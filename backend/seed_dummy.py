"""Isi database dengan DATA CONTOH (nama fiktif, encoding acak) supaya tim frontend punya data untuk dicoba.

Jalankan di folder backend:  python seed_dummy.py        (tambah --reset untuk menghapus dulu isi lama)

PENTING: ini bukan wajah asli. Encoding acak tidak akan cocok dengan wajah siapa pun, jadi
data ini hanya untuk melihat tampilan daftar mahasiswa, rekap, dan dashboard. Untuk menguji
login wajah, daftarkan wajah sungguhan lewat halaman Daftar (dengan persetujuan pemilik wajah).
"""
import json
import random
import sys
from datetime import datetime, timedelta

import numpy as np

import models  # noqa: F401
from database import Base, SessionLocal, engine, migrate
from models import Attendance, Student

NAMES = [
    "Contoh Satu", "Contoh Dua", "Contoh Tiga", "Contoh Empat", "Contoh Lima",
    "Contoh Enam", "Contoh Tujuh", "Contoh Delapan",
]


def main():
    migrate()
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    if "--reset" in sys.argv:
        db.query(Attendance).delete()
        db.query(Student).delete()
        db.commit()
    rng = random.Random(42)
    now = datetime.now()
    for i, nama in enumerate(NAMES, start=1):
        nim = f"99000000{i:04d}"  # awalan 99 supaya jelas data contoh
        if db.query(Student).filter(Student.nim == nim).first():
            continue
        enc = [np.random.RandomState(i * 10 + k).rand(128).tolist() for k in range(3)]
        s = Student(nama=nama, nim=nim, encoding=json.dumps(enc), created_at=now - timedelta(days=14))
        db.add(s)
        db.flush()
        for d in range(14):
            day = (now - timedelta(days=d)).replace(hour=7, minute=rng.randint(0, 59), second=0, microsecond=0)
            if day.weekday() < 5 and rng.random() < 0.8:
                db.add(Attendance(student_id=s.id, timestamp=day, status="hadir"))
    db.commit()
    db.close()
    print("Data contoh siap:", len(NAMES), "mahasiswa dengan riwayat 14 hari.")


if __name__ == "__main__":
    main()
