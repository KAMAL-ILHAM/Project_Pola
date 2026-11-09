"""STUB sementara untuk ml.match_face (hapus saat modul Alliyah siap).

Membandingkan encoding dengan semua mahasiswa di database memakai jarak
Euclidean, threshold 0.5 (sesuai default di CLAUDE.md).
"""
import json

import numpy as np

from database import SessionLocal
from models import Student

THRESHOLD = 0.5


def match_face(encoding):
    db = SessionLocal()
    try:
        best, best_dist = None, None
        for s in db.query(Student).all():
            dist = float(np.linalg.norm(np.array(json.loads(s.encoding)) - np.array(encoding)))
            if best_dist is None or dist < best_dist:
                best, best_dist = s, dist
        if best is None or best_dist > THRESHOLD:
            return None
        return {"nama": best.nama, "nim": best.nim, "distance": round(best_dist, 4)}
    finally:
        db.close()
