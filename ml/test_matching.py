"""Tes modul ml memakai encoding SINTETIS (bukan wajah asli). Jalankan dari root repo:  pytest ml -q

Tes ini membuktikan logikanya benar (pencocokan, threshold, pembagian data, hitungan FAR/FRR,
dan integrasi dengan database backend). Angka akurasi dari data sintetis TIDAK boleh masuk laporan.
"""
import json
import os
import sys
import tempfile
from pathlib import Path

import numpy as np
import pytest

# database sementara untuk tes integrasi match_face (harus diatur sebelum `import database`)
os.environ["DATABASE_PATH"] = os.path.join(tempfile.mkdtemp(), "test_ml.db")
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from ml.dataset_utils import parse_person_folder  # noqa: E402
from ml.evaluate_threshold import evaluate  # noqa: E402
from ml.matching import find_best_match, match_face, nearest  # noqa: E402
from ml.split_data import split_per_person  # noqa: E402


def make_records(n_people=5, n_photos=5, noise=0.02, seed=0):
    """Encoding sintetis: tiap orang punya 'pusat', foto = pusat + noise kecil (jarak sesama ~0.3)."""
    rng = np.random.RandomState(seed)
    centers = rng.normal(0, 0.06, (n_people, 128))  # jarak antar orang ~0.96
    records = []
    for p in range(n_people):
        for k in range(n_photos):
            enc = centers[p] + rng.normal(0, noise, 128)
            records.append({"nim": f"2411{p:08d}", "nama": f"Orang {p}", "file": f"foto_{k + 1:02d}.jpg",
                            "encoding": enc.tolist()})
    return records


def vec(value, dim0=0.0):
    v = np.full(128, value)
    v[0] += dim0
    return v.tolist()


# ---------- matching ----------
def test_nearest_picks_smallest_distance():
    known = [vec(0.0), vec(1.0)]
    label, dist = nearest(vec(0.0, 0.1), known, ["a", "b"])
    assert label == "a" and dist == pytest.approx(0.1)


def test_threshold_rejects_far_and_accepts_equal():
    known, labels = [vec(0.0)], ["a"]
    assert find_best_match(vec(0.0, 0.3), known, labels, 0.5)[0] == "a"
    assert find_best_match(vec(0.0, 0.6), known, labels, 0.5)[0] is None
    assert find_best_match(vec(0.0, 0.5), known, labels, 0.5)[0] == "a"  # tepat di threshold diterima


def test_empty_gallery_returns_none():
    assert nearest(vec(0.0), [], []) == (None, None)


def test_wrong_encoding_size_raises():
    with pytest.raises(ValueError):
        nearest([0.1] * 64, [vec(0.0)], ["a"])


# ---------- dataset ----------
def test_parse_person_folder():
    assert parse_person_folder("2411102441199_Muhammad_Alliyah") == ("2411102441199", "Muhammad Alliyah")
    assert parse_person_folder("foto_acak") is None


def test_split_is_reproducible_and_disjoint():
    records = make_records()
    a_train, a_test = split_per_person(records, 0.2, seed=42)
    b_train, b_test = split_per_person(records, 0.2, seed=42)
    assert [r["file"] for r in a_test] == [r["file"] for r in b_test]
    key = lambda r: (r["nim"], r["file"])  # noqa: E731
    assert not {key(r) for r in a_train} & {key(r) for r in a_test}  # tidak ada foto yang bocor
    assert len(a_train) + len(a_test) == len(records)
    assert {r["nim"] for r in a_test} == {r["nim"] for r in records}  # tiap orang punya foto uji


def test_split_person_with_one_photo_goes_to_train():
    records = make_records(n_people=2, n_photos=1)
    train, test = split_per_person(records)
    assert len(train) == 2 and test == []


# ---------- evaluasi ----------
def test_evaluate_counts_add_up_and_threshold_tradeoff():
    summary, predictions, info = evaluate(make_records(), thresholds=[0.1, 0.5, 0.6])
    by_t = {s["threshold"]: s for s in summary}
    # threshold sangat ketat: hampir semua orang sah ditolak, tidak ada yang salah diterima
    assert by_t[0.1]["FRR_%"] > 90 and by_t[0.1]["FAR_%"] == 0
    # threshold wajar: data sintetis terpisah jelas -> semua benar
    assert by_t[0.5]["FRR_%"] == 0 and by_t[0.5]["FAR_%"] == 0 and by_t[0.5]["salah_identitas"] == 0
    for s in summary:
        assert s["benar_diterima"] + s["salah_identitas"] + s["false_reject"] == s["n_terdaftar"]
        assert s["false_accept"] + s["benar_ditolak"] == s["n_tidak_terdaftar"]
    assert len(predictions) == len(summary) * (summary[0]["n_terdaftar"] + summary[0]["n_tidak_terdaftar"])


def test_far_rises_when_threshold_is_loose():
    # 'orang tidak terdaftar' jaraknya ~0.96 dari orang lain: threshold 1.5 harus menerima mereka (FAR naik)
    summary, _, _ = evaluate(make_records(), thresholds=[0.5, 1.5])
    assert summary[0]["FAR_%"] == 0 and summary[1]["FAR_%"] == 100


# ---------- integrasi dengan database backend ----------
@pytest.fixture(scope="module")
def db_with_students():
    import models  # noqa: F401
    from database import Base, SessionLocal, engine

    Base.metadata.create_all(bind=engine)
    records = make_records(n_people=3, n_photos=3, seed=7)
    db = SessionLocal()
    for p in range(3):
        mine = [r for r in records if r["nim"] == f"2411{p:08d}"]
        db.add(models.Student(nama=f"Orang {p}", nim=f"2411{p:08d}",
                              encoding=json.dumps([r["encoding"] for r in mine])))
    db.commit()
    db.close()
    return records


def test_match_face_known_person(db_with_students):
    query = db_with_students[0]["encoding"]  # foto pertama Orang 0
    result = match_face(query)
    assert result["nim"] == "241100000000" and result["nama"] == "Orang 0"
    assert set(result) == {"nama", "nim", "distance"}  # sesuai kontrak


def test_match_face_unknown_returns_none(db_with_students):
    assert match_face(np.random.RandomState(99).normal(0, 0.06, 128).tolist()) is None


def test_match_face_reads_threshold_from_settings(db_with_students):
    from database import SessionLocal
    from settings_service import set_threshold

    query = (np.array(db_with_students[0]["encoding"]) + 0.03).tolist()  # jarak ~0.34 dari foto asli
    assert match_face(query) is not None                                  # threshold default 0.5
    db = SessionLocal()
    set_threshold(db, 0.3)                                                # admin memperketat
    db.commit()
    db.close()
    assert match_face(query) is None                                      # langsung berlaku tanpa restart
