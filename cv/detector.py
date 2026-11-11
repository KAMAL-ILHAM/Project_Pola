"""Deteksi wajah memakai face_recognition (dlib)."""
import face_recognition  # jika belum terpasang -> ImportError (backend otomatis kembali ke stub)

from . import config
from .preprocess import prepare


def _locations(rgb, model, upsample):
    """Deteksi di gambar RGB; buang wajah yang lebih kecil dari MIN_FACE_SIZE."""
    boxes = face_recognition.face_locations(rgb, number_of_times_to_upsample=upsample, model=model)
    return [b for b in boxes
            if (b[2] - b[0]) >= config.MIN_FACE_SIZE and (b[1] - b[3]) >= config.MIN_FACE_SIZE]


def detect_faces(image, model=config.DETECTION_MODEL, upsample=config.UPSAMPLE):
    """Deteksi wajah pada gambar BGR.

    Returns:
        list kotak (top, right, bottom, left) dalam piksel gambar ASLI (bukan yang sudah di-resize),
        sehingga bisa langsung digambar di frame webcam. Wajah yang terlalu kecil diabaikan.
    """
    rgb, scale = prepare(image)
    boxes = _locations(rgb, model, upsample)
    return [tuple(round(v / scale) for v in b) for b in boxes]
