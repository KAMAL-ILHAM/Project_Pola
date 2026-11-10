# TODO untuk Tim Backend (dari Frontend: Rama)

Frontend punya 2 area dengan alamat berbeda dan sesi login terpisah:
- **Mahasiswa** (`/mahasiswa/...`): login dengan **verifikasi wajah** (tanpa sandi).
- **Admin** (`/admin/...`): login username + password.

Semua bagian di bawah sudah ada tampilannya dan ditandai `TODO-BACKEND` di kode (`frontend/src/api.js` dan halaman
terkait). Saat `npm run dev`, catatan yang sama tampil sebagai kotak kuning putus-putus di layar (tidak muncul di build
produksi). Frontend bisa dicoba tanpa backend dengan `VITE_USE_MOCK=true` (admin: `admin` / `admin123`; login wajah mock
memilih mahasiswa acak dan sesekali "tidak dikenali").

## A. Login mahasiswa dengan wajah

| # | Endpoint / logika | Kebutuhan | Prioritas | Pemilik |
|---|---|---|---|---|
| 1 | `POST /auth/face-login` | multipart `foto` -> `data: {token, nama, nim}`. Memakai `match_face`; token berumur pendek (mis. 30-60 menit), peran "student". **Tidak** mencatat kehadiran. Error: 404 `FACE_NOT_RECOGNIZED` (UI menampilkan "Tidak terdaftar"), 400 `NO_FACE_DETECTED` | Tinggi | Rizky + Alliyah |
| 2 | `GET /me/attendance` | Riwayat kehadiran milik mahasiswa pada token: `[{id, timestamp, status}]`, terbaru di atas. Identitas dari token, bukan parameter | Tinggi | Rizky |
| 3 | `POST /me/attendance` | Catat kehadiran hari ini untuk mahasiswa pada token (satu kali per hari). Balas `{timestamp, status, already_recorded}` | Tinggi | Rizky |
| 4 | **Liveness / anti-spoofing** | Tanpa sandi, wajah adalah satu-satunya kunci: foto atau layar HP orang lain bisa dipakai untuk masuk. Perlu deteksi kehidupan (mis. kedipan/gerakan kepala) atau minimal catat ini sebagai batasan sistem di laporan | Tinggi (risiko keamanan) | Zaky |
| 5 | Rate limit login wajah | Batasi percobaan per IP/perangkat, mis. 10 kali per 5 menit | Sedang | Rizky |
| 6 | Threshold login | Pertimbangkan threshold lebih ketat untuk login dibanding absen biasa, karena salah kenal = orang lain membuka akun mahasiswa | Sedang | Alliyah |
| 7 | `POST /recognize` | Cara lama (kenal wajah + langsung absen tanpa login) tidak dipakai UI lagi. Hapus atau batasi, kalau tidak siapa pun tetap bisa absen tanpa login | Sedang | Rizky |

## B. Admin

| # | Endpoint / logika | Kebutuhan | Prioritas | Pemilik |
|---|---|---|---|---|
| 8 | `POST /auth/login` | `{username, password}` -> `data: {token, nama}`. Salah: 401 `INVALID_CREDENTIALS`. Tabel admin, password ter-hash (bcrypt/argon2), token peran "admin" | Tinggi | Rizky |
| 9 | Proteksi endpoint admin | `GET /students`, `PUT/DELETE /students/{id}`, `GET /attendance`, `GET /attendance/summary` wajib cek `Authorization: Bearer <token admin>`, balas 401 bila tidak valid. **Saat ini terbuka untuk publik, termasuk nama dan NIM seluruh mahasiswa.** Token mahasiswa tidak boleh bisa mengakses endpoint admin | Tinggi | Rizky |
| 10 | `GET /attendance?dari=&sampai=` | Filter rentang tanggal di server (+ pagination bila data besar). Sekarang frontend mengambil semua data lalu menyaring di browser | Sedang | Rizky |
| 11 | `DELETE /attendance/{id}` | Hapus satu catatan kehadiran (koreksi). Hanya admin | Sedang | Rizky |
| 12 | `created_at` pada data mahasiswa | Dipakai agar daftar "belum hadir" di hari lampau tidak menghitung mahasiswa yang belum terdaftar saat itu | Sedang | Rizky |
| 13 | `GET/PUT /settings` | `{threshold}` rentang 0.30-0.80, validasi di server, hanya admin. Sepakati dengan Alliyah cara `match_face` membacanya | Rendah | Rizky + Alliyah |
| 14 | `POST /auth/change-password` | `{password_lama, password_baru}`; salah: `WRONG_PASSWORD` | Rendah | Rizky |
| 15 | `POST /auth/logout` (opsional) | Cabut token di server (kedua peran) | Rendah | Rizky |
| 16 | Verifikasi pendaftaran | Pendaftaran mandiri belum memverifikasi identitas: siapa pun bisa mendaftarkan wajahnya dengan NIM orang lain, lalu otomatis bisa "login sebagai" NIM itu. Opsi: validasi NIM ke data akademik, atau status "menunggu persetujuan admin" + endpoint approve | Perlu keputusan tim (penting karena sekarang wajah = akun) | Kamal + Rizky |

## Catatan keamanan
- Penjagaan rute di frontend (`RequireAuth`) hanya mengatur tampilan. **Keamanan sebenarnya ada di backend.** Token mahasiswa dan admin harus punya peran berbeda.
- Token disimpan di `sessionStorage` per peran (hilang saat tab ditutup). Foto wajah tidak pernah disimpan di browser.
- Mahasiswa otomatis keluar setelah 5 menit tanpa aktivitas (komputer bersama).
- CORS harus mengizinkan header `Authorization`.
- Jika endpoint belum ada, frontend menampilkan "Fitur belum tersedia" (deteksi 404/405 tanpa format `{success}`), tidak crash.
