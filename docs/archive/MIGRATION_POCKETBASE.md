# [ARCHIVE] Guide de migration entre anciens backends

> **Emplacement** : `docs/archive/MIGRATION_POCKETBASE.md` — **ne pas suivre** pour l’app actuelle.
>
> **Stack actuelle** : **NestJS + PostgreSQL + Prisma** (`api/`, voir `docs/guides/API_LOCAL_SETUP.md`). Ce fichier documente d’anciennes étapes (BaaS / backends légers) ; les binaires, dossiers et clients associés ne font plus partie du dépôt.

## 📋 Table des matières

1. [Introduction](#introduction)
2. [Prérequis](#prérequis)
3. [Installation de PocketBase](#installation-de-pocketbase)
4. [Migration du schéma de base de données](#migration-du-schéma-de-base-de-données)
5. [Migration du code](#migration-du-code)
6. [Migration de l'authentification](#migration-de-lauthentification)
7. [Migration du Realtime](#migration-du-realtime)
8. [Tests et validation](#tests-et-validation)
9. [Déploiement](#déploiement)
10. [Checklist de migration](#checklist-de-migration)

---

## Introduction

### Qu'est-ce que PocketBase ?

**PocketBase** est un backend open-source léger qui fournit :
- ✅ **Base de données SQLite** intégrée (fichier unique)
- ✅ **API REST automatique** (similaire à Supabase)
- ✅ **Authentification** complète (email/password, OAuth)
- ✅ **Realtime** (WebSockets)
- ✅ **Interface admin** intégrée
- ✅ **Un seul exécutable** (~10MB)

### Comparaison Supabase vs PocketBase

| Fonctionnalité | Supabase | PocketBase |
|----------------|----------|------------|
| **Base de données** | PostgreSQL (cloud) | SQLite (local) |
| **Taille** | ~500MB+ (Docker) | ~10MB (exécutable) |
| **Installation** | Docker compose | Un seul fichier |
| **API REST** | ✅ Automatique | ✅ Automatique |
| **Auth** | ✅ Complète | ✅ Complète |
| **Realtime** | ✅ WebSockets | ✅ WebSockets |
| **RLS** | ✅ Row Level Security | ⚠️ Via règles de collection |
| **Fonctions SQL** | ✅ RPC | ⚠️ Via hooks JavaScript |
| **Gratuit** | ✅ (limité) | ✅ Open-source |

### Avantages de PocketBase

- 🚀 **Très léger** : Un seul exécutable, pas de Docker nécessaire
- 💾 **SQLite** : Fichier unique, facile à sauvegarder
- 🎯 **Simple** : Interface admin intégrée, pas de configuration complexe
- 🔒 **Sécurisé** : Règles de collection pour remplacer RLS
- 📦 **Portable** : Copiez le fichier, c'est tout

### Inconvénients

- ⚠️ **SQLite** : Limites de concurrence (max ~1000 connexions simultanées)
- ⚠️ **Pas de PostgreSQL** : Migration du schéma nécessaire
- ⚠️ **Moins de fonctionnalités** : Pas de fonctions SQL complexes (RPC)
- ⚠️ **Communauté plus petite** : Moins de ressources que Supabase

---

## Prérequis

- ✅ Node.js 18+ installé
- ✅ Connaissance de base de SQL
- ✅ Accès au code source du projet
- ✅ Backup de votre base Supabase actuelle

---

## Installation de PocketBase

### 1. Télécharger PocketBase

**Windows :**
```powershell
# Télécharger depuis https://pocketbase.io/docs/
# Ou utiliser winget
winget install pocketbase
```

**Linux/Mac :**
```bash
# Télécharger depuis https://pocketbase.io/docs/
# Ou utiliser Homebrew (Mac)
brew install pocketbase
```

### 2. Démarrer PocketBase

```bash
# Créer un dossier pour PocketBase
mkdir pocketbase
cd pocketbase

# Démarrer PocketBase (crée la base de données automatiquement)
./pocketbase serve

# Ou sur Windows
pocketbase.exe serve
```

PocketBase sera accessible sur `http://127.0.0.1:8090`

### 3. Configuration initiale

1. Ouvrir `http://127.0.0.1:8090/_/` dans votre navigateur
2. Créer le premier admin (email + mot de passe)
3. L'interface admin s'ouvre automatiquement

### 4. Récupérer les clés API

Dans l'interface admin :
- **Settings** → **API Settings**
- Copier l'**API URL** (ex: `http://127.0.0.1:8090/api`)
- Créer une clé API si nécessaire (pour les requêtes server-side)

---

## Migration du schéma de base de données

### Concepts de migration

**Supabase (PostgreSQL)** → **PocketBase (SQLite)**

| Supabase | PocketBase |
|----------|------------|
| `TABLE` | `Collection` |
| `COLUMN` | `Field` |
| `RLS POLICY` | `Collection Rule` |
| `FUNCTION` | `Hook JavaScript` |
| `VIEW` | ⚠️ Non supporté (utiliser des requêtes) |

### Étape 1 : Créer les collections

Dans l'interface admin PocketBase, créer les collections suivantes :

#### Collection : `app_admins`
- **Fields :**
  - `user_id` (relation → `users`)
  - `role` (text, options: `admin`, `super_admin`)
  - `created_by` (relation → `users`, optionnel)
  - `created_at` (date)

#### Collection : `app_settings`
- **Fields :**
  - `key` (text, unique)
  - `value` (json)
  - `description` (text, optionnel)
  - `updated_by` (relation → `users`, optionnel)
  - `updated_at` (date)

#### Collection : `global_leave_types`
- **Fields :**
  - `id` (text, unique) - **Important : utiliser `id` comme clé primaire text**
  - `name` (text)
  - `label` (text)
  - `category` (text, options: `leave`, `event`)

#### Collection : `leave_types`
- **Fields :**
  - `user_id` (relation → `users`)
  - `global_type_id` (relation → `global_leave_types`)
  - `color` (text, default: `#4a90e2`)
  - `created_at` (date)
  - `updated_at` (date)

#### Collection : `leaves`
- **Fields :**
  - `user_id` (relation → `users`)
  - `date_key` (text) - Format: `YYYY-MM-DD` ou `YYYY-MM-DD-period`
  - `leave_type_id` (relation → `global_leave_types`)
  - `created_at` (date)
  - `updated_at` (date)

#### Collection : `leave_quotas`
- **Fields :**
  - `user_id` (relation → `users`)
  - `leave_type_id` (relation → `global_leave_types`)
  - `year` (number)
  - `quota` (number)
  - `created_at` (date)
  - `updated_at` (date)

#### Collection : `teams`
- **Fields :**
  - `name` (text)
  - `description` (text, optionnel)
  - `parent_id` (relation → `teams`, optionnel) - **Auto-relation**
  - `created_by` (relation → `users`)
  - `created_at` (date)
  - `updated_at` (date)

#### Collection : `team_members`
- **Fields :**
  - `team_id` (relation → `teams`)
  - `user_id` (relation → `users`)
  - `role` (text, options: `owner`, `admin`, `member`)
  - `invited_by` (relation → `users`, optionnel)
  - `joined_at` (date)

#### Collection : `team_invitations`
- **Fields :**
  - `team_id` (relation → `teams`)
  - `email` (email)
  - `invited_by` (relation → `users`)
  - `status` (text, options: `pending`, `accepted`, `declined`)
  - `created_at` (date)
  - `accepted_at` (date, optionnel)

#### Collection : `notifications`
- **Fields :**
  - `user_id` (relation → `users`)
  - `type` (text)
  - `title` (text)
  - `message` (text)
  - `read` (bool, default: `false`)
  - `read_at` (date, optionnel)
  - `data` (json, optionnel)
  - `created_at` (date)

#### Collection : `recurring_events`
- **Fields :**
  - `user_id` (relation → `users`, optionnel)
  - `team_id` (relation → `teams`, optionnel)
  - `leave_type_id` (relation → `global_leave_types`)
  - `title` (text)
  - `description` (text, optionnel)
  - `recurrence_rule` (text) - Format iCal RRULE
  - `start_date` (date)
  - `end_date` (date, optionnel)
  - `created_at` (date)
  - `updated_at` (date)

#### Collection : `user_preferences`
- **Fields :**
  - `user_id` (relation → `users`, unique)
  - `country` (text, default: `FR`)
  - `week_start_day` (number, default: `1`)
  - `theme_mode` (text, options: `light`, `dark`, `auto`)
  - `full_width` (bool, default: `false`)
  - `created_at` (date)
  - `updated_at` (date)

### Étape 2 : Configurer les règles de collection (remplacer RLS)

Pour chaque collection, configurer les règles dans **Settings** → **Collection Rules** :

#### Exemple : Collection `leaves`

**Rule : View (List/Single)**
```javascript
@request.auth.id != "" && @request.auth.id = user_id
```

**Rule : Create**
```javascript
@request.auth.id != "" && @request.auth.id = user_id
```

**Rule : Update**
```javascript
@request.auth.id != "" && @request.auth.id = user_id
```

**Rule : Delete**
```javascript
@request.auth.id != "" && @request.auth.id = user_id
```

#### Exemple : Collection `teams`

**Rule : View (List/Single)**
```javascript
@request.auth.id != "" && (
  created_by = @request.auth.id ||
  id in (
    select team_id from team_members where user_id = @request.auth.id
  )
)
```

**Rule : Create**
```javascript
@request.auth.id != "" && created_by = @request.auth.id
```

**Rule : Update**
```javascript
@request.auth.id != "" && (
  created_by = @request.auth.id ||
  id in (
    select team_id from team_members 
    where user_id = @request.auth.id 
    and role in ('owner', 'admin')
  )
)
```

### Étape 3 : Migrer les données (optionnel)

Si vous avez des données existantes dans Supabase :

1. Exporter les données depuis Supabase (CSV ou SQL)
2. Importer dans PocketBase via l'interface admin ou l'API
3. Vérifier les relations (user_id, team_id, etc.)

---

## Migration du code

### Étape 1 : Installer le client PocketBase

```bash
npm install pocketbase
```

### Étape 2 : Créer le service PocketBase

Créer `src/services/pocketbase.js` :

```javascript
import PocketBase from 'pocketbase'

const pocketbaseUrl = import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090'

if (!pocketbaseUrl) {
  console.error('❌ Variable d\'environnement VITE_POCKETBASE_URL manquante')
}

// Créer l'instance PocketBase
export const pb = new PocketBase(pocketbaseUrl)

// Configurer le storage pour la persistance de session
if (typeof window !== 'undefined') {
  pb.authStore.onChange((token, model) => {
    // Sauvegarder la session dans localStorage
    if (model) {
      localStorage.setItem('pocketbase_auth', JSON.stringify({
        token,
        model
      }))
    } else {
      localStorage.removeItem('pocketbase_auth')
    }
  })

  // Restaurer la session au démarrage
  const savedAuth = localStorage.getItem('pocketbase_auth')
  if (savedAuth) {
    try {
      const { token, model } = JSON.parse(savedAuth)
      pb.authStore.save(token, model)
    } catch (e) {
      console.warn('Erreur lors de la restauration de la session:', e)
    }
  }
}

export default pb
```

### Étape 3 : Mettre à jour `.env`

```env
# Remplacer
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...

# Par
VITE_POCKETBASE_URL=http://127.0.0.1:8090
```

### Étape 4 : Adapter les requêtes

#### Avant (Supabase) :
```javascript
const { data, error } = await supabase
  .from('leaves')
  .select('*')
  .eq('user_id', userId)
```

#### Après (PocketBase) :
```javascript
const records = await pb.collection('leaves').getFullList({
  filter: `user_id = "${userId}"`
})
```

#### Mapping des méthodes courantes :

| Supabase | PocketBase |
|----------|------------|
| `.from('table')` | `.collection('table')` |
| `.select('*')` | `.getFullList()` ou `.getList()` |
| `.eq('field', value)` | `filter: 'field = "value"'` |
| `.insert({...})` | `.create({...})` |
| `.update({...})` | `.update(id, {...})` |
| `.delete()` | `.delete(id)` |
| `.single()` | `.getOne(id)` |
| `.maybeSingle()` | `.getFirstListItem(filter)` |
| `.order('field')` | `sort: 'field'` |
| `.limit(n)` | `perPage: n` |

### Étape 5 : Migrer le store d'authentification

Créer `src/stores/auth-pb.js` (nouvelle version) :

```javascript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { pb } from '../services/pocketbase'
import logger from '../services/logger'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const isAuthenticated = computed(() => user.value !== null)
  const isAdmin = computed(() => user.value?.is_admin === true)
  const isSuperAdmin = computed(() => user.value?.is_super_admin === true)

  async function checkSession() {
    try {
      loading.value = true
      
      // Vérifier si l'utilisateur est authentifié
      if (pb.authStore.isValid) {
        await loadUserProfile(pb.authStore.model.id)
      } else {
        user.value = null
      }
    } catch (err) {
      logger.error('Erreur lors de la vérification de session:', err)
      user.value = null
    } finally {
      loading.value = false
    }
  }

  async function loadUserProfile(userId) {
    try {
      // Récupérer l'utilisateur depuis PocketBase
      const userRecord = await pb.collection('users').getOne(userId)
      
      // Vérifier si admin
      let isAdmin = false
      let isSuperAdmin = false
      
      try {
        const adminRecord = await pb.collection('app_admins')
          .getFirstListItem(`user_id = "${userId}"`)
        isAdmin = true
        isSuperAdmin = adminRecord.role === 'super_admin'
      } catch (e) {
        // Pas admin
      }

      user.value = {
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.name || userRecord.email?.split('@')[0] || 'Utilisateur',
        is_admin: isAdmin,
        is_super_admin: isSuperAdmin
      }

      logger.log('Profil utilisateur chargé:', user.value)
    } catch (err) {
      logger.error('Erreur lors du chargement du profil:', err)
      throw err
    }
  }

  async function signIn(email, password, rememberMe = true) {
    try {
      loading.value = true
      error.value = null

      // Authentifier avec PocketBase
      const authData = await pb.collection('users').authWithPassword(
        email.trim().toLowerCase(),
        password
      )

      // Charger le profil
      await loadUserProfile(authData.record.id)

      return { success: true }
    } catch (err) {
      const errorMessage = err.message || 'Erreur lors de la connexion'
      error.value = errorMessage
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  async function signUp(email, password, name) {
    try {
      loading.value = true
      error.value = null

      // Créer l'utilisateur
      const userData = {
        email: email.trim().toLowerCase(),
        password: password,
        passwordConfirm: password,
        name: name.trim()
      }

      await pb.collection('users').create(userData)

      // Se connecter automatiquement
      await signIn(email, password)

      return { success: true, needsConfirmation: false }
    } catch (err) {
      const errorMessage = err.message || 'Erreur lors de l\'inscription'
      error.value = errorMessage
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  async function signOut() {
    try {
      pb.authStore.clear()
      user.value = null
      localStorage.removeItem('pocketbase_auth')
    } catch (err) {
      logger.error('Erreur lors de la déconnexion:', err)
    }
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    isSuperAdmin,
    checkSession,
    loadUserProfile,
    signIn,
    signUp,
    signOut
  }
})
```

### Étape 6 : Migrer les stores de données

#### Exemple : `src/stores/leaves.js`

**Avant (Supabase) :**
```javascript
const { data, error } = await supabase
  .from('leaves')
  .select('*')
  .eq('user_id', authStore.user.id)
```

**Après (PocketBase) :**
```javascript
const records = await pb.collection('leaves').getFullList({
  filter: `user_id = "${authStore.user.id}"`
})
```

**Exemple complet :**
```javascript
async function loadLeaves() {
  const authStore = useAuthStore()
  if (!authStore.user || !pb) {
    leaves.value = {}
    return
  }

  try {
    loading.value = true
    error.value = null

    const records = await pb.collection('leaves').getFullList({
      filter: `user_id = "${authStore.user.id}"`
    })

    // Convertir les données en format interne
    leaves.value = {}
    leaveIdMap.value = {}
    records.forEach(leave => {
      leaves.value[leave.date_key] = leave.leave_type_id
      if (leave.id) {
        leaveIdMap.value[leave.id] = leave.date_key
      }
    })

    logger.log('Jours de congé chargés:', Object.keys(leaves.value).length, 'entrées')
  } catch (err) {
    error.value = err.message
    leaves.value = {}
  } finally {
    loading.value = false
  }
}
```

### Étape 7 : Migrer les services

#### Exemple : `src/services/teams.js`

**Avant :**
```javascript
const { data, error } = await supabase
  .from('team_members')
  .select(`
    team_id,
    role,
    teams (id, name, description, parent_id, created_by, created_at)
  `)
  .eq('user_id', userId)
```

**Après :**
```javascript
// Récupérer les membres
const members = await pb.collection('team_members').getFullList({
  filter: `user_id = "${userId}"`,
  expand: 'team_id'
})

// Mapper les équipes
const teams = members.map(member => ({
  id: member.expand.team_id.id,
  name: member.expand.team_id.name,
  description: member.expand.team_id.description,
  parentId: member.expand.team_id.parent_id,
  role: member.role,
  createdBy: member.expand.team_id.created_by,
  createdAt: member.expand.team_id.created
}))
```

---

## Migration de l'authentification

### Différences principales

| Supabase | PocketBase |
|----------|------------|
| `supabase.auth.signUp()` | `pb.collection('users').create()` |
| `supabase.auth.signInWithPassword()` | `pb.collection('users').authWithPassword()` |
| `supabase.auth.signOut()` | `pb.authStore.clear()` |
| `supabase.auth.getSession()` | `pb.authStore.isValid` |
| `session.user.id` | `pb.authStore.model.id` |

### Gestion des sessions

PocketBase gère automatiquement les sessions via `authStore`. La session est persistée dans `localStorage` par défaut.

---

## Migration du Realtime

### Différences

| Supabase | PocketBase |
|----------|------------|
| `supabase.channel().on('postgres_changes')` | `pb.collection('table').subscribe()` |

### Exemple de migration

**Avant (Supabase) :**
```javascript
channel.value = supabase
  .channel(`realtime:leaves:${userId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'leaves',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    if (payload.eventType === 'INSERT') {
      onInsert(payload.new)
    }
  })
  .subscribe()
```

**Après (PocketBase) :**
```javascript
pb.collection('leaves').subscribe('*', (e) => {
  const record = e.record
  
  // Filtrer côté client si nécessaire
  if (record.user_id !== userId) return
  
  if (e.action === 'create') {
    onInsert(record)
  } else if (e.action === 'update') {
    onUpdate(record)
  } else if (e.action === 'delete') {
    onDelete(record)
  }
})
```

### Adapter `useRealtime.js`

Créer `src/composables/useRealtime-pb.js` :

```javascript
import { ref } from 'vue'
import { pb } from '../services/pocketbase'
import logger from '../services/logger'

export function useRealtime(table, options = {}) {
  const unsubscribe = ref(null)
  const connected = ref(false)
  const error = ref(null)

  const {
    filter = null,
    onInsert = null,
    onUpdate = null,
    onDelete = null,
    enabled = true
  } = options

  function subscribe() {
    if (!enabled || !table || !pb) {
      logger.warn('[useRealtime] Subscription désactivée')
      return
    }

    try {
      unsubscribe.value = pb.collection(table).subscribe('*', (e) => {
        const record = e.record

        // Appliquer le filtre si fourni
        if (filter) {
          const [field, operator, value] = filter.split(/[=.]/)
          if (operator === 'eq' && record[field] !== value) {
            return // Ignorer cet événement
          }
        }

        logger.debug(`[useRealtime] Événement sur ${table}:`, e.action, record)

        switch (e.action) {
          case 'create':
            if (onInsert) onInsert(record)
            break
          case 'update':
            if (onUpdate) onUpdate(record)
            break
          case 'delete':
            if (onDelete) onDelete(record)
            break
        }
      })

      connected.value = true
      logger.log(`[useRealtime] Subscription active sur ${table}`)
    } catch (err) {
      error.value = err.message
      logger.error(`[useRealtime] Erreur:`, err)
    }
  }

  function unsubscribe() {
    if (unsubscribe.value) {
      unsubscribe.value()
      unsubscribe.value = null
      connected.value = false
      logger.log(`[useRealtime] Subscription supprimée pour ${table}`)
    }
  }

  if (enabled) {
    subscribe()
  }

  return {
    unsubscribe,
    connected,
    error,
    subscribe,
    unsubscribe
  }
}
```

---

## Migration des fonctions RPC

PocketBase ne supporte pas les fonctions SQL (RPC). Il faut les remplacer par :

1. **Hooks JavaScript** (côté serveur PocketBase)
2. **Requêtes API directes** (côté client)

### Exemple : `list_my_team_invitations`

**Avant (Supabase RPC) :**
```javascript
const { data, error } = await supabase.rpc('list_my_team_invitations')
```

**Après (PocketBase - requête directe) :**
```javascript
// Récupérer l'email de l'utilisateur
const user = await pb.collection('users').getOne(pb.authStore.model.id)
const userEmail = user.email

// Récupérer les invitations
const invitations = await pb.collection('team_invitations').getFullList({
  filter: `email = "${userEmail}" && status = "pending"`,
  expand: 'team_id,invited_by'
})

// Mapper les résultats
const mapped = invitations.map(inv => ({
  id: inv.id,
  team_id: inv.team_id,
  team_name: inv.expand.team_id?.name,
  team_description: inv.expand.team_id?.description,
  email: inv.email,
  invited_by_email: inv.expand.invited_by?.email,
  status: inv.status,
  created_at: inv.created
}))
```

---

## Tests et validation

### Checklist de migration

- [ ] **Installation PocketBase** : Serveur démarré et accessible
- [ ] **Collections créées** : Toutes les collections sont créées
- [ ] **Règles configurées** : Les règles de collection remplacent RLS
- [ ] **Service PocketBase** : `src/services/pocketbase.js` créé
- [ ] **Variables d'environnement** : `.env` mis à jour
- [ ] **Store auth migré** : Authentification fonctionne
- [ ] **Stores de données migrés** : Tous les stores fonctionnent
- [ ] **Services migrés** : Tous les services fonctionnent
- [ ] **Realtime migré** : Les subscriptions fonctionnent
- [ ] **Fonctions RPC remplacées** : Toutes les RPC sont remplacées
- [ ] **Tests utilisateur** : Inscription, connexion, création de congés
- [ ] **Tests équipes** : Création d'équipe, invitations
- [ ] **Tests Realtime** : Mises à jour en temps réel

### Tests à effectuer

1. **Authentification**
   - [ ] Inscription
   - [ ] Connexion
   - [ ] Déconnexion
   - [ ] Persistance de session

2. **Données**
   - [ ] Création de congé
   - [ ] Modification de congé
   - [ ] Suppression de congé
   - [ ] Chargement des congés

3. **Équipes**
   - [ ] Création d'équipe
   - [ ] Invitation de membre
   - [ ] Acceptation d'invitation
   - [ ] Hiérarchie (sous-équipes)

4. **Realtime**
   - [ ] Mise à jour en temps réel des congés
   - [ ] Notifications en temps réel

---

## Déploiement

### Option 1 : Déploiement sur le même serveur

1. **Copier PocketBase** sur le serveur
2. **Démarrer en arrière-plan** :
   ```bash
   nohup ./pocketbase serve > pocketbase.log 2>&1 &
   ```
3. **Configurer un reverse proxy** (Nginx) :
   ```nginx
   server {
       listen 80;
       server_name votre-domaine.com;
       
       location / {
           proxy_pass http://127.0.0.1:8090;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

### Option 2 : Service systemd (Linux)

Créer `/etc/systemd/system/pocketbase.service` :

```ini
[Unit]
Description=PocketBase Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/pocketbase
ExecStart=/opt/pocketbase/pocketbase serve
Restart=always

[Install]
WantedBy=multi-user.target
```

Démarrer :
```bash
sudo systemctl enable pocketbase
sudo systemctl start pocketbase
```

### Option 3 : Docker (optionnel)

Créer `Dockerfile` :
```dockerfile
FROM alpine:latest

RUN apk add --no-cache ca-certificates

COPY pocketbase /usr/local/bin/pocketbase

EXPOSE 8090

CMD ["pocketbase", "serve", "--http=0.0.0.0:8090"]
```

### Sauvegarde

PocketBase stocke tout dans un fichier SQLite. Pour sauvegarder :

```bash
# Sauvegarder la base de données
cp /path/to/pocketbase/pb_data/data.db /backup/data-$(date +%Y%m%d).db

# Ou utiliser la commande PocketBase
./pocketbase backup --dir /backup
```

---

## Checklist de migration

### Phase 1 : Préparation
- [ ] Backup de la base Supabase
- [ ] Télécharger PocketBase
- [ ] Installer PocketBase localement
- [ ] Tester PocketBase (créer admin, tester API)

### Phase 2 : Migration du schéma
- [ ] Créer toutes les collections
- [ ] Configurer les champs (types, relations)
- [ ] Configurer les règles de collection
- [ ] Tester les règles (créer/modifier/supprimer)

### Phase 3 : Migration du code
- [ ] Installer `pocketbase` npm package
- [ ] Créer `src/services/pocketbase.js`
- [ ] Mettre à jour `.env`
- [ ] Migrer `src/stores/auth.js`
- [ ] Migrer `src/stores/leaves.js`
- [ ] Migrer `src/stores/leaveTypes.js`
- [ ] Migrer `src/stores/quotas.js`
- [ ] Migrer `src/stores/teams.js`
- [ ] Migrer `src/stores/notifications.js`
- [ ] Migrer `src/services/teams.js`
- [ ] Migrer `src/composables/useRealtime.js`

### Phase 4 : Migration des fonctionnalités avancées
- [ ] Remplacer les RPC par des requêtes directes
- [ ] Adapter les hooks JavaScript si nécessaire
- [ ] Migrer le Realtime
- [ ] Tester les permissions

### Phase 5 : Tests
- [ ] Tests d'authentification
- [ ] Tests CRUD sur toutes les collections
- [ ] Tests Realtime
- [ ] Tests équipes et invitations
- [ ] Tests hiérarchie des équipes

### Phase 6 : Déploiement
- [ ] Déployer PocketBase sur le serveur
- [ ] Configurer le reverse proxy
- [ ] Mettre à jour les variables d'environnement
- [ ] Tester en production
- [ ] Migrer les données (si nécessaire)

---

## Ressources

- **Documentation PocketBase** : https://pocketbase.io/docs/
- **API Reference** : https://pocketbase.io/docs/api-records/
- **JavaScript SDK** : https://github.com/pocketbase/js-sdk
- **Exemples** : https://pocketbase.io/docs/

---

## Support

En cas de problème lors de la migration :

1. Vérifier les logs PocketBase (`pocketbase.log`)
2. Vérifier la console du navigateur (F12)
3. Consulter la documentation PocketBase
4. Vérifier les règles de collection dans l'interface admin

---

**Bon courage pour votre migration ! 🚀**
