# 📅 Gestionnaire de Congés

## 🎯 L'origine du projet

Ce projet est né d'une idée que j'avais en tête depuis longtemps, mais sur laquelle je n'avais jamais vraiment avancé. Depuis 2015, j'utilise Google Sheets avec des tags pour gérer mes congés, et je me suis dit que c'était l'occasion parfaite de tester l'intelligence artificielle pour enfin concrétiser cette idée. Je dois avouer que je suis bluffé par le résultat ! 🤖✨

---

Une application web moderne et responsive pour gérer vos jours de congé avec un calendrier interactif. **Multi-utilisateurs** avec authentification via l’**API NestJS** (JWT access + refresh) et persistance **PostgreSQL** (Prisma).

## ✨ Fonctionnalités

- 🔐 **Authentification multi-utilisateurs** : compte par utilisateur, données isolées côté API
- 📆 **Vues calendrier** : navigation par **année** ; **vue annuelle** (colonnes par mois) ou **matrice de présence** (par équipe, vue synthétique)
- 👥 **Équipes** : équipes, membres et invitations (partage de contexte pour la matrice de présence)
- 🎨 **Types de congés** : types globaux (congé payé, RTT, télétravail, etc.) et **personnalisation** des couleurs par utilisateur
- ⏰ **Demi-journées** : matin ou après-midi
- 🔁 **Événements récurrents** : règles de récurrence et application sur une plage de dates
- 🔔 **Notifications** : panneau de notifications côté utilisateur
- 📅 **Jours fériés** : plusieurs pays (ex. FR, BE, CH, CA, US, GB, DE, ES, IT, NL, LU)
- 📊 **Statistiques et quotas** : suivi par type et par année
- 🛡️ **Administration (comptes admin)** : **`/admin`** — onglets Utilisateurs, Équipes, Types de congés, Paramètres, Statistiques, Logs d’audit
- 💾 **Données** : API NestJS + PostgreSQL (local Docker ou hébergement distant)
- 📱 **Responsive** : ordinateur, tablette et mobile
- 📲 **PWA** : installable (**standalone**), mise à jour du **service worker** en production ; les **données métier** passent par l’API et nécessitent en général une connexion réseau

## 🚀 Installation et configuration

**Guide unique :** **`docs/INSTALL.md`** — Postgres (Docker), fichiers **`.env`** racine vs **`api/.env`**, migrations (`npm run migrate`, `migrate:dev`), réinitialisation dev (`npm run db:reset` si besoin), `npm run api:dev`, front (`npm run dev`), **table des scripts npm**. **Mémo démarrage :** **`docs/MEMO_DEMARRAGE.md`**

| Besoin | Où lire |
|--------|---------|
| Liste des **endpoints** REST | **`docs/guides/API_LOCAL_SETUP.md`** |
| **Docker** seul ou stack complète | **`docker/README.md`** |
| Premier **super-admin** | **`docs/guides/CREATE_FIRST_ADMIN.md`** |
| **CI/CD** (Actions, deploy SSH) | **`docs/guides/CICD_SETUP.md`** |
| Index des guides | **`docs/guides/README.md`** |
| Notes internes | **`docs/notes/`** |
| Archives | **`docs/archive/README.md`** |

Après installation : front sur **`http://localhost:5173/`** (base Vite **`/`**). Déploiement production : **`docker/README.md`** (stack Docker) ou build Vite + hébergeur statique avec **`VITE_API_URL`**.

## 📖 Utilisation

1. **S'inscrire / se connecter** : email et mot de passe (compte dédié).

2. **Choisir le format d’affichage** : vue **annuelle** ou **matrice de présence** (sélecteur dans l’en-tête) ; pour la matrice, sélection d’**équipe** si besoin.

3. **Ajouter un congé** : cliquer sur un jour → période (journée, matin, après-midi) → type de congé → enregistrement via l’API.

4. **Événements récurrents** : création via le flux prévu dans l’interface (modale dédiée).

5. **Sélection multiple** : **Ctrl** (ou **Cmd** sur Mac) + plusieurs jours, puis application d’un type en lot.

6. **Supprimer** : jour déjà renseigné → action supprimer dans la modale.

7. **Navigation** : flèches ◀ / ▶ pour changer d’**année**.

8. **Configurer** : ⚙️ — types, quotas, pays des jours fériés, équipes, etc.

9. **Administration** : réservé aux comptes **admin** — route **`/admin`** (voir **`docs/guides/CREATE_FIRST_ADMIN.md`**).

## 💻 Compatibilité

- Navigateurs modernes (Chrome, Firefox, Safari, Edge)
- Windows, macOS, Linux
- iOS et Android (navigateur ou **PWA installée**)

## 📁 Structure des fichiers

```
gestion-conges/
├── index.html              # Point d'entrée HTML (Vite)
├── vite.config.js          # base `/` ; vite-plugin-pwa
├── package.json
├── docker-compose.yml      # Postgres (dev) ; profil `docker` = API + Nginx + web
├── .env.docker.example     # Modèle LAN / VM pour DOCKER_* (copier vers .env.docker)
├── docker/                 # Nginx, doc Docker
├── Dockerfile.web          # Image Nginx (build Vite) — profil docker
├── api/                    # Backend NestJS + Prisma (+ Dockerfile)
├── scripts/                # start-dev.*, generate-icons.html, README
├── docs/                   # INSTALL, guides, notes (docs/notes/)
├── public/                 # Statiques (manifest.json de réf., icons/)
├── src/
│   ├── main.js
│   ├── App.vue
│   ├── router/index.js     # / , /admin (garde admin)
│   ├── stores/             # Pinia : auth, leaves, leaveTypes, quotas, teams,
│   │                       # ui, recurringEvents, notifications
│   ├── components/
│   │   ├── admin/          # Administration (super-admin)
│   │   ├── auth/
│   │   ├── calendar/       # Calendrier, vues annuelle / présence
│   │   ├── common/
│   │   ├── header/
│   │   ├── menu/
│   │   ├── modals/
│   │   ├── notifications/
│   │   └── stats/
│   ├── composables/
│   ├── services/           # API client, dates, jours fériés, récurrence…
│   ├── styles/             # main.css, year-view.css, year-presence-vertical.css
│   ├── utils/
│   ├── plugins/
│   └── i18n/
├── .env.example
├── docs/archive/
└── README.md
```

## 🔧 Installation comme PWA (Progressive Web App)

L’application peut être **installée** sur téléphone, tablette ou poste (expérience **standalone**, icône d’accueil). Le build utilise **`vite-plugin-pwa`** : précache des **assets statiques** (JS, CSS, HTML, images) et stratégie **`autoUpdate`** pour le service worker après déploiement.

### À nuancer

- **Données** : congés, auth, équipes passent par l’**API** ; sans réseau, l’interface peut être servie depuis le cache du navigateur, mais **pas** d’usage métier complet hors ligne comme une app native hors connexion.
- **Mises à jour** : nouvelle version du site = nouveau SW ; le comportement exact dépend du navigateur (pas forcément une notification dédiée au sens « alerte utilisateur »).

### Comment installer

**Mobile :** ouvrir le site dans le navigateur → menu du navigateur ou invite « Ajouter à l’écran d’accueil » selon l’OS.

**Chrome / Edge (desktop) :** icône d’installation dans la barre d’adresses ou menu « Installer l’application ».

**Icônes** : générateur **`scripts/generate-icons.html`** → fichiers dans **`public/icons/`** (voir **`scripts/README.md`**).

## 🛠️ Outils et Technologies

### Frontend

- **Vue.js 3** (Composition API)
- **Vite** + **vite-plugin-pwa**
- **Vue Router**, **Pinia**
- **Headless UI Vue**, **VeeValidate**, **Yup**
- **Vue I18n**, **AutoAnimate**, **VueUse**, **VueDatePicker**, **Lucide Vue Next**, **SweetAlert2**, **date-fns**

### Backend et base de données

- **NestJS** (`api/`)
- **PostgreSQL**
- **Prisma** (`api/prisma/` — dont par exemple `User`, `Leave`, `Team`, `RecurringEvent`, `Notification`, `AppSetting`, `AuditLog`, quotas…)

### Développement

- **Prisma Studio** : `npm run prisma:studio` à la racine (voir **`docs/INSTALL.md`**)

## 💡 Notes techniques

- **Auth** : JWT (access + refresh), module **`api/src/auth/`**
- **Autorisations** : guards Nest, ownership des ressources ; rôles **admin** pour `/admin`
- **Schéma** : **`api/prisma/schema.prisma`**, migrations **`api/prisma/migrations/`**

## 🗄️ Base de données

Modèle **Prisma** sur PostgreSQL. Application du schéma : **`npm run migrate`** (deploy). En développement, après changement de schéma : **`npm run migrate:dev`** ; en cas d’incohérence locale : **`npm run db:reset`** (destructif — voir **`docs/INSTALL.md`**). Anciens artefacts SQL éventuels : **`docs/archive/`**.

## 🎨 Personnalisation

- Variables et styles globaux : **`src/styles/main.css`** (et fichiers **`year-view.css`**, **`year-presence-vertical.css`** selon les vues)
- Types de congés et quotas : interface ⚙️
- Pays des jours fériés : configuration utilisateur

## 🔒 Sécurité

- Secrets : GitHub Actions / **`.env`** non versionné
- API : JWT, validation, contrôle d’accès dans les services
- Mots de passe : hashés côté serveur

## 🚀 Déploiement

- **Docker (recommandé)** : profil `docker` dans `docker-compose.yml` — voir **`docker/README.md`**
- **Front statique ailleurs** : `npm run build` avec **`VITE_API_URL`** pointant vers l’API Nest en HTTPS ; configurer **CORS** côté API pour l’origine du site

## 📝 Licence

Libre d'utilisation pour usage personnel.

---

**Bon courage avec votre gestionnaire de congés multi-utilisateurs ! 🎉**
