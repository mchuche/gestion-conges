# Migration : Types de congés globaux

## Vue d'ensemble

Cette migration sépare la gestion des types de congés en deux niveaux :
- **Administrateur** : Gère les **labels** (nom, abréviation, catégorie) dans `global_leave_types`
- **Utilisateurs** : Personnalisent les **couleurs** et gèrent les **quotas** dans `leave_types` et `leave_quotas`

## Changements de structure

### Avant
- Table `leave_types` : Contenait tout (id, user_id, name, label, color, category)
- Chaque utilisateur créait ses propres types

### Après
- Table `global_leave_types` : Contient les labels (id, name, label, category) - **Géré par l'admin**
- Table `leave_types` : Contient les personnalisations (id, user_id, global_type_id, color) - **Géré par les utilisateurs**
- Table `leave_quotas` : Inchangée, mais `leave_type_id` référence maintenant `global_type_id`

## Instructions de migration

### 1. Exécuter la migration SQL

Exécutez le script `migration-global-leave-types.sql` dans Supabase > SQL Editor.

Ce script :
- Crée la table `global_leave_types`
- Migre les données existantes
- Recrée la table `leave_types` avec la nouvelle structure
- Met à jour les politiques RLS

### 2. Vérifier la migration

Après la migration, vérifiez que :
- Les types globaux existent dans `global_leave_types`
- Les utilisateurs ont des personnalisations dans `leave_types`
- Les quotas fonctionnent toujours

### 3. Mettre à jour l'application

Les modifications du code sont déjà faites :
- ✅ Store `leaveTypes` mis à jour
- ✅ Interface admin pour gérer les types globaux
- ✅ Interface utilisateur pour personnaliser couleurs et quotas

## Utilisation

### Pour les administrateurs

1. Accéder à l'interface admin (onglet "Types de congés")
2. Ajouter/modifier/supprimer des types globaux
3. Les labels (nom, abréviation, catégorie) sont gérés ici

### Pour les utilisateurs

1. Accéder à la configuration (icône ⚙️)
2. Personnaliser les couleurs pour chaque type
3. Gérer les quotas par année

## Notes importantes

- Les utilisateurs ne peuvent plus créer/supprimer des types
- Les labels sont uniformes pour tous les utilisateurs
- Les couleurs peuvent être personnalisées par utilisateur
- Les quotas restent individuels par utilisateur

## Compatibilité

- La table `leaves` continue d'utiliser `leave_type_id` qui référence maintenant `global_type_id`
- Le store `leaveTypes` expose `id` qui correspond à `global_type_id` pour la compatibilité
- Tous les composants existants continuent de fonctionner

## Rollback

Si vous devez revenir en arrière :
1. Restaurer la table `leave_types_backup` créée lors de la migration
2. Supprimer `global_leave_types`
3. Restaurer l'ancienne structure de `leave_types`

