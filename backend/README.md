# Backend Presensi Wajah

## Menjalankan
```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```
Swagger: http://127.0.0.1:8000/docs

Selama modul `cv` dan `ml` belum siap, backend otomatis memakai stub di `stubs/`
(paksa dengan `USE_STUBS=1`).

## Format respons (semua endpoint)
```json
{"success": true, "message": "...", "data": {}, "error_code": null}
```

## Contoh curl
```bash
# Daftar
curl -X POST http://127.0.0.1:8000/register \
  -F "nama=Budi Santoso" -F "nim=2411102441001" -F "foto=@budi.jpg"

# Kenali + catat kehadiran
curl -X POST http://127.0.0.1:8000/recognize -F "foto=@budi.jpg"

# Rekap (filter opsional)
curl "http://127.0.0.1:8000/attendance"
curl "http://127.0.0.1:8000/attendance?tanggal=2026-11-09&nama=budi"

# Daftar mahasiswa
curl http://127.0.0.1:8000/students
```

## Kode error
| error_code | HTTP | Arti |
|---|---|---|
| INVALID_INPUT | 422 | Nama/NIM kosong atau format salah |
| INVALID_IMAGE | 422 | Bukan JPEG/PNG atau file rusak |
| IMAGE_TOO_LARGE | 413 | Foto > 5 MB |
| NO_FACE_DETECTED | 422 | Wajah tidak terdeteksi |
| MULTIPLE_FACES | 422 | Lebih dari satu wajah |
| NIM_ALREADY_REGISTERED | 409 | NIM sudah terdaftar |
| FACE_NOT_RECOGNIZED | 404 | Wajah tidak cocok dengan data manapun |
