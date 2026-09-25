#!/usr/bin/env python3
"""Buat data/gallery.json dari foto kelas dan thumbnail yang sudah ada."""

import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, ".."))
IMAGES_DIR = os.path.join(ROOT, "images")
THUMBS_DIR = os.path.join(IMAGES_DIR, "thumbs")
OUT_FILE = os.path.join(ROOT, "data", "gallery.json")

ALLOWED = {".jpg", ".jpeg", ".png", ".webp"}
GALLERY_PREFIX = "potoklas"
DEFAULT_TAGS = ["bersama"]
DEFAULT_ALT = "Foto bersama kelas 7K di SMP Negeri 3 Luwuk"


def image_entry(filename: str) -> dict:
    stem = os.path.splitext(filename)[0]
    thumbnail_filename = f"{stem}.jpg"
    thumbnail = (
        f"images/thumbs/{thumbnail_filename}"
        if os.path.isfile(os.path.join(THUMBS_DIR, thumbnail_filename))
        else f"images/{filename}"
    )
    return {
        "src": f"images/{filename}",
        "thumb": thumbnail,
        "tags": DEFAULT_TAGS,
        "alt": DEFAULT_ALT,
    }


files = []
if os.path.isdir(IMAGES_DIR):
    files = [
        image_entry(filename)
        for filename in sorted(os.listdir(IMAGES_DIR))
        if filename.lower().startswith(GALLERY_PREFIX)
        and os.path.splitext(filename)[1].lower() in ALLOWED
        and os.path.isfile(os.path.join(IMAGES_DIR, filename))
    ]

os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)
with open(OUT_FILE, "w", encoding="utf-8") as output:
    json.dump(files, output, indent=2, ensure_ascii=False)
    output.write("\n")

print(f"Wrote {len(files)} entries to {OUT_FILE}")

