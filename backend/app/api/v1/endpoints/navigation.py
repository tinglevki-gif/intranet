from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, RoleEnum
from app.models.menu import MenuItem
from app.schemas.navigation import (
    NavigationResponse, 
    MenuItemResponse, 
    MenuItemUpdate, 
    MenuReorderRequest, 
    MenuItemToggleActiveRequest
)
from app.services.auth_service import get_current_user
from app.services.navigation_service import get_navigation_for_role, DEFAULT_MENUS

router = APIRouter()
admin_router = APIRouter()

# =========================================================================
# 1. PUBLIC / EMPLOYEE NAVIGATION ENDPOINT
# =========================================================================

@router.get("/menu", response_model=NavigationResponse)
def get_user_menu(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns dynamic menu navigation hierarchy tailored to current user's role and individual module permissions."""
    return get_navigation_for_role(db, current_user.role, current_user=current_user)

# =========================================================================
# 2. SUPERADMIN MENU MANAGEMENT ENDPOINTS (/admin/menu)
# =========================================================================

@admin_router.get("", response_model=List[MenuItemResponse])
def admin_get_all_menu_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """SuperAdmin: Returns all menu items (including deactivated ones) ordered by sorting index."""
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Nur Administratoren dürfen Menüpunkte verwalten.")
        
    items = db.query(MenuItem).order_by(MenuItem.order.asc(), MenuItem.id.asc()).all()
    return items

@admin_router.patch("/{item_id}/toggle-active", response_model=MenuItemResponse)
def admin_toggle_menu_item_active(
    item_id: int,
    toggle_in: Optional[MenuItemToggleActiveRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """SuperAdmin: Globally enable or disable a navigation menu item for all users."""
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Nur Administratoren dürfen Menüpunkte aktivieren/deaktivieren.")

    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Menüpunkt nicht gefunden.")

    # Prevent deactivating essential system dashboard if needed
    if item.key == "dashboard" and toggle_in and toggle_in.is_active is False:
        raise HTTPException(status_code=400, detail="Das Haupt-Dashboard darf nicht global deaktiviert werden.")

    if toggle_in is not None:
        item.is_active = toggle_in.is_active
    else:
        item.is_active = not item.is_active

    db.commit()
    db.refresh(item)
    return item

@admin_router.put("/reorder", response_model=List[MenuItemResponse])
def admin_reorder_menu_items(
    reorder_in: MenuReorderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """SuperAdmin: Batch reorder and update section allocation for menu items."""
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Nur Administratoren dürfen die Menüreihenfolge anpassen.")

    for entry in reorder_in.items:
        item = db.query(MenuItem).filter(MenuItem.id == entry.id).first()
        if item:
            item.order = entry.order
            if entry.section:
                item.section = entry.section.strip()

    db.commit()
    items = db.query(MenuItem).order_by(MenuItem.order.asc(), MenuItem.id.asc()).all()
    return items

@admin_router.put("/{item_id}", response_model=MenuItemResponse)
def admin_update_menu_item(
    item_id: int,
    item_in: MenuItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """SuperAdmin: Update label, badge, icon, section, order or active state of a menu item."""
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Nur Administratoren dürfen Menüpunkte bearbeiten.")

    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Menüpunkt nicht gefunden.")

    if item_in.label is not None:
        item.label = item_in.label.strip()
    if item_in.icon is not None:
        item.icon = item_in.icon.strip()
    if item_in.section is not None:
        item.section = item_in.section.strip()
    if item_in.order is not None:
        item.order = item_in.order
    if item_in.badge is not None:
        item.badge = item_in.badge.strip() if item_in.badge else None
    if item_in.is_active is not None:
        item.is_active = item_in.is_active
    if item_in.allowed_roles is not None:
        item.allowed_roles = item_in.allowed_roles

    db.commit()
    db.refresh(item)
    return item

@admin_router.post("/reset-defaults", response_model=List[MenuItemResponse])
def admin_reset_default_menus(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """SuperAdmin: Restore default system menu hierarchy, sections, order and active states."""
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Nur Administratoren dürfen das Menü auf Standard zurücksetzen.")

    # Map default menus
    default_dict = {item["key"]: item for item in DEFAULT_MENUS}
    
    existing_items = db.query(MenuItem).all()
    for item in existing_items:
        if item.key in default_dict:
            src = default_dict[item.key]
            item.label = src["label"]
            item.path = src["path"]
            item.icon = src["icon"]
            item.section = src["section"]
            item.order = src["order"]
            item.allowed_roles = src["allowed_roles"]
            item.badge = src.get("badge")
            item.is_active = True

    db.commit()
    items = db.query(MenuItem).order_by(MenuItem.order.asc(), MenuItem.id.asc()).all()
    return items
