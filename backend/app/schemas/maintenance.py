import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

class VehicleMetaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    vehicle_id: str
    plate: str
    brand: Optional[str] = None
    current_mileage: int
    last_telemetry_at: datetime.datetime
    updated_at: datetime.datetime


class MaintenanceIntervalBase(BaseModel):
    vehicle_id: str
    plate: str
    service_type: str  # TUEV_SP, UVV, OIL_SERVICE, TIRES, GENERAL_INSPECTION, BRAKES
    interval_km: int = 30000
    last_service_mileage: int = 0
    last_service_date: Optional[datetime.date] = None
    next_due_mileage: Optional[int] = None
    next_due_date: Optional[datetime.date] = None
    warning_threshold_km: int = 1500
    notes: Optional[str] = None


class MaintenanceIntervalCreate(MaintenanceIntervalBase):
    pass


class MaintenanceIntervalUpdate(BaseModel):
    service_type: Optional[str] = None
    interval_km: Optional[int] = None
    last_service_mileage: Optional[int] = None
    last_service_date: Optional[datetime.date] = None
    next_due_mileage: Optional[int] = None
    next_due_date: Optional[datetime.date] = None
    warning_threshold_km: Optional[int] = None
    notes: Optional[str] = None


class MaintenanceIntervalResponse(MaintenanceIntervalBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str  # OK, DUE_SOON, OVERDUE
    next_due_mileage: int
    current_mileage: Optional[int] = None
    remaining_km: Optional[int] = None
    progress_percentage: Optional[float] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime


class MaintenanceLogCreate(BaseModel):
    interval_id: Optional[int] = None
    vehicle_id: str
    plate: str
    service_type: str
    service_mileage: int
    service_date: Optional[datetime.date] = None
    performed_by: Optional[str] = "Werkstatt Altlandsberg"
    workshop_name: Optional[str] = "Tinglev Werkstatt Altlandsberg"
    invoice_number: Optional[str] = None
    cost_euros: Optional[float] = 0.0
    notes: Optional[str] = None


class MaintenanceLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    interval_id: Optional[int] = None
    vehicle_id: str
    plate: str
    service_type: str
    service_mileage: int
    service_date: datetime.date
    performed_by: str
    workshop_name: str
    invoice_number: Optional[str] = None
    cost_euros: Optional[float] = 0.0
    notes: Optional[str] = None
    created_at: datetime.datetime


class MaintenanceAlertResponse(BaseModel):
    interval_id: int
    vehicle_id: str
    plate: str
    brand: Optional[str] = None
    service_type: str
    status: str  # OVERDUE, DUE_SOON
    current_mileage: int
    next_due_mileage: int
    remaining_km: int
    next_due_date: Optional[datetime.date] = None
    warning_threshold_km: int
    notes: Optional[str] = None


class MaintenanceSummaryResponse(BaseModel):
    total_intervals: int
    overdue_count: int
    due_soon_count: int
    ok_count: int
    total_cost_euros: float
    alerts: List[MaintenanceAlertResponse]
