"""Jembatan ke modul cv (Zaky) dan ml (Alliyah).

Backend memanggil keduanya sebagai black box sesuai kontrak:
  cv.extract_encoding(image) -> list[float] | None
  ml.match_face(encoding)    -> {"nama", "nim", "distance"} | None
Jika modul asli belum ada, otomatis dipakai stub di folder backend/stubs.
Set env USE_STUBS=1 untuk memaksa stub.
"""
import os
import sys
from pathlib import Path

import numpy as np

from errors import AppError

# supaya `import cv` / `import ml` menemukan folder /cv dan /ml di root repo
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

_force_stub = os.getenv("USE_STUBS") == "1"

try:
    if _force_stub:
        raise ImportError
    from cv import extract_encoding
    CV_IS_STUB = False
except ImportError:
    from stubs.cv_stub import extract_encoding
    CV_IS_STUB = True

try:
    if _force_stub:
        raise ImportError
    from ml import match_face
    ML_IS_STUB = False
except ImportError:
    from stubs.ml_stub import match_face
    ML_IS_STUB = True


def get_encoding(image: np.ndarray) -> list:
    """Ambil encoding wajah, atau lempar AppError yang jelas."""
    try:
        encoding = extract_encoding(image)
    except ValueError as e:
        # kesepakatan yang perlu dikonfirmasi ke Zaky: cv melempar
        # ValueError("multiple_faces") jika wajah lebih dari satu
        if "multiple" in str(e).lower():
            raise AppError(422, "MULTIPLE_FACES", "Terdeteksi lebih dari satu wajah. Pastikan hanya satu wajah di foto.")
        raise
    if encoding is None:
        raise AppError(422, "NO_FACE_DETECTED", "Wajah tidak terdeteksi. Gunakan foto yang jelas dan menghadap kamera.")
    return list(encoding)
