# 📋 Phases Restantes - Migration Vue.js

## ✅ Phase 1 : Infrastructure et Base (TERMINÉE)
- [x] Setup Vue.js 3 + Vite
- [x] Stores Pinia (auth, ui, leaves, leaveTypes, quotas)
- [x] Composables réutilisables (useLeaves)
- [x] Services (dateUtils, utils, supabase, logger)
- [x] Composants UI de base (Modal, Button, Icon)

## ✅ Phase 2 : Composants Principaux (TERMINÉE)
- [x] Composants calendrier (Calendar, CalendarDay, YearViewSemester)
- [x] Modales principales (LeaveModal, ConfigModal, HelpModal)
- [x] Header avec navigation
- [x] Authentification complète

## 🔄 Phase 3 : Affichage et Statistiques (EN COURS)

### 3.1 Affichage des Statistiques
- [ ] Créer composant `Stats.vue`
  - Total jours posés
  - Total jours restants
  - Affichage format "restants/total" (ex: 24/49)
  - Calcul uniquement pour l'année en cours
  - Exclure les événements (seulement les congés avec quota)

### 3.2 Affichage des Quotas
- [ ] Créer composant `Quotas.vue`
  - Cartes de quotas par type de congé
  - Barre de progression pour chaque quota
  - Jours utilisés / Quota total
  - Indicateur de dépassement
  - Mise à jour automatique lors des changements

### 3.3 Intégration dans Calendar
- [ ] Ajouter Stats et Quotas dans Calendar.vue
- [ ] Positionner correctement (au-dessus du calendrier)
- [ ] Responsive design

## 🔄 Phase 4 : Vues Calendrier Complètes

### 4.1 Sélecteur de Format de Vue
- [ ] Ajouter sélecteur dans Calendar.vue
- [ ] Options : Semestrielle, Matrice de Présence, Matrice Verticale
- [ ] Gérer le changement de vue

### 4.2 Vue Matrice de Présence (Horizontale)
- [ ] Créer composant `YearViewPresence.vue`
  - Tableau avec utilisateurs en lignes
  - Mois en colonnes
  - Cellules de jours avec couleurs selon type de congé
  - Division diagonale pour matin/après-midi différents

### 4.3 Vue Matrice de Présence (Verticale)
- [ ] Créer composant `YearViewPresenceVertical.vue`
  - Colonnes multiples de mois
  - Affichage vertical optimisé
  - Même logique de cellules que la vue horizontale

### 4.4 Correction Affichage Vue Semestrielle
- [ ] Corriger l'affichage du calendrier annuel
- [ ] Ajuster les tailles et espacements
- [ ] Optimiser pour mobile/tablette

## 🔄 Phase 5 : Fonctionnalités Avancées (Optionnel)

### 5.1 Gestion des Équipes
- [ ] Créer composant `TeamsModal.vue`
- [ ] Créer composant `TeamSelector.vue`
- [ ] Fonctionnalités : créer équipe, inviter membres, transférer propriété

### 5.2 Administration
- [ ] Créer composant `AdminModal.vue`
- [ ] Statistiques globales
- [ ] Gestion des utilisateurs
- [ ] Logs d'audit

### 5.3 Améliorations UX
- [ ] Message d'aide mobile (help-hint)
- [ ] Mode header minimal (minimize header)
- [ ] Sélection multiple améliorée
- [ ] Tooltips et infobulles

## 🔄 Phase 6 : Optimisations et Finalisation

### 6.1 Performance
- [ ] Optimisation du rendu du calendrier
- [ ] Lazy loading des composants
- [ ] Mémoization des calculs

### 6.2 Tests
- [ ] Tests unitaires des stores
- [ ] Tests des composables
- [ ] Tests d'intégration

### 6.3 Documentation
- [ ] Documentation des composants
- [ ] Guide de migration
- [ ] README mis à jour

## 📊 Priorités

### 🔴 Priorité Haute (Fonctionnalités Essentielles)
1. **Phase 3.1 et 3.2** : Statistiques et Quotas (affichage important)
2. **Phase 4.4** : Correction affichage calendrier (déjà identifié)

### 🟡 Priorité Moyenne (Fonctionnalités Utiles)
3. **Phase 4.1** : Sélecteur de format de vue
4. **Phase 4.2 et 4.3** : Vues matrice de présence

### 🟢 Priorité Basse (Optionnel)
5. **Phase 5** : Fonctionnalités avancées (teams, admin)
6. **Phase 6** : Optimisations

## 🎯 Prochaines Étapes Recommandées

1. **Créer les composants Stats et Quotas** (Phase 3)
2. **Corriger l'affichage du calendrier** (Phase 4.4)
3. **Ajouter le sélecteur de format de vue** (Phase 4.1)
4. **Créer les vues matrice de présence** (Phase 4.2 et 4.3)

