"""Ekstraksi encoding wajah 128-D."""
import face_recognition

from . import config
from .detector import _locations
from .preprocess import prepare


def extract_encoding(image, model=config.DETECTION_MODEL, num_jitters=config.NUM_JITTERS,
                     upsample=config.UPSAMPLE):
    """Ubah gambar BGR (hasil cv2.imdecode) menjadi encoding wajah.

    Returns:
        list berisi 128 float Python biasa (aman untuk JSON), atau None jika tidak ada wajah
        (termasuk jika satu-satunya wajah terlalu kecil).
    Raises:
        ValueError("multiple_faces"): lebih dari satu wajah. Ditolak, bukan dipilih, supaya
            presensi tidak mengenali orang yang kebetulan ada di latar belakang.
        ValueError("invalid_image..."): gambar kosong atau rusak.
    Error lain sengaja tidak ditelan.
    """
    rgb, _ = prepare(image)
    boxes = _locations(rgb, model, upsample)
    if not boxes:
        return None
    if len(boxes) > 1:
        raise ValueError("multiple_faces")
    encodings = face_recognition.face_encodings(rgb, known_face_locations=boxes, num_jitters=num_jitters)
    if not encodings:
        return None
    return [float(x) for x in encodings[0]]
