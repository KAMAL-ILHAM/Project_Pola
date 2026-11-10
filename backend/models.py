"""Tabel database: students, attendance, admins, auth_tokens, settings."""
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
    # kapan mahasiswa mendaftar; dipakai agar "belum hadir" di hari lampau tidak menghitung yang belum terdaftar
    created_at = Column(DateTime, default=datetime.now, nullable=False)


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.now, nullable=False)
    status = Column(String, default="hadir", nullable=False)


class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False, index=True)
    nama = Column(String, nullable=False, default="Administrator")
    password_hash = Column(String, nullable=False)  # format: scrypt$salt$hash (tidak pernah menyimpan password asli)


class AuthToken(Base):
    """Token sesi. Yang disimpan hanya hash SHA-256 token, jadi isi tabel tidak bisa dipakai login."""
    __tablename__ = "auth_tokens"

    id = Column(Integer, primary_key=True)
    token_hash = Column(String, unique=True, nullable=False, index=True)
    role = Column(String, nullable=False)  # "admin" | "student"
    subject_id = Column(Integer, nullable=False, index=True)  # id admin atau id mahasiswa
    expires_at = Column(DateTime, nullable=False)


class Setting(Base):
    """Pengaturan sederhana key-value (mis. threshold pencocokan wajah)."""
    __tablename__ = "settings"

    key = Column(String, primary_key=True)
    value = Column(String, nullable=False)


def parse_encodings(text: str) -> list:
    """Ubah isi kolom encoding menjadi daftar encoding.

    Mendukung format lama (satu encoding datar berisi 128 angka)
    dan format baru (daftar berisi beberapa encoding).
    """
    data = json.loads(text)
    if data and isinstance(data[0], (int, float)):
        return [data]
    return data
