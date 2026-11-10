"""Pengaturan aplikasi yang disimpan di tabel `settings`.

Untuk Alliyah (ml): threshold pencocokan dibaca dengan
    from settings_service import get_threshold
    THRESHOLD = get_threshold()   # panggil di dalam match_face, jangan simpan di variabel global
supaya perubahan dari halaman Pengaturan admin langsung berlaku tanpa restart.
"""
from database import SessionLocal
from models import Setting

DEFAULT_THRESHOLD = 0.5
MIN_THRESHOLD = 0.30
MAX_THRESHOLD = 0.80


def get_threshold() -> float:
    """Ambil threshold jarak Euclidean saat ini (default 0.5)."""
    db = SessionLocal()
    try:
        row = db.get(Setting, "threshold")
        return float(row.value) if row else DEFAULT_THRESHOLD
    finally:
        db.close()


def set_threshold(db, value: float) -> float:
    """Simpan threshold baru memakai sesi DB yang diberikan (caller yang commit)."""
    row = db.get(Setting, "threshold")
    if row:
        row.value = str(value)
    else:
        db.add(Setting(key="threshold", value=str(value)))
    return value
