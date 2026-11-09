"""GET /attendance: rekap kehadiran dengan filter tanggal dan nama."""
from datetime import date, datetime, time, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from models import Attendance, Student
from schemas import ApiResponse, AttendanceOut, ok

router = APIRouter(tags=["Kehadiran"])


@router.get("/attendance", response_model=ApiResponse)
def list_attendance(
    tanggal: Optional[date] = Query(None, description="Format YYYY-MM-DD"),
    nama: Optional[str] = Query(None, description="Cari sebagian nama"),
    db: Session = Depends(get_db),
):
    """Rekap kehadiran, terbaru di atas. Kedua filter bersifat opsional."""
    query = db.query(Attendance, Student).join(Student, Attendance.student_id == Student.id)
    if tanggal:
        start = datetime.combine(tanggal, time.min)
        query = query.filter(Attendance.timestamp >= start, Attendance.timestamp < start + timedelta(days=1))
    if nama:
        query = query.filter(Student.nama.ilike(f"%{nama}%"))

    rows = query.order_by(Attendance.timestamp.desc()).all()
    data = [
        AttendanceOut(id=a.id, student_id=s.id, nama=s.nama, nim=s.nim, timestamp=a.timestamp, status=a.status)
        for a, s in rows
    ]
    return ok(f"{len(data)} catatan kehadiran", data)
