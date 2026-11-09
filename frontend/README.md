# Frontend Presensi Wajah

React + Vite. Berbicara dengan backend FastAPI (lihat `backend/README.md` untuk format API).

## Menjalankan
```bash
cd frontend
cp .env.example .env        # sesuaikan VITE_API_URL bila backend tidak di 127.0.0.1:8000
npm install
npm run dev                 # http://localhost:5173
```
Jalankan backend lebih dulu (`uvicorn main:app --reload` di folder `backend`).
Port 5173 dikunci karena CORS backend hanya mengizinkan 5173 dan 3000.
Kamera hanya bisa dipakai lewat `localhost` atau HTTPS.

## Halaman
| Rute | Fungsi |
|---|---|
| `/` | Presensi: kamera, tombol/otomatis pindai, hasil, 5 presensi terbaru |
| `/dashboard` | Kartu ringkasan, grafik batang per hari, daftar hadir (filter tanggal dan nama) |
| `/mahasiswa` | Daftar mahasiswa, ubah nama/NIM, hapus |
| `/daftar` | Registrasi wajah (1-10 foto dari kamera atau berkas) dengan persetujuan |

## Struktur
```
src/
  api.js            semua pemanggilan endpoint (satu-satunya tempat yang tahu URL)
  utils.js          format tanggal/waktu, pesan error_code, hook useDebounce
  styles.css        design system (variabel warna, ukuran, jarak)
  components/       CameraView, ResultCard, AttendanceTable, StatCard, BarChart,
                    Alert, Modal, Spinner, StatusBadge  (dipakai ulang oleh Rama)
  pages/            PresensiPage, DashboardPage, MahasiswaPage, DaftarPage
```
