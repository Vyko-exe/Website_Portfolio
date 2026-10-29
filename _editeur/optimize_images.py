"""Génère les versions légères (WebP) des images du site.

images/<chemin>.jpg  →  images/_web/thumb/<chemin>.jpg.webp  (miniatures des galeries)
                     →  images/_web/full/<chemin>.jpg.webp   (lightbox, accueil)

Les pages gardent les chemins originaux ; media.js charge la version WebP
et retombe sur l'original si elle n'existe pas.

Usage :
  python optimize_images.py              tout le dossier images/ (+ nettoyage des orphelins)
  python optimize_images.py fichier...   seulement ces images
"""
import os
import sys

from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGES = os.path.join(ROOT, "images")
WEB = os.path.join(IMAGES, "_web")
SIZES = {"thumb": (1000, 80), "full": (2560, 86)}  # grand côté max, qualité
EXTS = (".jpg", ".jpeg", ".png")


def targets(src):
    rel = os.path.relpath(src, IMAGES)
    return {size: os.path.join(WEB, size, rel + ".webp") for size in SIZES}


def optimize(src):
    src = os.path.abspath(src)
    if not src.lower().endswith(EXTS) or not src.startswith(IMAGES + os.sep) or src.startswith(WEB + os.sep):
        return False
    todo = {s: d for s, d in targets(src).items()
            if not os.path.exists(d) or os.path.getmtime(d) < os.path.getmtime(src)}
    if not todo:
        return False
    img = ImageOps.exif_transpose(Image.open(src))
    img = img.convert("RGBA" if img.mode in ("RGBA", "LA", "P") else "RGB")
    for size, dest in todo.items():
        side, quality = SIZES[size]
        out = img.copy()
        out.thumbnail((side, side), Image.LANCZOS)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        out.save(dest, "WEBP", quality=quality, method=6)
    return True


def prune():
    """Supprime les versions WebP dont l'original n'existe plus."""
    removed = 0
    for size in SIZES:
        base = os.path.join(WEB, size)
        for dirpath, _, files in os.walk(base, topdown=False):
            for f in files:
                orig = os.path.join(IMAGES, os.path.relpath(os.path.join(dirpath, f), base))[: -len(".webp")]
                if not os.path.exists(orig):
                    os.remove(os.path.join(dirpath, f))
                    removed += 1
            if dirpath != base and not os.listdir(dirpath):
                os.rmdir(dirpath)
    return removed


def main(args):
    if args:
        for f in args:
            optimize(f)
        return
    files = [os.path.join(d, f) for d, dirs, fs in os.walk(IMAGES)
             if not d.startswith(WEB) for f in fs if f.lower().endswith(EXTS)]
    done = 0
    for i, f in enumerate(files, 1):
        try:
            if optimize(f):
                done += 1
                print(f"[{i}/{len(files)}] {os.path.relpath(f, IMAGES)}", flush=True)
        except Exception as e:
            print(f"[{i}/{len(files)}] ERREUR {f} : {e}", flush=True)
    print(f"{done} image(s) optimisée(s), {prune()} orpheline(s) supprimée(s).")


if __name__ == "__main__":
    main(sys.argv[1:])
