import os
import hashlib
import hmac
from datetime import datetime, timedelta, timezone
from typing import Any, Union, Optional
import jwt
import bcrypt
from app.core.config import settings

def get_password_hash(password: str) -> str:
    """Hashes a raw password using bcrypt."""
    try:
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    except Exception:
        # Robust SHA-256 HMAC fallback
        salt_key = settings.SECRET_KEY[:16]
        hashed = hmac.new(salt_key.encode("utf-8"), password.encode("utf-8"), hashlib.sha256).hexdigest()
        return f"sha256${hashed}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a raw password against its stored hash."""
    if not hashed_password:
        return False

    if hashed_password.startswith("sha256$"):
        expected = hashed_password.split("sha256$")[1]
        salt_key = settings.SECRET_KEY[:16]
        current = hmac.new(salt_key.encode("utf-8"), plain_password.encode("utf-8"), hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, current)
    
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        # Check if fallback HMAC matches
        salt_key = settings.SECRET_KEY[:16]
        current = hmac.new(salt_key.encode("utf-8"), plain_password.encode("utf-8"), hashlib.sha256).hexdigest()
        return hmac.compare_digest(hashed_password, current)

def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Generates a signed JWT access token."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "iat": datetime.now(timezone.utc)
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    """Decodes and validates a JWT token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except Exception:
        return None
