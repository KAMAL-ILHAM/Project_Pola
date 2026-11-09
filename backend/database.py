"""Koneksi database SQLite (SQLAlchemy)."""
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = "sqlite:///./presensi.db"

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
