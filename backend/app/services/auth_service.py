from typing import List, Optional, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User, RoleEnum

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Extracts and validates current logged in user from JWT."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kein Authentifizierungs-Token übermittelt",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ungültiges oder abgelaufenes Token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ungültige Token-Anmeldedaten",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Benutzer nicht gefunden",
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Benutzerkonto ist deaktiviert",
        )
        
    return user

def require_roles(allowed_roles: List[Any]):
    """Role-based access control dependency factory."""
    allowed_values = [r.value if hasattr(r, 'value') else str(r) for r in allowed_roles]
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role_val = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
        if user_role_val not in allowed_values and user_role_val != "ADMIN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Zugriff verweigert. Erforderliche Rollen: {allowed_values}",
            )
        return current_user
    return role_checker

def require_module_permission(module_key: str, min_level: str = "read"):
    """
    Granular module access control dependency factory.
    1. SuperAdmin always has full access.
    2. User explicit allowed_modules (if set) is evaluated.
    3. User dynamic custom_role permissions (if set) are evaluated.
    """
    def module_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role_val = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
        if user_role_val == "ADMIN":
            return current_user
        
        # 1. Check explicit user allowed_modules override
        if current_user.allowed_modules is not None:
            if module_key not in current_user.allowed_modules:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Zugriff verweigert: Sie besitzen keine Berechtigung für das Modul '{module_key}'.",
                )
            return current_user

        # 2. Check dynamic custom_role permissions
        if current_user.custom_role and current_user.custom_role.permissions:
            role_perm = current_user.custom_role.permissions.get(module_key, "read")
            if role_perm == "none":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Zugriff verweigert: Ihre Rolle '{current_user.custom_role.name}' besitzt keinen Zugriff auf das Modul '{module_key}'.",
                )
        return current_user
    return module_checker
