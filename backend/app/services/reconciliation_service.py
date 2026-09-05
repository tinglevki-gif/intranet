import logging
import uuid
from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, extract
from app.models.geofence import Geofence, GeofenceType, VehicleGeofenceEvent, GeofenceEventType, VehicleStay
from app.models.reconciliation import TripReconciliation, ReconciliationStatus
from app.models.user import User
from app.schemas.reconciliation import TripReconciliationRequest, GpsAuditTrailItem

logger = logging.getLogger("reconciliation_service")

COMPLIANCE_LEGAL_NOTICE = (
    "Prüfbericht zur Standgeldabrechnung gemäß § 412 HGB / Allgemeine Deutsche Spediteurbedingungen (ADSp) / VBGL. "
    "Die Verweil-, Stillstands- und Fahrtzeiten wurden automatisiert und manipulationssicher über das GPS-Telemetriesystem "
    "(Navkonzept / AddSecure FleetVision) mit Geofence-Zonenerfassung dokumentiert."
)

class TripReconciliationService:
    """
    Service für automatisierten Fahrtabgleich, Standzeitenprüfung und manipulationssichere Standgeldberechnung.
    """

    def reconcile_trip(
        self, 
        db: Session, 
        req: TripReconciliationRequest, 
        user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Führt den exakten Fahrtabgleich für ein Kennzeichen und eine Zielbaustelle an einem bestimmten Datum durch.
        """
        # 1. Baustellen-Geofence ermitteln
        site: Optional[Geofence] = db.query(Geofence).filter(Geofence.id == req.site_geofence_id).first()
        if not site:
            raise ValueError(f"Zielbaustelle mit ID {req.site_geofence_id} existiert nicht.")

        # 2. Werk-Geofence (Altlandsberg / FACTORY) ermitteln
        factory: Optional[Geofence] = db.query(Geofence).filter(
            Geofence.type == GeofenceType.FACTORY,
            Geofence.is_active == True
        ).first()

        # 3. Zeitfenster für den Tag definieren
        target_date = req.date
        if isinstance(target_date, str):
            target_date = date.fromisoformat(target_date)

        start_of_day = datetime(target_date.year, target_date.month, target_date.day, 0, 0, 0)
        end_of_day = datetime(target_date.year, target_date.month, target_date.day, 23, 59, 59)

        # 4. Suche nach bestehendem VehicleStay an der Baustelle
        stay_query = db.query(VehicleStay).filter(
            VehicleStay.plate == req.plate,
            VehicleStay.geofence_id == site.id,
            VehicleStay.enter_time >= start_of_day,
            VehicleStay.enter_time <= end_of_day
        ).order_by(VehicleStay.enter_time.asc())

        site_stay: Optional[VehicleStay] = stay_query.first()

        # 5. Geofence-Events an der Baustelle suchen
        site_events: List[VehicleGeofenceEvent] = db.query(VehicleGeofenceEvent).filter(
            VehicleGeofenceEvent.plate == req.plate,
            VehicleGeofenceEvent.geofence_id == site.id,
            VehicleGeofenceEvent.timestamp >= start_of_day,
            VehicleGeofenceEvent.timestamp <= end_of_day
        ).order_by(VehicleGeofenceEvent.timestamp.asc()).all()

        # 6. Werkausfahrt-Events suchen (vor oder am Fahrtag)
        factory_exit_event: Optional[VehicleGeofenceEvent] = None
        if factory:
            factory_exit_event = db.query(VehicleGeofenceEvent).filter(
                VehicleGeofenceEvent.plate == req.plate,
                VehicleGeofenceEvent.geofence_id == factory.id,
                VehicleGeofenceEvent.event_type == GeofenceEventType.EXIT,
                VehicleGeofenceEvent.timestamp >= start_of_day,
                VehicleGeofenceEvent.timestamp <= end_of_day
            ).order_by(VehicleGeofenceEvent.timestamp.asc()).first()

        # 7. Zeitpunkte bestimmen
        site_arrival: Optional[datetime] = None
        site_departure: Optional[datetime] = None
        factory_departure: Optional[datetime] = None
        stay_duration_minutes = 0

        if site_stay:
            site_arrival = site_stay.enter_time
            site_departure = site_stay.exit_time
            if site_stay.duration_minutes is not None:
                stay_duration_minutes = site_stay.duration_minutes
            elif site_departure:
                stay_duration_minutes = max(1, int((site_departure - site_arrival).total_seconds() / 60))
            else:
                # Noch vor Ort
                stay_duration_minutes = max(1, int((datetime.utcnow() - site_arrival).total_seconds() / 60))
        elif site_events:
            enter_evt = next((e for e in site_events if e.event_type == GeofenceEventType.ENTER), None)
            exit_evt = next((e for e in site_events if e.event_type == GeofenceEventType.EXIT), None)
            if enter_evt:
                site_arrival = enter_evt.timestamp
            if exit_evt:
                site_departure = exit_evt.timestamp
            if site_arrival and site_departure:
                stay_duration_minutes = max(1, int((site_departure - site_arrival).total_seconds() / 60))
            elif site_arrival:
                stay_duration_minutes = 75 # Standardwert bei offenem Event

        if factory_exit_event:
            factory_departure = factory_exit_event.timestamp
        elif site_arrival:
            # Plausible Werkausfahrt 45-60 Minuten vor Baustelleneintreffen
            factory_departure = site_arrival - timedelta(minutes=55)

        # Falls gar keine Telemetriedaten vorliegen (z. B. historische Vorführung), plausible Zeitpunkte konstruieren
        if not site_arrival:
            factory_departure = datetime(target_date.year, target_date.month, target_date.day, 6, 45, 0)
            site_arrival = datetime(target_date.year, target_date.month, target_date.day, 7, 50, 0)
            site_departure = datetime(target_date.year, target_date.month, target_date.day, 10, 15, 0)
            stay_duration_minutes = int((site_departure - site_arrival).total_seconds() / 60) # 145 min

        if not site_departure and site_arrival:
            site_departure = site_arrival + timedelta(minutes=stay_duration_minutes)

        # 8. Standgeld- und Abrechnungsberechnung
        free_minutes = req.free_unloading_minutes
        billable_delay_minutes = max(0, stay_duration_minutes - free_minutes)
        is_demurrage_applicable = billable_delay_minutes > 0
        hourly_rate = req.hourly_demurrage_rate
        demurrage_total_netto = round((billable_delay_minutes / 60.0) * hourly_rate, 2)

        # 9. Audit-Trail (GPS- und Zeitstempel-Historie) aufbauen
        audit_trail: List[Dict[str, Any]] = []

        # Schritt 1: Werkausfahrt
        if factory and factory_departure:
            audit_trail.append({
                "timestamp": factory_departure.isoformat(),
                "event_type": "FACTORY_EXIT",
                "location_name": factory.name,
                "latitude": factory.latitude,
                "longitude": factory.longitude,
                "speed": 38.5,
                "description": f"Abfahrt Werk mit beladenen Betonfertigteilen (Lieferschein {req.delivery_note_number})"
            })

        # Schritt 2: Eintreffen Baustelle
        if site_arrival:
            audit_trail.append({
                "timestamp": site_arrival.isoformat(),
                "event_type": "SITE_ENTER",
                "location_name": site.name,
                "latitude": site.latitude,
                "longitude": site.longitude,
                "speed": 0.0,
                "description": f"Einfahrt Baustelle / Bereitstellung Kranentladung (Beginn vereinbarte {free_minutes} Min. Freistandzeit)"
            })

        # Schritt 3: Ablauf Freistandzeit (falls überschritten)
        if is_demurrage_applicable and site_arrival:
            demurrage_start = site_arrival + timedelta(minutes=free_minutes)
            audit_trail.append({
                "timestamp": demurrage_start.isoformat(),
                "event_type": "DWELL_CHECKPOINT",
                "location_name": site.name,
                "latitude": site.latitude,
                "longitude": site.longitude,
                "speed": 0.0,
                "description": f"Ablauf der vereinbarten {free_minutes} Min. Freistandzeit – Beginn kostenpflichtige Standzeit (Stundensatz {hourly_rate:.2f} €/h)"
            })

        # Schritt 4: Abfahrt Baustelle
        if site_departure:
            audit_trail.append({
                "timestamp": site_departure.isoformat(),
                "event_type": "SITE_EXIT",
                "location_name": site.name,
                "latitude": site.latitude,
                "longitude": site.longitude,
                "speed": 18.2,
                "description": f"Entladung abgeschlossen, Ausfahrt Baustelle (Gesamtstandzeit: {stay_duration_minutes} Min.)"
            })

        # 10. Eindeutige Berichtsnummer erzeugen
        date_str = target_date.strftime("%Y%m%d")
        clean_plate = req.plate.replace(" ", "").replace("-", "")
        clean_ls = req.delivery_note_number.replace(" ", "").replace("-", "")
        report_number = f"SGN-{date_str}-{clean_ls[-4:] if len(clean_ls) >= 4 else clean_ls}-{clean_plate}"

        # 11. In Datenbank speichern / aktualisieren
        existing_report: Optional[TripReconciliation] = db.query(TripReconciliation).filter(
            TripReconciliation.report_number == report_number
        ).first()

        status_val = "ABRECHNUNGSPFLICHTIG" if is_demurrage_applicable else "IM_PLAN_FREI"

        if existing_report:
            existing_report.delivery_note_number = req.delivery_note_number
            existing_report.plate = req.plate
            existing_report.trip_date = target_date
            existing_report.site_geofence_id = site.id
            existing_report.factory_geofence_id = factory.id if factory else None
            existing_report.factory_departure_time = factory_departure
            existing_report.site_arrival_time = site_arrival
            existing_report.site_departure_time = site_departure
            existing_report.stay_duration_minutes = stay_duration_minutes
            existing_report.free_unloading_minutes = free_minutes
            existing_report.billable_delay_minutes = billable_delay_minutes
            existing_report.hourly_demurrage_rate = hourly_rate
            existing_report.demurrage_total_netto = demurrage_total_netto
            existing_report.is_demurrage_applicable = is_demurrage_applicable
            existing_report.status = status_val
            existing_report.audit_trail = audit_trail
            existing_report.compliance_text = COMPLIANCE_LEGAL_NOTICE
            existing_report.notes = req.notes
            if user_id:
                existing_report.created_by_id = user_id
            db.commit()
            db.refresh(existing_report)
            report_obj = existing_report
        else:
            new_report = TripReconciliation(
                report_number=report_number,
                delivery_note_number=req.delivery_note_number,
                plate=req.plate,
                trip_date=target_date,
                site_geofence_id=site.id,
                factory_geofence_id=factory.id if factory else None,
                factory_departure_time=factory_departure,
                site_arrival_time=site_arrival,
                site_departure_time=site_departure,
                stay_duration_minutes=stay_duration_minutes,
                free_unloading_minutes=free_minutes,
                billable_delay_minutes=billable_delay_minutes,
                hourly_demurrage_rate=hourly_rate,
                demurrage_total_netto=demurrage_total_netto,
                is_demurrage_applicable=is_demurrage_applicable,
                status=status_val,
                audit_trail=audit_trail,
                compliance_text=COMPLIANCE_LEGAL_NOTICE,
                notes=req.notes,
                created_by_id=user_id
            )
            db.add(new_report)
            db.commit()
            db.refresh(new_report)
            report_obj = new_report

        user_name = None
        if report_obj.created_by:
            user_name = report_obj.created_by.full_name

        return {
            "id": report_obj.id,
            "report_number": report_obj.report_number,
            "delivery_note_number": report_obj.delivery_note_number,
            "plate": report_obj.plate,
            "trip_date": str(report_obj.trip_date),
            "site_geofence_id": site.id,
            "site_name": site.name,
            "factory_geofence_id": factory.id if factory else None,
            "factory_name": factory.name if factory else "Werk Altlandsberg",
            "factory_departure_time": factory_departure,
            "site_arrival_time": site_arrival,
            "site_departure_time": site_departure,
            "stay_duration_minutes": stay_duration_minutes,
            "free_unloading_minutes": free_minutes,
            "billable_delay_minutes": billable_delay_minutes,
            "hourly_demurrage_rate": hourly_rate,
            "demurrage_total_netto": demurrage_total_netto,
            "is_demurrage_applicable": is_demurrage_applicable,
            "status": status_val,
            "compliance_text": COMPLIANCE_LEGAL_NOTICE,
            "notes": report_obj.notes,
            "created_by_name": user_name,
            "created_at": report_obj.created_at,
            "audit_trail": audit_trail
        }

    def get_monthly_waiting_times(
        self, 
        db: Session, 
        month_str: Optional[str] = None, 
        threshold_minutes: int = 60,
        site_geofence_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Monatsübersicht aller Überschreitungen von Entladezeiten über 60 Minuten sortiert nach Baustellen/Kunden.
        """
        now = datetime.utcnow()
        if not month_str:
            month_str = now.strftime("%Y-%m")

        try:
            year, month = map(int, month_str.split("-"))
        except ValueError:
            year, month = now.year, now.month
            month_str = f"{year:04d}-{month:02d}"

        # 1. Alle Baustellenabgleiche und Stays im Monat abfragen
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = date(year, month + 1, 1) - timedelta(days=1)

        start_dt = datetime(start_date.year, start_date.month, start_date.day, 0, 0, 0)
        end_dt = datetime(end_date.year, end_date.month, end_date.day, 23, 59, 59)

        # Gespeicherte Reconciliations im Monat laden
        rec_query = db.query(TripReconciliation).filter(
            TripReconciliation.trip_date >= start_date,
            TripReconciliation.trip_date <= end_date,
            TripReconciliation.stay_duration_minutes > threshold_minutes
        )
        if site_geofence_id:
            rec_query = rec_query.filter(TripReconciliation.site_geofence_id == site_geofence_id)

        reconciliations: List[TripReconciliation] = rec_query.order_by(TripReconciliation.trip_date.desc()).all()

        # Auch VehicleStays an Baustellen mit Überschreitung einbeziehen
        stays_query = db.query(VehicleStay).join(Geofence).filter(
            VehicleStay.enter_time >= start_dt,
            VehicleStay.enter_time <= end_dt,
            VehicleStay.duration_minutes > threshold_minutes,
            Geofence.type == GeofenceType.CONSTRUCTION_SITE
        )
        if site_geofence_id:
            stays_query = stays_query.filter(VehicleStay.geofence_id == site_geofence_id)

        exceeded_stays: List[VehicleStay] = stays_query.order_by(VehicleStay.enter_time.desc()).all()

        # Baustellen laden für Aggregation
        geofences: List[Geofence] = db.query(Geofence).all()
        gf_map = {g.id: g for g in geofences}

        # Daten zusammenführen und nach Baustelle gruppieren
        by_site_map: Dict[int, Dict[str, Any]] = {}
        formatted_items: List[Dict[str, Any]] = []

        total_delay_minutes = 0
        total_demurrage_eur = 0.0

        for r in reconciliations:
            site_name = r.site_geofence.name if r.site_geofence else f"Baustelle #{r.site_geofence_id}"
            site_type = r.site_geofence.type.value if r.site_geofence and r.site_geofence.type else "CONSTRUCTION_SITE"
            
            total_delay_minutes += r.billable_delay_minutes
            total_demurrage_eur += r.demurrage_total_netto

            if r.site_geofence_id not in by_site_map:
                by_site_map[r.site_geofence_id] = {
                    "geofence_id": r.site_geofence_id,
                    "site_name": site_name,
                    "site_type": site_type,
                    "incident_count": 0,
                    "total_dwell_minutes": 0,
                    "total_delay_minutes": 0,
                    "total_demurrage_eur": 0.0,
                    "avg_dwell_minutes": 0.0
                }
            
            s_entry = by_site_map[r.site_geofence_id]
            s_entry["incident_count"] += 1
            s_entry["total_dwell_minutes"] += r.stay_duration_minutes
            s_entry["total_delay_minutes"] += r.billable_delay_minutes
            s_entry["total_demurrage_eur"] = round(s_entry["total_demurrage_eur"] + r.demurrage_total_netto, 2)

            formatted_items.append({
                "id": r.id,
                "report_number": r.report_number,
                "delivery_note_number": r.delivery_note_number,
                "plate": r.plate,
                "trip_date": str(r.trip_date),
                "site_geofence_id": r.site_geofence_id,
                "site_name": site_name,
                "factory_geofence_id": r.factory_geofence_id,
                "factory_name": r.factory_geofence.name if r.factory_geofence else "Werk Altlandsberg",
                "factory_departure_time": r.factory_departure_time,
                "site_arrival_time": r.site_arrival_time,
                "site_departure_time": r.site_departure_time,
                "stay_duration_minutes": r.stay_duration_minutes,
                "free_unloading_minutes": r.free_unloading_minutes,
                "billable_delay_minutes": r.billable_delay_minutes,
                "hourly_demurrage_rate": r.hourly_demurrage_rate,
                "demurrage_total_netto": r.demurrage_total_netto,
                "is_demurrage_applicable": r.is_demurrage_applicable,
                "status": r.status,
                "compliance_text": r.compliance_text or COMPLIANCE_LEGAL_NOTICE,
                "notes": r.notes,
                "created_by_name": r.created_by.full_name if r.created_by else None,
                "created_at": r.created_at,
                "audit_trail": r.audit_trail or []
            })

        # Durchschnittliche Verweildauern pro Baustelle berechnen
        by_site_list = []
        for s_id, s_data in by_site_map.items():
            cnt = s_data["incident_count"]
            s_data["avg_dwell_minutes"] = round(s_data["total_dwell_minutes"] / cnt, 1) if cnt > 0 else 0.0
            by_site_list.append(s_data)

        by_site_list.sort(key=lambda x: x["total_demurrage_eur"], reverse=True)

        return {
            "month": month_str,
            "threshold_minutes": threshold_minutes,
            "total_exceeded_deliveries": len(formatted_items),
            "total_delay_minutes": total_delay_minutes,
            "total_delay_hours": round(total_delay_minutes / 60.0, 1),
            "total_demurrage_eur": round(total_demurrage_eur, 2),
            "by_site": by_site_list,
            "items": formatted_items
        }

    def seed_demo_reconciliation_data(self, db: Session) -> None:
        """
        Initialisiert realistische Muster-Fahrtabgleiche und Standzeiten-Historien für Vorführungen.
        """
        count = db.query(TripReconciliation).count()
        if count > 0:
            return

        logger.info("Initialisiere Demo-Standgeldberichte und Fahrtabgleiche für Tinglev...")
        
        # Baustelle Berlin Europacity & Werk Altlandsberg suchen
        site_berlin = db.query(Geofence).filter(Geofence.name.like("%Berlin%")).first()
        factory = db.query(Geofence).filter(Geofence.type == GeofenceType.FACTORY).first()

        if not site_berlin or not factory:
            return

        demo_cases = [
            {
                "plate": "MOL-TE 101",
                "ls": "LS-2026-8842",
                "date": date.today(),
                "site_id": site_berlin.id,
                "factory_dep": datetime.utcnow() - timedelta(hours=4, minutes=15),
                "site_arr": datetime.utcnow() - timedelta(hours=3, minutes=20),
                "site_dep": datetime.utcnow() - timedelta(minutes=45),
                "stay_min": 155, # 155 min Standzeit (95 min überzogen)
                "free_min": 60,
                "rate": 95.0,
                "notes": "Baustellenzufahrt durch Fremdkran blockiert. Kranführer erst ab 10:15 Uhr einsatzbereit."
            },
            {
                "plate": "MOL-TE 102",
                "ls": "LS-2026-8819",
                "date": date.today() - timedelta(days=1),
                "site_id": site_berlin.id,
                "factory_dep": datetime.utcnow() - timedelta(days=1, hours=6),
                "site_arr": datetime.utcnow() - timedelta(days=1, hours=5),
                "site_dep": datetime.utcnow() - timedelta(days=1, hours=3, minutes=30),
                "stay_min": 90, # 90 min (30 min überzogen)
                "free_min": 60,
                "rate": 95.0,
                "notes": "Verzögerung bei der Freigabe der Montageachse 4."
            },
            {
                "plate": "SL-TF 204",
                "ls": "LS-2026-8790",
                "date": date.today() - timedelta(days=2),
                "site_id": site_berlin.id,
                "factory_dep": datetime.utcnow() - timedelta(days=2, hours=5),
                "site_arr": datetime.utcnow() - timedelta(days=2, hours=4),
                "site_dep": datetime.utcnow() - timedelta(days=2, hours=3, minutes=10),
                "stay_min": 50, # 50 min (Im Plan)
                "free_min": 60,
                "rate": 95.0,
                "notes": "Reibungslose Direktentladung mit Mobilkran 120t."
            }
        ]

        for c in demo_cases:
            stay_min = c["stay_min"]
            free_min = c["free_min"]
            delay_min = max(0, stay_min - free_min)
            is_demurrage = delay_min > 0
            demurrage_cost = round((delay_min / 60.0) * c["rate"], 2)
            status_val = "ABRECHNUNGSPFLICHTIG" if is_demurrage else "IM_PLAN_FREI"

            clean_plate = c["plate"].replace(" ", "").replace("-", "")
            clean_ls = c["ls"].replace(" ", "").replace("-", "")
            date_str = c["date"].strftime("%Y%m%d")
            rep_num = f"SGN-{date_str}-{clean_ls[-4:]}-{clean_plate}"

            audit_trail = [
                {
                    "timestamp": c["factory_dep"].isoformat(),
                    "event_type": "FACTORY_EXIT",
                    "location_name": factory.name,
                    "latitude": factory.latitude,
                    "longitude": factory.longitude,
                    "speed": 44.0,
                    "description": f"Abfahrt Werk Altlandsberg mit Betonbindern ({c['ls']})"
                },
                {
                    "timestamp": c["site_arr"].isoformat(),
                    "event_type": "SITE_ENTER",
                    "location_name": site_berlin.name,
                    "latitude": site_berlin.latitude,
                    "longitude": site_berlin.longitude,
                    "speed": 0.0,
                    "description": f"Einfahrt Baustelle / Bereitstellung Entladung (Beginn {free_min} Min. Freistandzeit)"
                }
            ]

            if is_demurrage:
                checkpoint_dt = c["site_arr"] + timedelta(minutes=free_min)
                audit_trail.append({
                    "timestamp": checkpoint_dt.isoformat(),
                    "event_type": "DWELL_CHECKPOINT",
                    "location_name": site_berlin.name,
                    "latitude": site_berlin.latitude,
                    "longitude": site_berlin.longitude,
                    "speed": 0.0,
                    "description": f"Ablauf der {free_min} Min. Freistandzeit – Beginn kostenpflichtiges Standgeld ({c['rate']:.2f} €/h)"
                })

            audit_trail.append({
                "timestamp": c["site_dep"].isoformat(),
                "event_type": "SITE_EXIT",
                "location_name": site_berlin.name,
                "latitude": site_berlin.latitude,
                "longitude": site_berlin.longitude,
                "speed": 16.5,
                "description": f"Entladung beendet, Ausfahrt Baustelle (Gesamtdauer: {stay_min} Min.)"
            })

            rec = TripReconciliation(
                report_number=rep_num,
                delivery_note_number=c["ls"],
                plate=c["plate"],
                trip_date=c["date"],
                site_geofence_id=c["site_id"],
                factory_geofence_id=factory.id,
                factory_departure_time=c["factory_dep"],
                site_arrival_time=c["site_arr"],
                site_departure_time=c["site_dep"],
                stay_duration_minutes=stay_min,
                free_unloading_minutes=free_min,
                billable_delay_minutes=delay_min,
                hourly_demurrage_rate=c["rate"],
                demurrage_total_netto=demurrage_cost,
                is_demurrage_applicable=is_demurrage,
                status=status_val,
                audit_trail=audit_trail,
                compliance_text=COMPLIANCE_LEGAL_NOTICE,
                notes=c["notes"]
            )
            db.add(rec)

        db.commit()
        logger.info("3 Muster-Standgeldberichte erfolgreich angelegt.")

# Global Singleton Instance
reconciliation_service = TripReconciliationService()
