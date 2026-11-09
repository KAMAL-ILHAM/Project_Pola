"""Tabel database: students dan attendance."""
import json
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text

from database import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    nama = Column(String, nullable=False)
    nim = Column(String, unique=True, nullable=False, index=True)
    # daftar encoding (satu per foto), disimpan sebagai teks JSON: [[128 angka], [128 angka], ...]
    encoding = Column(Text, nullable=False)


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.now, nullable=False)
    status = Column(String, default="hadir", nullable=False)


def parse_encodings(text: str) -> list:
    """Ubah isi kolom encoding menjadi daftar encoding.

    Mendukung format lama (satu encoding datar berisi 128 angka)
    dan format baru (daftar berisi beberapa encoding).
    """
    data = json.loads(text)
    if data and isinstance(data[0], (int, float)):
        return [data]
    return data
