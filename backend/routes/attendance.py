"""Endpoint kehadiran: GET /attendance dan GET /attendance/summary."""
from datetime import date, datetime, time, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from errors import AppError
from models import Attendance, Student
from schemas import ApiResponse, AttendanceOut, ok
from security import require_admin

# seluruh endpoint di sini hanya untuk admin
router = APIRouter(tags=["Kehadiran"], dependencies=[Depends(require_admin)])


@router.get("/attendance", response_model=ApiResponse)
def list_attendance(
    tanggal: Optional[date] = Query(None, description="Satu tanggal, format YYYY-MM-DD"),
    dari: Optional[date] = Query(None, description="Awal rentang tanggal (termasuk)"),
    sampai: Optional[date] = Query(None, description="Akhir rentang tanggal (termasuk)"),
    nama: Optional[str] = Query(None, description="Cari sebagian nama"),
    limit: Optional[int] = Query(None, ge=1, le=1000, description="Maksimal baris (pagination)"),
    offset: int = Query(0, ge=0, description="Lewati sekian baris pertama (pagination)"),
    db: Session = Depends(get_db),
):
    """Rekap kehadiran, terbaru di atas. Semua filter opsional.

    `tanggal` dan rentang `dari`/`sampai` bisa dipakai bersamaan (hasilnya irisan).
    Tanpa `limit`, semua baris dikirim (kompatibel dengan frontend lama).
    """
    if dari and sampai and dari > sampai:
        raise AppError(422, "INVALID_INPUT", "Tanggal 'dari' tidak boleh setelah 'sampai'.")

    query = db.query(Attendance, Student).join(Student, Attendance.student_id == Student.id)
    if tanggal:
        start = datetime.combine(tanggal, time.min)
        query = query.filter(Attendance.timestamp >= start, Attendance.timestamp < start + timedelta(days=1))
    if dari:
        query = query.filter(Attendance.timestamp >= datetime.combine(dari, time.min))
    if sampai:
        query = query.filter(Attendance.timestamp < datetime.combine(sampai, time.min) + timedelta(days=1))
    if nama:
        query = query.filter(Student.nama.ilike(f"%{nama}%"))

    total = query.count()
    query = query.order_by(Attendance.timestamp.desc(), Attendance.id.desc()).offset(offset)
    if limit:
        query = query.limit(limit)
    rows = query.all()
    data = [
        AttendanceOut(id=a.id, student_id=s.id, nama=s.nama, nim=s.nim, timestamp=a.timestamp, status=a.status)
        for a, s in rows
    ]
    return ok(f"{len(data)} dari {total} catatan kehadiran", data)


@router.delete("/attendance/{attendance_id}", response_model=ApiResponse)
def delete_attendance(attendance_id: int, db: Session = Depends(get_db)):
    """Hapus satu catatan kehadiran (koreksi, mis. salah deteksi)."""
    record = db.get(Attendance, attendance_id)
    if record is None:
        raise AppError(404, "ATTENDANCE_NOT_FOUND", "Catatan kehadiran tidak ditemukan.")
    db.delete(record)
    db.commit()
    return ok("Catatan kehadiran dihapus", {"id": attendance_id})


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

    # hanya mahasiswa yang sudah terdaftar pada tanggal itu (created_at), supaya "belum hadir" hari lampau akurat
    total = db.query(func.count(Student.id)).filter(Student.created_at < day_end).scalar() or 0
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
