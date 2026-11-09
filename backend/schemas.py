"""Skema Pydantic untuk respons API. Semua respons memakai format yang sama:
{"success": bool, "message": str, "data": ...}
"""
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict


class ApiResponse(BaseModel):
    success: bool
    message: str
    data: Any = None
    error_code: Optional[str] = None


class StudentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    nama: str
    nim: str


class AttendanceOut(BaseModel):
    id: int
    student_id: int
    nama: str
    nim: str
    timestamp: datetime
    status: str


def ok(message: str, data: Any = None) -> dict:
    """Bentuk respons sukses."""
    return {"success": True, "message": message, "data": data, "error_code": None}
