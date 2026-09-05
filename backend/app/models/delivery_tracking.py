import secrets
from datetime import datetime, timedelta
from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_secure_share_token() -> str:
    """Generates a cryptographically secure URL-safe token (e.g. 24 bytes base64)."""
    return secrets.token_urlsafe(24)

class DeliveryTrackingShare(Base):
    """
    Öffentliche, zeitlich befristete Live-Tracking-Freigaben für Baustellen & Montageleiter.
    """
    __tablename__ = "delivery_tracking_shares"

    @staticmethod
    def generate_token() -> str:
        return generate_secure_share_token()

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(100), unique=True, index=True, default=generate_secure_share_token, nullable=False)
    vehicle_id = Column(String(100), nullable=False, index=True)
    
    destination_name = Column(String(200), nullable=False)
    destination_lat = Column(Float, nullable=False)
    destination_lon = Column(Float, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    notes = Column(String(500), nullable=True)

    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_by = relationship("User", foreign_keys=[created_by_id])
