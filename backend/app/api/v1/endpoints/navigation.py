from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.navigation import NavigationResponse
from app.services.auth_service import get_current_user
from app.services.navigation_service import get_navigation_for_role

router = APIRouter()

@router.get("/menu", response_model=NavigationResponse)
def get_user_menu(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns dynamic menu navigation hierarchy tailored to current user's role and individual module permissions."""
    return get_navigation_for_role(db, current_user.role, current_user=current_user)
