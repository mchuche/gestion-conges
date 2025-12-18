# 🔴 Configuration Supabase Realtime

Ce document explique comment activer Supabase Realtime pour la synchronisation en temps réel des données.

## 📋 Prérequis

1. **Supabase Realtime activé** sur votre projet Supabase
   - Par défaut, Realtime est activé sur les projets Supabase
   - Vérifiez dans votre dashboard Supabase > Settings > API > Realtime

## 🚀 Étapes d'activation

### 1. Activer Realtime sur les tables dans Supabase

#### Option A : Via le Dashboard (Recommandé)

1. Allez dans **Supabase Dashboard** > **Database** > **Replication**
2. Activez la réplication pour les tables suivantes :
   - ✅ `leaves` (congés)
   - ✅ `leave_types` (types de congés)
   - ✅ `leave_quotas` (quotas)

#### Option B : Via SQL

Exécutez le script `supabase/ops/supabase-realtime-enable.sql` dans **Supabase > SQL Editor** :

```sql
-- Activer Realtime sur la table leaves
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS leaves;

-- Activer Realtime sur la table leave_types
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS leave_types;

-- Activer Realtime sur la table leave_quotas
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS leave_quotas;
```

**Important** : Vous devez également activer `REPLICA IDENTITY` pour que les mises à jour et suppressions fonctionnent correctement :

```sql
-- Pour que les UPDATE et DELETE soient visibles dans Realtime
ALTER TABLE leaves REPLICA IDENTITY FULL;
ALTER TABLE leave_types REPLICA IDENTITY FULL;
ALTER TABLE leave_quotas REPLICA IDENTITY FULL;
```

### 2. Vérifier que Realtime est activé

Dans le **SQL Editor**, exécutez :

```sql
SELECT 
    schemaname,
    tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
```

Vous devriez voir `leaves`, `leave_types`, `leave_quotas`, et `notifications` dans les résultats.

## ✅ Fonctionnalités activées

Une fois Realtime activé, les fonctionnalités suivantes sont disponibles :

### Synchronisation automatique

- **Congés** : Les modifications de congés (ajout, modification, suppression) sont synchronisées en temps réel
- **Types de congés** : Les modifications de types de congés sont synchronisées en temps réel
- **Quotas** : Les modifications de quotas sont synchronisées en temps réel

### Comportement

- Les changements effectués par **un utilisateur** sur ses propres données sont **automatiquement** reflétés dans l'interface
- Les changements sont **instantanés** sans nécessiter de rechargement de page
- Les subscriptions sont **automatiquement** gérées (création au chargement, nettoyage à la déconnexion)

## 🔧 Architecture technique

### Composable `useRealtime`

Un composable réutilisable (`src/composables/useRealtime.js`) gère les subscriptions Realtime :

- Gestion automatique du cycle de vie (création/nettoyage)
- Support des filtres pour écouter uniquement les données d'un utilisateur
- Callbacks pour INSERT, UPDATE, DELETE
- Gestion des erreurs et reconnexion automatique

### Intégration dans les stores

Les stores suivants utilisent Realtime :

- **`leaves.js`** : Synchronisation des congés
- **`leaveTypes.js`** : Synchronisation des types de congés
- **`quotas.js`** : Synchronisation des quotas

Chaque store :
1. Active automatiquement Realtime après le premier chargement des données
2. Met à jour son état local lors des événements Realtime
3. Nettoie la subscription lors de la déconnexion

## 🐛 Dépannage

### Les changements ne sont pas synchronisés

1. **Vérifiez que Realtime est activé** sur les tables dans le dashboard Supabase
2. **Vérifiez les logs** dans la console du navigateur (mode développement)
3. **Vérifiez les permissions RLS** : Les politiques RLS doivent permettre la lecture des données
4. **Vérifiez la connexion** : Les subscriptions nécessitent une connexion WebSocket active

### Erreur "CHANNEL_ERROR"

- Vérifiez que les tables sont bien dans la publication `supabase_realtime`
- Vérifiez que `REPLICA IDENTITY` est configuré sur `FULL` pour les tables
- Vérifiez que l'utilisateur a les permissions nécessaires (RLS)

### Les événements ne sont pas reçus

- Vérifiez que le filtre est correct (format : `"user_id=eq.xxx"`)
- Vérifiez que l'utilisateur connecté correspond au filtre
- Vérifiez les logs dans la console pour voir les événements reçus

## 📝 Notes importantes

- **Performance** : Les subscriptions Realtime utilisent des WebSockets. Pour de grandes quantités de données, considérez l'utilisation de filtres appropriés.
- **Sécurité** : Les filtres RLS sont toujours appliqués, donc un utilisateur ne recevra que les événements pour ses propres données.
- **Coûts** : Realtime est inclus dans le plan gratuit de Supabase avec certaines limitations. Consultez la documentation Supabase pour plus d'informations.

## 🔗 Ressources

- [Documentation Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [API Realtime Supabase](https://supabase.com/docs/reference/javascript/subscribe)

