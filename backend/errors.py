"""Error aplikasi dengan kode yang konsisten, supaya frontend mudah menanganinya."""


class AppError(Exception):
    """Error yang sengaja dilempar backend (wajah tidak ditemukan, NIM dobel, dll)."""

    def __init__(self, status_code: int, error_code: str, message: str):
        self.status_code = status_code
        self.error_code = error_code
        self.message = message
