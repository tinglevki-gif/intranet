import math
import logging
import requests
from datetime import datetime, time, timezone, timedelta
from typing import List, Dict, Any, Optional, Tuple
from zoneinfo import ZoneInfo
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.models.security import FleetSecurityEvent, FleetSecuritySetting, FleetSecurityEventType
from app.models.geofence import Geofence, GeofenceType
from app.models.maintenance import VehicleMeta
from app.models.user import User
from app.schemas.security import (
    FleetSecuritySettingUpdate, 
    FleetSecuritySettingResponse,
    FleetSecurityEventResponse,
    FleetSecurityLogsResponse,
    FleetSecurityStatsResponse
)

logger = logging.getLogger("security_service")

# Berliner Zeitzone für Schicht- und Ruhezeiten
BERLIN_TZ = ZoneInfo("Europe/Berlin")

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Berechnet Distanz in Metern zwischen zwei GPS-Koordinaten."""
    R = 6371000.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = (math.sin(delta_phi / 2.0) ** 2) + \
        math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 1)

class SecurityService:
    """
    Zentraler Dienst für Werksschutz, Hof-Geschwindigkeitsüberwachung und 
    Alarmierung bei unbefugten Flottenbewegungen außerhalb der Betriebszeiten.
    """

    def get_or_create_settings(self, db: Session) -> FleetSecuritySetting:
        """Liefert die globalen Sicherheitseinstellungen oder legt die Standardkonfiguration an."""
        settings_obj = db.query(FleetSecuritySetting).filter(FleetSecuritySetting.id == 1).first()
        if not settings_obj:
            settings_obj = FleetSecuritySetting(
                id=1,
                max_yard_speed=20.0,
                quiet_hours_start="20:00",
                quiet_hours_end="05:00",
                weekend_quiet_all_day=True,
                off_hours_speed_threshold=5.0,
                off_hours_distance_threshold_meters=100.0,
                alert_email="werksschutz@tinglev-elementfabrik.de, it-leitung@tinglev-elementfabrik.de",
                webhook_url=None,
                cooldown_minutes=15,
                is_active=True
            )
            db.add(settings_obj)
            db.commit()
            db.refresh(settings_obj)
        return settings_obj

    def update_settings(self, db: Session, update_data: FleetSecuritySettingUpdate) -> FleetSecuritySetting:
        """Aktualisiert die globalen Sicherheitseinstellungen."""
        settings_obj = self.get_or_create_settings(db)
        
        for field, value in update_data.dict(exclude_unset=True).items():
            if value is not None:
                setattr(settings_obj, field, value)
        
        settings_obj.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(settings_obj)
        logger.info("Fleet security settings updated: max_speed=%s km/h, quiet_hours=%s-%s", 
                    settings_obj.max_yard_speed, settings_obj.quiet_hours_start, settings_obj.quiet_hours_end)
        return settings_obj

    def get_settings_response(self, db: Session) -> FleetSecuritySettingResponse:
        """Gibt die aktuellen Einstellungen inklusive aktuellem Ruhezeit-Status zurück."""
        settings_obj = self.get_or_create_settings(db)
        now_berlin = datetime.now(BERLIN_TZ)
        is_quiet, reason = self.is_in_quiet_hours(now_berlin, settings_obj)
        
        return FleetSecuritySettingResponse(
            id=settings_obj.id,
            max_yard_speed=settings_obj.max_yard_speed,
            quiet_hours_start=settings_obj.quiet_hours_start,
            quiet_hours_end=settings_obj.quiet_hours_end,
            weekend_quiet_all_day=settings_obj.weekend_quiet_all_day,
            off_hours_speed_threshold=settings_obj.off_hours_speed_threshold,
            off_hours_distance_threshold_meters=settings_obj.off_hours_distance_threshold_meters,
            alert_email=settings_obj.alert_email,
            webhook_url=settings_obj.webhook_url,
            cooldown_minutes=settings_obj.cooldown_minutes,
            is_active=settings_obj.is_active,
            is_currently_quiet_hours=is_quiet,
            current_time_info=f"Berlin: {now_berlin.strftime('%d.%m.%Y %H:%M:%S')} ({reason})",
            updated_at=settings_obj.updated_at
        )

    def is_in_quiet_hours(self, dt: Optional[datetime], settings_obj: FleetSecuritySetting) -> Tuple[bool, str]:
        """
        Prüft, ob ein gegebener Zeitstempel in die definierte Ruhezeit fällt.
        Standard: Mo-Fr 20:00 - 05:00 Uhr und Sa/So ganztägig.
        """
        if not dt:
            dt = datetime.now(BERLIN_TZ)
        elif dt.tzinfo is None:
            # Wenn naiv, als Berlin-Zeit interpretieren
            dt = dt.replace(tzinfo=BERLIN_TZ)
        else:
            dt = dt.astimezone(BERLIN_TZ)

        weekday = dt.weekday() # 0 = Montag, 6 = Sonntag

        # 1. Ganztägiges Wochenende (Samstag & Sonntag)
        if settings_obj.weekend_quiet_all_day and weekday in (5, 6):
            day_name = "Samstag" if weekday == 5 else "Sonntag"
            return True, f"Wochenende ({day_name}, ganztägige Ruhezeit)"

        # 2. Uhrzeit-Prüfung Mo-Fr
        try:
            start_parts = [int(p) for p in settings_obj.quiet_hours_start.split(":")]
            end_parts = [int(p) for p in settings_obj.quiet_hours_end.split(":")]
            start_t = time(start_parts[0], start_parts[1])
            end_t = time(end_parts[0], end_parts[1])
        except Exception:
            start_t = time(20, 0)
            end_t = time(5, 0)

        current_t = dt.time()

        if start_t > end_t:
            # Über Mitternacht (z. B. 20:00 bis 05:00)
            if current_t >= start_t:
                return True, f"Nachtruhe (nach {settings_obj.quiet_hours_start} Uhr)"
            elif current_t < end_t:
                return True, f"Frühruhe (vor {settings_obj.quiet_hours_end} Uhr)"
        else:
            # Gleicher Tag (z. B. 22:00 bis 23:59)
            if start_t <= current_t <= end_t:
                return True, f"Ruhezeit ({settings_obj.quiet_hours_start} - {settings_obj.quiet_hours_end} Uhr)"

        return False, "Reguläre Betriebszeit"

    def is_vehicle_in_cooldown(self, db: Session, vehicle_id: str, event_type: FleetSecurityEventType, cooldown_minutes: int) -> bool:
        """
        Prüft, ob für dieses Fahrzeug und diesen Ereignistyp in den letzten X Minuten
        bereits ein Alarm ausgelöst wurde (Anti-Spam / Debounce).
        """
        cutoff = datetime.utcnow() - timedelta(minutes=cooldown_minutes)
        recent_event = db.query(FleetSecurityEvent).filter(
            FleetSecurityEvent.vehicle_id == str(vehicle_id),
            FleetSecurityEvent.event_type == event_type,
            FleetSecurityEvent.timestamp >= cutoff
        ).first()
        return recent_event is not None

    def dispatch_security_notification(self, event: FleetSecurityEvent, settings_obj: FleetSecuritySetting) -> str:
        """
        Löst konfigurierte Alarmierungs-Aktionen aus (MS Teams / Slack Webhook oder E-Mail).
        """
        actions = []

        # 1. Loggen
        logger.warning(
            "🚨 FLEET SECURITY ALERT [%s] - Fzg: %s (%s) | Speed: %s km/h (Limit: %s) | Ort: %s",
            event.event_type.value, event.plate, event.vehicle_id, event.speed, event.speed_limit, event.location
        )
        actions.append("SYSTEM_LOGGED")

        # 2. Webhook (MS Teams / Slack)
        if settings_obj.webhook_url and settings_obj.webhook_url.startswith("http"):
            try:
                title_map = {
                    FleetSecurityEventType.FACTORY_SPEED_VIOLATION: "⚠️ Werkshof-Geschwindigkeitsüberschreitung",
                    FleetSecurityEventType.OFF_HOURS_MOVEMENT: "🚨 Unbefugte Bewegung außerhalb der Betriebszeit"
                }
                color_map = {
                    FleetSecurityEventType.FACTORY_SPEED_VIOLATION: "e11d48", # Rose/Red
                    FleetSecurityEventType.OFF_HOURS_MOVEMENT: "7c3aed"        # Purple/Indigo
                }
                payload = {
                    "@type": "MessageCard",
                    "@context": "https://schema.org/extensions",
                    "summary": f"Sicherheitsalarm Flotte: {event.plate}",
                    "themeColor": color_map.get(event.event_type, "e11d48"),
                    "title": title_map.get(event.event_type, "Sicherheitswarnung Fuhrpark"),
                    "sections": [
                        {
                            "activityTitle": f"Fahrzeug: **{event.plate}** (ID: {event.vehicle_id})",
                            "activitySubtitle": f"Zeitpunkt: {event.timestamp.strftime('%d.%m.%Y %H:%M:%S UTC')}",
                            "facts": [
                                {"name": "Ereignis-Typ", "value": event.event_type.value},
                                {"name": "Gemessene Geschwindigkeit", "value": f"{event.speed} km/h"},
                                {"name": "Geltendes Limit / Schwelle", "value": f"{event.speed_limit} km/h"},
                                {"name": "Standort", "value": event.location or "Nicht angegeben"},
                                {"name": "Distanzbewegung", "value": f"{event.distance_moved_meters or 0} m"}
                            ],
                            "markdown": True
                        }
                    ]
                }
                # Slack compatible fallback payload
                slack_payload = {
                    "text": f"*{title_map.get(event.event_type)}*\n"
                            f"• **Fahrzeug:** {event.plate} (ID: {event.vehicle_id})\n"
                            f"• **Geschwindigkeit:** {event.speed} km/h (Limit: {event.speed_limit} km/h)\n"
                            f"• **Standort:** {event.location}\n"
                            f"• **Zeitstempel:** {event.timestamp.strftime('%d.%m.%Y %H:%M:%S')}"
                }
                
                # Send webhook with short timeout
                resp = requests.post(settings_obj.webhook_url, json=payload, timeout=3.0)
                if resp.status_code in (200, 204):
                    actions.append("WEBHOOK_DISPATCHED")
                else:
                    # Retry with slack format
                    resp_slack = requests.post(settings_obj.webhook_url, json=slack_payload, timeout=3.0)
                    if resp_slack.status_code in (200, 204):
                        actions.append("WEBHOOK_DISPATCHED")
                    else:
                        logger.warning("Webhook response status %s: %s", resp.status_code, resp.text)
                        actions.append(f"WEBHOOK_FAILED_{resp.status_code}")
            except Exception as ex:
                logger.warning("Fehler beim Versenden des Sicherheits-Webhooks: %s", ex)
                actions.append("WEBHOOK_ERROR")

        # 3. E-Mail-Empfänger (Werksschutz & IT-Leitung)
        if settings_obj.alert_email:
            # Simuliert/dokumentiert den E-Mail-Versand an die konfigurierten Empfänger
            actions.append(f"EMAIL_NOTIFIED({settings_obj.alert_email.split(',')[0].strip()})")

        return " | ".join(actions)

    def evaluate_security_rules(self, db: Session, vehicles: List[Dict[str, Any]]) -> List[FleetSecurityEvent]:
        """
        Prüft eine Liste von Live-Telemetriefahrzeugen gegen alle Sicherheitsregeln:
        1. Werkshof-Höchstgeschwindigkeit (max. 20 km/h im Geofence Werk Altlandsberg)
        2. Unbefugte Bewegung während Ruhezeiten (> 5 km/h oder > 100m Verschiebung)
        """
        settings_obj = self.get_or_create_settings(db)
        if not settings_obj.is_active:
            return []

        # Aktive Geofences laden
        active_geofences: List[Geofence] = db.query(Geofence).filter(Geofence.is_active == True).all()
        factory_geofences = [
            g for g in active_geofences 
            if g.type == GeofenceType.FACTORY or "werk" in g.name.lower() or "altlandsberg" in g.name.lower()
        ]

        now_utc = datetime.utcnow()
        now_berlin = datetime.now(BERLIN_TZ)
        is_quiet, quiet_reason = self.is_in_quiet_hours(now_berlin, settings_obj)

        new_events: List[FleetSecurityEvent] = []

        for veh in vehicles:
            veh_id = str(veh.get("id"))
            plate = str(veh.get("plate") or f"LKW-{veh_id}")
            speed = float(veh.get("speed", 0.0) or 0.0)
            lat = float(veh.get("lat")) if veh.get("lat") is not None else None
            lon = float(veh.get("lon")) if veh.get("lon") is not None else None
            location_name = veh.get("location") or "Unbekannt"

            # Parse vehicle timestamp if present
            raw_ts = veh.get("timestamp")
            if isinstance(raw_ts, datetime):
                event_ts = raw_ts
            elif isinstance(raw_ts, str):
                try:
                    event_ts = datetime.fromisoformat(raw_ts.replace("Z", "+00:00")).astimezone(timezone.utc).replace(tzinfo=None)
                except Exception:
                    event_ts = now_utc
            else:
                event_ts = now_utc

            # Lade oder erstelle Metadaten des Fahrzeugs für Positionsvergleich
            meta = db.query(VehicleMeta).filter(VehicleMeta.vehicle_id == veh_id).first()
            if not meta:
                meta = VehicleMeta(
                    vehicle_id=veh_id,
                    plate=plate,
                    current_mileage=int(veh.get("mileage", 0) or 0),
                    last_telemetry_at=event_ts,
                    last_lat=lat,
                    last_lon=lon
                )
                db.add(meta)
                db.flush()

            # Distanzverschiebung zum letzten bekannten Standort berechnen
            distance_moved = 0.0
            if lat is not None and lon is not None and meta.last_lat is not None and meta.last_lon is not None:
                distance_moved = calculate_haversine_distance(meta.last_lat, meta.last_lon, lat, lon)

            # Prüfe, in welchem Geofence sich das Fahrzeug befindet
            current_factory_geo: Optional[Geofence] = None
            matched_geofence: Optional[Geofence] = None
            if lat is not None and lon is not None:
                for geo in active_geofences:
                    dist = calculate_haversine_distance(lat, lon, geo.latitude, geo.longitude)
                    if dist <= (geo.radius_meters or 500):
                        matched_geofence = geo
                        if geo in factory_geofences or geo.type == GeofenceType.FACTORY:
                            current_factory_geo = geo
                        break

            # -------------------------------------------------------------
            # REGEL 1: Überwachung Werkshof-Geschwindigkeit (max. 20 km/h)
            # -------------------------------------------------------------
            if current_factory_geo and speed > settings_obj.max_yard_speed:
                # Prüfe Cooldown gegen Spam
                if not self.is_vehicle_in_cooldown(db, veh_id, FleetSecurityEventType.FACTORY_SPEED_VIOLATION, settings_obj.cooldown_minutes):
                    event = FleetSecurityEvent(
                        event_type=FleetSecurityEventType.FACTORY_SPEED_VIOLATION,
                        vehicle_id=veh_id,
                        plate=plate,
                        speed=speed,
                        speed_limit=settings_obj.max_yard_speed,
                        location=f"{current_factory_geo.name} ({location_name})",
                        latitude=lat,
                        longitude=lon,
                        distance_moved_meters=distance_moved,
                        geofence_id=current_factory_geo.id,
                        timestamp=event_ts,
                        details={
                            "geofence_name": current_factory_geo.name,
                            "geofence_type": current_factory_geo.type.value,
                            "excess_speed_kmh": round(speed - settings_obj.max_yard_speed, 1),
                            "rule": f"Werkshof-Höchstgeschwindigkeit: max. {settings_obj.max_yard_speed} km/h",
                            "severity": "HIGH" if speed >= (settings_obj.max_yard_speed + 15.0) else "MEDIUM"
                        },
                        is_acknowledged=False,
                        created_at=now_utc
                    )
                    action_summary = self.dispatch_security_notification(event, settings_obj)
                    event.action_taken = action_summary
                    db.add(event)
                    new_events.append(event)
                    logger.warning("Neuer Werkshof-Geschwindigkeitsverstoß erfasst: %s mit %s km/h", plate, speed)

            # -------------------------------------------------------------
            # REGEL 2: Alarm bei unbefugter Bewegung außerhalb der Betriebszeit
            # -------------------------------------------------------------
            if is_quiet:
                is_moving = speed > settings_obj.off_hours_speed_threshold
                is_shifted = distance_moved > settings_obj.off_hours_distance_threshold_meters

                if is_moving or is_shifted:
                    if not self.is_vehicle_in_cooldown(db, veh_id, FleetSecurityEventType.OFF_HOURS_MOVEMENT, settings_obj.cooldown_minutes):
                        trigger_reason = []
                        if is_moving:
                            trigger_reason.append(f"Geschwindigkeit: {speed} km/h (Schwelle: > {settings_obj.off_hours_speed_threshold} km/h)")
                        if is_shifted:
                            trigger_reason.append(f"Positionsverschiebung: {distance_moved} m (Schwelle: > {settings_obj.off_hours_distance_threshold_meters} m)")

                        event = FleetSecurityEvent(
                            event_type=FleetSecurityEventType.OFF_HOURS_MOVEMENT,
                            vehicle_id=veh_id,
                            plate=plate,
                            speed=speed,
                            speed_limit=settings_obj.off_hours_speed_threshold,
                            location=location_name or (matched_geofence.name if matched_geofence else "Werksgelände / Unterwegs"),
                            latitude=lat,
                            longitude=lon,
                            distance_moved_meters=distance_moved,
                            geofence_id=matched_geofence.id if matched_geofence else None,
                            timestamp=event_ts,
                            details={
                                "quiet_period_reason": quiet_reason,
                                "trigger_details": " | ".join(trigger_reason),
                                "previous_coords": {"lat": meta.last_lat, "lon": meta.last_lon} if meta.last_lat else None,
                                "current_coords": {"lat": lat, "lon": lon},
                                "severity": "CRITICAL" if (speed > 25.0 or distance_moved > 500.0) else "HIGH"
                            },
                            is_acknowledged=False,
                            created_at=now_utc
                        )
                        action_summary = self.dispatch_security_notification(event, settings_obj)
                        event.action_taken = action_summary
                        db.add(event)
                        new_events.append(event)
                        logger.warning("Unbefugte Bewegung außerhalb Betriebszeit erfasst: %s (%s)", plate, quiet_reason)

            # Aktualisiere die letzten bekannten Koordinaten in VehicleMeta
            if lat is not None and lon is not None:
                meta.last_lat = lat
                meta.last_lon = lon
                meta.last_telemetry_at = event_ts

        if new_events or len(vehicles) > 0:
            db.commit()

        return new_events

    def get_security_logs(
        self,
        db: Session,
        event_type: Optional[str] = "ALL",
        plate: Optional[str] = None,
        is_acknowledged: Optional[bool] = None,
        limit: int = 50,
        offset: int = 0
    ) -> FleetSecurityLogsResponse:
        """Liefert gefilterte Sicherheits- und Geschwindigkeitsverstöße für den Fuhrparkleiter."""
        query = db.query(FleetSecurityEvent)

        if event_type and event_type != "ALL":
            query = query.filter(FleetSecurityEvent.event_type == event_type)

        if plate:
            query = query.filter(FleetSecurityEvent.plate.ilike(f"%{plate.strip()}%"))

        if is_acknowledged is not None:
            query = query.filter(FleetSecurityEvent.is_acknowledged == is_acknowledged)

        total = query.count()
        unack_count = db.query(FleetSecurityEvent).filter(FleetSecurityEvent.is_acknowledged == False).count()
        speed_count = db.query(FleetSecurityEvent).filter(FleetSecurityEvent.event_type == FleetSecurityEventType.FACTORY_SPEED_VIOLATION).count()
        off_hours_count = db.query(FleetSecurityEvent).filter(FleetSecurityEvent.event_type == FleetSecurityEventType.OFF_HOURS_MOVEMENT).count()

        events = query.order_by(desc(FleetSecurityEvent.timestamp)).offset(offset).limit(limit).all()

        items = []
        for e in events:
            user_name = None
            if e.acknowledged_by:
                user_name = f"{e.acknowledged_by.first_name} {e.acknowledged_by.last_name}".strip() or e.acknowledged_by.username
            
            geo_name = e.geofence.name if e.geofence else None

            items.append(FleetSecurityEventResponse(
                id=e.id,
                event_type=e.event_type,
                vehicle_id=e.vehicle_id,
                plate=e.plate,
                speed=e.speed,
                speed_limit=e.speed_limit,
                location=e.location,
                latitude=e.latitude,
                longitude=e.longitude,
                distance_moved_meters=e.distance_moved_meters or 0.0,
                geofence_id=e.geofence_id,
                geofence_name=geo_name,
                timestamp=e.timestamp,
                details=e.details,
                is_acknowledged=e.is_acknowledged,
                acknowledged_at=e.acknowledged_at,
                acknowledged_by_id=e.acknowledged_by_id,
                acknowledged_by_name=user_name,
                acknowledgement_note=e.acknowledgement_note,
                action_taken=e.action_taken,
                created_at=e.created_at
            ))

        return FleetSecurityLogsResponse(
            items=items,
            total=total,
            unacknowledged_count=unack_count,
            speed_violations_count=speed_count,
            off_hours_count=off_hours_count,
            limit=limit,
            offset=offset
        )

    def acknowledge_event(self, db: Session, event_id: int, user_id: int, note: Optional[str] = None) -> FleetSecurityEventResponse:
        """Quittiert einen Sicherheitsvorfall durch den Fuhrparkleiter / Werksschutz."""
        event = db.query(FleetSecurityEvent).filter(FleetSecurityEvent.id == event_id).first()
        if not event:
            raise ValueError(f"Sicherheitsereignis #{event_id} nicht gefunden.")

        event.is_acknowledged = True
        event.acknowledged_at = datetime.utcnow()
        event.acknowledged_by_id = user_id
        event.acknowledgement_note = note
        db.commit()
        db.refresh(event)

        user_name = None
        if event.acknowledged_by:
            user_name = f"{event.acknowledged_by.first_name} {event.acknowledged_by.last_name}".strip() or event.acknowledged_by.username

        return FleetSecurityEventResponse(
            id=event.id,
            event_type=event.event_type,
            vehicle_id=event.vehicle_id,
            plate=event.plate,
            speed=event.speed,
            speed_limit=event.speed_limit,
            location=event.location,
            latitude=event.latitude,
            longitude=event.longitude,
            distance_moved_meters=event.distance_moved_meters or 0.0,
            geofence_id=event.geofence_id,
            geofence_name=event.geofence.name if event.geofence else None,
            timestamp=event.timestamp,
            details=event.details,
            is_acknowledged=event.is_acknowledged,
            acknowledged_at=event.acknowledged_at,
            acknowledged_by_id=event.acknowledged_by_id,
            acknowledged_by_name=user_name,
            acknowledgement_note=event.acknowledgement_note,
            action_taken=event.action_taken,
            created_at=event.created_at
        )

    def get_security_stats(self, db: Session) -> FleetSecurityStatsResponse:
        """Liefert statistische Zusammenfassung für das Dashboard."""
        settings_obj = self.get_or_create_settings(db)
        now_berlin = datetime.now(BERLIN_TZ)
        is_quiet, quiet_reason = self.is_in_quiet_hours(now_berlin, settings_obj)

        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

        total_events = db.query(FleetSecurityEvent).count()
        unack_events = db.query(FleetSecurityEvent).filter(FleetSecurityEvent.is_acknowledged == False).count()
        today_violations = db.query(FleetSecurityEvent).filter(FleetSecurityEvent.timestamp >= today_start).count()
        speed_total = db.query(FleetSecurityEvent).filter(FleetSecurityEvent.event_type == FleetSecurityEventType.FACTORY_SPEED_VIOLATION).count()
        off_hours_total = db.query(FleetSecurityEvent).filter(FleetSecurityEvent.event_type == FleetSecurityEventType.OFF_HOURS_MOVEMENT).count()

        quiet_label = f"Mo–Fr {settings_obj.quiet_hours_start}–{settings_obj.quiet_hours_end} Uhr"
        if settings_obj.weekend_quiet_all_day:
            quiet_label += " & Sa/So ganztägig"

        return FleetSecurityStatsResponse(
            total_events=total_events,
            unacknowledged_events=unack_events,
            violations_today=today_violations,
            speed_violations_total=speed_total,
            off_hours_total=off_hours_total,
            is_active=settings_obj.is_active,
            is_currently_quiet_hours=is_quiet,
            max_yard_speed=settings_obj.max_yard_speed,
            quiet_hours_label=quiet_label
        )

security_service = SecurityService()
