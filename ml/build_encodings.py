"""Ubah semua foto di ml/data menjadi encoding 128-D dan simpan ke ml/encodings.pkl.

Jalankan dari root repo:  python -m ml.build_encodings

Memakai cv.extract_encoding (modul Zaky) bila sudah ada, supaya encoding eksperimen sama dengan
encoding yang dipakai backend. Jika belum ada, dipakai face_recognition langsung (pustaka yang sama).
Foto yang gagal (wajah tidak terdeteksi / lebih dari satu) dicatat di ml/hasil/foto_gagal.txt.
"""
import pickle

import cv2

from . import config
from .dataset_utils import list_dataset

try:
    from cv import extract_encoding  # modul Zaky
    SUMBER = "cv.extract_encoding"
except ImportError:
    extract_encoding = None
    SUMBER = "face_recognition (cadangan, modul cv belum ada)"


def _fallback_extract(image_bgr):
    """Cadangan: satu wajah -> encoding; tidak ada wajah -> None; banyak wajah -> ValueError."""
    import face_recognition

    rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)  # face_recognition membutuhkan RGB
    locations = face_recognition.face_locations(rgb)
    if not locations:
        return None
    if len(locations) > 1:
        raise ValueError("multiple_faces")
    return face_recognition.face_encodings(rgb, locations)[0].tolist()


def main():
    extractor = extract_encoding or _fallback_extract
    people = list_dataset(config.DATA_DIR)
    if not people:
        print(f"Dataset kosong. Taruh foto di {config.DATA_DIR}/<nim>_<nama>/foto_01.jpg")
        return

    print(f"Sumber encoding: {SUMBER}")
    records, gagal = [], []
    for nim, p in people.items():
        for path in p["files"]:
            image = cv2.imread(str(path))  # BGR, sama dengan yang diterima cv di backend
            try:
                encoding = extractor(image) if image is not None else None
            except ValueError as e:
                encoding, alasan = None, str(e)
            else:
                alasan = "wajah tidak terdeteksi / file rusak"
            if encoding is None:
                gagal.append(f"{path.relative_to(config.DATA_DIR)}: {alasan}")
                continue
            records.append({"nim": nim, "nama": p["nama"], "file": path.name, "encoding": list(encoding)})

    with open(config.ENCODINGS_PATH, "wb") as f:
        pickle.dump({"records": records, "sumber": SUMBER}, f)

    config.HASIL_DIR.mkdir(exist_ok=True)
    (config.HASIL_DIR / "foto_gagal.txt").write_text("\n".join(gagal) + ("\n" if gagal else ""), encoding="utf-8")
    print(f"Berhasil: {len(records)} foto | Gagal: {len(gagal)} foto | Tersimpan: {config.ENCODINGS_PATH}")
    if gagal:
        print("Foto gagal dicatat di ml/hasil/foto_gagal.txt (ganti dengan foto yang lebih jelas).")


if __name__ == "__main__":
    main()
