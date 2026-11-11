"""Uji threshold (0.4, 0.5, 0.6) dan hitung false accept / false reject.

Jalankan dari root repo (setelah build_encodings):  python -m ml.evaluate_threshold

Dua skenario uji:
1. Orang TERDAFTAR: foto uji (20%) dicocokkan dengan galeri foto latih (80%) semua orang.
   - diterima dan nama benar   -> benar diterima
   - diterima tapi nama salah  -> salah identitas (paling berbahaya: absen atas nama orang lain)
   - ditolak                   -> false reject (FRR): mahasiswa sah gagal absen
2. Orang TIDAK TERDAFTAR (leave-one-person-out): tiap orang bergantian dianggap belum daftar,
   galeri hanya berisi orang lain. Jika wajahnya tetap diterima -> false accept (FAR).

Keluaran di ml/hasil/: ringkasan_threshold.csv, hasil_prediksi.csv (untuk Daffa), konfigurasi.json.
"""
import csv
import json
import pickle
import sys

from . import config
from .matching import find_best_match
from .split_data import split_per_person

UNKNOWN = "unknown"


def load_records():
    """Baca encodings.pkl buatan build_encodings.py (hanya buka file buatan sendiri)."""
    if not config.ENCODINGS_PATH.exists():
        sys.exit(f"{config.ENCODINGS_PATH} belum ada. Jalankan dulu: python -m ml.build_encodings")
    with open(config.ENCODINGS_PATH, "rb") as f:
        return pickle.load(f)["records"]


def evaluate(records, thresholds=config.THRESHOLDS, test_ratio=config.TEST_RATIO, seed=config.SEED):
    """Jalankan kedua skenario uji.

    Returns:
        (summary, predictions): summary = list dict per threshold,
        predictions = list dict per foto uji per threshold.
    """
    train, test = split_per_person(records, test_ratio, seed)
    enrolled = sorted({r["nim"] for r in train})

    # skenario 1: orang terdaftar. Galeri = seluruh data latih.
    known_cases = [(r, train) for r in test]
    # skenario 2: orang tidak terdaftar. Galeri = data latih tanpa orang itu; uji = SEMUA fotonya.
    unknown_cases = []
    for nim in enrolled:
        gallery = [r for r in train if r["nim"] != nim]
        if not gallery:
            continue  # hanya ada satu orang: tidak ada pembanding
        unknown_cases += [(r, gallery) for r in records if r["nim"] == nim]

    predictions, summary = [], []
    for t in thresholds:
        counts = {"benar_diterima": 0, "salah_identitas": 0, "false_reject": 0,
                  "false_accept": 0, "benar_ditolak": 0}
        for kelompok, cases in (("terdaftar", known_cases), ("tidak_terdaftar", unknown_cases)):
            for r, gallery in cases:
                label, dist = find_best_match(r["encoding"], [g["encoding"] for g in gallery],
                                              [g["nim"] for g in gallery], t)
                prediksi = label or UNKNOWN
                if kelompok == "terdaftar":
                    asli = r["nim"]
                    if label is None:
                        counts["false_reject"] += 1
                    elif label == asli:
                        counts["benar_diterima"] += 1
                    else:
                        counts["salah_identitas"] += 1
                else:
                    asli = UNKNOWN
                    counts["false_accept" if label else "benar_ditolak"] += 1
                predictions.append({"threshold": t, "kelompok": kelompok, "file": f"{r['nim']}/{r['file']}",
                                    "label_asli": asli, "prediksi": prediksi,
                                    "distance": round(dist, 4), "benar": asli == prediksi})
        n_known, n_unknown = len(known_cases), len(unknown_cases)
        total = n_known + n_unknown
        summary.append({
            "threshold": t, **counts, "n_terdaftar": n_known, "n_tidak_terdaftar": n_unknown,
            "FRR_%": round(counts["false_reject"] / n_known * 100, 2) if n_known else None,
            "salah_identitas_%": round(counts["salah_identitas"] / n_known * 100, 2) if n_known else None,
            "FAR_%": round(counts["false_accept"] / n_unknown * 100, 2) if n_unknown else None,
            "akurasi_%": round((counts["benar_diterima"] + counts["benar_ditolak"]) / total * 100, 2) if total else None,
        })
    return summary, predictions, {"train": len(train), "test": len(test), "orang": len(enrolled)}


def save_csv(path, rows):
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def main():
    records = load_records()
    summary, predictions, info = evaluate(records)

    config.HASIL_DIR.mkdir(exist_ok=True)
    save_csv(config.HASIL_DIR / "ringkasan_threshold.csv", summary)
    save_csv(config.HASIL_DIR / "hasil_prediksi.csv", predictions)
    (config.HASIL_DIR / "konfigurasi.json").write_text(json.dumps({
        "seed": config.SEED, "test_ratio": config.TEST_RATIO, "thresholds": config.THRESHOLDS,
        "metode": "jarak Euclidean, nearest neighbor (k=1), tolak jika jarak > threshold",
        "jumlah_orang": info["orang"], "foto_latih": info["train"], "foto_uji": info["test"],
    }, indent=2), encoding="utf-8")

    print(f"Orang: {info['orang']} | foto latih: {info['train']} | foto uji: {info['test']} | seed: {config.SEED}\n")
    print("| Threshold | Benar diterima | Salah identitas | False reject | False accept | FRR % | FAR % | Akurasi % |")
    print("|---|---|---|---|---|---|---|---|")
    for s in summary:
        print(f"| {s['threshold']} | {s['benar_diterima']} | {s['salah_identitas']} | {s['false_reject']} | "
              f"{s['false_accept']} | {s['FRR_%']} | {s['FAR_%']} | {s['akurasi_%']} |")
    print(f"\nTersimpan di {config.HASIL_DIR}/ (ringkasan_threshold.csv, hasil_prediksi.csv, konfigurasi.json)")


if __name__ == "__main__":
    main()
