from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, create_access_token
from app.models.user import User
from app.schemas.user import UserLogin, Token, UserResponse
from app.services.auth_service import get_current_user
from app.services.seeder import seed_database

router = APIRouter()

@router.post("/login", response_model=Token)
def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """Authenticates user and returns JWT bearer access token."""
    user = db.query(User).filter(User.email == user_credentials.email.lower().strip()).first()
    
    if not user or not verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ungültige E-Mail-Adresse oder falsches Passwort",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Das Benutzerkonto ist derzeit deaktiviert",
        )
        
    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Returns currently authenticated user profile."""
    return current_user

@router.post("/seed")
def reseed_data(db: Session = Depends(get_db)):
    """Convenience endpoint to ensure demo data and users exist."""
    seed_database(db)
    return {"message": "Datenbank erfolgreich überprüft und synchronisiert."}
