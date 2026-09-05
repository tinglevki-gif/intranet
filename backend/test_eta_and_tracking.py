"""
Unit and Integration tests for EtaCalculationService and Live Delivery Tracking Shares
"""
import pytest
import datetime
from app.services.eta_service import EtaCalculationService
from app.models.delivery_tracking import DeliveryTrackingShare

def test_haversine_and_road_distance():
    # Factory Altlandsberg (52.5272, 13.8052) to Berlin Potsdamer Platz (52.5096, 13.3759)
    factory_lat, factory_lon = 52.5272, 13.8052
    dest_lat, dest_lon = 52.5096, 13.3759

    crow_dist = EtaCalculationService.haversine_distance_km(factory_lat, factory_lon, dest_lat, dest_lon)
    # Crow distance is around 29 km
    assert 25.0 <= crow_dist <= 35.0, f"Expected crow distance ~29km, got {crow_dist}"

    road_dist = EtaCalculationService.estimate_road_distance_km(factory_lat, factory_lon, dest_lat, dest_lon)
    # Road distance with circuity factor 1.25 should be around 36-37 km
    assert road_dist > crow_dist
    assert 30.0 <= road_dist <= 45.0, f"Expected road distance ~36km, got {road_dist}"

def test_eta_calculation():
    current_lat, current_lon = 52.5272, 13.8052
    dest_lat, dest_lon = 52.5096, 13.3759

    now_utc = datetime.datetime.now(datetime.timezone.utc)
    eta_result = EtaCalculationService.calculate_eta(
        current_lat=current_lat,
        current_lon=current_lon,
        dest_lat=dest_lat,
        dest_lon=dest_lon,
        current_speed=65.0,
        average_speed_kmh=65.0,
        current_time=now_utc
    )

    assert "remaining_distance_km" in eta_result
    assert "estimated_travel_minutes" in eta_result
    assert "estimated_arrival_time" in eta_result
    assert "is_arrived" in eta_result
    assert not eta_result["is_arrived"]
    assert eta_result["remaining_distance_km"] > 0
    assert eta_result["estimated_travel_minutes"] > 0
    assert eta_result["estimated_arrival_time"] > now_utc

def test_eta_already_arrived():
    dest_lat, dest_lon = 52.5096, 13.3759
    # Current location is within 150m of destination
    current_lat, current_lon = 52.5098, 13.3760

    eta_result = EtaCalculationService.calculate_eta(
        current_lat=current_lat,
        current_lon=current_lon,
        dest_lat=dest_lat,
        dest_lon=dest_lon
    )

    assert eta_result["is_arrived"] is True
    assert eta_result["estimated_travel_minutes"] == 0
    assert eta_result["remaining_distance_km"] <= 0.2

def test_tracking_share_token_generation():
    token = DeliveryTrackingShare.generate_token()
    assert isinstance(token, str)
    assert len(token) >= 20
    assert "/" not in token and "+" not in token  # URL-safe

if __name__ == "__main__":
    test_haversine_and_road_distance()
    test_eta_calculation()
    test_eta_already_arrived()
    test_tracking_share_token_generation()
    print("All ETA and Delivery Tracking tests passed successfully!")
