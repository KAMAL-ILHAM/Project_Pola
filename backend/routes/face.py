"""POST /register dan POST /recognize."""
import json
import re
from datetime import datetime, time, timedelta
from typing import List

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

import face_service
from database import get_db
from errors import AppError
from models import Attendance, Student
from schemas import ApiResponse, ok, student_out
from utils import read_image

router = APIRouter(tags=["Wajah"])

MAX_PHOTOS = 10  # batas foto per pendaftaran


@router.post("/register", response_model=ApiResponse, status_code=201)
async def register(
    nama: str = Form(...),
    nim: str = Form(...),
    foto: List[UploadFile] = File(..., description="Satu atau beberapa foto (kirim field 'foto' berulang)"),
    db: Session = Depends(get_db),
):
    """Daftarkan mahasiswa dengan 1-10 foto. Tiap foto diubah jadi satu encoding, foto tidak disimpan."""
    nama, nim = nama.strip(), nim.strip()
    if not nama:
        raise AppError(422, "INVALID_INPUT", "Nama tidak boleh kosong.")
    if not re.fullmatch(r"\d{5,20}", nim):
        raise AppError(422, "INVALID_INPUT", "NIM harus berupa angka (5-20 digit).")
    if len(foto) > MAX_PHOTOS:
        raise AppError(422, "TOO_MANY_PHOTOS", f"Maksimal {MAX_PHOTOS} foto per pendaftaran.")
    if db.query(Student).filter(Student.nim == nim).first():
        raise AppError(409, "NIM_ALREADY_REGISTERED", "NIM sudah terdaftar.")

    encodings = []
    for i, file in enumerate(foto, start=1):
        try:
            image = await read_image(file)
            encodings.append(face_service.get_encoding(image))
        except AppError as e:
            # sebutkan foto ke berapa yang bermasalah supaya mudah diulang
            raise AppError(e.status_code, e.error_code, f"Foto ke-{i}: {e.message}")

    student = Student(nama=nama, nim=nim, encoding=json.dumps(encodings))
    db.add(student)
    db.commit()
    db.refresh(student)
    return ok(f"Pendaftaran berhasil ({len(encodings)} foto)", student_out(student))


@router.post("/recognize", response_model=ApiResponse)
async def recognize(foto: UploadFile = File(...), db: Session = Depends(get_db)):
    """Kenali wajah lalu catat kehadiran. Satu mahasiswa hanya tercatat sekali per hari."""
    image = await read_image(foto)
    encoding = face_service.get_encoding(image)

    match = face_service.match_face(encoding)
    if match is None:
        raise AppError(404, "FACE_NOT_RECOGNIZED", "Wajah tidak dikenali.")

    student = db.query(Student).filter(Student.nim == match["nim"]).first()
    if student is None:
        raise AppError(404, "STUDENT_NOT_FOUND", "Data mahasiswa tidak ditemukan di database.")

    # anti-duplikasi: cek apakah sudah ada catatan hari ini
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
    result = {
        "nama": student.nama,
        "nim": student.nim,
        "distance": match["distance"],
    }
    if existing:
        result.update(already_recorded=True, timestamp=existing.timestamp, status=existing.status)
        return ok(f"{student.nama} sudah tercatat hari ini", result)

    record = Attendance(student_id=student.id, status="hadir")
    db.add(record)
    db.commit()
    db.refresh(record)
    result.update(already_recorded=False, timestamp=record.timestamp, status=record.status)
    return ok(f"Kehadiran {student.nama} berhasil dicatat", result)
