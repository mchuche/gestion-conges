# Essai — vacances scolaires (chiffre du jour coloré)

Fonctionnalité **optionnelle**, **désactivée par défaut** : le calendrier reste identique tant que tu ne l’actives pas.

## Activer l’essai

1. **Configuration** → section **Vacances scolaires**
2. Choisir la **zone** (A, B ou C)
3. Cocher **Afficher les vacances scolaires** (couleur du chiffre du jour)

Les **badges** congé / événement ne changent pas.

**Couleurs** : chiffre **orange** en mode clair (`#d97706`), **jaune ambre** en mode foncé (`#fbbf24`) — réglables via `--school-holiday-number-color` dans `CalendarDay.vue`.

## Revenir en arrière (sans toucher au code)

- Décocher **Afficher les vacances scolaires** → rendu comme avant.

## Revenir en arrière (supprimer la feature)

1. Décocher l’option en config (ci-dessus).
2. Fichiers à retirer si abandon définitif :
   - `src/services/school-holidays.js`
   - `src/data/school-holidays-fr.json`
   - styles `.school-holiday-day-number` dans `CalendarDay.vue`
   - section config + champs store / API / migration Prisma `20260522100000_school_holidays_prefs`

## Données

`src/data/school-holidays-fr.json` — calendrier 2024–2027 (métropole). Mettre à jour chaque année scolaire si la feature est conservée.

## Migration locale

```bash
npm run migrate
```
