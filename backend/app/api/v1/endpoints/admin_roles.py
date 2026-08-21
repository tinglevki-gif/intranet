import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, RoleEnum
from app.models.role import Role
from app.schemas.role import (
    RoleResponse, 
    RoleCreate, 
    RoleUpdate, 
    PermissionsCatalogResponse
)
from app.services.auth_service import require_roles
from app.services.role_service import (
    PERMISSION_LEVELS, 
    SYSTEM_MODULES, 
    ALL_MODULE_KEYS
)

router = APIRouter(dependencies=[Depends(require_roles([RoleEnum.ADMIN]))])

def map_role_response(role: Role, db: Session) -> RoleResponse:
    users_count = db.query(User).filter(User.custom_role_id == role.id).count()
    return RoleResponse(
        id=role.id,
        name=role.name,
        slug=role.slug,
        description=role.description,
        is_system_role=role.is_system_role,
        permissions=role.permissions or {},
        users_count=users_count,
        created_at=role.created_at,
        updated_at=role.updated_at
    )

@router.get("/permissions-catalog", response_model=PermissionsCatalogResponse)
def get_permissions_catalog():
    """Returns catalog of all controllable modules, categories, and permission levels."""
    return PermissionsCatalogResponse(
        levels=PERMISSION_LEVELS,
        modules=SYSTEM_MODULES
    )

@router.get("", response_model=List[RoleResponse])
def list_roles(db: Session = Depends(get_db)):
    """SuperAdmin only: List all dynamic and system roles."""
    roles = db.query(Role).order_by(Role.is_system_role.desc(), Role.id.asc()).all()
    return [map_role_response(r, db) for r in roles]

@router.get("/{role_id}", response_model=RoleResponse)
def get_role(role_id: int, db: Session = Depends(get_db)):
    """SuperAdmin only: Get details for a specific role."""
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Rolle nicht gefunden")
    return map_role_response(role, db)

@router.post("", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
def create_role(payload: RoleCreate, db: Session = Depends(get_db)):
    """SuperAdmin only: Create a new custom role with custom module permissions."""
    clean_name = payload.name.strip()
    clean_slug = re.sub(r'[^a-zA-Z0-9_]', '_', payload.slug.strip().upper())

    if not clean_slug:
        raise HTTPException(status_code=400, detail="Ungültiger Rollen-Schlüssel (Slug).")

    # Check if slug exists
    existing = db.query(Role).filter((Role.slug == clean_slug) | (Role.name == clean_name)).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Eine Rolle mit dem Namen oder Schlüssel '{clean_slug}' existiert bereits.")

    # Validate and sanitize permissions
    sanitized_perms = {}
    valid_levels = {"none", "read", "read_write", "admin"}
    for mod_key in ALL_MODULE_KEYS:
        lvl = payload.permissions.get(mod_key, "read")
        sanitized_perms[mod_key] = lvl if lvl in valid_levels else "read"

    new_role = Role(
        name=clean_name,
        slug=clean_slug,
        description=payload.description.strip() if payload.description else None,
        is_system_role=False,
        permissions=sanitized_perms
    )
    db.add(new_role)
    db.commit()
    db.refresh(new_role)

    return map_role_response(new_role, db)

@router.put("/{role_id}", response_model=RoleResponse)
def update_role(role_id: int, payload: RoleUpdate, db: Session = Depends(get_db)):
    """SuperAdmin only: Update role name, description, and module permissions matrix."""
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Rolle nicht gefunden")

    if payload.name:
        clean_name = payload.name.strip()
        # Check duplicate name
        existing = db.query(Role).filter(Role.name == clean_name, Role.id != role_id).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Eine andere Rolle mit dem Namen '{clean_name}' existiert bereits.")
        role.name = clean_name

    if payload.description is not None:
        role.description = payload.description.strip() if payload.description else None

    if payload.permissions is not None:
        valid_levels = {"none", "read", "read_write", "admin"}
        current_perms = dict(role.permissions or {})
        for mod_key, lvl in payload.permissions.items():
            if lvl in valid_levels:
                current_perms[mod_key] = lvl
        role.permissions = current_perms

    db.commit()
    db.refresh(role)

    return map_role_response(role, db)

@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role(role_id: int, db: Session = Depends(get_db)):
    """SuperAdmin only: Delete a custom role. Protected against system roles and roles in active use."""
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Rolle nicht gefunden")

    if role.is_system_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Systemrollen (wie SuperAdmin, HR-Manager, IT-Administrator, Mitarbeiter) sind systemkritisch und können nicht gelöscht werden."
        )

    # Check if active users are assigned to this role
    assigned_users_count = db.query(User).filter(User.custom_role_id == role_id).count()
    if assigned_users_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Die Rolle kann nicht gelöscht werden, da ihr aktuell noch {assigned_users_count} Benutzer zugewiesen sind. Bitte weisen Sie diese Benutzer zuerst einer anderen Rolle zu."
        )

    db.delete(role)
    db.commit()
    return None
