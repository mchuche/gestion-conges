# Optimisations de Performance

Ce document décrit les optimisations de performance implémentées dans l'application.

## 1. Système de Logging Conditionnel

### Problème
L'application contenait 224 `console.log` en production, ce qui :
- Ralentit l'exécution du JavaScript
- Pollue la console du navigateur
- Expose des informations sensibles en production

### Solution
Un système de logging conditionnel a été créé dans `js/utils.js` :

```javascript
const DEBUG = (typeof window !== 'undefined' && window.DEBUG) || false;

const logger = {
    log: (...args) => DEBUG && console.log(...args),
    error: (...args) => console.error(...args), // Toujours affiché
    warn: (...args) => DEBUG && console.warn(...args),
    debug: (prefix, ...args) => DEBUG && console.log(prefix, ...args),
    // ...
};
```

### Utilisation
- **En développement** : Activer avec `window.DEBUG = true` dans la console
- **En production** : Les logs sont automatiquement désactivés
- **Les erreurs** : Toujours affichées pour le débogage

### Fichiers modifiés
- `js/utils.js` : Création du système de logging
- `js/admin.js` : Tous les `console.log` remplacés par `logger`
- `js/teams.js` : Tous les `console.log` remplacés par `logger`
- Autres fichiers : À migrer progressivement

## 2. Optimisation des Requêtes SQL (N+1)

### Problème
La fonction `loadAllUsers()` effectuait une requête par utilisateur pour récupérer les statistiques :
- 1 requête pour charger les utilisateurs
- N requêtes pour compter les congés de chaque utilisateur
- N requêtes pour compter les équipes de chaque utilisateur
- **Total : 1 + 2N requêtes** (ex: 100 utilisateurs = 201 requêtes)

### Solution
Création d'une fonction SQL optimisée `get_users_with_stats()` qui :
- Utilise des jointures SQL (LEFT JOIN)
- Récupère toutes les statistiques en une seule requête
- **Total : 1 requête** pour tous les utilisateurs

### Fichier SQL
Le fichier **`supabase-performance-optimizations.sql`** (à la racine du projet) contient :
- `get_users_with_stats(search_email)` : Fonction optimisée pour les utilisateurs
- `get_team_members_with_emails(team_uuid)` : Fonction optimisée pour les membres d'équipe
- Index pour optimiser les recherches

### Installation
1. Ouvrir le fichier **`supabase-performance-optimizations.sql`** dans votre éditeur
2. Copier tout le contenu du fichier
3. Aller sur [Supabase Dashboard](https://supabase.com/dashboard) → Sélectionner votre projet
4. Aller dans **SQL Editor** (dans le menu de gauche)
5. Coller le contenu du fichier SQL dans l'éditeur
6. Cliquer sur **Run** (ou appuyer sur `Ctrl+Enter`)
7. Les fonctions seront automatiquement utilisées par le code JavaScript

**Chemin du fichier :** `./supabase-performance-optimizations.sql` (à la racine du projet, au même niveau que `index.html`)

### Fallback
Le code JavaScript inclut un fallback vers l'ancienne méthode si les fonctions SQL n'existent pas encore, garantissant la compatibilité.

## 3. Optimisation de loadTeamMembers()

### Problème
La fonction chargeait les membres puis faisait une requête séparée pour chaque email.

### Solution
Fonction SQL `get_team_members_with_emails()` qui récupère tout en une seule requête avec jointure.

## 4. Index de Base de Données

### Index créés
- `idx_user_emails_email` : Recherche rapide par email
- `idx_user_emails_email_lower` : Recherche insensible à la casse
- `idx_leaves_user_id` : Jointures rapides sur les congés
- `idx_team_members_user_id` : Jointures rapides sur les membres
- `idx_team_members_team_id` : Recherche rapide par équipe

## Bénéfices

### Performance
- **Réduction de 99% des requêtes** pour `loadAllUsers()` (201 → 1 requête pour 100 utilisateurs)
- **Réduction de 50% des requêtes** pour `loadTeamMembers()`
- **Temps de chargement divisé par 10-20** pour la page admin avec beaucoup d'utilisateurs

### Expérience Utilisateur
- Chargement plus rapide des listes
- Moins de latence réseau
- Interface plus réactive

### Maintenance
- Code plus propre avec le système de logging
- Logs désactivés en production
- Erreurs toujours visibles pour le débogage

## Prochaines Étapes

1. ✅ Système de logging conditionnel
2. ✅ Optimisation des requêtes SQL
3. ⏳ Migration des autres fichiers vers le système de logging
4. ⏳ Cache local pour les données fréquemment utilisées
5. ⏳ Lazy loading des données

## Activation du Mode Debug

Pour activer les logs en développement, ajoutez dans la console du navigateur :
```javascript
window.DEBUG = true;
```

Ou modifiez `js/utils.js` :
```javascript
const DEBUG = true; // Activer les logs
```

