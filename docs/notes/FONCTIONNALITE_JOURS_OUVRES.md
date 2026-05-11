# Calcul Automatique des Jours Ouvrés

## 📋 Description

Cette fonctionnalité calcule automatiquement le nombre de jours ouvrés lors de la sélection de congés, en excluant :
- Les weekends (samedi et dimanche)
- Les jours fériés du pays sélectionné

## ✨ Fonctionnalités

### 1. Calcul pour une date unique
Lorsque vous sélectionnez un seul jour :
- ✅ **Jour ouvré** : Affiche "Jour ouvré - Comptabilisé dans les jours ouvrés"
- ⚠️ **Weekend** : Affiche "Ce jour est un samedi/dimanche - Non comptabilisé"
- 🎉 **Jour férié** : Affiche "Ce jour est un jour férié (nom) - Non comptabilisé"

### 2. Calcul pour plusieurs dates
Lorsque vous sélectionnez plusieurs jours (Ctrl/Cmd + clic) :
- Affiche le nombre de jours ouvrés sur le total de jours sélectionnés
- Affiche la plage de dates (ex: "5 jours ouvrés sur 7 jours sélectionnés (1 jan - 7 jan 2024)")
- Met à jour en temps réel quand vous ajoutez/retirez des dates

### 3. Mise à jour en temps réel
- Les jours ouvrés sont recalculés automatiquement quand vous :
  - Ajoutez une date à la sélection
  - Retirez une date de la sélection
  - Changez le pays dans les préférences

## 🎯 Utilisation

### Sélection simple
1. Cliquez sur un jour dans le calendrier
2. La modale s'ouvre avec l'information sur le jour ouvré
3. Vous voyez immédiatement si c'est un jour ouvré ou non

### Sélection multiple
1. Maintenez **Ctrl** (ou **Cmd** sur Mac) et cliquez sur plusieurs jours
2. Cliquez sur un jour sélectionné pour ouvrir la modale
3. Vous voyez le nombre de jours ouvrés sur le total sélectionné
4. Continuez à ajouter/retirer des dates, le calcul se met à jour automatiquement

## 🔧 Fonctions techniques

### `calculateWorkingDays(startDate, endDate, country, holidays)`
Calcule le nombre de jours ouvrés entre deux dates.

**Paramètres :**
- `startDate` : Date de début (incluse)
- `endDate` : Date de fin (incluse)
- `country` : Code pays (ex: 'FR', 'BE') - défaut: 'FR'
- `holidays` : Objet des jours fériés (optionnel, calculé si non fourni)

**Retourne :** Nombre de jours ouvrés

### `calculateWorkingDaysFromDates(dates, country)`
Calcule le nombre de jours ouvrés dans une liste de dates.

**Paramètres :**
- `dates` : Array de dates
- `country` : Code pays - défaut: 'FR'

**Retourne :** Nombre de jours ouvrés

### `updateWorkingDaysInfo()`
Met à jour l'affichage des jours ouvrés dans la modale.

## 📍 Où est-ce affiché ?

L'information est affichée dans la modale "Choisir le type de congé" :
- Sous la date sélectionnée
- Dans un encadré bleu informatif
- Avec des icônes pour faciliter la compréhension :
  - 📅 pour les statistiques de jours ouvrés
  - ✅ pour un jour ouvré
  - ℹ️ pour un weekend ou jour férié

## 🌍 Pays supportés

Le calcul utilise les jours fériés du pays sélectionné dans vos préférences :
- 🇫🇷 France (FR)
- 🇧🇪 Belgique (BE)
- 🇨🇭 Suisse (CH)
- 🇨🇦 Canada (CA)
- 🇺🇸 États-Unis (US)
- 🇬🇧 Royaume-Uni (GB)
- 🇩🇪 Allemagne (DE)
- 🇪🇸 Espagne (ES)
- 🇮🇹 Italie (IT)
- 🇳🇱 Pays-Bas (NL)
- 🇱🇺 Luxembourg (LU)

## 💡 Exemples

### Exemple 1 : Une semaine complète
- Sélection : Du lundi 1er janvier au dimanche 7 janvier 2024
- Résultat : "5 jours ouvrés sur 7 jours sélectionnés"
- Explication : Exclut le samedi et le dimanche

### Exemple 2 : Semaine avec jour férié
- Sélection : Du lundi 1er janvier au vendredi 5 janvier 2024 (en France)
- Résultat : "4 jours ouvrés sur 5 jours sélectionnés"
- Explication : Exclut le 1er janvier (Jour de l'an) qui est un jour férié

### Exemple 3 : Weekend
- Sélection : Samedi 6 janvier 2024
- Résultat : "Ce jour est un samedi - Non comptabilisé dans les jours ouvrés"

## 🎨 Styles

L'affichage utilise des couleurs pour différencier les types d'informations :
- **Bleu clair** : Information sur les jours ouvrés
- **Vert** : Jour ouvré confirmé
- **Orange** : Weekend ou jour férié

Les styles s'adaptent automatiquement au thème clair/sombre.

## 🔄 Mise à jour automatique

Le calcul se met à jour automatiquement quand :
- Vous sélectionnez/désélectionnez des dates
- Vous changez le pays dans les préférences
- Vous ouvrez la modale avec une nouvelle sélection

## 📝 Notes techniques

- Les jours fériés sont calculés dynamiquement selon l'année
- Le calcul prend en compte les jours fériés variables (Pâques, etc.)
- Les weekends sont toujours exclus (samedi = 6, dimanche = 0)
- Le pays utilisé est celui défini dans `user_preferences.selected_country`

