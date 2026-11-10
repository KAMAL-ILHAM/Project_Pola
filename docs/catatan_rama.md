# Catatan Kerja: Muhammad Rama Fahrezy (Frontend + UI/UX)

## Yang dibuat
- `frontend/src/pages/RekapPage.jsx` (rute `/rekap`): filter tanggal / semua tanggal, filter nama, tabel dengan kolom tanggal, ekspor CSV.
- `downloadAttendanceCSV` di `src/utils.js`: ekspor CSV di sisi browser.
- `src/mock.js` + mode mock di `src/api.js` (`VITE_USE_MOCK=true`): frontend bisa dijalankan tanpa backend.
- Pesan error baru: `NIM_ALREADY_REGISTERED`, `TOO_MANY_PHOTOS`, `INVALID_INPUT`; dialog ubah/hapus di halaman Mahasiswa kini memakai `describeError`.
- Validasi halaman Daftar: minimal 3 foto (depan, kiri, kanan).
- Tautan "Rekap lengkap & ekspor CSV" di Dashboard dan menu "Rekap" di navbar.

## Library dan parameter
- React 18.3, Vite 5.4, react-router-dom 6.28.
- `MAX_PHOTOS = 10` (batas backend), `MIN_PHOTOS = 3`, NIM 5-20 digit, debounce pencarian 300 ms, auto-refresh dashboard 30 detik.
- CSV: UTF-8 dengan BOM, tanda kutip digandakan, NIM diawali `'` agar tidak jadi notasi ilmiah di Excel.

## Alasan keputusan teknis
- Ekspor CSV dilakukan di frontend dari data `GET /attendance`, jadi tidak perlu mengubah kontrak API.
- Minimal 3 foto agar encoding mencakup variasi sudut sehingga pencocokan lebih akurat.
- Foto hanya disimpan di memori (Blob), tidak di localStorage dan tidak di repo (privasi data wajah).

## Hasil
- (isi setelah pengujian end-to-end)

## Kendala
- `backend/stubs/cv_stub.py` belum ada di repo sehingga backend gagal start selama modul `cv` kosong (sudah disampaikan ke Rizky).
- Filter rentang tanggal belum ada; butuh parameter baru di `GET /attendance` (perlu konfirmasi Rizky dan Kamal).

## Pemisahan peran dan alamat (Mahasiswa dan Admin)
- Mahasiswa (`/mahasiswa/...`): `masuk` (login dengan verifikasi wajah, tanpa sandi), `daftar` (registrasi wajah), lalu setelah login: beranda (status dan tombol absen), `riwayat` (kehadiran sendiri). Wajah tidak dikenali -> kartu "Tidak terdaftar".
- Admin (`/admin/...`): `login`, dashboard (hari ini / kemarin / tanggal lain, sudah dan belum hadir), `rekap` (rentang tanggal, CSV, hapus catatan), `mahasiswa` (daftar, tambah, ubah, hapus), `pengaturan` (threshold, ganti password).
- Sesi dipisah per peran di sessionStorage (`authStore.js`); mahasiswa logout otomatis setelah 5 menit idle.
- Komponen baru: `Shell`, `Segmented`, `BackendTodo`; `auth.jsx` (`AuthProvider`, `RequireAuth`).
- Bagian yang butuh backend ditandai `TODO-BACKEND`; rangkuman di `docs/TODO_BACKEND_Rama.md`.
- Alasan: halaman mahasiswa hanya menampilkan data diri sendiri; data pribadi seluruh mahasiswa hanya bisa dilihat admin.
- Risiko yang dicatat untuk laporan: login hanya dengan wajah rentan terhadap foto/layar orang lain (perlu liveness) dan pendaftaran mandiri belum memverifikasi identitas.
