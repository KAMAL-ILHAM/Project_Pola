"""Hitung karakteristik dataset (jumlah orang, jumlah foto, distribusi per orang).

Jalankan dari root repo:  python -m ml.dataset_stats
Hasil: tabel di layar dan ml/hasil/distribusi_dataset.md (siap ditempel ke laporan).
"""
from . import config
from .dataset_utils import list_dataset

MIN_RECOMMENDED = 3  # frontend mewajibkan minimal 3 foto per pendaftaran


def main():
    people = list_dataset(config.DATA_DIR)
    if not people:
        print(f"Dataset kosong. Taruh foto di {config.DATA_DIR}/<nim>_<nama>/foto_01.jpg")
        return

    counts = [len(p["files"]) for p in people.values()]
    lines = [
        "## Karakteristik Dataset",
        "",
        f"- Jumlah orang: {len(people)}",
        f"- Jumlah foto: {sum(counts)}",
        f"- Foto per orang: min {min(counts)}, maks {max(counts)}, rata-rata {sum(counts) / len(counts):.1f}",
        "",
        "| No | NIM | Nama | Jumlah Foto | Persentase |",
        "|----|-----|------|-------------|------------|",
    ]
    for i, (nim, p) in enumerate(people.items(), start=1):
        n = len(p["files"])
        lines.append(f"| {i} | {nim} | {p['nama']} | {n} | {n / sum(counts) * 100:.1f}% |")

    kurang = [p["nama"] for p in people.values() if len(p["files"]) < MIN_RECOMMENDED]
    if kurang:
        lines += ["", f"Perhatian: foto kurang dari {MIN_RECOMMENDED} untuk: {', '.join(kurang)}"]

    text = "\n".join(lines)
    print(text)
    config.HASIL_DIR.mkdir(exist_ok=True)
    (config.HASIL_DIR / "distribusi_dataset.md").write_text(text + "\n", encoding="utf-8")
    print(f"\nTersimpan: {config.HASIL_DIR / 'distribusi_dataset.md'}")


if __name__ == "__main__":
    main()
