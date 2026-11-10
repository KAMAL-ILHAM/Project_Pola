# Backend Presensi Wajah

## Menjalankan
```bash
cd backend
python -m venv venv
source venv/Scripts/activate        # Git Bash. PowerShell: venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```
Swagger: http://127.0.0.1:8000/docs

## Di mana databasenya? (kenapa data tidak tersimpan)
- Database SQLite ada di **`backend/data/presensi.db`**, dibuat otomatis saat backend pertama kali jalan.
  Lokasinya tetap, tidak peduli dari folder mana `uvicorn` dijalankan (ubah lewat env `DATABASE_PATH`).
- File `.db` **sengaja tidak masuk Git** (`.gitignore`): isinya encoding wajah, yaitu data pribadi.
  Jadi **setiap laptop punya database sendiri**; data teman tidak ikut saat `git pull`.
- Frontend dengan `VITE_USE_MOCK=true` memakai data di memori browser (`src/mock.js`) yang hilang saat halaman
  di-refresh. Untuk data yang benar-benar tersimpan: hapus baris itu dari `frontend/.env`, jalankan backend, lalu
  jalankan frontend.
- Butuh data contoh untuk melihat tampilan? `python seed_dummy.py` (nama fiktif, bukan wajah asli).
- Database bersama satu tim: jalankan backend di satu laptop (mis. Rizky) dengan
  `uvicorn main:app --host 0.0.0.0 --reload`, lalu teman mengisi `VITE_API_URL=http://<IP-laptop>:8000` dan
  backend dijalankan dengan `CORS_ORIGINS=http://<IP-teman>:5173`. Jangan kirim file `.db` lewat grup/repo.

## Variabel lingkungan (opsional)
| Env | Fungsi | Bawaan |
|---|---|---|
| `DATABASE_PATH` | lokasi file database | `backend/data/presensi.db` |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | akun admin pertama (hanya dibuat jika tabel admin kosong) | `admin` / `admin123` |
| `CORS_ORIGINS` | origin frontend tambahan, dipisah koma | kosong |
| `USE_STUBS=1` | paksa stub cv/ml | tidak aktif |

Admin bawaan `admin` / `admin123` hanya untuk pengembangan. Segera ganti lewat halaman Pengaturan.

## Tes otomatis
```bash
pip install -r requirements-dev.txt
pytest -q
```
Tes memakai database sementara, jadi tidak menyentuh `data/presensi.db`.

Selama modul `cv` dan `ml` belum siap, backend memakai stub di `stubs/`
(paksa dengan env `USE_STUBS=1`).

## Format respons (semua endpoint)
```json
{"success": true, "message": "...", "data": {}, "error_code": null}
```
Saat error: `success` bernilai `false`, `data` null, dan `error_code` terisi (lihat tabel di bawah).

## Autentikasi
Dua peran dengan token terpisah. Kirim `Authorization: Bearer <token>`. Token admin berlaku 8 jam,
token mahasiswa 30 menit. Token mahasiswa **tidak** bisa membuka endpoint admin (dan sebaliknya).

## Daftar endpoint
| Method | Path | Akses | Fungsi |
|---|---|---|---|
| POST | /auth/login | publik | Login admin `{username, password}` -> `{token, nama}` |
| POST | /auth/face-login | publik (rate limit 10/5 menit/IP) | Login mahasiswa dengan wajah -> `{token, nama, nim}`; tidak mencatat kehadiran |
| POST | /auth/change-password | admin | `{password_lama, password_baru}` (min. 6 karakter) |
| POST | /auth/logout | admin / mahasiswa | Cabut token |
| GET | /me/attendance | mahasiswa | Riwayat kehadiran sendiri |
| POST | /me/attendance | mahasiswa | Absen hari ini (sekali per hari) |
| POST | /register | publik | Daftar mahasiswa dengan 1-10 foto (multipart) |
| GET | /students | admin | Daftar mahasiswa (ada `created_at`) |
| PUT | /students/{id} | admin | Ubah nama dan/atau NIM (JSON) |
| DELETE | /students/{id} | admin | Hapus mahasiswa + catatan kehadiran + sesi loginnya |
| GET | /attendance | admin | Rekap; filter `tanggal`, `dari`, `sampai`, `nama`, `limit`, `offset` |
| DELETE | /attendance/{id} | admin | Hapus satu catatan kehadiran |
| GET | /attendance/summary | admin | Ringkasan dashboard (`tanggal`, `hari`) |
| GET / PUT | /settings | admin | `{threshold}` rentang 0.30-0.80 |
| POST | /recognize | admin | Mode kiosk: kenali wajah + langsung absen (mahasiswa tidak memakai ini lagi) |

## Contoh curl
```bash
# Login admin, simpan token
TOKEN=$(curl -s -X POST http://127.0.0.1:8000/auth/login -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | python -c "import sys,json;print(json.load(sys.stdin)['data']['token'])")

# Login mahasiswa dengan wajah, lalu absen
curl -X POST http://127.0.0.1:8000/auth/face-login -F "foto=@budi1.jpg"
curl -X POST http://127.0.0.1:8000/me/attendance -H "Authorization: Bearer <token mahasiswa>"
curl http://127.0.0.1:8000/me/attendance -H "Authorization: Bearer <token mahasiswa>"

# Endpoint admin (contoh)
curl http://127.0.0.1:8000/students -H "Authorization: Bearer $TOKEN"
curl "http://127.0.0.1:8000/attendance?dari=2026-11-01&sampai=2026-11-09&limit=50" -H "Authorization: Bearer $TOKEN"
curl -X DELETE http://127.0.0.1:8000/attendance/5 -H "Authorization: Bearer $TOKEN"
curl -X PUT http://127.0.0.1:8000/settings -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"threshold":0.45}'

# Endpoint lain (tambahkan -H "Authorization: Bearer $TOKEN" untuk yang khusus admin)
# Daftar dengan beberapa foto (field "foto" diulang)
curl -X POST http://127.0.0.1:8000/register \
  -F "nama=Budi Santoso" -F "nim=2411102441001" \
  -F "foto=@budi1.jpg" -F "foto=@budi2.jpg" -F "foto=@budi3.jpg"

curl -X POST http://127.0.0.1:8000/recognize -F "foto=@budi1.jpg" -H "Authorization: Bearer $TOKEN"

curl "http://127.0.0.1:8000/attendance?tanggal=2026-11-09&nama=budi"
curl "http://127.0.0.1:8000/attendance/summary?hari=7"
curl http://127.0.0.1:8000/students

curl -X PUT http://127.0.0.1:8000/students/1 \
  -H "Content-Type: application/json" -d '{"nama": "Budi S."}'
curl -X DELETE http://127.0.0.1:8000/students/1
```

## Contoh respons (untuk data mock frontend)
POST /register (201)
```json
{"success": true, "message": "Pendaftaran berhasil (3 foto)",
 "data": {"id": 1, "nama": "Budi Santoso", "nim": "2411102441001", "jumlah_foto": 3},
 "error_code": null}
```
POST /recognize (200)
```json
{"success": true, "message": "Kehadiran Budi Santoso berhasil dicatat",
 "data": {"nama": "Budi Santoso", "nim": "2411102441001", "distance": 0.31,
          "already_recorded": false, "timestamp": "2026-11-09T07:46:39", "status": "hadir"},
 "error_code": null}
```
GET /students
```json
{"success": true, "message": "1 mahasiswa terdaftar",
 "data": [{"id": 1, "nama": "Budi Santoso", "nim": "2411102441001", "jumlah_foto": 3}],
 "error_code": null}
```
GET /attendance
```json
{"success": true, "message": "1 catatan kehadiran",
 "data": [{"id": 1, "student_id": 1, "nama": "Budi Santoso", "nim": "2411102441001",
           "timestamp": "2026-11-09T07:46:39", "status": "hadir"}],
 "error_code": null}
```
GET /attendance/summary
```json
{"success": true, "message": "Ringkasan kehadiran",
 "data": {"tanggal": "2026-11-09", "total_mahasiswa": 30, "hadir": 24, "belum_hadir": 6,
          "persentase_hadir": 80.0,
          "harian": [{"tanggal": "2026-11-08", "hadir": 22}, {"tanggal": "2026-11-09", "hadir": 24}]},
 "error_code": null}
```
Contoh error (404)
```json
{"success": false, "message": "Wajah tidak dikenali.", "data": null, "error_code": "FACE_NOT_RECOGNIZED"}
```

## Kode error
| error_code | HTTP | Arti |
|---|---|---|
| INVALID_INPUT | 422 | Input kosong atau formatnya salah |
| INVALID_IMAGE | 422 | Bukan JPEG/PNG atau file rusak |
| IMAGE_TOO_LARGE | 413 | Foto lebih dari 5 MB |
| TOO_MANY_PHOTOS | 422 | Lebih dari 10 foto saat registrasi |
| NO_FACE_DETECTED | 422 (400 pada /auth/face-login) | Wajah tidak terdeteksi (pesan menyebut foto ke berapa) |
| MULTIPLE_FACES | 422 | Lebih dari satu wajah (pesan menyebut foto ke berapa) |
| NIM_ALREADY_REGISTERED | 409 | NIM sudah dipakai |
| STUDENT_NOT_FOUND | 404 | ID mahasiswa tidak ada |
| FACE_NOT_RECOGNIZED | 404 | Wajah tidak cocok dengan data manapun |
| UNAUTHORIZED | 401 | Token tidak ada, kedaluwarsa, atau perannya salah |
| INVALID_CREDENTIALS | 401 | Username/password admin salah |
| WRONG_PASSWORD | 400 | Password lama salah saat ganti password |
| RATE_LIMITED | 429 | Terlalu banyak percobaan login wajah |
| ATTENDANCE_NOT_FOUND | 404 | ID catatan kehadiran tidak ada |

## Catatan untuk modul lain
- **Alliyah (ml):** kolom `students.encoding` kini berisi *daftar* encoding (satu per foto):
  `[[128 angka], [128 angka], ...]`. Gunakan `models.parse_encodings(text)` untuk membacanya.
  Data lama berformat satu encoding datar tetap terbaca.
- **Alliyah (ml):** threshold sekarang bisa diubah admin dari halaman Pengaturan dan disimpan di tabel `settings`.
  Baca dengan `from settings_service import get_threshold` **di dalam** `match_face` (jangan di variabel global),
  supaya perubahan langsung berlaku. Kontrak `match_face` tidak berubah. Untuk login wajah, backend menambah
  syarat jarak `<= threshold - 0.05` (konstanta `LOGIN_MARGIN` di `routes/auth.py`).
- **Zaky (cv):** liveness/anti-spoofing (TODO #4) belum ada di backend. Jika modul cv menyediakan fungsinya,
  tinggal dipanggil di `routes/auth.py` sebelum `match_face`. Jika tidak, catat sebagai batasan sistem di laporan.
  Stub `cv_stub` membuat encoding dari hash gambar, jadi foto kamera yang berbeda tidak akan pernah cocok:
  login wajah lewat kamera baru bisa diuji dengan modul `cv` asli.
