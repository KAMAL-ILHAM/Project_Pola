"""Endpoint untuk mahasiswa yang sudah login (identitas diambil dari token, bukan parameter)."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from attendance_service import mark_today
from database import get_db
from models import Attendance, Student
from schemas import ApiResponse, ok
from security import require_student

router = APIRouter(prefix="/me", tags=["Mahasiswa (login)"])


@router.get("/attendance", response_model=ApiResponse)
def my_attendance(student: Student = Depends(require_student), db: Session = Depends(get_db)):
    """Riwayat kehadiran milik sendiri, terbaru di atas."""
    rows = db.query(Attendance).filter(Attendance.student_id == student.id).order_by(Attendance.timestamp.desc()).all()
    data = [{"id": a.id, "timestamp": a.timestamp, "status": a.status} for a in rows]
    return ok(f"{len(data)} catatan kehadiran", data)


@router.post("/attendance", response_model=ApiResponse)
def mark_my_attendance(student: Student = Depends(require_student), db: Session = Depends(get_db)):
    """Catat kehadiran hari ini untuk diri sendiri. Satu kali per hari."""
    record, already = mark_today(db, student)
    data = {"timestamp": record.timestamp, "status": record.status, "already_recorded": already}
    msg = "Kehadiran hari ini sudah tercatat" if already else "Kehadiran berhasil dicatat"
    return ok(msg, data)
