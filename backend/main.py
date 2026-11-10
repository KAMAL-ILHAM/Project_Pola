"""Entry point API Presensi Wajah. Jalankan: uvicorn main:app --reload"""
import os

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import models  # noqa: F401  (agar tabel terdaftar sebelum create_all)
from database import Base, SessionLocal, engine, migrate
from errors import AppError
from models import Admin
from routes import attendance, auth, face, me, settings, students
from security import hash_password

migrate()
Base.metadata.create_all(bind=engine)


def seed_admin():
    """Buat akun admin pertama jika belum ada. Atur lewat env ADMIN_USERNAME / ADMIN_PASSWORD."""
    username = os.getenv("ADMIN_USERNAME", "admin")
    password = os.getenv("ADMIN_PASSWORD", "admin123")
    db = SessionLocal()
    try:
        if db.query(Admin).count() == 0:
            db.add(Admin(username=username, nama="Administrator", password_hash=hash_password(password)))
            db.commit()
            if "ADMIN_PASSWORD" not in os.environ:
                print("[PERINGATAN] Admin dibuat dengan password bawaan 'admin123'. Ganti lewat halaman Pengaturan.")
    finally:
        db.close()


seed_admin()

app = FastAPI(
    title="API Presensi Wajah",
    description="Backend sistem presensi berbasis pengenalan wajah (Kelompok 7, Pengenalan Pola).",
    version="0.2.0",
)

# CORS: izinkan frontend (Vite 5173, atau server lain di 3000) memanggil API
# Tambahan origin (mis. laptop teman di jaringan yang sama) lewat env CORS_ORIGINS, dipisah koma.
_extra_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", *_extra_origins],
    allow_methods=["*"],
    allow_headers=["*"],  # termasuk header Authorization
)


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "message": exc.message, "data": None, "error_code": exc.error_code},
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    detail = [{"field": ".".join(str(p) for p in e["loc"][1:]), "message": e["msg"]} for e in exc.errors()]
    return JSONResponse(
        status_code=422,
        content={"success": False, "message": "Input tidak valid", "data": detail, "error_code": "INVALID_INPUT"},
    )


app.include_router(auth.router)
app.include_router(me.router)
app.include_router(settings.router)
app.include_router(face.router)
app.include_router(attendance.router)
app.include_router(students.router)


@app.get("/", tags=["Info"])
def root():
    return {"success": True, "message": "API Presensi Wajah aktif. Dokumentasi: /docs", "data": None, "error_code": None}
