"""Pencocokan wajah: bandingkan encoding dengan encoding yang tersimpan.

Metode: jarak Euclidean ke SEMUA encoding terdaftar, ambil yang terkecil (nearest neighbor, sama
dengan KNN dengan k=1). Jika jarak terkecil melebihi threshold, wajah dianggap "unknown" (None).

Jarak Euclidean dihitung dengan numpy (np.linalg.norm). Hasilnya identik dengan
face_recognition.face_distance, tetapi modul ini tidak perlu memasang dlib, jadi cepat diimpor
dan mudah diuji di laptop mana pun.
"""
import numpy as np

ENCODING_SIZE = 128


def _to_vector(encoding) -> np.ndarray:
    """Ubah encoding menjadi array 128 angka; lempar ValueError bila bentuknya salah."""
    vec = np.asarray(encoding, dtype=float)
    if vec.shape != (ENCODING_SIZE,):
        raise ValueError(f"Encoding harus berisi {ENCODING_SIZE} angka, diterima bentuk {vec.shape}.")
    return vec


def nearest(encoding, known_encodings, known_labels):
    """Cari encoding terdaftar yang paling dekat (tanpa threshold).

    Returns:
        (label, distance) milik encoding terdekat, atau (None, None) jika belum ada data terdaftar.
    """
    if len(known_encodings) == 0:
        return None, None
    query = _to_vector(encoding)
    known = np.asarray(known_encodings, dtype=float)
    distances = np.linalg.norm(known - query, axis=1)  # jarak Euclidean ke tiap encoding
    best = int(np.argmin(distances))
    return known_labels[best], float(distances[best])


def find_best_match(encoding, known_encodings, known_labels, threshold):
    """Seperti nearest(), tetapi label diganti None jika jarak melebihi threshold ("unknown").

    Jarak yang sama persis dengan threshold masih diterima (sama dengan perilaku stub backend).
    """
    label, distance = nearest(encoding, known_encodings, known_labels)
    if label is None or distance > threshold:
        return None, distance
    return label, distance


def match_face(encoding):
    """Kontrak untuk backend: cocokkan encoding dengan semua mahasiswa di database.

    Args:
        encoding: list 128 angka dari cv.extract_encoding.

    Returns:
        {"nama": str, "nim": str, "distance": float} jika dikenali, atau None jika
        tidak ada yang cukup dekat (atau belum ada mahasiswa terdaftar).

    Threshold dibaca dari pengaturan admin setiap kali dipanggil, jadi perubahan di halaman
    Pengaturan langsung berlaku tanpa restart server.
    """
    # impor di dalam fungsi: modul backend hanya ada saat dijalankan dari backend,
    # sedangkan skrip eksperimen (evaluate_threshold.py dll.) tidak butuh database.
    from database import SessionLocal
    from models import Student, parse_encodings
    from settings_service import get_threshold

    threshold = get_threshold()
    db = SessionLocal()
    try:
        known_encodings, known_owners = [], []
        for student in db.query(Student).all():
            for known in parse_encodings(student.encoding):  # satu mahasiswa bisa punya banyak encoding
                known_encodings.append(known)
                known_owners.append((student.nama, student.nim))
    finally:
        db.close()

    owner, distance = find_best_match(encoding, known_encodings, known_owners, threshold)
    if owner is None:
        return None
    nama, nim = owner
    return {"nama": nama, "nim": nim, "distance": round(distance, 4)}
