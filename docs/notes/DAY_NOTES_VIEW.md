# Vue « Notes » — carnet annuel

## Utilisation

1. Sélecteur **Format de vue** → **Notes**
2. Grille type Excel : **#** (jour), **J** (lettre), **Note** — mois collés sans espace entre colonnes (essai UI)
3. **Clic** sur une ligne → modale pour saisir / modifier / supprimer la note (500 caractères max)
4. Si pas de note mais un congé posé : indice en italique (type de congé)

## Technique

- API : `GET /day-notes?year=`, `PATCH /day-notes`
- Table `DayNote` (une entrée par `userId` + `dateKey`)
- Indépendant des types `Leave` : tu peux noter un week-end sans poser de congé

## Vacances scolaires

Si activées en Configuration, le **chiffre** du jour reste orange/jaune (comme la vue Congés).

## Migration

```bash
npm run migrate
```
