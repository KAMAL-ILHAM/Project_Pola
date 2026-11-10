"""Tes otomatis backend (pakai stub cv/ml dan database sementara). Jalankan: pytest -q  (di folder backend)."""
import os
import tempfile
from datetime import date, datetime, timedelta

os.environ["DATABASE_PATH"] = os.path.join(tempfile.mkdtemp(), "test.db")
os.environ["USE_STUBS"] = "1"
os.environ["ADMIN_PASSWORD"] = "admin123"

import cv2  # noqa: E402
import numpy as np  # noqa: E402
import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

import security  # noqa: E402
from database import SessionLocal  # noqa: E402
from main import app  # noqa: E402
from models import Attendance, Student  # noqa: E402

client = TestClient(app)


def img(seed: int) -> bytes:
    """Gambar acak (seed sama = gambar sama = encoding stub sama)."""
    arr = np.random.RandomState(seed).randint(0, 255, (64, 64, 3), dtype=np.uint8)
    return cv2.imencode(".jpg", arr, [cv2.IMWRITE_JPEG_QUALITY, 100])[1].tobytes()


def files(*seeds):
    return [("foto", (f"f{s}.jpg", img(s), "image/jpeg")) for s in seeds]


@pytest.fixture(autouse=True)
def reset_limiter():
    security.face_login_limiter.reset()


def admin_headers():
    r = client.post("/auth/login", json={"username": "admin", "password": "admin123"})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['data']['token']}"}


def register(nama, nim, seed):
    r = client.post("/register", data={"nama": nama, "nim": nim}, files=files(seed))
    assert r.status_code == 201, r.text
    return r.json()["data"]


def student_headers(seed):
    r = client.post("/auth/face-login", files=files(seed)[0:1])
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['data']['token']}"}


def test_admin_login_and_errors():
    assert client.post("/auth/login", json={"username": "admin", "password": "salah"}).json()["error_code"] == "INVALID_CREDENTIALS"
    assert client.post("/auth/login", json={"username": "tidakada", "password": "x"}).status_code == 401
    assert admin_headers()


def test_admin_endpoints_protected():
    for path in ["/students", "/attendance", "/attendance/summary", "/settings"]:
        r = client.get(path)
        assert r.status_code == 401 and r.json()["error_code"] == "UNAUTHORIZED", path
    assert client.delete("/students/1").status_code == 401
    assert client.delete("/attendance/1").status_code == 401
    assert client.post("/recognize", files=files(1)).status_code == 401


def test_student_token_cannot_access_admin():
    register("Budi", "2411102441001", 1)
    h = student_headers(1)
    assert client.get("/students", headers=h).status_code == 401
    assert client.get("/attendance", headers=h).status_code == 401
    # token admin juga tidak berlaku untuk /me
    assert client.get("/me/attendance", headers=admin_headers()).status_code == 401


def test_face_login_and_attendance_flow():
    register("Siti", "2411102441002", 2)
    h = student_headers(2)
    assert client.get("/me/attendance", headers=h).json()["data"] == []
    r1 = client.post("/me/attendance", headers=h).json()["data"]
    assert r1["already_recorded"] is False
    r2 = client.post("/me/attendance", headers=h).json()["data"]
    assert r2["already_recorded"] is True and r2["timestamp"] == r1["timestamp"]
    hist = client.get("/me/attendance", headers=h).json()["data"]
    assert len(hist) == 1 and set(hist[0]) == {"id", "timestamp", "status"}


def test_face_login_not_recognized_and_no_face():
    r = client.post("/auth/face-login", files=files(999))
    assert r.status_code == 404 and r.json()["error_code"] == "FACE_NOT_RECOGNIZED"
    blank = cv2.imencode(".jpg", np.zeros((64, 64, 3), np.uint8))[1].tobytes()
    r = client.post("/auth/face-login", files=[("foto", ("x.jpg", blank, "image/jpeg"))])
    assert r.status_code == 400 and r.json()["error_code"] == "NO_FACE_DETECTED"


def test_face_login_rate_limit():
    for _ in range(10):
        client.post("/auth/face-login", files=files(999))
    r = client.post("/auth/face-login", files=files(999))
    assert r.status_code == 429 and r.json()["error_code"] == "RATE_LIMITED"


def test_logout_revokes_token():
    register("Andi", "2411102441003", 3)
    h = student_headers(3)
    assert client.post("/auth/logout", headers=h).status_code == 200
    assert client.get("/me/attendance", headers=h).status_code == 401


def test_expired_token_rejected():
    register("Dewi", "2411102441004", 4)
    h = student_headers(4)
    db = SessionLocal()
    from models import AuthToken
    for t in db.query(AuthToken).all():
        t.expires_at = datetime.now() - timedelta(minutes=1)
    db.commit()
    db.close()
    assert client.get("/me/attendance", headers=h).status_code == 401


def test_attendance_range_delete_and_summary():
    ha = admin_headers()
    s = register("Rina", "2411102441005", 5)
    db = SessionLocal()
    today = datetime.now().replace(hour=8, minute=0, second=0, microsecond=0)
    ids = []
    for d in (0, 3, 10):
        a = Attendance(student_id=s["id"], timestamp=today - timedelta(days=d), status="hadir")
        db.add(a)
        db.flush()
        ids.append(a.id)
    db.commit()
    db.close()

    dari = (date.today() - timedelta(days=4)).isoformat()
    sampai = date.today().isoformat()
    rows = client.get(f"/attendance?dari={dari}&sampai={sampai}&nama=rina", headers=ha).json()["data"]
    assert len(rows) == 2
    assert client.get(f"/attendance?dari={sampai}&sampai={dari}", headers=ha).json()["error_code"] == "INVALID_INPUT"
    assert len(client.get("/attendance?nama=rina&limit=1", headers=ha).json()["data"]) == 1

    assert client.delete(f"/attendance/{ids[2]}", headers=ha).status_code == 200
    assert client.delete(f"/attendance/{ids[2]}", headers=ha).json()["error_code"] == "ATTENDANCE_NOT_FOUND"

    # mahasiswa yang mendaftar hari ini tidak dihitung pada tanggal kemarin
    kemarin = (date.today() - timedelta(days=1)).isoformat()
    summ = client.get(f"/attendance/summary?tanggal={kemarin}", headers=ha).json()["data"]
    db = SessionLocal()
    lama = db.query(Student).filter(Student.created_at < datetime.combine(date.today(), datetime.min.time())).count()
    db.close()
    assert summ["total_mahasiswa"] == lama


def test_settings_validation_and_effect():
    ha = admin_headers()
    assert client.get("/settings", headers=ha).json()["data"]["threshold"] == 0.5
    assert client.put("/settings", json={"threshold": 0.9}, headers=ha).status_code == 422
    assert client.put("/settings", json={"threshold": 0.1}, headers=ha).status_code == 422
    assert client.put("/settings", json={"threshold": 0.4}, headers=ha).json()["data"]["threshold"] == 0.4
    assert client.get("/settings", headers=ha).json()["data"]["threshold"] == 0.4
    client.put("/settings", json={"threshold": 0.5}, headers=ha)


def test_change_password():
    ha = admin_headers()
    r = client.post("/auth/change-password", json={"password_lama": "salah", "password_baru": "baru1234"}, headers=ha)
    assert r.status_code == 400 and r.json()["error_code"] == "WRONG_PASSWORD"
    assert client.post("/auth/change-password", json={"password_lama": "admin123", "password_baru": "baru1234"}, headers=ha).status_code == 200
    assert client.post("/auth/login", json={"username": "admin", "password": "admin123"}).status_code == 401
    ok = client.post("/auth/login", json={"username": "admin", "password": "baru1234"})
    assert ok.status_code == 200
    # kembalikan supaya tes lain tidak terganggu
    h = {"Authorization": f"Bearer {ok.json()['data']['token']}"}
    client.post("/auth/change-password", json={"password_lama": "baru1234", "password_baru": "admin123"}, headers=h)


def test_delete_student_revokes_login():
    s = register("Tono", "2411102441006", 6)
    hs = student_headers(6)
    assert client.delete(f"/students/{s['id']}", headers=admin_headers()).status_code == 200
    assert client.get("/me/attendance", headers=hs).status_code == 401


def test_recognize_admin_only_kiosk():
    register("Lina", "2411102441007", 7)
    r = client.post("/recognize", files=files(7), headers=admin_headers())
    assert r.status_code == 200 and r.json()["data"]["already_recorded"] is False
