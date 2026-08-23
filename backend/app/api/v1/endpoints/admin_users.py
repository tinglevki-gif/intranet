import os
import uuid
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, RoleEnum
from app.models.role import Role
from app.schemas.user import (
    UserCreate, 
    UserUpdate, 
    UserAdminResponse, 
    UserListResponse,
    UserPermissionsResponse,
    UserPermissionsUpdate,
    ModuleDefinition
)
from app.services.auth_service import get_current_user, require_roles
from app.services.navigation_service import AVAILABLE_MODULES, CONTROLLABLE_MODULE_KEYS
from app.core.security import get_password_hash

router = APIRouter(dependencies=[Depends(require_roles([RoleEnum.ADMIN]))])

# Upload directory config
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
UPLOAD_ROOT = os.path.join(BACKEND_DIR, "uploads")
AVATAR_DIR = os.path.join(UPLOAD_ROOT, "avatars")
os.makedirs(AVATAR_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

def map_user_to_admin_response(u: User, db: Session) -> UserAdminResponse:
    supervisor_name = u.supervisor.full_name if u.supervisor else None
    sub_count = db.query(User).filter(User.supervisor_id == u.id).count()
    custom_role_name = u.custom_role.name if u.custom_role else None
    return UserAdminResponse(
        id=u.id,
        email=u.email,
        first_name=u.first_name,
        last_name=u.last_name,
        full_name=u.full_name,
        department=u.department,
        position=u.position,
        avatar_url=u.avatar_url,
        phone=u.phone,
        mobile=u.mobile,
        location=u.location,
        role=u.role,
        custom_role_id=u.custom_role_id,
        custom_role_name=custom_role_name,
        supervisor_id=u.supervisor_id,
        supervisor_name=supervisor_name,
        subordinates_count=sub_count,
        allowed_modules=u.allowed_modules,
        is_active=u.is_active,
        created_at=u.created_at,
        updated_at=u.updated_at
    )

def remove_local_avatar_file(avatar_url: Optional[str]):
    """Safely delete previous local avatar file from disk if it was stored locally."""
    if not avatar_url:
        return
    if avatar_url.startswith("/uploads/avatars/"):
        filename = os.path.basename(avatar_url)
        file_path = os.path.join(AVATAR_DIR, filename)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                print(f"Warning: Could not remove old avatar file {file_path}: {e}")

@router.get("", response_model=UserListResponse)
def list_admin_users(
    query: Optional[str] = None,
    department: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """SuperAdmin only: Get paginated list of all corporate users with multi-criteria filtering."""
    q = db.query(User)

    if is_active is not None:
        q = q.filter(User.is_active == is_active)

    if department and department != "ALL":
        q = q.filter(User.department == department)

    if role and role != "ALL":
        q = q.filter(User.role == role)

    if query:
        search = f"%{query.lower().strip()}%"
        q = q.filter(
            (User.full_name.ilike(search)) |
            (User.first_name.ilike(search)) |
            (User.last_name.ilike(search)) |
            (User.email.ilike(search)) |
            (User.position.ilike(search)) |
            (User.department.ilike(search)) |
            (User.phone.ilike(search)) |
            (User.mobile.ilike(search))
        )

    total = q.count()
    users = q.order_by(User.id.asc()).offset(skip).limit(limit).all()

    items = [map_user_to_admin_response(u, db) for u in users]
    return UserListResponse(total=total, items=items)

@router.get("/{user_id}", response_model=UserAdminResponse)
def get_admin_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """SuperAdmin only: Retrieve single user details."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")
    return map_user_to_admin_response(user, db)

# =========================================================================
# GRANULAR PERMISSIONS MATRIX ENDPOINTS
# =========================================================================

@router.get("/{user_id}/permissions", response_model=UserPermissionsResponse)
def get_user_permissions(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """SuperAdmin only: Retrieve granular module permissions for a specific user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")

    is_admin = user.role == RoleEnum.ADMIN
    allowed = user.allowed_modules if user.allowed_modules is not None else CONTROLLABLE_MODULE_KEYS

    return UserPermissionsResponse(
        user_id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=user.role,
        is_admin=is_admin,
        allowed_modules=allowed,
        available_modules=[ModuleDefinition(**m) for m in AVAILABLE_MODULES]
    )

@router.put("/{user_id}/permissions", response_model=UserPermissionsResponse)
def update_user_permissions(
    user_id: int,
    permissions_in: UserPermissionsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """SuperAdmin only: Update and persist granular module permissions for a specific user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")

    # Filter only valid module keys
    sanitized_modules = [m for m in permissions_in.modules if m in CONTROLLABLE_MODULE_KEYS]
    user.allowed_modules = sanitized_modules

    db.commit()
    db.refresh(user)

    is_admin = user.role == RoleEnum.ADMIN
    return UserPermissionsResponse(
        user_id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=user.role,
        is_admin=is_admin,
        allowed_modules=user.allowed_modules,
        available_modules=[ModuleDefinition(**m) for m in AVAILABLE_MODULES]
    )

@router.post("", response_model=UserAdminResponse, status_code=status.HTTP_201_CREATED)
def create_admin_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """SuperAdmin only: Create new user with hashed password and role assignment."""
    clean_email = user_in.email.lower().strip()
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Die E-Mail-Adresse '{clean_email}' ist bereits vergeben."
        )

    if not user_in.password or len(user_in.password) < 4:
        raise HTTPException(
            status_code=400,
            detail="Das Passwort muss mindestens 4 Zeichen lang sein."
        )

    full_name = user_in.full_name.strip()
    if not full_name and (user_in.first_name or user_in.last_name):
        full_name = f"{user_in.first_name or ''} {user_in.last_name or ''}".strip()

    if not full_name:
        full_name = clean_email.split("@")[0].replace(".", " ").title()

    if user_in.supervisor_id:
        supervisor = db.query(User).filter(User.id == user_in.supervisor_id).first()
        if not supervisor:
            raise HTTPException(status_code=400, detail="Der angegebene Vorgesetzte existiert nicht.")

    custom_role_id = user_in.custom_role_id
    if not custom_role_id and user_in.role:
        # Fallback find role by slug
        role_str = user_in.role.value if hasattr(user_in.role, 'value') else str(user_in.role)
        r = db.query(Role).filter(Role.slug == role_str).first()
        if r:
            custom_role_id = r.id

    user = User(
        email=clean_email,
        first_name=user_in.first_name.strip() if user_in.first_name else None,
        last_name=user_in.last_name.strip() if user_in.last_name else None,
        full_name=full_name,
        hashed_password=get_password_hash(user_in.password),
        role=user_in.role,
        custom_role_id=custom_role_id,
        department=user_in.department.strip() if user_in.department else "General",
        position=user_in.position.strip() if user_in.position else "Mitarbeiter",
        avatar_url=user_in.avatar_url.strip() if user_in.avatar_url else None,
        phone=user_in.phone.strip() if user_in.phone else None,
        mobile=user_in.mobile.strip() if user_in.mobile else None,
        location=user_in.location.strip() if user_in.location else "Tinglev Headquarter",
        supervisor_id=user_in.supervisor_id,
        allowed_modules=user_in.allowed_modules,
        is_active=user_in.is_active
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return map_user_to_admin_response(user, db)

@router.put("/{user_id}", response_model=UserAdminResponse)
@router.patch("/{user_id}", response_model=UserAdminResponse)
def update_admin_user(
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """SuperAdmin only: Update profile, department, role, password, allowed_modules, and active status."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")

    # Safety: Prevent SuperAdmin from self-deactivating or self-demoting
    if current_user.id == user.id:
        if user_in.is_active is False:
            raise HTTPException(
                status_code=400,
                detail="Ein SuperAdmin kann sein eigenes Konto nicht deaktivieren."
            )
        if user_in.role is not None:
            user_in_role_str = user_in.role.value if hasattr(user_in.role, 'value') else str(user_in.role)
            if user_in_role_str != "ADMIN":
                raise HTTPException(
                    status_code=400,
                    detail="Ein SuperAdmin kann seine eigene Administrator-Rolle nicht entziehen."
                )

    # Check email uniqueness if email is modified
    if user_in.email:
        clean_email = user_in.email.lower().strip()
        if clean_email != user.email:
            existing = db.query(User).filter(User.email == clean_email, User.id != user_id).first()
            if existing:
                raise HTTPException(
                    status_code=400,
                    detail=f"Die E-Mail-Adresse '{clean_email}' wird bereits von einem anderen Benutzer verwendet."
                )
            user.email = clean_email

    # Check supervisor cycle
    if user_in.supervisor_id is not None:
        if user_in.supervisor_id == user_id:
            raise HTTPException(
                status_code=400,
                detail="Ein Benutzer kann nicht sein eigener Vorgesetzter sein."
            )
        if user_in.supervisor_id > 0:
            sup = db.query(User).filter(User.id == user_in.supervisor_id).first()
            if not sup:
                raise HTTPException(status_code=400, detail="Der angegebene Vorgesetzte existiert nicht.")
            user.supervisor_id = user_in.supervisor_id
        else:
            user.supervisor_id = None

    if user_in.first_name is not None:
        user.first_name = user_in.first_name.strip() if user_in.first_name else None
    if user_in.last_name is not None:
        user.last_name = user_in.last_name.strip() if user_in.last_name else None

    if user_in.full_name is not None and user_in.full_name.strip():
        user.full_name = user_in.full_name.strip()
    elif user_in.first_name or user_in.last_name:
        user.full_name = f"{user.first_name or ''} {user.last_name or ''}".strip()

    if user_in.department is not None:
        user.department = user_in.department.strip()
    if user_in.position is not None:
        user.position = user_in.position.strip()
    if user_in.avatar_url is not None:
        if user.avatar_url and user.avatar_url != user_in.avatar_url:
            remove_local_avatar_file(user.avatar_url)
        user.avatar_url = user_in.avatar_url.strip() if user_in.avatar_url else None
    if user_in.phone is not None:
        user.phone = user_in.phone.strip() if user_in.phone else None
    if user_in.mobile is not None:
        user.mobile = user_in.mobile.strip() if user_in.mobile else None
    if user_in.location is not None:
        user.location = user_in.location.strip()
    if user_in.role is not None:
        user_role_str = user_in.role.value if hasattr(user_in.role, 'value') else str(user_in.role)
        user.role = user_role_str
        if not user_in.custom_role_id:
            r = db.query(Role).filter(Role.slug == user_role_str).first()
            if r:
                user.custom_role_id = r.id
    if user_in.custom_role_id is not None:
        user.custom_role_id = user_in.custom_role_id
        r = db.query(Role).filter(Role.id == user_in.custom_role_id).first()
        if r:
            user.role = r.slug
    if user_in.allowed_modules is not None:
        user.allowed_modules = user_in.allowed_modules
    if user_in.is_active is not None:
        user.is_active = user_in.is_active

    # Optional password reset
    if user_in.password and user_in.password.strip():
        if len(user_in.password.strip()) < 4:
            raise HTTPException(status_code=400, detail="Das neue Passwort muss mindestens 4 Zeichen lang sein.")
        user.hashed_password = get_password_hash(user_in.password.strip())

    db.commit()
    db.refresh(user)

    return map_user_to_admin_response(user, db)

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_admin_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """SuperAdmin only: Delete user and safely reassign subordinate hierarchy."""
    if current_user.id == user_id:
        raise HTTPException(
            status_code=400,
            detail="Ein SuperAdmin kann sich nicht selbst aus dem System löschen."
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")

    # Clean up avatar file if local
    remove_local_avatar_file(user.avatar_url)

    # Safe hierarchy cleanup: Reassign direct reports to the deleted user's supervisor
    subordinates = db.query(User).filter(User.supervisor_id == user_id).all()
    for sub in subordinates:
        sub.supervisor_id = user.supervisor_id

    db.delete(user)
    db.commit()
    return None

# =========================================================================
# AVATAR MANAGEMENT ENDPOINTS
# =========================================================================

@router.post("/upload-avatar-temp")
async def upload_temp_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """SuperAdmin only: Upload an avatar file for a user being created."""
    file_ext = os.path.splitext(file.filename)[1].lower() if file.filename else ".png"
    if file_ext not in ALLOWED_EXTENSIONS or file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Ungültiges Dateiformat. Erlaubt sind JPG, PNG, WebP und GIF."
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Die Bilddatei ist zu groß. Maximale Größe: 5 MB."
        )

    unique_filename = f"avatar_temp_{uuid.uuid4().hex[:12]}{file_ext}"
    dest_path = os.path.join(AVATAR_DIR, unique_filename)

    with open(dest_path, "wb") as f:
        f.write(content)

    return {"avatar_url": f"/uploads/avatars/{unique_filename}"}

@router.post("/{user_id}/avatar", response_model=UserAdminResponse)
async def upload_user_avatar(
    user_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """SuperAdmin only: Upload and replace profile picture for any user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")

    file_ext = os.path.splitext(file.filename)[1].lower() if file.filename else ".png"
    if file_ext not in ALLOWED_EXTENSIONS or file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Ungültiges Dateiformat. Erlaubt sind JPG, PNG, WebP und GIF."
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Die Bilddatei ist zu groß. Maximale Größe: 5 MB."
        )

    # Clean up previous local avatar file
    remove_local_avatar_file(user.avatar_url)

    # Save new file
    unique_filename = f"user_{user_id}_{uuid.uuid4().hex[:8]}{file_ext}"
    dest_path = os.path.join(AVATAR_DIR, unique_filename)

    with open(dest_path, "wb") as f:
        f.write(content)

    user.avatar_url = f"/uploads/avatars/{unique_filename}"
    db.commit()
    db.refresh(user)

    return map_user_to_admin_response(user, db)

@router.delete("/{user_id}/avatar", response_model=UserAdminResponse)
def delete_user_avatar(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """SuperAdmin only: Delete custom avatar and reset to default."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")

    remove_local_avatar_file(user.avatar_url)
    user.avatar_url = None
    db.commit()
    db.refresh(user)

    return map_user_to_admin_response(user, db)
