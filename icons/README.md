# Icônes PWA

Ce dossier contient les icônes nécessaires pour l'installation PWA de l'application.

## Icônes requises

L'application nécessite les icônes suivantes (en PNG) :
- `icon-72x72.png` (72x72 pixels)
- `icon-96x96.png` (96x96 pixels)
- `icon-128x128.png` (128x128 pixels)
- `icon-144x144.png` (144x144 pixels)
- `icon-152x152.png` (152x152 pixels)
- `icon-192x192.png` (192x192 pixels)
- `icon-384x384.png` (384x384 pixels)
- `icon-512x512.png` (512x512 pixels)

## Génération des icônes

### Option 1 : Utiliser un outil en ligne

1. Allez sur https://realfavicongenerator.net/ ou https://www.pwabuilder.com/imageGenerator
2. Téléchargez le fichier `icon.svg` de ce dossier
3. Générez toutes les tailles nécessaires
4. Placez les fichiers PNG générés dans ce dossier

### Option 2 : Utiliser ImageMagick (ligne de commande)

```bash
# Installer ImageMagick si nécessaire
# Windows: choco install imagemagick
# Mac: brew install imagemagick
# Linux: sudo apt-get install imagemagick

# Convertir le SVG en PNG de différentes tailles
convert -background none icon.svg -resize 72x72 icon-72x72.png
convert -background none icon.svg -resize 96x96 icon-96x96.png
convert -background none icon.svg -resize 128x128 icon-128x128.png
convert -background none icon.svg -resize 144x144 icon-144x144.png
convert -background none icon.svg -resize 152x152 icon-152x152.png
convert -background none icon.svg -resize 192x192 icon-192x192.png
convert -background none icon.svg -resize 384x384 icon-384x384.png
convert -background none icon.svg -resize 512x512 icon-512x512.png
```

### Option 3 : Utiliser un éditeur d'images

1. Ouvrez `icon.svg` dans un éditeur d'images (GIMP, Photoshop, etc.)
2. Exportez en PNG aux différentes tailles requises
3. Placez les fichiers dans ce dossier

## Note importante

Les icônes sont nécessaires pour que l'application soit installable en tant que PWA. Sans ces icônes, l'installation fonctionnera mais l'icône par défaut du navigateur sera utilisée.

## Vérification

Pour vérifier que les icônes sont correctement configurées :
1. Ouvrez l'application dans un navigateur
2. Ouvrez les outils de développement (F12)
3. Allez dans l'onglet "Application" (Chrome) ou "Manifest" (Firefox)
4. Vérifiez que toutes les icônes sont chargées sans erreur



