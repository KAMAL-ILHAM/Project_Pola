"""Skema Pydantic untuk request/respons API. Semua respons memakai format yang sama:
{"success": bool, "message": str, "data": ..., "error_code": str | null}
"""
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field

from models import Student, parse_encodings


class ApiResponse(BaseModel):
    success: bool
    message: str
    data: Any = None
    error_code: Optional[str] = None


class StudentOut(BaseModel):
    id: int
    nama: str
    nim: str
    jumlah_foto: int = 0


class StudentUpdate(BaseModel):
    """Body untuk PUT /students/{id}. Isi minimal salah satu."""
    nama: Optional[str] = Field(None, max_length=100)
    nim: Optional[str] = Field(None, pattern=r"^\d{5,20}$")


class AttendanceOut(BaseModel):
    id: int
    student_id: int
    nama: str
    nim: str
    timestamp: datetime
    status: str


def student_out(student: Student) -> StudentOut:
    """Ubah baris Student menjadi StudentOut (tanpa mengirim data encoding)."""
    return StudentOut(
        id=student.id,
        nama=student.nama,
        nim=student.nim,
        jumlah_foto=len(parse_encodings(student.encoding)),
    )


def ok(message: str, data: Any = None) -> dict:
    """Bentuk respons sukses."""
    return {"success": True, "message": message, "data": data, "error_code": None}
