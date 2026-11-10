"""Logika kehadiran yang dipakai bersama oleh /recognize dan /me/attendance."""
from datetime import datetime, time, timedelta

from sqlalchemy.orm import Session

from models import Attendance, Student


def mark_today(db: Session, student: Student):
    """Catat kehadiran hari ini. Satu mahasiswa hanya tercatat sekali per hari.

    Mengembalikan (record, already_recorded).
    """
    start = datetime.combine(datetime.now().date(), time.min)
    existing = (
        db.query(Attendance)
        .filter(
            Attendance.student_id == student.id,
            Attendance.timestamp >= start,
            Attendance.timestamp < start + timedelta(days=1),
        )
        .first()
    )
    if existing:
        return existing, True
    record = Attendance(student_id=student.id, status="hadir")
    db.add(record)
    db.commit()
    db.refresh(record)
    return record, False
