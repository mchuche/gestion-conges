# 📅 Gestionnaire de Congés

Une application web moderne et responsive pour gérer vos jours de congé avec un calendrier interactif. **Multi-utilisateurs avec authentification Supabase**.

## ✨ Fonctionnalités

- 🔐 **Authentification multi-utilisateurs** : Chaque utilisateur a son propre compte et ses propres données
- 📆 **Calendrier interactif** : Naviguez entre les semestres et cliquez sur n'importe quel jour pour ajouter un congé
- 🎨 **Types de congés personnalisables** : 
  - Congé Payé, RTT, Jours Hiver, Maladie, Télétravail, Formation, Grève
  - Créez vos propres types avec couleurs et labels personnalisés
- ⏰ **Demi-journées** : Posez des congés pour le matin ou l'après-midi uniquement
- 📅 **Jours fériés** : Support de 11 pays (FR, BE, CH, CA, US, GB, DE, ES, IT, NL, LU)
- 📊 **Statistiques et quotas** : Suivez vos congés posés et restants par type et par année
- 💾 **Sauvegarde cloud** : Toutes vos données sont sauvegardées dans Supabase (base de données PostgreSQL)
- 📱 **Responsive** : Fonctionne parfaitement sur ordinateur, tablette et mobile
- 🎯 **Interface moderne** : Design élégant et intuitif
- 📲 **PWA (Progressive Web App)** : Installable comme une app native, fonctionne hors ligne
- 📲 **PWA (Progressive Web App)** : Installable comme une app native, fonctionne hors ligne

## 🚀 Installation et Configuration

### Prérequis

1. **Créer un compte Supabase** (gratuit) : https://supabase.com
2. **Créer un projet Supabase** et récupérer vos clés API

### Configuration

1. **Créer les tables dans Supabase** :
   - Allez dans SQL Editor dans votre projet Supabase
   - Exécutez le script SQL fourni (voir section "Base de données" ci-dessous)

2. **Configurer les clés API** :

   **Pour le développement local :**
   - Exécutez `setup-local.bat` (Windows) ou `./setup-local.sh` (Linux/Mac)
   - Modifiez `config.js` avec vos clés Supabase
   - ⚠️ **Ne commitez JAMAIS `config.js` dans Git** (déjà dans `.gitignore`)

   **Pour GitHub Pages :**
   - Configurez les secrets GitHub (voir section "Déploiement")
   - Le fichier `config.js` sera généré automatiquement lors du déploiement

3. **Ouvrir l'application** :
   - Ouvrez `index.html` dans votre navigateur
   - Ou servez via un serveur web local (recommandé)

## 📖 Utilisation

1. **S'inscrire/Se connecter** :
   - Créez un compte avec votre email et mot de passe
   - Ou connectez-vous si vous avez déjà un compte

2. **Ajouter un congé** :
   - Cliquez sur un jour dans le calendrier
   - Choisissez la période (journée complète, matin, après-midi)
   - Sélectionnez le type de congé
   - Le congé sera automatiquement sauvegardé dans Supabase

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
├── index.html              # Structure HTML avec authentification
├── styles.css              # Styles et design responsive
├── js/                     # Modules JavaScript modulaires
│   ├── supabase-init.js   # Initialisation Supabase
│   ├── utils.js           # Fonctions utilitaires
│   ├── holidays.js         # Calcul des jours fériés
│   ├── database.js         # Opérations Supabase
│   ├── auth.js             # Authentification
│   ├── calendar.js         # Rendu du calendrier
│   ├── stats.js            # Statistiques et quotas
│   ├── modals.js           # Gestion des modales
│   ├── config.js           # Configuration des événements
│   └── leaveManager.js     # Classe principale
├── config.js.example       # Exemple de configuration
├── config.js               # Configuration Supabase (généré par GitHub Actions ou créé localement)
├── .github/workflows/      # Workflows GitHub Actions
│   └── deploy.yml         # Déploiement automatique
├── setup-local.sh          # Script de configuration locale (Linux/Mac)
├── setup-local.bat         # Script de configuration locale (Windows)
├── .gitignore              # Fichiers à ignorer (inclut config.js)
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

**Note :** Pour générer les icônes nécessaires, ouvrez `generate-icons.html` dans votre navigateur et cliquez sur "Télécharger toutes les icônes", puis placez-les dans le dossier `icons/`.

## 🛠️ Outils et Technologies

### Frontend
- **HTML5** : Structure de l'application
- **CSS3** : Styles et design responsive avec variables CSS
- **JavaScript (ES6+)** : Logique de l'application, modules ES6
- **Vanilla JS** : Pas de framework, JavaScript pur pour la performance

### Backend & Base de données
- **Supabase** : Backend as a Service (BaaS)
  - **PostgreSQL** : Base de données relationnelle
  - **Supabase Auth** : Authentification et gestion des utilisateurs
  - **Row Level Security (RLS)** : Sécurité au niveau des lignes
  - **API REST automatique** : Générée automatiquement par Supabase

### Déploiement & CI/CD
- **GitHub Pages** : Hébergement de l'application
- **GitHub Actions** : Déploiement automatique et génération de `config.js`
- **Git** : Contrôle de version

### Outils de développement
- **Cursor** : Éditeur de code avec IA intégrée
  - Éditeur basé sur VS Code avec des fonctionnalités d'IA avancées
  - Aide au développement avec suggestions de code intelligentes
  - Utilisé pour le développement et la maintenance de ce projet
- **GitHub** : Hébergement du code source et gestion des secrets
- **Supabase Dashboard** : Interface d'administration de la base de données

### Bibliothèques externes
- **@supabase/supabase-js** (v2) : Client JavaScript officiel pour Supabase
  - Chargé via CDN : `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2`

## 💡 Notes techniques

- **Backend** : Supabase (PostgreSQL + API REST automatique)
- **Authentification** : Supabase Auth (sécurisé, avec gestion de sessions)
- **Base de données** : PostgreSQL avec Row Level Security (RLS)
- **Sécurité** : Chaque utilisateur ne peut voir/modifier que ses propres données
- **Synchronisation** : Les données sont synchronisées en temps réel via Supabase

## 🗄️ Base de données

L'application utilise 4 tables dans Supabase :

- `leaves` : Stocke les congés posés (date_key, leave_type_id)
- `leave_types` : Types de congés personnalisables par utilisateur
- `leave_quotas` : Quotas de congés par type et par année
- `user_preferences` : Préférences utilisateur (pays sélectionné, etc.)

**Script SQL** : Exécutez le script SQL fourni dans Supabase > SQL Editor pour créer les tables et les politiques de sécurité (RLS).

## 🎨 Personnalisation

Vous pouvez facilement personnaliser :
- Les couleurs dans `styles.css` (variables CSS `:root`)
- Les types de congés via l'interface de configuration (⚙️)
- Les quotas par type et par année
- Le pays pour les jours fériés

## 🔒 Sécurité

- **Clés API** : Stockées dans GitHub Secrets (production) ou `config.js` (développement local, non versionné)
- **Row Level Security (RLS)** : Activé - chaque utilisateur ne voit que ses données
- **Authentification** : Sécurisée via Supabase Auth
- **Mots de passe** : Hashés (jamais stockés en clair)
- **GitHub Actions** : Génère `config.js` automatiquement à partir des secrets lors du déploiement

## 🚀 Déploiement

### GitHub Pages avec GitHub Actions (Recommandé)

Cette méthode utilise GitHub Secrets pour stocker vos clés Supabase de manière sécurisée. Le fichier `config.js` est généré automatiquement lors du déploiement.

#### 1. Configurer les secrets GitHub

1. Allez dans votre dépôt GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. Cliquez sur **New repository secret** et ajoutez :
   - **Nom** : `SUPABASE_URL`
   - **Valeur** : Votre URL Supabase (ex: `https://xxxxx.supabase.co`)
4. Ajoutez un second secret :
   - **Nom** : `SUPABASE_ANON_KEY`
   - **Valeur** : Votre clé anonyme Supabase

#### 2. Activer GitHub Pages

1. Allez dans **Settings** → **Pages**
2. Sous **Source**, sélectionnez **GitHub Actions**
3. Le workflow `.github/workflows/deploy.yml` sera utilisé automatiquement

#### 3. Déployer

1. Poussez votre code sur la branche `main`
2. Le workflow GitHub Actions se déclenchera automatiquement
3. Le fichier `config.js` sera créé à partir des secrets
4. Votre site sera déployé sur GitHub Pages

#### 4. Vérifier le déploiement

- Allez dans l'onglet **Actions** de votre dépôt pour voir le statut du déploiement
- Une fois terminé, votre site sera accessible à `https://votre-username.github.io/gestion-conges`

### Développement local

Pour développer localement :

**Windows :**
```bash
setup-local.bat
```

**Linux/Mac :**
```bash
chmod +x setup-local.sh
./setup-local.sh
```

Puis modifiez `config.js` avec vos clés Supabase.

### Alternative : Vercel/Netlify

Pour un déploiement sur Vercel ou Netlify :
- Utilisez les variables d'environnement au lieu de `config.js`
- Plus sécurisé pour la production
- Configuration similaire avec leurs interfaces respectives

## 📝 Licence

Libre d'utilisation pour usage personnel.

---

**Profitez de votre gestionnaire de congés multi-utilisateurs ! 🎉**

