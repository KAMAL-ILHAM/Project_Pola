"""GET /students: daftar mahasiswa terdaftar (encoding tidak ikut dikirim)."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Student
from schemas import ApiResponse, StudentOut, ok

router = APIRouter(tags=["Mahasiswa"])


@router.get("/students", response_model=ApiResponse)
def list_students(db: Session = Depends(get_db)):
    """Daftar semua mahasiswa yang sudah terdaftar."""
    students = db.query(Student).order_by(Student.nama).all()
    data = [StudentOut.model_validate(s) for s in students]
    return ok(f"{len(data)} mahasiswa terdaftar", data)
