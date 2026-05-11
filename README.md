# 📅 Gestionnaire de Congés

## 🎯 L'origine du projet

Ce projet est né d'une idée que j'avais en tête depuis longtemps, mais sur laquelle je n'avais jamais vraiment avancé. Depuis 2015, j'utilise Google Sheets avec des tags pour gérer mes congés, et je me suis dit que c'était l'occasion parfaite de tester l'intelligence artificielle pour enfin concrétiser cette idée. Je dois avouer que je suis bluffé par le résultat ! 🤖✨

---

Une application web moderne et responsive pour gérer vos jours de congé avec un calendrier interactif. **Multi-utilisateurs** avec authentification via l’**API NestJS** (JWT) et persistance **PostgreSQL** (Prisma).

## ✨ Fonctionnalités

- 🔐 **Authentification multi-utilisateurs** : Chaque utilisateur a son propre compte et ses propres données
- 📆 **Calendrier interactif** : Naviguez entre les semestres et cliquez sur n'importe quel jour pour ajouter un congé
- 🎨 **Types de congés personnalisables** : 
  - Congé Payé, RTT, Jours Hiver, Maladie, Télétravail, Formation, Grève
  - Créez vos propres types avec couleurs et labels personnalisés
- ⏰ **Demi-journées** : Posez des congés pour le matin ou l'après-midi uniquement
- 📅 **Jours fériés** : Support de 11 pays (FR, BE, CH, CA, US, GB, DE, ES, IT, NL, LU)
- 📊 **Statistiques et quotas** : Suivez vos congés posés et restants par type et par année
- 💾 **Sauvegarde** : Données via l’API NestJS sur PostgreSQL (déploiement ou Docker local)
- 📱 **Responsive** : Fonctionne parfaitement sur ordinateur, tablette et mobile
- 🎯 **Interface moderne** : Design élégant et intuitif
- 📲 **PWA (Progressive Web App)** : Installable comme une app native, fonctionne hors ligne

## 🚀 Installation et configuration

**Guide unique :** **`docs/INSTALL.md`** — Postgres (Docker), fichiers **`.env`** racine vs **`api/.env`**, migrations (`npm run migrate`), `npm run api:dev`, front (`npm run dev`), et **table des scripts npm** à la racine.

| Besoin | Où lire |
|--------|---------|
| Liste des **endpoints** REST | **`docs/guides/API_LOCAL_SETUP.md`** |
| **Docker** seul ou stack complète | **`docker/README.md`** |
| Premier **super-admin** | **`docs/guides/CREATE_FIRST_ADMIN.md`** |
| Déploiement **GitHub Pages** | **`docs/guides/DEPLOY_GITHUB_PAGES.md`** |
| Index des guides | **`docs/guides/README.md`** |
| Notes internes | **`docs/notes/`** |
| Archives | **`docs/archive/README.md`** |

Après installation : front sur **`http://localhost:5173/gestion-conges/`** (base path `/gestion-conges/`).

## 📖 Utilisation

1. **S'inscrire/Se connecter** :
   - Créez un compte avec votre email et mot de passe
   - Ou connectez-vous si vous avez déjà un compte

2. **Ajouter un congé** :
   - Cliquez sur un jour dans le calendrier
   - Choisissez la période (journée complète, matin, après-midi)
   - Sélectionnez le type de congé
   - Le congé est enregistré via l’API

3. **Sélection multiple** :
   - Maintenez **Ctrl** (ou **Cmd** sur Mac) et cliquez sur plusieurs jours
   - Appliquez un congé à tous les jours sélectionnés en une fois

4. **Supprimer un congé** :
   - Cliquez sur un jour qui a déjà un congé
   - Cliquez sur le bouton "Supprimer"

5. **Naviguer entre les semestres** :
   - Utilisez les flèches ◀ et ▶ pour changer de semestre

6. **Configurer** :
   - Cliquez sur ⚙️ pour accéder à la configuration
   - Modifiez les types de congés, quotas, et pays

## 💻 Compatibilité

- ✅ Tous les navigateurs modernes (Chrome, Firefox, Safari, Edge)
- ✅ Windows, macOS, Linux
- ✅ iOS et Android (via navigateur)
- ✅ Peut être installé comme PWA (Progressive Web App) sur mobile

## 📁 Structure des fichiers

```
gestion-conges/
├── index.html              # Point d'entrée HTML (Vite)
├── vite.config.js
├── package.json
├── docker-compose.yml      # Postgres (dev) ; profil `docker` = API + Nginx
├── docker/                 # Nginx, doc d’usage Docker
├── Dockerfile.web          # Image Nginx (build Vite) — profil docker
├── api/                    # Backend NestJS + Prisma (+ Dockerfile)
├── scripts/                # start-dev.*, generate-icons.html
├── docs/                   # INSTALL, guides, notes internes (docs/notes/)
├── public/                 # Fichiers statiques (servis tels quels)
│   ├── 404.html
│   ├── manifest.json       # Manifest PWA
│   └── icons/
├── src/                    # Application Vue.js
│   ├── main.js            # Point d'entrée Vue
│   ├── App.vue            # Composant racine
│   ├── router/            # Configuration Vue Router
│   │   └── index.js
│   ├── stores/            # Stores Pinia
│   │   ├── auth.js        # Authentification
│   │   ├── leaves.js      # Gestion des congés
│   │   ├── leaveTypes.js  # Types de congés
│   │   ├── quotas.js      # Quotas
│   │   ├── teams.js       # Équipes
│   │   └── ui.js          # État UI
│   ├── components/        # Composants Vue
│   │   ├── admin/         # Administration
│   │   ├── auth/          # Authentification
│   │   ├── calendar/      # Calendrier
│   │   ├── common/        # Composants réutilisables
│   │   ├── header/        # En-tête
│   │   ├── modals/        # Modales
│   │   └── stats/         # Statistiques
│   ├── composables/       # Composables Vue (hooks)
│   ├── services/          # Client API, utilitaires
│   ├── styles/            # Styles CSS
│   ├── utils/             # Utilitaires
│   ├── plugins/           # Plugins Vue
│   └── i18n/              # Internationalisation
├── .github/workflows/      # Workflows GitHub Actions
│   └── deploy.yml         # Déploiement automatique
├── .env.example            # Exemple de variables d'environnement
├── docs/archive/            # Documentation et SQL historiques (non requis pour Nest + Prisma)
└── README.md               # Ce fichier
```

## 🔧 Installation comme PWA (Progressive Web App)

L'application est maintenant une **PWA complète** et peut être installée sur votre appareil !

### Fonctionnalités PWA

- ✅ **Installation native** : Installez l'app sur votre téléphone, tablette ou ordinateur
- ✅ **Mode hors ligne** : Fonctionne même sans connexion internet (lecture seule)
- ✅ **Icône sur l'écran d'accueil** : Accès rapide à l'application
- ✅ **Mises à jour automatiques** : Notification quand une nouvelle version est disponible
- ✅ **Expérience native** : S'ouvre en plein écran, sans barre d'adresse

### Comment installer

**Sur mobile (Android/iPhone) :**
1. Ouvrez l'application dans votre navigateur
2. Un bouton "📱 Installer l'app" apparaîtra automatiquement (ou utilisez le menu du navigateur)
3. Suivez les instructions pour installer
4. L'app apparaîtra sur votre écran d'accueil

**Sur ordinateur (Chrome/Edge) :**
1. Ouvrez l'application dans Chrome ou Edge
2. Cliquez sur l'icône d'installation dans la barre d'adresse (ou menu > Installer l'application)
3. L'app s'ouvrira dans une fenêtre dédiée

**Note :** Pour générer les icônes PWA, ouvrez **`scripts/generate-icons.html`** dans le navigateur, puis placez les fichiers dans **`public/icons/`** (voir `scripts/README.md`).

## 🛠️ Outils et Technologies

### Frontend
- **Vue.js 3** : Framework JavaScript (Composition API)
- **Vite** : Build tool et serveur de développement
- **Vue Router** : Routage côté client
- **Pinia** : Gestion d'état
- **Headless UI Vue** : Composants UI accessibles
- **VeeValidate** : Validation de formulaires
- **Vue I18n** : Internationalisation
- **AutoAnimate** : Animations automatiques
- **VueUse** : Collection de composables utilitaires
- **VueDatePicker** : Sélecteur de dates

### Backend & base de données
- **NestJS** : API REST (`api/`)
- **PostgreSQL** : base relationnelle (Docker local ou hébergeur)
- **Prisma** : ORM, migrations et client typé (`api/prisma/`)

### Déploiement & CI/CD
- **GitHub Pages** : Hébergement de l'application
- **GitHub Actions** : Déploiement automatique sur GitHub Pages
- **Git** : Contrôle de version

### Outils de développement
- **Cursor** : Éditeur de code avec IA intégrée
  - Éditeur basé sur VS Code avec des fonctionnalités d'IA avancées
  - Aide au développement avec suggestions de code intelligentes
  - Utilisé pour le développement et la maintenance de ce projet
- **GitHub** : Hébergement du code source et gestion des secrets
- **Prisma Studio** (`cd api && npx prisma studio`) : exploration des tables PostgreSQL

### Bibliothèques externes
- **@nestjs/core** + écosystème Nest : API REST
- **@prisma/client** : accès base de données
- **SweetAlert2** : Modales et notifications
- **date-fns** : Manipulation de dates

## 💡 Notes techniques

- **Backend** : NestJS + Prisma sur PostgreSQL
- **Authentification** : JWT (access + refresh), voir module `api/src/auth/`
- **Sécurité** : contrôle d’accès côté API (guards, relations utilisateur)
- **Schéma** : défini dans `api/prisma/schema.prisma`, migrations dans `api/prisma/migrations/`

## 🗄️ Base de données

Le modèle relationnel est celui de **Prisma** (`User`, `Leave`, `GlobalLeaveType`, quotas, équipes, etc.). Pour appliquer le schéma : **`npm run migrate`** à la racine (équivalent `prisma migrate deploy` dans `api/`). D’anciens fichiers SQL éventuels sont rangés sous **`docs/archive/`** (voir `docs/archive/README.md`).

## 🎨 Personnalisation

Vous pouvez facilement personnaliser :
- Les couleurs dans `styles.css` (variables CSS `:root`)
- Les types de congés via l'interface de configuration (⚙️)
- Les quotas par type et par année
- Le pays pour les jours fériés

## 🔒 Sécurité

- **Clés API** : Stockées dans GitHub Secrets (production) ou `.env` (développement local, non versionné)
- **Autorisations** : appliquées dans les services Nest (JWT + ownership des ressources)
- **Authentification** : JWT émis par l’API Nest (access + refresh)
- **Mots de passe** : Hashés (jamais stockés en clair)
- **Variables d'environnement** : Gérées via Vite pour un accès sécurisé aux clés API

## 🚀 Déploiement

### GitHub Pages avec GitHub Actions

Le workflow **`.github/workflows/deploy.yml`** construit le front et publie le dossier `dist/`. Il attend un secret dépôt :

- **`VITE_API_URL`** : URL HTTPS de ton **API Nest** (ex. `https://api.mondomaine.com`).

L’API doit être hébergée séparément et accepter les requêtes depuis ton domaine Pages (**CORS**). Détail pas à pas : **`docs/guides/DEPLOY_GITHUB_PAGES.md`**.

### Autres hébergeurs (Vercel, Netlify, etc.)

Même principe : variable d’environnement **`VITE_API_URL`** au build, plus hébergement de l’API et CORS.

## 📝 Licence

Libre d'utilisation pour usage personnel.

---

**Profitez de votre gestionnaire de congés multi-utilisateurs ! 🎉**

