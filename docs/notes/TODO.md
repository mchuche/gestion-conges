# TODO - Gestion de Congés

## À faire

### Fonctionnalités
- [x] **Pose week-end / férié (option utilisateur)** : préférence `allowWeekendHolidayLeave` en Configuration.
- [ ] **Collègues travaillant week-end / jours fériés (suite)** : travail en service, repos compensateurs, matrice ETP — voir note ci-dessous.
- [ ] Demande utilisateur → admin pour ajouter un type Absence/Événement au socle (`GlobalLeaveType`)
- [ ] Partage disponibilité entre amis (hors équipe / matrice)

### Corrections de bugs
- [x] probleme d'enregistrement des jours de congé
- [x] Affichage du calendrier disparait quand calendrier perso
- [ ] pour les jours récurrents il y a un probleme de calcule sur la modale avant validation (jours off)
- [ ] Impossible de supprimer un evenement dans la matrice de presence

### Améliorations UI/UX
- [ ] sur une resolution petit telephone en mode header caché: le titre de la vue et les controlers d'année ne sont plus sur la meme ligne  
- [ ] en mode largeur limité si la fenetre est trop grande les colonnes des mois ne se place pas bien
- [ ] 
- [x] améioration reglage visibilité pour les jours férier et weekend
- [ ] dans les matrices de presence supprimer le type de congé. 

### Optimisations
- [ ] 
- [ ] 
- [ ] 

### Tests
- [ ] 
- [ ] 
- [ ] 

### Documentation
- [ ] 
- [ ] 
- [ ] 

## En cours

- [ ] Revoir les vues Matrice de presence

## Terminé

- [x] Amélioration de la sélection multiple dans la vue annuelle
- [x] Mode minimisé du header (calendar-container prend tout l'espace)
- [x] Correction de la comparaison des dates dans le store UI

## Notes

### Week-end et jours fériés (travail occasionnel)

**Contexte (2026-05)** : certains collègues travaillent parfois le samedi/dimanche ou un jour férié. L’app actuelle part du principe **jours ouvrés** = lun–ven hors fériés.

**Comportement actuel à connaître** :
- Clic / sélection bloqués sur week-end et fériés dans le calendrier annuel.
- `calculateWorkingDays` / `DateRangeModal` : exclusion week-end + fériés (pays `UserPreferences.selectedCountry`).
- Matrice présence : cellules week-end/férié atténuées ; ETP souvent vide ces jours.

**Pistes plus tard (à trancher)** :
- Préférence utilisateur « je peux travailler week-ends / fériés » (ou jours de service fixes).
- Type d’événement « travail week-end » / « permanence » + comptage dédié.
- Repos compensateurs (absence dédiée admin) liés aux jours travaillés hors calendrier standard.
- Ne pas casser le cas majoritaire (agents lun–ven).

**Priorité produit** : individu d’abord ; matrice équipe en bonus.


