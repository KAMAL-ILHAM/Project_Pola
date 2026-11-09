"""Endpoint mahasiswa: GET, PUT, DELETE /students."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from errors import AppError
from models import Attendance, Student
from schemas import ApiResponse, StudentUpdate, ok, student_out

router = APIRouter(tags=["Mahasiswa"])


def _get_or_404(db: Session, student_id: int) -> Student:
    student = db.get(Student, student_id)
    if student is None:
        raise AppError(404, "STUDENT_NOT_FOUND", "Mahasiswa tidak ditemukan.")
    return student


@router.get("/students", response_model=ApiResponse)
def list_students(db: Session = Depends(get_db)):
    """Daftar semua mahasiswa terdaftar (encoding tidak ikut dikirim)."""
    students = db.query(Student).order_by(Student.nama).all()
    data = [student_out(s) for s in students]
    return ok(f"{len(data)} mahasiswa terdaftar", data)


@router.put("/students/{student_id}", response_model=ApiResponse)
def update_student(student_id: int, body: StudentUpdate, db: Session = Depends(get_db)):
    """Ubah nama dan/atau NIM mahasiswa. NIM harus tetap unik."""
    student = _get_or_404(db, student_id)
    if body.nama is None and body.nim is None:
        raise AppError(422, "INVALID_INPUT", "Isi minimal salah satu: nama atau nim.")

    if body.nama is not None:
        nama = body.nama.strip()
        if not nama:
            raise AppError(422, "INVALID_INPUT", "Nama tidak boleh kosong.")
        student.nama = nama

    if body.nim is not None and body.nim != student.nim:
        used = db.query(Student).filter(Student.nim == body.nim, Student.id != student.id).first()
        if used:
            raise AppError(409, "NIM_ALREADY_REGISTERED", "NIM sudah dipakai mahasiswa lain.")
        student.nim = body.nim

    db.commit()
    db.refresh(student)
    return ok("Data mahasiswa diperbarui", student_out(student))


@router.delete("/students/{student_id}", response_model=ApiResponse)
def delete_student(student_id: int, db: Session = Depends(get_db)):
    """Hapus mahasiswa beserta encoding dan seluruh catatan kehadirannya.

    Catatan kehadiran ikut dihapus karena data wajah adalah data pribadi:
    jika pemiliknya meminta dihapus, jejaknya tidak boleh tersisa.
    """
    student = _get_or_404(db, student_id)
    removed = db.query(Attendance).filter(Attendance.student_id == student.id).delete()
    info = {"id": student.id, "nama": student.nama, "nim": student.nim, "catatan_kehadiran_dihapus": removed}
    db.delete(student)
    db.commit()
    return ok(f"{info['nama']} berhasil dihapus", info)
