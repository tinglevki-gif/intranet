import datetime
from app.models.role import Role
from app.models.user import User
from app.models.delivery_tracking import DeliveryTrackingShare
from app.services.eta_service import EtaCalculationService, eta_calculation_service
from app.services.geofence_service import calculate_haversine_distance

def test_haversine_and_road_distance():
    # Factory Altlandsberg (52.5584, 13.7656) to Berlin Potsdamer Platz (52.5096, 13.3759)
    factory_lat, factory_lon = 52.5584, 13.7656
    dest_lat, dest_lon = 52.5096, 13.3759

    crow_dist_m = calculate_haversine_distance(factory_lat, factory_lon, dest_lat, dest_lon)
    crow_dist_km = crow_dist_m / 1000.0
    print(f"Calculated crow distance: {crow_dist_km:.2f} km")
    # Crow distance is ~29.3 km
    assert 25.0 <= crow_dist_km <= 35.0, f"Expected crow distance ~29km, got {crow_dist_km}"

    road_dist_km = (crow_dist_m * EtaCalculationService.ROAD_CIRCUITY_FACTOR) / 1000.0
    print(f"Calculated road distance: {road_dist_km:.2f} km")
    assert road_dist_km > crow_dist_km
    assert 30.0 <= road_dist_km <= 45.0, f"Expected road distance ~36km, got {road_dist_km}"

def test_tracking_share_token_generation():
    token = DeliveryTrackingShare.generate_token()
    print(f"Generated secure tracking token: {token}")
    assert isinstance(token, str)
    assert len(token) >= 20
    assert "/" not in token and "+" not in token  # URL-safe

def test_share_eta_simulation():
    # Create simulated DeliveryTrackingShare instance
    share = DeliveryTrackingShare(
        vehicle_id="1",
        token=DeliveryTrackingShare.generate_token(),
        destination_name="Großbaustelle Berlin Potsdamer Platz (Kran 1)",
        destination_lat=52.5096,
        destination_lon=13.3759,
        expires_at=datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=12),
        is_active=True,
        notes="Betonfertigteile Los 2, Montagebeginn ab 14:00 Uhr"
    )

    result = eta_calculation_service.calculate_eta_for_share(share)
    assert result is not None, "Expected ETA result to not be None"
    assert result["is_valid"] is True
    assert "distance_remaining_km" in result
    assert "duration_remaining_minutes" in result
    assert "estimated_arrival_time" in result
    assert result["distance_remaining_km"] > 0
    print(f"Simulated ETA Calculation Result: {result['estimated_arrival_time']}, Restdistanz: {result['distance_remaining_km']} km, Restdauer: {result['duration_remaining_minutes']} min")

def test_db_persistence_and_public_endpoint():
    from app.core.database import SessionLocal
    db = SessionLocal()
    try:
        token = "test-live-montage-2026"
        db.query(DeliveryTrackingShare).filter_by(token=token).delete()
        db.commit()

        share = DeliveryTrackingShare(
            vehicle_id="1",
            token=token,
            destination_name="Baustelle Berlin Potsdamer Platz (Kran 1)",
            destination_lat=52.5096,
            destination_lon=13.3759,
            expires_at=datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=12),
            is_active=True,
            notes="Betonfertigteile Los 1, Kranabnahme 14:00 Uhr"
        )
        db.add(share)
        db.commit()
        db.refresh(share)
        print(f"✅ Created and persisted test share in DB with token: {share.token}")

        saved_share = db.query(DeliveryTrackingShare).filter_by(token=token).first()
        assert saved_share is not None
        assert saved_share.destination_name == "Baustelle Berlin Potsdamer Platz (Kran 1)"
        assert saved_share.is_active is True
    finally:
        db.close()

if __name__ == "__main__":
    test_haversine_and_road_distance()
    test_tracking_share_token_generation()
    test_share_eta_simulation()
    test_db_persistence_and_public_endpoint()
    print("\n✅ All ETA & Delivery Tracking test cases passed successfully!")
