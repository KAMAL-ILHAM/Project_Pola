"""Tes logika modul cv dengan face_recognition palsu (tanpa dlib dan tanpa foto wajah asli).

Jalankan dari root repo:  pytest cv/tests -q
Tes ini memeriksa kontrak dan alur kita (BGR->RGB, resize, kasus 0/1/>1 wajah, tipe float),
bukan akurasi dlib. Akurasi diuji dengan foto asli lewat cv/benchmark.py dan tes manual.
"""
import json
import sys
import types
from pathlib import Path

import numpy as np
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))  # root repo, supaya `import cv` ketemu


class FakeFR:
    """Meniru dua fungsi face_recognition yang kita pakai."""

    def __init__(self):
        self.boxes = []
        self.seen_rgb = None

    def face_locations(self, img, number_of_times_to_upsample=1, model="hog"):
        self.seen_rgb = img
        return list(self.boxes)

    def face_encodings(self, img, known_face_locations=None, num_jitters=1):
        return [np.arange(128, dtype=np.float64) / 128 for _ in known_face_locations]


# face_recognition palsu dipasang SEBELUM cv diimpor (cv/__init__ mengimpornya saat pytest mengumpulkan tes)
_fake = FakeFR()
_module = types.ModuleType("face_recognition")
_module.face_locations = lambda *a, **k: _fake.face_locations(*a, **k)
_module.face_encodings = lambda *a, **k: _fake.face_encodings(*a, **k)
sys.modules["face_recognition"] = _module


@pytest.fixture
def fr():
    _fake.boxes = []
    _fake.seen_rgb = None
    return _fake


def img(h=480, w=640):
    return np.random.RandomState(0).randint(0, 255, (h, w, 3), dtype=np.uint8)


def test_satu_wajah_128_float_dan_json(fr):
    from cv import extract_encoding
    fr.boxes = [(100, 300, 250, 150)]
    enc = extract_encoding(img())
    assert len(enc) == 128 and type(enc[0]) is float
    json.dumps(enc)  # backend menyimpan sebagai JSON


def test_tanpa_wajah_none(fr):
    from cv import extract_encoding
    assert extract_encoding(img()) is None


def test_dua_wajah_value_error(fr):
    from cv import extract_encoding
    fr.boxes = [(50, 200, 200, 50), (50, 500, 200, 350)]
    with pytest.raises(ValueError, match="multiple_faces"):
        extract_encoding(img())


def test_wajah_terlalu_kecil_dianggap_tidak_ada(fr):
    from cv import extract_encoding
    fr.boxes = [(10, 40, 40, 10)]  # 30x30 < MIN_FACE_SIZE
    assert extract_encoding(img()) is None


def test_wajah_kecil_di_latar_tidak_memicu_multiple(fr):
    from cv import extract_encoding
    fr.boxes = [(100, 300, 250, 150), (10, 40, 40, 10)]
    assert len(extract_encoding(img())) == 128


def test_bgr_diubah_ke_rgb(fr):
    from cv import extract_encoding
    fr.boxes = [(100, 300, 250, 150)]
    bgr = np.zeros((480, 640, 3), np.uint8)
    bgr[..., 0] = 10   # B
    bgr[..., 2] = 200  # R
    bgr[0, 0] = (10, 0, 200)
    extract_encoding(bgr)
    assert tuple(fr.seen_rgb[0, 0]) == (200, 0, 10)


def test_gambar_besar_dikecilkan_dan_kotak_dikembalikan_ke_ukuran_asli(fr):
    from cv import detect_faces
    from cv.config import MAX_SIDE
    fr.boxes = [(100, 300, 300, 100)]
    boxes = detect_faces(img(1600, 2000))
    assert max(fr.seen_rgb.shape[:2]) == MAX_SIDE
    assert boxes == [(250, 750, 750, 250)]  # skala 800/2000 = 0.4


def test_gambar_kecil_tidak_diperbesar(fr):
    from cv import preprocess
    assert preprocess(img(200, 300)).shape == (200, 300, 3)


@pytest.mark.parametrize("bad", [None, "foto.jpg", np.zeros((0, 0, 3), np.uint8),
                                 np.zeros((10, 10, 3), np.float32), np.zeros((10, 10, 5), np.uint8)])
def test_gambar_rusak_value_error(fr, bad):
    from cv import extract_encoding
    with pytest.raises(ValueError, match="invalid_image"):
        extract_encoding(bad)


def test_grayscale_dan_bgra_diterima(fr):
    from cv import preprocess
    assert preprocess(np.zeros((100, 100), np.uint8)).shape == (100, 100, 3)
    assert preprocess(np.zeros((100, 100, 4), np.uint8)).shape == (100, 100, 3)


def test_fungsi_murni_tidak_mengubah_input(fr):
    from cv import extract_encoding
    fr.boxes = [(100, 300, 250, 150)]
    image = img()
    before = image.copy()
    extract_encoding(image)
    assert np.array_equal(image, before)


def test_clahe_menjaga_bentuk(fr):
    from cv import preprocess
    assert preprocess(img(), use_clahe=True).shape == (480, 640, 3)
