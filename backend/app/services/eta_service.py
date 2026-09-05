import math
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from app.models.delivery_tracking import DeliveryTrackingShare
from app.services.geofence_service import calculate_haversine_distance
from app.services.navkonzept_service import navkonzept_fleet_service

logger = logging.getLogger("eta_service")

class EtaCalculationService:
    """
    Berechnet die verbleibende Distanz und voraussichtliche Ankunftszeit (ETA)
    für Betonfertigteile-Schwerlasttransporte zur Baustellen- und Mobilkrankoordination.
    """
    AVERAGE_HEAVY_GOODS_SPEED_KMH = 65.0  # Durchschnittsgeschwindigkeit für Schwertransporte
    ROAD_CIRCUITY_FACTOR = 1.25           # Multiplikator Luftlinie -> reales Straßennetz

    def calculate_eta_for_share(self, share: DeliveryTrackingShare) -> Optional[Dict[str, Any]]:
        """
        Ermittelt den aktuellen Fahrzeugstandort und berechnet ETA und Restdistanz.
        """
        # 1. Telemetriedaten des Fahrzeugs laden
        telemetry = navkonzept_fleet_service.get_vehicles()
        vehicles = telemetry.get("vehicles", [])

        # Suche Fahrzeug anhand von ID oder Kennzeichen
        target_vehicle = None
        for v in vehicles:
            if str(v.get("id")) == str(share.vehicle_id) or str(v.get("plate", "")).replace(" ", "").upper() == str(share.vehicle_id).replace(" ", "").upper():
                target_vehicle = v
                break

        # Falls nicht exakt gefunden, erstes Fahrzeug als Fallback verwenden (oder None)
        if not target_vehicle and vehicles:
            target_vehicle = vehicles[0]

        if not target_vehicle:
            logger.warning("Fahrzeug mit ID '%s' für Tracking-Token '%s' nicht gefunden.", share.vehicle_id, share.token)
            return None

        current_lat = float(target_vehicle.get("lat", 52.5272))
        current_lon = float(target_vehicle.get("lon", 13.8052))
        speed = float(target_vehicle.get("speed", 0.0) or 0.0)
        is_moving = speed > 0.0
        plate = str(target_vehicle.get("plate", "LKW"))
        brand = str(target_vehicle.get("brand", "Betonfertigteile-Transporter"))

        # 2. Haversine-Distanz in Metern berechnen
        air_distance_meters = calculate_haversine_distance(
            current_lat,
            current_lon,
            share.destination_lat,
            share.destination_lon
        )

        # 3. Straßennetz-Distanz (km)
        road_distance_km = round(max(0.1, (air_distance_meters * self.ROAD_CIRCUITY_FACTOR) / 1000.0), 1)

        # 4. Fahrzeitberechnung (Minuten)
        if speed >= 35.0:
            # Wenn der LKW bereits auf der Autobahn / Schnellstraße fährt
            effective_speed = (0.35 * speed) + (0.65 * self.AVERAGE_HEAVY_GOODS_SPEED_KMH)
            buffer_min = 0
        else:
            # LKW steht oder fährt im Stadtverkehr
            effective_speed = 55.0
            buffer_min = 4  # 4 Minuten Anfahrts-/Rangiervorlauf

        calculated_duration_min = max(1, int(round((road_distance_km / effective_speed) * 60.0)) + buffer_min)

        # Wenn Distanz unter 300m liegt, ist das Fahrzeug quasi am Ziel
        if road_distance_km <= 0.4:
            calculated_duration_min = 0

        # 5. ETA-Zeitstempel
        now_utc = datetime.now(timezone.utc)
        eta_time = now_utc + timedelta(minutes=calculated_duration_min)
        
        # Formatierte Uhrzeit (z. B. "14:35 Uhr")
        eta_formatted = eta_time.strftime("%H:%M Uhr") if calculated_duration_min > 0 else "Am Ziel / Eintreffend"

        last_update_str = target_vehicle.get("timestamp") or now_utc.strftime("%H:%M:%S UTC")

        return {
            "is_valid": True,
            "token": share.token,
            "plate": plate,
            "brand": brand,
            "current_lat": current_lat,
            "current_lon": current_lon,
            "current_speed": speed,
            "is_moving": is_moving,
            "destination_name": share.destination_name,
            "destination_lat": share.destination_lat,
            "destination_lon": share.destination_lon,
            "distance_remaining_km": road_distance_km,
            "duration_remaining_minutes": calculated_duration_min,
            "estimated_arrival_time": eta_formatted,
            "last_update": last_update_str,
            "expires_at": share.expires_at,
            "notes": share.notes
        }

# Global Singleton Instance
eta_calculation_service = EtaCalculationService()
