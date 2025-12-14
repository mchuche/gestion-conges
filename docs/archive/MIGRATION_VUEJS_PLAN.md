# 📋 Plan de Migration vers Vue.js 3

## 🎯 Objectif

Migrer l'application vanilla JavaScript vers Vue.js 3 avec Composition API, en conservant toutes les fonctionnalités existantes et en améliorant la maintenabilité du code.

---

## ✅ Prérequis et Préparation

### 1. Outils nécessaires (à installer si pas déjà fait)

- ✅ **Node.js** (v18+ recommandé) - [Télécharger](https://nodejs.org/)
- ✅ **npm** (inclus avec Node.js)
- ✅ **Git** (déjà installé)

### 2. Bibliothèques à installer

Toutes les bibliothèques seront installées via npm lors de la Phase 1. Aucune installation manuelle nécessaire.

**Dépendances principales :**
- `vue@^3.4.0` - Framework Vue.js 3
- `pinia@^2.1.7` - Gestion d'état
- `@supabase/supabase-js@^2.39.0` - Client Supabase
- `sweetalert2@^11.10.0` - Modales
- `lucide-vue-next@^0.309.0` - Icônes (ou garder CDN)
- `date-fns@^3.2.0` - Manipulation de dates

**Outils de développement :**
- `vite@^5.1.0` - Build tool
- `@vitejs/plugin-vue@^5.0.4` - Plugin Vue pour Vite
- `vite-plugin-pwa@^0.17.4` - Support PWA

### 3. Votre aide

**Vous pouvez m'aider sur :**
- ✅ Tester l'application après chaque phase
- ✅ Signaler les bugs ou comportements inattendus
- ✅ Valider les fonctionnalités migrées
- ✅ Donner votre avis sur l'interface utilisateur

**Je m'occupe de :**
- ✅ Toute la migration du code
- ✅ L'installation des dépendances
- ✅ La configuration des outils
- ✅ Les commits et pushes Git

**Pas besoin de :**
- ❌ Installer manuellement des bibliothèques
- ❌ Configurer des fichiers complexes
- ❌ Écrire du code (sauf si vous voulez)

---

## 🏗️ Architecture Vue.js Proposée

### Stack Technique
- **Vue.js 3** (Composition API) - Framework principal
- **Pinia** - Gestion d'état réactive
- **Vite** - Build tool rapide
- **Composables** - Logique réutilisable
- **Composants** - Interface modulaire

### Structure de Dossiers

```
gestion-conges/
├── public/                    # Assets statiques
│   ├── icons/                # Icônes PWA
│   └── manifest.json         # Manifest PWA
├── src/
│   ├── assets/               # Images, fonts
│   ├── components/           # Composants Vue
│   │   ├── common/           # Composants réutilisables
│   │   │   ├── Modal.vue
│   │   │   ├── Button.vue
│   │   │   └── Icon.vue
│   │   ├── auth/             # Authentification
│   │   │   ├── LoginForm.vue
│   │   │   └── SignupForm.vue
│   │   ├── calendar/         # Calendrier
│   │   │   ├── Calendar.vue
│   │   │   ├── CalendarDay.vue
│   │   │   ├── YearViewSemester.vue
│   │   │   ├── YearViewPresence.vue
│   │   │   └── YearViewPresenceVertical.vue
│   │   ├── stats/            # Statistiques
│   │   │   ├── StatsCards.vue
│   │   │   └── QuotaCard.vue
│   │   ├── modals/           # Modales
│   │   │   ├── ConfigModal.vue
│   │   │   ├── LeaveTypeModal.vue
│   │   │   ├── TeamsModal.vue
│   │   │   ├── AdminModal.vue
│   │   │   └── HelpModal.vue
│   │   └── header/           # Header
│   │       ├── Header.vue
│   │       └── MenuDropdown.vue
│   ├── composables/          # Logique réutilisable
│   │   ├── useAuth.js
│   │   ├── useLeaves.js
│   │   ├── useLeaveTypes.js
│   │   ├── useStats.js
│   │   ├── useTeams.js
│   │   ├── useAdmin.js
│   │   ├── useDatabase.js
│   │   ├── useTheme.js
│   │   └── usePWA.js
│   ├── stores/               # Stores Pinia
│   │   ├── auth.js
│   │   ├── leaves.js
│   │   ├── leaveTypes.js
│   │   ├── teams.js
│   │   ├── ui.js
│   │   └── admin.js
│   ├── services/             # Services
│   │   ├── supabase.js
│   │   ├── dateUtils.js
│   │   ├── holidays.js
│   │   ├── swalHelper.js
│   │   └── logger.js
│   ├── styles/               # Styles CSS
│   │   ├── main.css
│   │   ├── year-view.css
│   │   ├── year-semester.css
│   │   └── year-presence-vertical.css
│   ├── App.vue               # Composant racine
│   └── main.js               # Point d'entrée
├── index.html                # Template HTML
├── vite.config.js            # Configuration Vite
├── package.json              # Dépendances
└── .env.example              # Variables d'environnement
```

---

## 📝 Plan de Migration par Phases

### **Phase 1 : Setup et Infrastructure** ⏱️ ~2-3h

#### Objectifs
- Initialiser le projet Vue.js
- Configurer Vite et les outils
- Créer la structure de base

#### Tâches
- [ ] Créer branche `vue-migration`
- [ ] Initialiser projet Vue.js avec Vite
- [ ] Configurer `package.json` avec dépendances
- [ ] Configurer `vite.config.js` avec plugin PWA
- [ ] Créer structure de dossiers
- [ ] Migrer assets (icons, manifest.json, styles)
- [ ] Configurer Supabase dans services
- [ ] Créer `App.vue` et `main.js` de base

#### Livrables
- ✅ Projet Vue.js fonctionnel
- ✅ Serveur de développement qui démarre
- ✅ Structure de dossiers complète

---

### **Phase 2 : Services et Utilitaires** ⏱️ ~2-3h

#### Objectifs
- Migrer toutes les fonctions utilitaires
- Créer les services de base

#### Tâches
- [ ] Migrer `js/utils.js` → `src/services/dateUtils.js`
- [ ] Migrer `js/holidays.js` → `src/services/holidays.js`
- [ ] Migrer `js/swalHelper.js` → `src/services/swalHelper.js`
- [ ] Créer `src/services/logger.js`
- [ ] Tester tous les services

#### Livrables
- ✅ Tous les services fonctionnels
- ✅ Tests de validation

---

### **Phase 3 : Stores Pinia** ⏱️ ~4-5h

#### Objectifs
- Créer tous les stores Pinia
- Migrer la gestion d'état

#### Tâches
- [ ] Store `auth.js` - Authentification
- [ ] Store `leaves.js` - Gestion congés
- [ ] Store `leaveTypes.js` - Types de congés
- [ ] Store `teams.js` - Équipes
- [ ] Store `ui.js` - État UI (thème, modales, vues)
- [ ] Store `admin.js` - Administration

#### Livrables
- ✅ Tous les stores créés et testés
- ✅ Gestion d'état réactive fonctionnelle

---

### **Phase 4 : Composables** ⏱️ ~3-4h

#### Objectifs
- Extraire la logique réutilisable
- Créer les composables

#### Tâches
- [ ] `useAuth.js` - Logique authentification
- [ ] `useLeaves.js` - Logique congés
- [ ] `useStats.js` - Calculs statistiques
- [ ] `useTheme.js` - Gestion thème
- [ ] `usePWA.js` - Gestion PWA
- [ ] `useDatabase.js` - Wrapper Supabase

#### Livrables
- ✅ Composables réutilisables
- ✅ Logique découplée des composants

---

### **Phase 5 : Composants UI de Base** ⏱️ ~2-3h

#### Objectifs
- Créer les composants réutilisables
- Établir les patterns de base

#### Tâches
- [ ] `Icon.vue` - Wrapper Lucide Icons
- [ ] `Modal.vue` - Composant modal réutilisable
- [ ] `Button.vue` - Bouton stylisé
- [ ] `Input.vue` - Input stylisé
- [ ] Composants auth (LoginForm, SignupForm)

#### Livrables
- ✅ Composants de base fonctionnels
- ✅ Authentification UI complète

---

### **Phase 6 : Composants Calendrier** ⏱️ ~5-6h

#### Objectifs
- Migrer toutes les vues calendrier
- Conserver toutes les fonctionnalités

#### Tâches
- [ ] `CalendarDay.vue` - Cellule jour
- [ ] `Calendar.vue` - Calendrier principal
- [ ] `YearViewSemester.vue` - Vue semestrielle
- [ ] `YearViewPresence.vue` - Matrice présence horizontale
- [ ] `YearViewPresenceVertical.vue` - Matrice présence verticale
- [ ] `StatsCards.vue` - Cartes statistiques
- [ ] `QuotaCard.vue` - Carte quota

#### Livrables
- ✅ Toutes les vues calendrier migrées
- ✅ Fonctionnalités identiques à l'original

---

### **Phase 7 : Composants Modales** ⏱️ ~4-5h

#### Objectifs
- Migrer toutes les modales
- Conserver l'UX existante

#### Tâches
- [ ] `ConfigModal.vue` - Configuration
- [ ] `LeaveTypeModal.vue` - Sélection type congé
- [ ] `TeamsModal.vue` - Gestion équipes
- [ ] `AdminModal.vue` - Administration
- [ ] `HelpModal.vue` - Aide

#### Livrables
- ✅ Toutes les modales fonctionnelles
- ✅ UX identique à l'original

---

### **Phase 8 : Composants Header et Navigation** ⏱️ ~2h

#### Objectifs
- Migrer le header et la navigation
- Conserver toutes les fonctionnalités

#### Tâches
- [ ] `Header.vue` - Header principal
- [ ] `MenuDropdown.vue` - Menu déroulant
- [ ] `TeamSelector.vue` - Sélecteur d'équipe
- [ ] Intégration thème et full-width

#### Livrables
- ✅ Header et navigation complets
- ✅ Toutes les fonctionnalités préservées

---

### **Phase 9 : App.vue et Intégration** ⏱️ ~3-4h

#### Objectifs
- Intégrer tous les composants
- Finaliser l'application

#### Tâches
- [ ] Créer `App.vue` complet
- [ ] Intégrer tous les composants
- [ ] Gérer les routes/états de navigation
- [ ] Intégrer les stores
- [ ] Configurer `main.js` final

#### Livrables
- ✅ Application complète et fonctionnelle
- ✅ Toutes les fonctionnalités intégrées

---

### **Phase 10 : PWA et Optimisations** ⏱️ ~2h

#### Objectifs
- Migrer le service worker
- Optimiser les performances

#### Tâches
- [ ] Configurer Vite PWA plugin
- [ ] Migrer service worker
- [ ] Tester installation PWA
- [ ] Lazy loading des composants
- [ ] Code splitting

#### Livrables
- ✅ PWA fonctionnelle
- ✅ Application optimisée

---

### **Phase 11 : Tests et Débogage** ⏱️ ~4-5h

#### Objectifs
- Tester toutes les fonctionnalités
- Corriger les bugs

#### Tâches
- [ ] Tests fonctionnels complets
- [ ] Tests visuels (responsive, thème)
- [ ] Correction des bugs
- [ ] Optimisation des performances
- [ ] Amélioration UX si nécessaire

#### Livrables
- ✅ Application testée et déboguée
- ✅ Prête pour la production

---

### **Phase 12 : Déploiement** ⏱️ ~2h

#### Objectifs
- Configurer le build de production
- Mettre à jour le déploiement

#### Tâches
- [ ] Configurer build de production
- [ ] Tester le build local
- [ ] Mettre à jour GitHub Actions
- [ ] Adapter pour Vite
- [ ] Mettre à jour la documentation

#### Livrables
- ✅ Build de production fonctionnel
- ✅ Déploiement automatique configuré
- ✅ Documentation à jour

---

## 🔄 Stratégie de Migration

### Approche : Migration Complète

Nous créerons une nouvelle branche `vue-migration` et migrerons tout en une fois. Cette approche est plus propre et permet de :
- ✅ Garder l'ancien code intact sur `main`
- ✅ Tester complètement avant merge
- ✅ Revenir facilement si nécessaire

### Workflow

1. **Créer branche** `vue-migration`
2. **Migrer phase par phase** avec tests réguliers
3. **Tester complètement** avant merge
4. **Merger dans main** une fois validé

---

## 📦 Dépendances Complètes

```json
{
  "dependencies": {
    "vue": "^3.4.15",
    "pinia": "^2.1.7",
    "@supabase/supabase-js": "^2.39.3",
    "sweetalert2": "^11.10.5",
    "lucide-vue-next": "^0.309.0",
    "date-fns": "^3.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.4",
    "vite": "^5.1.0",
    "vite-plugin-pwa": "^0.17.4"
  }
}
```

---

## ⚠️ Points d'Attention

### 1. Gestion d'État
- **Avant** : Propriétés de classe `LeaveManager`
- **Après** : Stores Pinia avec réactivité

### 2. Manipulation DOM
- **Avant** : `document.getElementById`, `innerHTML`
- **Après** : Templates Vue avec directives

### 3. Event Listeners
- **Avant** : `addEventListener` manuel
- **Après** : `@click`, `@change` dans templates

### 4. Modales
- **Avant** : Affichage/masquage via CSS
- **Après** : Composants conditionnels avec `v-if` ou `Teleport`

### 5. Service Worker
- **Avant** : `sw.js` manuel
- **Après** : Plugin Vite PWA (automatique)

---

## 📊 Estimation Totale

- **Temps estimé** : 30-40 heures
- **Phases critiques** : Phase 3 (Stores), Phase 6 (Calendrier), Phase 9 (Intégration)
- **Risques** : Gestion d'état complexe, migration des vues annuelles

---

## ✅ Checklist Finale

- [ ] Toutes les fonctionnalités migrées
- [ ] Tests passés
- [ ] PWA fonctionnelle
- [ ] Build de production OK
- [ ] Déploiement réussi
- [ ] Documentation à jour
- [ ] Ancien code archivé (tag `v1.0-vanilla-js` ✅)

---

## 🚀 Démarrage

**Prêt à commencer ?**

1. Je crée la branche `vue-migration`
2. Je commence la Phase 1 : Setup et Infrastructure
3. Vous testez après chaque phase
4. On continue phase par phase

**Aucune action de votre part nécessaire pour l'instant !** 🎯

