# Modul ML: Pencocokan Wajah (Alliyah)

Fungsi yang dipakai backend: `from ml import match_face`

```python
match_face(encoding) -> {"nama": str, "nim": str, "distance": float} | None
```
Membandingkan encoding 128-D dengan semua encoding mahasiswa di database (jarak Euclidean, ambil yang
terkecil). `None` jika jarak terkecil > threshold. Threshold dibaca dari pengaturan admin tiap panggilan.

## Alur eksperimen (jalankan dari root repo)
```bash
# 1. taruh foto (dengan persetujuan pemilik wajah): ml/data/<nim>_<nama>/foto_01.jpg, foto_02.jpg, ...
python -m ml.dataset_stats        # tabel distribusi dataset  -> ml/hasil/distribusi_dataset.md
python -m ml.build_encodings      # foto -> encoding          -> ml/encodings.pkl (tidak di-commit)
python -m ml.evaluate_threshold   # uji threshold 0.4/0.5/0.6 -> ml/hasil/*.csv
pytest ml -q                      # tes logika (data sintetis)
```
Butuh `face_recognition` (dlib) dan `opencv-python` hanya untuk `build_encodings`. `match_face` dan evaluasi hanya butuh numpy.

## File
| File | Fungsi |
|---|---|
| `matching.py` | `match_face` (database) dan `nearest`/`find_best_match` (murni, bisa dipakai offline) |
| `config.py` | seed, rasio uji, daftar threshold |
| `dataset_utils.py`, `dataset_stats.py` | membaca dataset dan tabel distribusi |
| `build_encodings.py` | foto -> `encodings.pkl` (memakai `cv.extract_encoding` bila ada) |
| `split_data.py` | pembagian latih:uji 80:20 per orang, seed 42 |
| `evaluate_threshold.py` | FAR, FRR, salah identitas per threshold + `hasil_prediksi.csv` untuk Daffa |
| `test_matching.py` | tes otomatis (encoding sintetis) |

## Format `hasil/hasil_prediksi.csv` (untuk Daffa)
`threshold, kelompok, file, label_asli, prediksi, distance, benar`
- `kelompok`: `terdaftar` (foto uji orang yang sudah terdaftar) atau `tidak_terdaftar` (orang dianggap belum daftar).
- `label_asli` / `prediksi`: NIM, atau `unknown`.

Folder `ml/data/` dan `*.pkl` sudah ada di `.gitignore`. File di `ml/hasil/` berisi NIM dan nama (bukan wajah).
