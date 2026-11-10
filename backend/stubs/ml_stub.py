"""STUB sementara untuk ml.match_face (hapus saat modul Alliyah siap).

Membandingkan encoding dengan semua encoding tiap mahasiswa di database memakai
jarak Euclidean, lalu mengambil jarak terkecil. Threshold dibaca dari pengaturan admin
(default 0.5, lihat settings_service.py).
"""
import numpy as np

from database import SessionLocal
from models import Student, parse_encodings
from settings_service import get_threshold


def match_face(encoding):
    threshold = get_threshold()
    db = SessionLocal()
    try:
        best, best_dist = None, None
        query = np.array(encoding)
        for s in db.query(Student).all():
            for known in parse_encodings(s.encoding):
                dist = float(np.linalg.norm(np.array(known) - query))
                if best_dist is None or dist < best_dist:
                    best, best_dist = s, dist
        if best is None or best_dist > threshold:
            return None
        return {"nama": best.nama, "nim": best.nim, "distance": round(best_dist, 4)}
    finally:
        db.close()
