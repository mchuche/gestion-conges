# Préférences d’affichage

## Griser le passé

- **Configuration → onglet Affichage** : case « Griser les congés et événements passés »
- **Défaut** : coché — opacité ~38 % sur les jours passés (`--past-leave-opacity` dans `main.css`, avant ~60–75 %)
- **Désactivé** : attribut `data-gray-past-leaves="false"` sur `<html>`, le CSS global remet `opacity: 1`
- **Persistance** : `UserPreferences.grayPastLeaves` via `PATCH /preferences` (`grayPastLeaves` en camelCase)

## Modale Configuration

Réorganisée en onglets :

| Onglet | Contenu |
|--------|---------|
| Affichage | Semaine, opacité événements, intensité fériés/week-end, grisage passé |
| Congés | Quotas par année, bandeau « Jours restants », couleurs |
| Calendrier | Pose week-end/férié, vacances scolaires, suppressions masse |
| Compte | Suppression du compte |

Les réglages **Affichage** (dont grisage passé) sont enregistrés **immédiatement**. Congés / Calendrier : bouton **Enregistrer** en bas.

## Migration

```bash
npm run migrate
```
