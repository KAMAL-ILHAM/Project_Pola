"""Parameter modul cv. Semua angka ada di sini supaya mudah dijelaskan dan diubah."""

DETECTION_MODEL = "hog"   # "hog" (CPU, cepat) atau "cnn" (lebih akurat, butuh GPU agar cepat)
UPSAMPLE = 1              # berapa kali gambar diperbesar sebelum deteksi; makin besar makin sensitif tapi lambat
NUM_JITTERS = 1           # berapa kali wajah diacak sedikit saat encoding; 1 = tercepat
MAX_SIDE = 800            # sisi terpanjang gambar (piksel) setelah resize; gambar lebih kecil tidak diperbesar
MIN_FACE_SIZE = 60        # tinggi/lebar wajah minimum (piksel, pada gambar yang sudah di-resize)
USE_CLAHE = False         # normalisasi pencahayaan; mati secara default, aktifkan hanya jika terbukti membantu
CLAHE_CLIP_LIMIT = 2.0
CLAHE_TILE_GRID = (8, 8)
