"""Endpoint kehadiran: GET /attendance dan GET /attendance/summary."""
from datetime import date, datetime, time, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
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


@router.get("/attendance/summary", response_model=ApiResponse)
def attendance_summary(
    tanggal: Optional[date] = Query(None, description="Tanggal acuan, default hari ini (YYYY-MM-DD)"),
    hari: int = Query(7, ge=1, le=31, description="Jumlah hari ke belakang untuk grafik"),
    db: Session = Depends(get_db),
):
    """Ringkasan untuk dashboard: kehadiran pada satu hari dan jumlah hadir per hari."""
    target = tanggal or date.today()
    day_start = datetime.combine(target, time.min)
    day_end = day_start + timedelta(days=1)

    total = db.query(func.count(Student.id)).scalar() or 0
    hadir = (
        db.query(func.count(func.distinct(Attendance.student_id)))
        .filter(Attendance.timestamp >= day_start, Attendance.timestamp < day_end)
        .scalar()
        or 0
    )

    first_day = target - timedelta(days=hari - 1)
    rows = (
        db.query(func.date(Attendance.timestamp), func.count(func.distinct(Attendance.student_id)))
        .filter(Attendance.timestamp >= datetime.combine(first_day, time.min), Attendance.timestamp < day_end)
        .group_by(func.date(Attendance.timestamp))
        .all()
    )
    per_day = {str(d): n for d, n in rows}
    harian = []
    for i in range(hari):
        d = str(first_day + timedelta(days=i))
        harian.append({"tanggal": d, "hadir": per_day.get(d, 0)})

    data = {
        "tanggal": str(target),
        "total_mahasiswa": total,
        "hadir": hadir,
        "belum_hadir": max(total - hadir, 0),
        "persentase_hadir": round(hadir / total * 100, 1) if total else 0.0,
        "harian": harian,
    }
    return ok("Ringkasan kehadiran", data)
