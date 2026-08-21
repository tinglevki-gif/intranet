from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, RoleEnum
from app.schemas.user import UserResponse, UserDirectoryResponse, OrgChartNodeResponse, UserCreate
from app.services.auth_service import get_current_user, require_roles
from app.core.security import get_password_hash

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
    all_users = db.query(User).filter(User.is_active == True).all()
    
    # Build lookup map
    user_map = {u.id: u for u in all_users}
    children_map = {u.id: [] for u in all_users}
    
    roots = []
    for u in all_users:
        if u.supervisor_id and u.supervisor_id in user_map:
            children_map[u.supervisor_id].append(u)
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
            email=user.email,
            phone=user.phone,
            mobile=user.mobile,
            avatar_url=user.avatar_url,
            location=user.location,
            role=user.role,
            supervisor_id=user.supervisor_id,
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
        raise HTTPException(status_code=404, detail="Colaborador no encontrado")
    return user

@router.post("", response_model=UserResponse, dependencies=[Depends(require_roles([RoleEnum.ADMIN]))])
def create_user(user_in: UserCreate, db: Session = Depends(get_db)):
    """Admin-only: Create new corporate employee."""
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="El correo electrónico ya se encuentra registrado")
        
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
