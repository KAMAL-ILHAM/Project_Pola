"""Koneksi database SQLite (SQLAlchemy).

Lokasi file database dibuat ABSOLUT (backend/data/presensi.db), bukan relatif terhadap
folder tempat uvicorn dijalankan. Sebelumnya `sqlite:///./presensi.db` membuat file baru
di mana pun perintah dijalankan, sehingga data seolah-olah "hilang" saat pindah folder.
Ubah lokasi lewat env DATABASE_PATH bila perlu.
"""
import os
from pathlib import Path

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = Path(os.getenv("DATABASE_PATH", BASE_DIR / "data" / "presensi.db")).resolve()
DB_PATH.parent.mkdir(parents=True, exist_ok=True)
DATABASE_URL = f"sqlite:///{DB_PATH.as_posix()}"

# check_same_thread=False dibutuhkan karena FastAPI memakai banyak thread
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False)
Base = declarative_base()


def get_db():
    """Dependency FastAPI: buka sesi DB per request, tutup setelah selesai."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def migrate():
    """Migrasi ringan untuk database lama (create_all tidak mengubah tabel yang sudah ada).

    - students.created_at: mahasiswa lama diberi tanggal 1970-01-01 supaya tetap
      dihitung pada semua tanggal (perilaku sebelum kolom ini ada).
    """
    insp = inspect(engine)
    if "students" in insp.get_table_names():
        cols = {c["name"] for c in insp.get_columns("students")}
        if "created_at" not in cols:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE students ADD COLUMN created_at DATETIME"))
                conn.execute(text("UPDATE students SET created_at = '1970-01-01 00:00:00'"))
