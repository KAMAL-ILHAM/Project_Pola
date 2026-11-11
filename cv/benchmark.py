"""Bandingkan HOG vs CNN: waktu per foto dan jumlah wajah terdeteksi (bahan Bab 3 / catatan teknis).

Jalankan dari root repo:  python -m cv.benchmark <folder_foto> [--ulang 3]
Hasil dicetak sebagai tabel Markdown dan disimpan di cv/hasil/benchmark.csv (berisi nama file dan angka,
bukan foto). Gunakan hanya foto dengan persetujuan pemilik wajah.
"""
import argparse
import csv
import time
from pathlib import Path

import cv2

from . import config
from .detector import _locations
from .preprocess import prepare

EXTENSIONS = {".jpg", ".jpeg", ".png"}


def run(folder, repeat):
    paths = sorted(p for p in Path(folder).rglob("*") if p.suffix.lower() in EXTENSIONS)
    if not paths:
        raise SystemExit(f"Tidak ada foto di {folder}")
    rows = []
    for path in paths:
        image = cv2.imread(str(path))
        if image is None:
            continue
        rgb, _ = prepare(image)
        row = {"file": path.name}
        for model in ("hog", "cnn"):
            times = []
            for _ in range(repeat):
                start = time.perf_counter()
                faces = _locations(rgb, model, config.UPSAMPLE)
                times.append((time.perf_counter() - start) * 1000)
            row[f"{model}_ms"] = round(sum(times) / len(times), 1)
            row[f"{model}_wajah"] = len(faces)
        rows.append(row)
    return rows


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("folder")
    parser.add_argument("--ulang", type=int, default=3, help="berapa kali tiap foto diukur (rata-rata)")
    args = parser.parse_args()
    rows = run(args.folder, args.ulang)

    out = Path(__file__).resolve().parent / "hasil" / "benchmark.csv"
    out.parent.mkdir(exist_ok=True)
    with open(out, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)

    n = len(rows)
    print("| Model | Rata-rata ms/foto | Foto dengan tepat 1 wajah | Foto tanpa wajah | Foto >1 wajah |")
    print("|---|---|---|---|---|")
    for model in ("hog", "cnn"):
        avg = sum(r[f"{model}_ms"] for r in rows) / n
        one = sum(r[f"{model}_wajah"] == 1 for r in rows)
        none = sum(r[f"{model}_wajah"] == 0 for r in rows)
        many = sum(r[f"{model}_wajah"] > 1 for r in rows)
        print(f"| {model} | {avg:.1f} | {one}/{n} | {none} | {many} |")
    print(f"\nDetail per foto: {out}")


if __name__ == "__main__":
    main()
