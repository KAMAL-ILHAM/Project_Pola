"""STUB sementara untuk cv.extract_encoding (hapus saat modul Zaky siap).

Gambar yang sama menghasilkan encoding yang sama. Gambar polos (satu warna)
dianggap "tidak ada wajah" supaya error NO_FACE_DETECTED bisa diuji.
"""
import hashlib

import numpy as np


def extract_encoding(image):
    if image.std() == 0:
        return None
    seed = int(hashlib.sha256(image.tobytes()).hexdigest()[:8], 16)
    return np.random.RandomState(seed).rand(128).tolist()
