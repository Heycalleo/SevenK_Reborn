#!/usr/bin/env python3
"""Buat data/gallery.json dari foto kelas dan thumbnail yang sudah ada."""

import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, ".."))
IMAGES_DIR = os.path.join(ROOT, "images")
THUMBS_DIR = os.path.join(IMAGES_DIR, "thumbs")
OUT_FILE = os.path.join(ROOT, "data", "gallery.json")

# (pola nama, tags, alt, wide) - urutan di sini menentukan urutan tampil di galeri.
# Pola pakai regex, bukan awalan saja, supaya varian srcset seperti
# "potoklas-480.jpg" tidak ikut terbaca sebagai foto galeri.
GROUPS = [
    (
        re.compile(r"^potoklas\d*\.(?:jpg|jpeg|png|webp)$", re.IGNORECASE),
        ["olahraga"],
        "Foto bersama kelas 7K di SMP Negeri 3 Luwuk",
        False,
    ),
    (
        re.compile(r"^haribatik\d*\.(?:jpg|jpeg|png|webp)$", re.IGNORECASE),
        ["hari batik"],
        "Foto bersama kelas 7K memakai batik pada Hari Batik Nasional",
        True,
    ),
]


def load_existing_alts() -> dict:
    """Kumpulkan alt teks yang sudah ditulis manual agar tidak hilang saat
    generator dijalankan ulang. Foto baru tetap memakai alt bawaan grup."""
    alts = {}
    if not os.path.isfile(OUT_FILE):
        return alts
    try:
        with open(OUT_FILE, "r", encoding="utf-8") as source:
            previous = json.load(source)
    except (json.JSONDecodeError, OSError):
        return alts
    for entry in previous:
        if isinstance(entry, dict) and entry.get("src") and entry.get("alt"):
            alts[entry["src"]] = entry["alt"]
    return alts


def image_entry(filename: str, tags: list, default_alt: str, wide: bool, alts: dict) -> dict:
    stem = os.path.splitext(filename)[0]
    thumbnail_filename = f"{stem}.jpg"
    thumbnail = (
        f"images/thumbs/{thumbnail_filename}"
        if os.path.isfile(os.path.join(THUMBS_DIR, thumbnail_filename))
        else f"images/{filename}"
    )
    src = f"images/{filename}"
    entry = {
        "src": src,
        "thumb": thumbnail,
        "tags": tags,
        "alt": alts.get(src) or default_alt,
    }
    # Foto landscape (Hari Batik) tandai agar grid tidak memotongnya.
    if wide:
        entry["wide"] = True
    return entry


files = []
if os.path.isdir(IMAGES_DIR):
    available = os.listdir(IMAGES_DIR)
    alts = load_existing_alts()
    for pattern, tags, default_alt, wide in GROUPS:
        matched = sorted(
            filename
            for filename in available
            if pattern.match(filename)
            and os.path.isfile(os.path.join(IMAGES_DIR, filename))
        )
        files.extend(
            image_entry(filename, tags, default_alt, wide, alts) for filename in matched
        )

os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)
with open(OUT_FILE, "w", encoding="utf-8") as output:
    json.dump(files, output, indent=2, ensure_ascii=False)
    output.write("\n")

print(f"Wrote {len(files)} entries to {OUT_FILE}")

