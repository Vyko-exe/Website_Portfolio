"""Prépare une image ajoutée via l'éditeur.

- HEIC/HEIF → JPG
- applique la rotation EXIF (photos de téléphone)
- réduit les images dont le grand côté dépasse MAX_SIDE
- convertit les gros PNG sans transparence en JPG
- génère ses versions WebP légères (optimize_images.py)

Affiche le chemin du fichier final sur la dernière ligne.
"""
import os
import sys

from PIL import Image, ImageOps

MAX_SIDE = 3000
PNG_TO_JPG_ABOVE = 3 * 1024 * 1024  # octets
JPG_QUALITY = 90


def unique(path):
    stem, ext = os.path.splitext(path)
    i, candidate = 2, path
    while os.path.exists(candidate):
        candidate = f"{stem}-{i}{ext}"
        i += 1
    return candidate


def main(src):
    ext = os.path.splitext(src)[1].lower()
    if ext in (".heic", ".heif"):
        import pillow_heif
        pillow_heif.register_heif_opener()
    if ext == ".gif":
        return src

    img = Image.open(src)
    rotated = img.getexif().get(0x0112, 1) != 1
    img = ImageOps.exif_transpose(img)

    resized = max(img.size) > MAX_SIDE
    if resized:
        img.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)

    has_alpha = img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info)
    to_jpg = ext in (".heic", ".heif") or (
        ext == ".png" and not has_alpha and os.path.getsize(src) > PNG_TO_JPG_ABOVE
    )

    if to_jpg:
        dest = unique(os.path.splitext(src)[0] + ".jpg")
        img.convert("RGB").save(dest, "JPEG", quality=JPG_QUALITY, optimize=True, progressive=True)
        os.remove(src)
        return dest
    elif resized or rotated:
        if ext in (".jpg", ".jpeg"):
            img.convert("RGB").save(src, "JPEG", quality=JPG_QUALITY, optimize=True, progressive=True)
        else:
            img.save(src, optimize=True)
        return src
    else:
        return src


if __name__ == "__main__":
    final = main(sys.argv[1])
    try:  # versions WebP légères pour le site (voir optimize_images.py)
        from optimize_images import optimize
        optimize(final)
    except Exception:
        pass
    print(final)
