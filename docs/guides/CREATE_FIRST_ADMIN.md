# Guide : Créer le premier administrateur

## Pré-requis
Assure-toi d’avoir exécuté le script Supabase “fresh install” :
- `supabase/sql/00_fresh_install.sql`

(Il crée déjà `app_admins`, `app_settings` + les fonctions/policies.)

## Étape 2 : Trouver votre User ID

Vous avez plusieurs options pour trouver votre `user_id` :

### Option A : Via la console du navigateur
1. Connectez-vous à votre application
2. Ouvrez la console du navigateur (F12)
3. Tapez cette commande :
```javascript
supabase.auth.getUser().then(u => console.log('User ID:', u.data.user.id))
```
4. Copiez l'ID affiché

### Option B : Via Supabase Dashboard
1. Allez dans **Authentication** > **Users**
2. Trouvez votre utilisateur dans la liste
3. Cliquez dessus pour voir les détails
4. Copiez l'**UUID** (c'est votre `user_id`)

## Étape 3 : Créer votre compte administrateur

1. Retournez dans **SQL Editor** dans Supabase
2. Exécutez cette requête (remplacez `VOTRE_USER_ID` par l'ID que vous avez copié) :

```sql
-- Créer votre compte super_admin
INSERT INTO app_admins (user_id, role, created_by)
VALUES ('VOTRE_USER_ID', 'super_admin', 'VOTRE_USER_ID');
```

**Exemple :**
```sql
INSERT INTO app_admins (user_id, role, created_by)
VALUES ('123e4567-e89b-12d3-a456-426614174000', 'super_admin', '123e4567-e89b-12d3-a456-426614174000');
```

## Étape 4 : Vérifier que ça fonctionne

1. Rafraîchissez votre application
2. Le bouton **"⚙️ Admin"** devrait apparaître dans le header
3. Cliquez dessus pour ouvrir la page d'administration

## Notes importantes

- **Super Admin** : Peut tout faire (gérer les admins, supprimer des utilisateurs, etc.)
- **Admin** : Peut gérer les utilisateurs et groupes, mais pas créer d'autres admins
- Pour créer d'autres admins, vous devrez utiliser SQL pour l'instant (une interface UI sera ajoutée plus tard)

## Dépannage

Si le bouton admin n'apparaît pas :
1. Vérifiez que vous avez bien exécuté `supabase/sql/00_fresh_install.sql`
2. Vérifiez que votre `user_id` est correct dans la table `app_admins`
3. Déconnectez-vous et reconnectez-vous à l'application
4. Videz le cache du navigateur (Ctrl+Shift+R)

Pour vérifier si vous êtes bien admin :
```sql
-- Dans SQL Editor, remplacez VOTRE_USER_ID
SELECT * FROM app_admins WHERE user_id = 'VOTRE_USER_ID';
```

