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

Selama modul `cv` dan `ml` belum siap, backend memakai stub di `stubs/`
(paksa dengan env `USE_STUBS=1`).

## Format respons (semua endpoint)
```json
{"success": true, "message": "...", "data": {}, "error_code": null}
```
Saat error: `success` bernilai `false`, `data` null, dan `error_code` terisi (lihat tabel di bawah).

## Daftar endpoint
| Method | Path | Fungsi |
|---|---|---|
| POST | /register | Daftar mahasiswa dengan 1-10 foto (multipart) |
| POST | /recognize | Kenali wajah dan catat kehadiran |
| GET | /attendance | Rekap kehadiran (filter `tanggal`, `nama`) |
| GET | /attendance/summary | Ringkasan dashboard (`tanggal`, `hari`) |
| GET | /students | Daftar mahasiswa |
| PUT | /students/{id} | Ubah nama dan/atau NIM (JSON) |
| DELETE | /students/{id} | Hapus mahasiswa + catatan kehadirannya |

## Contoh curl
```bash
# Daftar dengan beberapa foto (field "foto" diulang)
curl -X POST http://127.0.0.1:8000/register \
  -F "nama=Budi Santoso" -F "nim=2411102441001" \
  -F "foto=@budi1.jpg" -F "foto=@budi2.jpg" -F "foto=@budi3.jpg"

curl -X POST http://127.0.0.1:8000/recognize -F "foto=@budi1.jpg"

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
| NO_FACE_DETECTED | 422 | Wajah tidak terdeteksi (pesan menyebut foto ke berapa) |
| MULTIPLE_FACES | 422 | Lebih dari satu wajah (pesan menyebut foto ke berapa) |
| NIM_ALREADY_REGISTERED | 409 | NIM sudah dipakai |
| STUDENT_NOT_FOUND | 404 | ID mahasiswa tidak ada |
| FACE_NOT_RECOGNIZED | 404 | Wajah tidak cocok dengan data manapun |

## Catatan untuk modul lain
- **Alliyah (ml):** kolom `students.encoding` kini berisi *daftar* encoding (satu per foto):
  `[[128 angka], [128 angka], ...]`. Gunakan `models.parse_encodings(text)` untuk membacanya.
  Data lama berformat satu encoding datar tetap terbaca.
