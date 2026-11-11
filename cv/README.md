# Modul CV: Deteksi dan Encoding Wajah (Zaky)

Dipakai backend: `from cv import extract_encoding`

```python
extract_encoding(image) -> list[float] | None
```
| Situasi | Hasil |
|---|---|
| Satu wajah | list 128 `float` Python biasa |
| Tidak ada wajah (atau satu-satunya wajah < 60 px) | `None` |
| Lebih dari satu wajah (>= 60 px) | `ValueError("multiple_faces")` |
| Gambar kosong/rusak/tipe salah | `ValueError("invalid_image: ...")` |
| Error lain | dibiarkan naik |

Input: array BGR `uint8` dari `cv2.imdecode`. Fungsi lain: `detect_faces(image) -> [(top, right, bottom, left)]`
(koordinat gambar asli) dan `preprocess(image) -> RGB` (sudah di-resize).

## Alur
`validasi -> resize (sisi terpanjang <= 800) -> [CLAHE, mati] -> BGR ke RGB -> face_locations (hog) -> buang wajah < 60 px -> face_encodings`

Parameter ada di `config.py`. Fungsi bersifat murni: tidak menulis ke disk.

## Pemasangan (Windows, sudah terbukti berhasil di laptop Zaky dengan Python 3.11)
Pakai **Python 3.11** dan venv yang SAMA dengan backend. Python 3.12 membuat pip mencoba mengompilasi dlib dan gagal.
```powershell
py -3.11 -m venv venv
.\venv\Scripts\Activate.ps1          # jika diblokir: Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
python --version                       # harus 3.11.x
python -m pip install --upgrade pip
python -m pip install dlib-bin
python -m pip install face_recognition --no-deps
python -m pip install face_recognition_models Click numpy Pillow opencv-python
python -c "import face_recognition; print('ok')"
```
Kenapa `--no-deps`: `face_recognition` mencantumkan `dlib` sebagai dependensi, sedangkan `dlib-bin` terdaftar dengan nama
lain, sehingga pip mencoba membuild dlib. Pesan merah "face-recognition requires dlib>=19.7, which is not installed"
setelah langkah ini hanya peringatan dan aman diabaikan selama `import face_recognition` menghasilkan `ok`.
Jika muncul "Please install face_recognition_models": `python -m pip install "setuptools<81"`.
Alternatif jika dlib-bin tidak tersedia: `conda install -c conda-forge dlib`.

## Cek (dari root repo)
```bash
pytest cv/tests -q                     # logika dengan face_recognition palsu, tanpa dlib
python -c "from cv import extract_encoding"   # tidak boleh ada ImportError
python -m cv.demo                      # webcam, q keluar, m ganti hog/cnn
python -m cv.benchmark <folder_foto>   # HOG vs CNN, hasil ke cv/hasil/benchmark.csv
cd backend && python -c "import face_service as f; print('cv stub:', f.CV_IS_STUB)"   # harus False
```
