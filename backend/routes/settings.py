"""Pengaturan threshold pencocokan wajah (hanya admin)."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import settings_service
from database import get_db
from schemas import ApiResponse, SettingsIn, ok
from security import require_admin

router = APIRouter(tags=["Pengaturan"], dependencies=[Depends(require_admin)])


@router.get("/settings", response_model=ApiResponse)
def get_settings():
    """Ambil pengaturan saat ini."""
    return ok("Pengaturan", {"threshold": settings_service.get_threshold()})


@router.put("/settings", response_model=ApiResponse)
def update_settings(body: SettingsIn, db: Session = Depends(get_db)):
    """Ubah threshold (0.30 - 0.80). Makin kecil = makin ketat. Langsung berlaku tanpa restart."""
    value = round(body.threshold, 2)
    settings_service.set_threshold(db, value)
    db.commit()
    return ok("Pengaturan disimpan", {"threshold": value})
