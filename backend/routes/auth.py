"""Autentikasi: login admin (username + password), login mahasiswa (wajah), ganti password, logout."""
from typing import Optional

from fastapi import APIRouter, Depends, File, Request, UploadFile
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

import face_service
import security
from database import get_db
from errors import AppError
from models import Admin, Student
from schemas import ApiResponse, ChangePasswordIn, LoginIn, ok
from settings_service import get_threshold
from utils import read_image

router = APIRouter(prefix="/auth", tags=["Autentikasi"])

# Login lebih ketat daripada absen biasa: salah kenal berarti orang lain membuka akun mahasiswa.
# Jarak wajah harus lebih kecil dari (threshold - LOGIN_MARGIN).
LOGIN_MARGIN = 0.05

# hash palsu untuk menyamakan waktu respons saat username tidak ada (mencegah penebakan username)
_DUMMY_HASH = security.hash_password("tidak-dipakai")


@router.post("/login", response_model=ApiResponse)
def login_admin(body: LoginIn, db: Session = Depends(get_db)):
    """Login admin. Salah username/password: 401 INVALID_CREDENTIALS."""
    admin = db.query(Admin).filter(Admin.username == body.username.strip()).first()
    valid = security.verify_password(body.password, admin.password_hash if admin else _DUMMY_HASH)
    if admin is None or not valid:
        raise AppError(401, "INVALID_CREDENTIALS", "Username atau password salah.")
    token = security.issue_token(db, "admin", admin.id)
    return ok("Login berhasil", {"token": token, "nama": admin.nama})


@router.post("/face-login", response_model=ApiResponse)
async def face_login(request: Request, foto: UploadFile = File(...), db: Session = Depends(get_db)):
    """Login mahasiswa dengan verifikasi wajah (tanpa sandi). TIDAK mencatat kehadiran.

    Dibatasi 10 percobaan per 5 menit per IP. Token berlaku 30 menit, peran "student".
    """
    security.face_login_limiter.check(security.client_key(request))

    image = await read_image(foto)
    try:
        encoding = face_service.get_encoding(image)
    except AppError as e:
        if e.error_code == "NO_FACE_DETECTED":
            raise AppError(400, "NO_FACE_DETECTED", e.message)
        raise

    match = face_service.match_face(encoding)
    if match is None or match["distance"] > get_threshold() - LOGIN_MARGIN:
        raise AppError(404, "FACE_NOT_RECOGNIZED", "Wajah tidak dikenali atau belum terdaftar.")

    student = db.query(Student).filter(Student.nim == match["nim"]).first()
    if student is None:
        raise AppError(404, "FACE_NOT_RECOGNIZED", "Wajah tidak dikenali atau belum terdaftar.")

    token = security.issue_token(db, "student", student.id)
    return ok(f"Selamat datang, {student.nama}", {"token": token, "nama": student.nama, "nim": student.nim})


@router.post("/change-password", response_model=ApiResponse)
def change_password(body: ChangePasswordIn, admin: Admin = Depends(security.require_admin), db: Session = Depends(get_db)):
    """Ganti password admin yang sedang login. Password lama salah: 400 WRONG_PASSWORD."""
    if not security.verify_password(body.password_lama, admin.password_hash):
        raise AppError(400, "WRONG_PASSWORD", "Password lama salah.")
    admin.password_hash = security.hash_password(body.password_baru)
    db.commit()
    return ok("Password berhasil diganti")


@router.post("/logout", response_model=ApiResponse)
def logout(creds: Optional[HTTPAuthorizationCredentials] = Depends(security.bearer_scheme), db: Session = Depends(get_db)):
    """Cabut token yang sedang dipakai (admin maupun mahasiswa)."""
    security.revoke_token(db, creds)
    return ok("Berhasil keluar")
