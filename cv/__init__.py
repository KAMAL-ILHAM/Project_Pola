"""Modul computer vision (Zaky): deteksi wajah, pra-pemrosesan, ekstraksi encoding."""
from .detector import detect_faces
from .encoder import extract_encoding
from .preprocess import preprocess

__all__ = ["extract_encoding", "detect_faces", "preprocess"]
