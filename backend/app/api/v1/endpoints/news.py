import os
import uuid
import math
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from app.core.database import get_db
from app.models.user import User, RoleEnum
from app.models.announcement import Announcement, NewsPost
from app.schemas.news import (
    NewsPostCreate, 
    NewsPostUpdate, 
    NewsPostResponse, 
    NewsListResponse,
    NEWS_CATEGORIES
)
from app.services.auth_service import get_current_user, require_roles

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
UPLOAD_ROOT = os.path.join(BASE_DIR, "uploads")
NEWS_UPLOAD_DIR = os.path.join(UPLOAD_ROOT, "news")
os.makedirs(NEWS_UPLOAD_DIR, exist_ok=True)

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/svg+xml": ".svg"
}

def format_news_response(post: Announcement, db: Session = None) -> NewsPostResponse:
    # Approximate read time based on ~180-200 words/min
    word_count = len((post.content or "").split())
    read_time = max(1, math.ceil(word_count / 180))

    author_avatar = post.author.avatar_url if post.author else None
    author_dept = post.author.department if post.author else "Unternehmenskommunikation"
    author_name = post.author_name or (post.author.full_name if post.author else "Geschäftsleitung")

    # If post has a specific author_name, attempt lookup in database to get the matching profile avatar
    if db and post.author_name:
        matched_user = db.query(User).filter(User.full_name == post.author_name).first()
        if matched_user:
            author_avatar = matched_user.avatar_url or author_avatar
            author_dept = matched_user.department or author_dept

    return NewsPostResponse(
        id=post.id,
        title=post.title,
        summary=post.summary or "",
        content=post.content or "",
        category=post.category or "Allgemein",
        is_pinned=bool(post.is_pinned),
        cover_image=post.cover_image,
        author_id=post.author_id,
        author_name=author_name,
        author_avatar=author_avatar,
        author_department=author_dept,
        views_count=post.views_count or 0,
        read_time_minutes=read_time,
        created_at=post.created_at,
        updated_at=post.updated_at
    )

@router.get("/categories", tags=["Unternehmensnews & Mitteilungen"])
def get_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns all available categories and count of posts in each."""
    posts = db.query(Announcement).all()
    counts = {}
    for cat in NEWS_CATEGORIES:
        counts[cat] = 0
    for p in posts:
        c = p.category or "Allgemein"
        counts[c] = counts.get(c, 0) + 1
    return {
        "categories": NEWS_CATEGORIES,
        "counts": counts,
        "total": len(posts)
    }

@router.get("", response_model=List[NewsPostResponse], tags=["Unternehmensnews & Mitteilungen"])
def list_news(
    category: Optional[str] = Query(None, description="Nach Kategorie filtern (z.B. Allgemein, IT-Sicherheit)"),
    search: Optional[str] = Query(None, alias="q", description="Volltextsuche in Titel, Kurzbeschreibung und Inhalt"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Public for all authenticated employees.
    Returns corporate news and announcements, sorted with pinned/wichtig posts first, then chronologically by created_at desc.
    """
    q = db.query(Announcement)

    # Category filter
    if category and category.upper() not in ["ALL", "ALLE", ""]:
        q = q.filter(Announcement.category.ilike(f"%{category}%"))

    # Search filter
    if search and search.strip():
        term = f"%{search.strip()}%"
        q = q.filter(
            or_(
                Announcement.title.ilike(term),
                Announcement.summary.ilike(term),
                Announcement.content.ilike(term),
                Announcement.author_name.ilike(term)
            )
        )

    posts = q.order_by(
        desc(Announcement.is_pinned), 
        desc(Announcement.created_at)
    ).offset(offset).limit(limit).all()

    return [format_news_response(p, db) for p in posts]

@router.get("/{news_id}", response_model=NewsPostResponse, tags=["Unternehmensnews & Mitteilungen"])
def get_news_detail(
    news_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get full details for a single news post and increment views count.
    """
    post = db.query(Announcement).filter(Announcement.id == news_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Nachricht / Ankündigung nicht gefunden."
        )

    # Increment view counter
    post.views_count = (post.views_count or 0) + 1
    db.commit()
    db.refresh(post)

    return format_news_response(post, db)

@router.post("", response_model=NewsPostResponse, status_code=status.HTTP_201_CREATED, tags=["Unternehmensnews & Mitteilungen"])
def create_news(
    payload: NewsPostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN]))
):
    """
    SuperAdmin only: Create a new corporate news article or announcement.
    """
    resolved = payload.get_resolved_values()
    if not resolved["title"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Titel der Nachricht ist erforderlich."
        )
    if not resolved["content"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Inhalt der Nachricht ist erforderlich."
        )

    new_post = Announcement(
        title=resolved["title"],
        summary=resolved["summary"],
        content=resolved["content"],
        category=resolved["category"],
        is_pinned=resolved["is_pinned"],
        cover_image=resolved["cover_image"],
        author_id=current_user.id,
        author_name=current_user.full_name,
        views_count=0
    )

    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    return format_news_response(new_post, db)

@router.put("/{news_id}", response_model=NewsPostResponse, tags=["Unternehmensnews & Mitteilungen"])
@router.patch("/{news_id}", response_model=NewsPostResponse, tags=["Unternehmensnews & Mitteilungen"])
def update_news(
    news_id: int,
    payload: NewsPostUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN]))
):
    """
    SuperAdmin only: Update an existing corporate news post.
    """
    post = db.query(Announcement).filter(Announcement.id == news_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Nachricht / Ankündigung nicht gefunden."
        )

    resolved_title = payload.title or payload.titel
    if resolved_title is not None:
        post.title = resolved_title.strip()

    resolved_summary = payload.summary if payload.summary is not None else payload.kurzbeschreibung
    if resolved_summary is not None:
        post.summary = resolved_summary.strip()

    resolved_content = payload.content or payload.inhalt
    if resolved_content is not None:
        post.content = resolved_content.strip()

    resolved_category = payload.category or payload.kategorie
    if resolved_category is not None:
        post.category = resolved_category.strip()

    resolved_pinned = payload.is_pinned if payload.is_pinned is not None else payload.ist_wichtig
    if resolved_pinned is not None:
        post.is_pinned = bool(resolved_pinned)

    resolved_cover = payload.cover_image if payload.cover_image is not None else payload.titelbild_url
    if resolved_cover is not None:
        post.cover_image = resolved_cover.strip() if resolved_cover else None

    db.commit()
    db.refresh(post)

    return format_news_response(post, db)

@router.delete("/{news_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Unternehmensnews & Mitteilungen"])
def delete_news(
    news_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN]))
):
    """
    SuperAdmin only: Delete a corporate news post.
    """
    post = db.query(Announcement).filter(Announcement.id == news_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Nachricht / Ankündigung nicht gefunden."
        )

    # Clean up local image file if stored locally in uploads/news
    if post.cover_image and post.cover_image.startswith("/uploads/news/"):
        filename = post.cover_image.replace("/uploads/news/", "")
        local_file = os.path.join(NEWS_UPLOAD_DIR, filename)
        if os.path.exists(local_file):
            try:
                os.remove(local_file)
            except Exception:
                pass

    db.delete(post)
    db.commit()
    return None

@router.post("/upload-cover", tags=["Unternehmensnews & Mitteilungen"])
async def upload_news_cover(
    file: UploadFile = File(...),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN]))
):
    """
    SuperAdmin only: Upload a cover image for a news article.
    Accepts JPG, PNG, WEBP, GIF, SVG. Returns public relative URL.
    """
    content_type = file.content_type
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ungültiges Dateiformat '{content_type}'. Erlaubt sind JPG, PNG, WEBP, GIF, SVG."
        )

    ext = ALLOWED_IMAGE_TYPES[content_type]
    unique_filename = f"news_{uuid.uuid4().hex[:12]}{ext}"
    target_path = os.path.join(NEWS_UPLOAD_DIR, unique_filename)

    file_bytes = await file.read()
    if len(file_bytes) > 10 * 1024 * 1024:  # 10 MB limit
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Die Bilddatei ist zu groß (maximal 10 MB erlaubt)."
        )

    with open(target_path, "wb") as f:
        f.write(file_bytes)

    relative_url = f"/uploads/news/{unique_filename}"

    return {
        "status": "success",
        "url": relative_url,
        "filename": unique_filename,
        "size_bytes": len(file_bytes)
    }
