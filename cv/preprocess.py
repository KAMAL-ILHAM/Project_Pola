"""Pra-pemrosesan gambar dengan OpenCV, dipakai sebelum deteksi dan encoding wajah."""
import cv2
import numpy as np

from . import config


def validate_image(image):
    """Pastikan `image` adalah array gambar yang layak diproses; lempar ValueError jika tidak.

    Gambar grayscale (2 dimensi) atau BGRA (4 kanal) diubah menjadi BGR 3 kanal.
    Backend selalu mengirim BGR 3 kanal, tetapi cek ini melindungi pemakaian lain (demo, ml).
    """
    if not isinstance(image, np.ndarray):
        raise ValueError("invalid_image: input harus array NumPy")
    if image.size == 0 or image.ndim not in (2, 3):
        raise ValueError("invalid_image: gambar kosong atau bentuknya salah")
    if image.dtype != np.uint8:
        raise ValueError("invalid_image: tipe data harus uint8")
    if image.ndim == 2:
        return cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
    channels = image.shape[2]
    if channels == 4:
        return cv2.cvtColor(image, cv2.COLOR_BGRA2BGR)
    if channels != 3:
        raise ValueError(f"invalid_image: jumlah kanal {channels} tidak didukung")
    return image


def resize_keep_ratio(image, max_side=config.MAX_SIDE):
    """Kecilkan gambar (rasio tetap) agar sisi terpanjang <= max_side.

    Returns:
        (gambar_baru, skala) dengan skala = ukuran_baru / ukuran_asli (1.0 jika tidak diubah).
    Gambar kecil tidak diperbesar: memperbesar tidak menambah detail, hanya menambah waktu.
    """
    longest = max(image.shape[:2])
    if longest <= max_side:
        return image, 1.0
    scale = max_side / longest
    new_size = (round(image.shape[1] * scale), round(image.shape[0] * scale))
    return cv2.resize(image, new_size, interpolation=cv2.INTER_AREA), scale  # INTER_AREA terbaik untuk memperkecil


def equalize_lighting(bgr):
    """CLAHE pada kanal kecerahan (L di ruang warna LAB) agar warna kulit tidak ikut berubah."""
    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=config.CLAHE_CLIP_LIMIT, tileGridSize=config.CLAHE_TILE_GRID)
    return cv2.cvtColor(cv2.merge((clahe.apply(l), a, b)), cv2.COLOR_LAB2BGR)


def prepare(image, max_side=config.MAX_SIDE, use_clahe=config.USE_CLAHE):
    """Pipeline lengkap. Returns (rgb, skala); rgb siap dipakai face_recognition."""
    bgr = validate_image(image)
    bgr, scale = resize_keep_ratio(bgr, max_side)
    if use_clahe:
        bgr = equalize_lighting(bgr)
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)  # dlib mengharapkan RGB, OpenCV memberi BGR
    return np.ascontiguousarray(rgb), scale


def preprocess(image, max_side=config.MAX_SIDE, use_clahe=config.USE_CLAHE):
    """Ubah gambar BGR (OpenCV) menjadi RGB uint8 yang sudah di-resize, siap untuk deteksi.

    Langkah: validasi -> resize (sisi terpanjang <= max_side) -> CLAHE opsional -> BGR ke RGB.
    Tidak mengubah `image` asli dan tidak menyimpan apa pun ke disk.
    """
    return prepare(image, max_side, use_clahe)[0]
