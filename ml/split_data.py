"""Pembagian data latih dan uji per orang dengan seed tetap (reproducible)."""
import random
from collections import defaultdict

from . import config


def split_per_person(records, test_ratio=config.TEST_RATIO, seed=config.SEED):
    """Bagi foto tiap orang menjadi latih dan uji (default 80:20).

    Dibagi per orang (stratified) supaya setiap orang punya foto di data latih DAN data uji.
    Orang dengan kurang dari 2 foto tidak bisa dibagi: semua fotonya masuk data latih.

    Returns:
        (train, test): dua list record.
    """
    by_person = defaultdict(list)
    for r in records:
        by_person[r["nim"]].append(r)

    rng = random.Random(seed)
    train, test = [], []
    for nim in sorted(by_person):                      # urutan tetap -> hasil sama setiap dijalankan
        items = sorted(by_person[nim], key=lambda r: r["file"])
        if len(items) < 2:
            train.extend(items)
            continue
        rng.shuffle(items)
        n_test = max(1, round(len(items) * test_ratio))  # minimal 1 foto uji per orang
        test.extend(items[:n_test])
        train.extend(items[n_test:])
    return train, test
