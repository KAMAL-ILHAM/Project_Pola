"""Fungsi bantu membaca dataset: data/<nim>_<nama>/foto_01.jpg, foto_02.jpg, dst."""
import re
from pathlib import Path

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}
FOLDER_PATTERN = re.compile(r"^(\d{5,20})_(.+)$")  # NIM 5-20 digit (sama dengan validasi backend)


def parse_person_folder(folder_name: str):
    """Pecah nama folder '<nim>_<nama>' menjadi (nim, nama), atau None bila formatnya salah."""
    match = FOLDER_PATTERN.match(folder_name)
    if not match:
        return None
    return match.group(1), match.group(2).replace("_", " ")


def list_dataset(data_dir: Path) -> dict:
    """Baca semua folder orang di data_dir.

    Returns:
        {nim: {"nama": str, "files": [Path, ...]}}, terurut menurut NIM dan nama file.
    """
    people = {}
    for folder in sorted(Path(data_dir).glob("*")):
        if not folder.is_dir():
            continue
        parsed = parse_person_folder(folder.name)
        if parsed is None:
            print(f"[lewati] nama folder tidak sesuai format <nim>_<nama>: {folder.name}")
            continue
        nim, nama = parsed
        files = sorted(f for f in folder.iterdir() if f.suffix.lower() in IMAGE_EXTENSIONS)
        people[nim] = {"nama": nama, "files": files}
    return people
