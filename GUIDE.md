# Guide — Ajouter un projet au portfolio

---

## DIGITAL 3D

```
┌─────────────────────────────────────────────────────────────┐
│  Tu as un nouveau projet 3D avec plusieurs renders          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  1. CRÉER LE DOSSIER                                        │
│                                                             │
│  images/Digital3d/2025/MonProjet/                          │
│    ├── 01.jpg   ← meilleur render (sera le thumbnail)      │
│    ├── 02.jpg   ← wireframe / clay / autre angle           │
│    └── 03.jpg                                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  2. OUVRIR digital-3d.html                                  │
│                                                             │
│  Trouver la section de l'année :                           │
│  <!-- 2025 -->                                              │
│  <div class="year-block reveal">                            │
│    <div class="thumb-strip">                                │
│      ...                                                    │
│      ← COLLER ICI                                           │
│    </div>                                                   │
│  </div>                                                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  3. COLLER CE BLOC (adapter les chemins et le titre)        │
│                                                             │
│  <div class="thumb"                                         │
│       data-title="MonProjet"                                │
│       data-year="2025"                                      │
│       data-images="images/Digital3d/2025/MonProjet/01.jpg,  │
│                    images/Digital3d/2025/MonProjet/02.jpg,  │
│                    images/Digital3d/2025/MonProjet/03.jpg"> │
│    <div class="thumb-img"                                   │
│         data-bg="images/Digital3d/2025/MonProjet/01.jpg">   │
│    </div>                                                   │
│    <div class="thumb-ov"></div>                             │
│    <span class="thumb-label">MonProjet</span>               │
│  </div>                                                     │
│                                                             │
│  ↑ data-bg       = thumbnail affiché dans la galerie        │
│  ↑ data-images   = toutes les images du lightbox            │
│  ↑ data-title    = nom affiché dans le lightbox             │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  4. SAUVEGARDER → tester dans le navigateur                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  5. GIT BASH — publier                                      │
│                                                             │
│  git add . && git commit -m "ajout MonProjet" && git push   │
└─────────────────────────────────────────────────────────────┘
```

---

## DIGITAL 2D

```
┌─────────────────────────────────────────────────────────────┐
│  Tu as une nouvelle illustration                            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  1. METTRE L'IMAGE dans le bon dossier                      │
│                                                             │
│  images/Digital2d/2025/monimage.jpg                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  2. OUVRIR digital-2d.html                                  │
│                                                             │
│  Trouver <!-- 2025 --> et coller dans le thumb-strip :      │
│                                                             │
│  <div class="thumb"                                         │
│       data-title="Mon titre"                                │
│       data-year="2025">                                     │
│    <div class="thumb-img"                                   │
│         data-bg="images/Digital2d/2025/monimage.jpg">       │
│    </div>                                                   │
│    <div class="thumb-ov"></div>                             │
│    <span class="thumb-label">Mon titre</span>               │
│  </div>                                                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  3. GIT BASH — publier                                      │
│                                                             │
│  git add . && git commit -m "ajout monimage" && git push    │
└─────────────────────────────────────────────────────────────┘
```

---

## NOUVELLE ANNÉE

```
┌─────────────────────────────────────────────────────────────┐
│  C'est le début d'une nouvelle année                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Créer le dossier images/Digital2d/2026/                    │
│  (ou Digital3d/2026/)                                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Dans le HTML, ajouter ce bloc EN PREMIER (avant 2025) :    │
│                                                             │
│  <!-- 2026 -->                                              │
│  <div class="year-block reveal">                            │
│    <h2 class="year-heading">2026</h2>                       │
│    <div class="thumb-strip">                                │
│                                                             │
│      <!-- tes cartes ici -->                                │
│                                                             │
│    </div>                                                   │
│  </div>                                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## RÉORGANISER L'ORDRE

```
Navigateur  →  CTRL + *  →  glisser les cartes  →  "Sauvegarder dans le fichier"  →  CTRL + *
```

---

## RAPPEL CHEMINS

```
data-bg       → 1 seul fichier  →  le thumbnail de la carte
data-images   → tous les fichiers séparés par des virgules  →  les images du lightbox
data-title    → texte affiché dans le lightbox
data-year     → année affichée dans le lightbox
```

---

## GIT — PUBLIER LES MODIFICATIONS

```
┌─────────────────────────────────────────────────────────────┐
│  Voir ce qui a changé                                       │
│  git status                                                 │
├─────────────────────────────────────────────────────────────┤
│  Ajouter tous les fichiers modifiés                         │
│  git add .                                                  │
├─────────────────────────────────────────────────────────────┤
│  Créer un commit                                            │
│  git commit -m "ajout MonProjet"                            │
├─────────────────────────────────────────────────────────────┤
│  Envoyer sur GitHub                                         │
│  git push                                                   │
└─────────────────────────────────────────────────────────────┘

  VERSION RAPIDE EN UNE LIGNE :
  git add . && git commit -m "update" && git push
```

### Commandes utiles en plus

```
git status                   → voir les fichiers modifiés / non trackés
git log --oneline            → historique des commits
git diff                     → voir les changements non encore commités
git restore nomfichier.html  → annuler les modifs d'un fichier (DANGER : irréversible)
git reset --soft HEAD~1      → annuler le dernier commit (garde les fichiers)
git push -u origin main      → première fois qu'on push une nouvelle branche
```
