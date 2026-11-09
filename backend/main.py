"""Entry point API Presensi Wajah. Jalankan: uvicorn main:app --reload"""
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import models  # noqa: F401  (agar tabel terdaftar sebelum create_all)
from database import Base, engine
from errors import AppError
from routes import attendance, face, students

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="API Presensi Wajah",
    description="Backend sistem presensi berbasis pengenalan wajah (Kelompok 7, Pengenalan Pola).",
    version="0.1.0",
)

# CORS: izinkan frontend (Vite 5173, atau server lain di 3000) memanggil API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
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


app.include_router(face.router)
app.include_router(attendance.router)
app.include_router(students.router)


@app.get("/", tags=["Info"])
def root():
    return {"success": True, "message": "API Presensi Wajah aktif. Dokumentasi: /docs", "data": None, "error_code": None}
