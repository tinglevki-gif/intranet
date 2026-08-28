from typing import Any, Dict
from fastapi import APIRouter, Depends, Query, HTTPException, status
from app.models.user import User, RoleEnum
from app.services.auth_service import get_current_user
from app.services.perseus_service import (
    fetch_perseus_overview,
    fetch_infrastructure_dashboard,
    fetch_awareness_dashboard,
    clear_perseus_cache
)

router = APIRouter()


@router.get("/overview", response_model=Dict[str, Any])
async def get_perseus_overview(
    force_refresh: bool = Query(False, description="Bypass in-memory cache and query Perseus API live"),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Returns aggregated Perseus Security & Awareness Hub data for IT Management dashboard:
    1. Infrastructure & Domain Scan
    2. Employee Awareness & Phishing Simulations
    """
    return await fetch_perseus_overview(force_refresh=force_refresh)


@router.get("/infrastructure", response_model=Dict[str, Any])
async def get_perseus_infrastructure(
    force_refresh: bool = Query(False),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Returns domain security, SSL status, email DNS authentication and perimeter vulnerability scan.
    """
    return await fetch_infrastructure_dashboard(force_refresh=force_refresh)


@router.get("/awareness", response_model=Dict[str, Any])
async def get_perseus_awareness(
    force_refresh: bool = Query(False),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Returns employee cybersecurity awareness index, phishing simulation stats and training progress.
    """
    return await fetch_awareness_dashboard(force_refresh=force_refresh)


@router.post("/refresh", response_model=Dict[str, Any])
async def refresh_perseus_data(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Force-refreshes Perseus API cache and fetches latest live security telemetry.
    """
    clear_perseus_cache()
    return await fetch_perseus_overview(force_refresh=True)
