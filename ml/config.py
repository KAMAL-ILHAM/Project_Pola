"""Konfigurasi eksperimen ML. Semua angka eksperimen ada di sini supaya hasil bisa diulang."""
from pathlib import Path

ML_DIR = Path(__file__).resolve().parent

DATA_DIR = ML_DIR / "data"                      # foto wajah (TIDAK di-commit)
ENCODINGS_PATH = ML_DIR / "encodings.pkl"       # hasil build_encodings.py (TIDAK di-commit, *.pkl di .gitignore)
HASIL_DIR = ML_DIR / "hasil"                    # tabel dan hasil prediksi

SEED = 42                                       # seed tetap -> pembagian data selalu sama
TEST_RATIO = 0.2                                # pembagian latih:uji = 80:20 per orang
THRESHOLDS = [0.4, 0.5, 0.6]                    # nilai threshold yang diuji
DEFAULT_THRESHOLD = 0.5                         # sama dengan default backend (settings_service.py)
ENCODING_SIZE = 128                             # panjang encoding face_recognition (dlib)
