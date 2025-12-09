# Configuration de la confirmation d'email

## Problème résolu

Le code a été corrigé pour :
1. ✅ Utiliser automatiquement l'URL actuelle comme URL de redirection lors de l'inscription
2. ✅ Gérer automatiquement le token de confirmation quand l'utilisateur clique sur le lien dans l'email
3. ✅ Connecter automatiquement l'utilisateur après confirmation

## Configuration dans Supabase (IMPORTANT)

Pour que les emails de confirmation fonctionnent correctement, vous devez aussi configurer les URLs autorisées dans le dashboard Supabase :

### 1. Accéder aux paramètres d'authentification

1. Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans **Authentication** → **URL Configuration**

### 2. Configurer les URLs de redirection

Dans la section **Redirect URLs**, ajoutez toutes les URLs où votre application peut être accessible :

**Pour la production (GitHub Pages) :**
```
https://mchuche.github.io/gestion-conges/
https://mchuche.github.io/gestion-conges
```

**Pour le développement local (optionnel) :**
```
http://localhost:3000/
http://localhost:3000
http://127.0.0.1:3000/
http://127.0.0.1:3000
```

**Format général :**
- Ajoutez l'URL avec le slash final : `https://votre-domaine.com/`
- Ajoutez aussi l'URL sans le slash : `https://votre-domaine.com`
- N'oubliez pas le protocole (`https://` ou `http://`)

### 3. Site URL

Dans la section **Site URL**, définissez votre URL de production :
```
https://mchuche.github.io/gestion-conges/
```

### 4. Sauvegarder

Cliquez sur **Save** pour enregistrer les modifications.

## Comment ça fonctionne maintenant

1. **Lors de l'inscription** :
   - L'utilisateur s'inscrit avec son email
   - Le code utilise automatiquement `window.location.origin + window.location.pathname` comme URL de redirection
   - Supabase envoie un email de confirmation avec un lien contenant un token

2. **Lors du clic sur le lien** :
   - L'utilisateur est redirigé vers votre application avec le token dans l'URL (format : `#access_token=...&type=signup`)
   - Le code détecte automatiquement le token
   - L'utilisateur est connecté automatiquement
   - Un message de succès s'affiche
   - L'URL est nettoyée (le token est retiré de l'URL)

## Vérification

Pour vérifier que tout fonctionne :

1. **Inscrivez-vous** avec un nouvel email
2. **Vérifiez votre boîte email** (y compris les spams)
3. **Cliquez sur le lien de confirmation**
4. **Vous devriez être automatiquement connecté** avec un message de succès

## Dépannage

### Le lien redirige vers localhost:3000

**Cause** : L'URL de redirection n'est pas correctement configurée dans Supabase.

**Solution** :
1. Vérifiez que vous avez bien ajouté votre URL de production dans **Redirect URLs**
2. Vérifiez que le code utilise bien `window.location.origin + window.location.pathname`
3. Redéployez l'application si nécessaire

### L'utilisateur n'est pas connecté après le clic

**Cause** : Le token n'est pas correctement traité.

**Solution** :
1. Vérifiez la console du navigateur pour les erreurs
2. Vérifiez que l'URL contient bien `#access_token=...&type=signup`
3. Vérifiez que Supabase est correctement initialisé

### L'email de confirmation n'arrive pas

**Cause** : Problème avec la configuration email de Supabase.

**Solution** :
1. Vérifiez dans Supabase → **Authentication** → **Email Templates**
2. Vérifiez que les emails sont bien activés
3. Vérifiez vos spams
4. Pour le développement, vous pouvez désactiver la confirmation d'email dans **Authentication** → **Settings** → **Enable email confirmations** (désactivé en développement uniquement)

## Notes importantes

- ⚠️ **Ne désactivez jamais la confirmation d'email en production** pour des raisons de sécurité
- ✅ Le code gère automatiquement les URLs de production et de développement
- ✅ Les tokens sont automatiquement nettoyés de l'URL après traitement
- ✅ L'utilisateur est connecté automatiquement après confirmation

