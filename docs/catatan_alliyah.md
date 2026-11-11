# Catatan Kerja: Muhammad Alliyah Tilla Ilwa Fathami (ML / Data Engineer)

## Yang dibuat
Semua di folder `/ml` (lihat `ml/README.md`):
- `matching.py`: `match_face(encoding)` sesuai kontrak, membaca encoding semua mahasiswa dari database backend.
- `dataset_stats.py`, `dataset_utils.py`: tabel distribusi dataset (jumlah orang, foto, foto per orang).
- `build_encodings.py`: foto menjadi `encodings.pkl` (memakai `cv.extract_encoding` bila modul Zaky sudah ada).
- `split_data.py`: pembagian latih:uji 80:20 per orang, seed 42.
- `evaluate_threshold.py`: uji threshold 0.4 / 0.5 / 0.6, hitung FAR, FRR, dan salah identitas; menghasilkan
  `hasil_prediksi.csv` (label asli vs prediksi) untuk Daffa.
- `test_matching.py`: 12 tes otomatis (encoding sintetis), semuanya lolos.

## Library dan parameter
- numpy (jarak Euclidean `np.linalg.norm`), opencv-python (membaca foto), face_recognition/dlib (encoding 128-D, hanya di `build_encodings`).
- Metode: jarak Euclidean ke semua encoding terdaftar, ambil terkecil (nearest neighbor, k=1). Ditolak jika jarak > threshold.
- `SEED = 42`, `TEST_RATIO = 0.2`, `THRESHOLDS = [0.4, 0.5, 0.6]`, default threshold 0.5 (sama dengan backend).

## Alasan keputusan teknis
- **Jarak Euclidean + threshold, bukan KNN scikit-learn.** Encoding dlib memang dilatih agar wajah orang yang sama
  berjarak dekat, jadi perbandingan jarak langsung sudah cukup. Nearest neighbor sama dengan KNN dengan k=1, tetapi
  tanpa proses "latih": mahasiswa baru yang mendaftar langsung bisa dikenali. Lebih sederhana dijelaskan saat presentasi.
- **numpy, bukan `face_recognition.face_distance`.** Rumusnya sama (norma Euclidean), tetapi `match_face` jadi tidak
  perlu dlib sehingga ringan dan mudah diuji.
- **Pembagian per orang (stratified).** Tiap orang punya foto di data latih dan uji; tanpa itu ada orang yang tidak
  muncul di data uji. Seed tetap supaya hasil bisa diulang.
- **Dua skenario uji.** Orang terdaftar (mengukur false reject dan salah identitas) dan orang tidak terdaftar lewat
  leave-one-person-out (mengukur false accept). Dengan cara ini FAR bisa diukur tanpa mengumpulkan foto orang tambahan.
- **Threshold dibaca di dalam `match_face`** (bukan variabel global) agar perubahan admin langsung berlaku.

## False accept vs false reject dalam presensi
- **False accept:** wajah yang seharusnya tidak dikenali (atau orang lain) diterima. Akibatnya titip absen: kehadiran
  tercatat atas nama orang yang tidak hadir, dan pada login wajah orang lain bisa masuk ke akun mahasiswa. Ini kesalahan
  yang lebih merugikan.
- **False reject:** mahasiswa sah ditolak. Akibatnya ia harus mencoba lagi atau dicatat manual. Mengganggu, tetapi tidak merusak data.
- Threshold kecil (ketat) -> FAR turun, FRR naik. Threshold besar (longgar) -> sebaliknya. Karena FAR lebih berbahaya,
  threshold sebaiknya dipilih ke arah ketat, selama FRR masih bisa diterima.
- Pemilihan angka akhir harus berdasarkan tabel hasil dari data asli, bukan tebakan. Pustaka face_recognition memakai 0.6
  sebagai default umum; 0.5 lebih ketat.

## Hasil (data awal, belum final)
**Dataset:** 4 orang x 3 foto = 12 foto. Pembagian 80:20 per orang dengan seed 42 menghasilkan 8 foto latih dan
4 foto uji (1 per orang). Tabel distribusi ada di `ml/hasil/distribusi_dataset.md`.
Sumber encoding: `face_recognition` langsung (modul `cv` belum siap saat eksperimen).

| Threshold | Benar diterima | False reject | False accept | FRR | FAR | Salah identitas |
|---|---|---|---|---|---|---|
| 0.4 | 2 dari 4 | 2 | 0 dari 12 | 50% | 0% | 0 |
| 0.5 | 2 dari 4 | 2 | 0 dari 12 | 50% | 0% | 0 |
| 0.6 | 4 dari 4 | 0 | 3 dari 12 | 0% | 25% | 0 |

**Jarak sebenarnya** (`ml/hasil/hasil_prediksi.csv`):
- Foto orang sah: 0.318, 0.354, 0.502, 0.503. Dua foto terakhir ditolak pada threshold 0.5 hanya karena selisih 0.002.
- Foto orang lain (jarak ke orang terdekat): 0.548 sampai 0.697.
- Pada threshold 0.51 sampai 0.54 tidak ada kesalahan (FRR 0%, FAR 0%), tetapi celahnya sempit dan hanya berdasar
  4 foto orang sah, sehingga tidak dipakai untuk menentukan angka final. Pada 0.55 FAR mulai naik (8,3%).
- Tiga false accept pada 0.6: fandi-05 dikenali sebagai Daffa, ali-04 sebagai Daffa, rama-05 sebagai Fandi.

**Kesimpulan sementara:**
- Threshold absen tetap 0.5 (FAR 0%). Kandidat 0.52 menunggu data lebih banyak. Threshold 0.6 ditolak karena
  FAR 25% berarti titip absen mudah terjadi.
- `LOGIN_MARGIN` 0.05 belum bisa difinalkan: batas login efektif 0.45 akan menolak 2 dari 4 orang sah (jarak 0.50).
  Perlu foto pendaftaran yang lebih bervariasi (sudut, cahaya, kacamata).
- Akurasi keseluruhan (87,5%) tidak dijadikan ukuran utama karena didominasi kasus "tidak terdaftar" yang mudah ditolak.

**Keterbatasan:** dataset sangat kecil (satu foto uji per orang, jadi satu foto sama dengan 25 poin FRR). Hasil perlu
diulang dengan lebih banyak foto per orang dan dengan encoding dari modul `cv` Zaky.

**Terverifikasi dengan data sintetis:** logika pencocokan, pembagian data, hitungan FAR/FRR, dan integrasi dengan
backend (`ML_IS_STUB = False`; 13 tes backend tetap lolos). Angka sintetis tidak dipakai di laporan.

## Kendala dan hal yang perlu dikoordinasikan
- Modul `cv` (Zaky) masih kosong, jadi `build_encodings.py` memakai `face_recognition` langsung sebagai cadangan.
  Setelah `cv` siap, jalankan ulang agar encoding eksperimen sama dengan encoding di backend.
- **Rizky:** `backend/face_service.py` diam-diam jatuh ke stub jika `from ml import match_face` gagal impor. Cek
  `face_service.ML_IS_STUB` bernilai `False`. Stub `ml_stub.py` bisa dihapus.
- **Rizky:** login wajah memakai syarat `jarak <= threshold - 0.05` (`LOGIN_MARGIN`). Pada threshold 0.4 batasnya 0.35,
  yang bisa terlalu ketat untuk foto kamera biasa. Cek FRR login saat memilih threshold akhir.
- Hanya dua metrik jarak ke satu wajah terdekat yang dipakai. Jika data asli menunjukkan salah identitas, perbaikan
  yang bisa dicoba: syarat selisih jarak terhadap kandidat kedua, atau rata-rata beberapa jarak terkecil per orang.
- Dataset: hanya foto dengan persetujuan pemilik wajah, jangan di-commit. Hasil prediksi berisi NIM dan nama, bukan wajah.