Folder ini berisi foto galeri kelas 7K.

- Foto potret bersama: potoklas.jpeg, potoklas2.jpeg, dan seterusnya.
- Foto Hari Batik (landscape 16:9): haribatik1.jpeg, dan seterusnya.
- Thumbnail: thumbs/nama-file.jpg.
- Ukuran thumbnail foto potret: 225 × 400 piksel.
- Ukuran thumbnail foto landscape: 450 × 253 piksel.
- Ukuran foto utama: 720 × 1280 (potret) dan 1280 × 720 (landscape).

Untuk memperbarui galeri, jalankan:
    python scripts/generate_gallery.py

Generator mengelompokkan foto berdasarkan awalan nama ("potoklas" dan
"haribatik"), memakai thumbnail dengan nama yang sama jika tersedia, lalu
menandai foto landscape dengan "wide": true supaya grid tidak memotongnya.

