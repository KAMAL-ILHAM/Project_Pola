"""Tabel database: students dan attendance."""
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text

from database import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    nama = Column(String, nullable=False)
    nim = Column(String, unique=True, nullable=False, index=True)
    encoding = Column(Text, nullable=False)  # 128 angka disimpan sebagai teks JSON


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.now, nullable=False)
    status = Column(String, default="hadir", nullable=False)
