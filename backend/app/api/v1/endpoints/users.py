import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User, RoleEnum
from app.schemas.user import (
    UserResponse, 
    UserDirectoryResponse, 
    OrgChartNodeResponse, 
    UserCreate,
    SelfProfileUpdate,
    SelfPasswordUpdate
)
from app.services.auth_service import get_current_user, require_roles
from app.core.security import get_password_hash, verify_password

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
UPLOAD_ROOT = os.path.join(BACKEND_DIR, "uploads")
AVATAR_DIR = os.path.join(UPLOAD_ROOT, "avatars")
os.makedirs(AVATAR_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

def remove_user_avatar_file(avatar_url: Optional[str]):
    if not avatar_url:
        return
    if avatar_url.startswith("/uploads/avatars/"):
        filename = os.path.basename(avatar_url)
        file_path = os.path.join(AVATAR_DIR, filename)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                print(f"Warning: Could not remove avatar file {file_path}: {e}")

router = APIRouter()

@router.get("/directory", response_model=List[UserDirectoryResponse])
def get_phone_directory(
    query: Optional[str] = None,
    department: Optional[str] = None,
    location: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Enriched phone directory of all corporate employees with search and filters."""
    if getattr(settings, "IS_TRIAL_BUILD", False):
        return []

    q = db.query(User).filter(User.is_active == True)
    
    if department and department != "ALL" and department != "Todos":
        q = q.filter(User.department == department)

    if location and location != "ALL":
        q = q.filter(User.location == location)
        
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
        
    users = q.order_by(User.full_name.asc()).all()
    results = []
    for u in users:
        supervisor_name = u.supervisor.full_name if u.supervisor else None
        extension = u.phone.split("-")[1] if u.phone and "-" in u.phone else str(100 + u.id)
        results.append(
            UserDirectoryResponse(
                id=u.id,
                email=u.email,
                first_name=u.first_name,
                last_name=u.last_name,
                full_name=u.full_name,
                department=u.department,
                departments=u.get_departments(),
                position=u.position,
                avatar_url=u.avatar_url,
                phone=u.phone,
                mobile=u.mobile,
                location=u.location,
                role=u.role,
                supervisor_id=u.supervisor_id,
                supervisor_name=supervisor_name,
                extension=f"#{extension}",
                is_active=u.is_active
            )
        )
    return results

@router.get("/org-chart", response_model=List[OrgChartNodeResponse])
def get_organization_chart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns the hierarchical tree structure for the interactive corporate Org-Chart."""
    if getattr(settings, "IS_TRIAL_BUILD", False):
        return []

    all_users = db.query(User).filter(User.is_active == True).all()
    
    # Build lookup map
    user_map = {u.id: u for u in all_users}
    children_map = {u.id: [] for u in all_users}
    
    roots = []
    for u in all_users:
        sup_ids = u.get_supervisor_ids()
        if sup_ids:
            is_child = False
            for s_id in sup_ids:
                if s_id in user_map and s_id != u.id:
                    children_map[s_id].append(u)
                    is_child = True
            if not is_child:
                roots.append(u)
        else:
            roots.append(u)
            
    # Recursive tree builder
    def build_node(user: User) -> OrgChartNodeResponse:
        subordinate_users = children_map.get(user.id, [])
        children_nodes = [build_node(child) for child in subordinate_users]
        
        return OrgChartNodeResponse(
            id=user.id,
            first_name=user.first_name,
            last_name=user.last_name,
            full_name=user.full_name,
            position=user.position,
            department=user.department,
            departments=user.get_departments(),
            email=user.email,
            phone=user.phone,
            mobile=user.mobile,
            avatar_url=user.avatar_url,
            location=user.location,
            role=user.role,
            supervisor_id=user.supervisor_id,
            supervisor_ids=user.get_supervisor_ids(),
            subordinates_count=len(children_nodes),
            children=children_nodes
        )
        
    tree = [build_node(root) for root in roots]
    return tree

@router.get("", response_model=List[UserResponse])
def list_directory(
    query: Optional[str] = None,
    department: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Legacy/Simple directory list."""
    if getattr(settings, "IS_TRIAL_BUILD", False):
        return []

    q = db.query(User).filter(User.is_active == True)
    if department and department != "Todos" and department != "ALL":
        q = q.filter(User.department == department)
    if query:
        search = f"%{query.lower()}%"
        q = q.filter(
            (User.full_name.ilike(search)) |
            (User.email.ilike(search)) |
            (User.position.ilike(search)) |
            (User.department.ilike(search))
        )
    return q.order_by(User.full_name.asc()).all()

@router.get("/{user_id}", response_model=UserResponse)
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get single user profile by ID."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Mitarbeiter nicht gefunden")
    return user

@router.post("", response_model=UserResponse, dependencies=[Depends(require_roles([RoleEnum.ADMIN]))])
def create_user(user_in: UserCreate, db: Session = Depends(get_db)):
    """Admin-only: Create new corporate employee."""
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Diese E-Mail-Adresse ist bereits registriert")
        
    user = User(
        email=user_in.email.lower().strip(),
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        full_name=user_in.full_name.strip(),
        hashed_password=get_password_hash(user_in.password),
        role=user_in.role,
        department=user_in.department,
        position=user_in.position,
        avatar_url=user_in.avatar_url,
        phone=user_in.phone,
        mobile=user_in.mobile,
        location=user_in.location,
        supervisor_id=user_in.supervisor_id,
        is_active=user_in.is_active
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.patch("/{user_id}/permissions", dependencies=[Depends(require_roles([RoleEnum.ADMIN]))])
def patch_user_permissions(
    user_id: int,
    permissions_in: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """SuperAdmin: Update permissions (such as manage_canteen) for a user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")

    cur_perms = dict(user.custom_permissions or {})
    if "manage_canteen" in permissions_in:
        cur_perms["manage_canteen"] = bool(permissions_in["manage_canteen"])
    if "custom_permissions" in permissions_in and isinstance(permissions_in["custom_permissions"], dict):
        cur_perms.update(permissions_in["custom_permissions"])
    if "modules" in permissions_in and isinstance(permissions_in["modules"], list):
        user.allowed_modules = permissions_in["modules"]

    user.custom_permissions = cur_perms
    db.commit()
    db.refresh(user)
    return {
        "user_id": user.id,
        "full_name": user.full_name,
        "custom_permissions": user.custom_permissions,
        "can_manage_canteen": user.can_manage_canteen,
        "allowed_modules": user.allowed_modules
    }

# =========================================================================
# SELF-SERVICE PROFILE & PASSWORD ENDPOINTS (AVAILABLE TO ALL AUTH USERS)
# =========================================================================

@router.put("/me/profile", response_model=UserResponse)
@router.patch("/me/profile", response_model=UserResponse)
def update_my_profile(
    profile_in: SelfProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Allows any authenticated user to update their own personal profile fields."""
    if profile_in.first_name is not None:
        current_user.first_name = profile_in.first_name.strip() if profile_in.first_name else None
    if profile_in.last_name is not None:
        current_user.last_name = profile_in.last_name.strip() if profile_in.last_name else None
    
    if profile_in.full_name is not None and profile_in.full_name.strip():
        current_user.full_name = profile_in.full_name.strip()
    elif profile_in.first_name or profile_in.last_name:
        current_user.full_name = f"{current_user.first_name or ''} {current_user.last_name or ''}".strip()

    if profile_in.phone is not None:
        current_user.phone = profile_in.phone.strip() if profile_in.phone else None
    if profile_in.mobile is not None:
        current_user.mobile = profile_in.mobile.strip() if profile_in.mobile else None
    if profile_in.location is not None:
        current_user.location = profile_in.location.strip() if profile_in.location else current_user.location

    db.commit()
    db.refresh(current_user)
    return current_user

@router.put("/me/password", response_model=UserResponse)
def update_my_password(
    password_in: SelfPasswordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Allows any authenticated user to change their own password without requiring current password."""
    if not password_in.new_password or len(password_in.new_password.strip()) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Das neue Passwort muss mindestens 4 Zeichen lang sein."
        )

    current_user.hashed_password = get_password_hash(password_in.new_password.strip())
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/me/avatar", response_model=UserResponse)
async def upload_my_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Allows any authenticated user to upload/update their own profile photo."""
    file_ext = os.path.splitext(file.filename)[1].lower() if file.filename else ".png"
    if file_ext not in ALLOWED_EXTENSIONS or file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ungültiges Dateiformat. Erlaubt sind JPG, PNG, WebP und GIF."
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Die Bilddatei ist zu groß. Maximale Größe: 5 MB."
        )

    # Remove previous local avatar file
    remove_user_avatar_file(current_user.avatar_url)

    unique_filename = f"user_{current_user.id}_{uuid.uuid4().hex[:8]}{file_ext}"
    dest_path = os.path.join(AVATAR_DIR, unique_filename)

    with open(dest_path, "wb") as f:
        f.write(content)

    current_user.avatar_url = f"/uploads/avatars/{unique_filename}"
    db.commit()
    db.refresh(current_user)
    return current_user

@router.delete("/me/avatar", response_model=UserResponse)
def delete_my_avatar(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Allows any authenticated user to delete their own custom profile photo."""
    remove_user_avatar_file(current_user.avatar_url)
    current_user.avatar_url = None
    db.commit()
    db.refresh(current_user)
    return current_user

