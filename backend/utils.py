"""Fungsi bantu: membaca file gambar upload menjadi array OpenCV."""
import cv2
import numpy as np
from fastapi import UploadFile

from errors import AppError

MAX_SIZE = 5 * 1024 * 1024  # 5 MB
ALLOWED_TYPES = {"image/jpeg", "image/png"}


async def read_image(file: UploadFile) -> np.ndarray:
    """Validasi dan decode upload ke array BGR. Foto tidak disimpan ke disk."""
    if file.content_type not in ALLOWED_TYPES:
        raise AppError(422, "INVALID_IMAGE", "Format foto harus JPEG atau PNG.")
    data = await file.read()
    if len(data) > MAX_SIZE:
        raise AppError(413, "IMAGE_TOO_LARGE", "Ukuran foto maksimal 5 MB.")
    image = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise AppError(422, "INVALID_IMAGE", "File bukan gambar yang valid.")
    return image
