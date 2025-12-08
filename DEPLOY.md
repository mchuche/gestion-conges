# 🚀 Guide de Déploiement - GitHub Pages avec Secrets

Ce guide vous explique comment déployer l'application sur GitHub Pages en utilisant GitHub Secrets pour stocker vos clés Supabase de manière sécurisée.

## 📋 Prérequis

1. Un compte GitHub
2. Un compte Supabase avec un projet créé
3. Vos clés Supabase (URL et Anon Key)

## 🔐 Étape 1 : Configurer les Secrets GitHub

1. **Allez dans votre dépôt GitHub**
   - Ouvrez votre dépôt sur GitHub.com

2. **Accédez aux paramètres de secrets**
   - Cliquez sur **Settings** (en haut du dépôt)
   - Dans le menu de gauche, cliquez sur **Secrets and variables**
   - Puis cliquez sur **Actions**

3. **Ajouter le premier secret : SUPABASE_URL**
   - Cliquez sur **New repository secret**
   - **Name** : `SUPABASE_URL`
   - **Secret** : Votre URL Supabase (ex: `https://abcdefghijklmnop.supabase.co`)
   - Cliquez sur **Add secret**

4. **Ajouter le second secret : SUPABASE_ANON_KEY**
   - Cliquez à nouveau sur **New repository secret**
   - **Name** : `SUPABASE_ANON_KEY`
   - **Secret** : Votre clé anonyme Supabase (la longue chaîne commençant par `eyJ...`)
   - Cliquez sur **Add secret**

## 🌐 Étape 2 : Activer GitHub Pages

1. **Accédez aux paramètres Pages**
   - Toujours dans **Settings**
   - Dans le menu de gauche, cliquez sur **Pages**

2. **Configurer la source**
   - Sous **Source**, sélectionnez **GitHub Actions**
   - Le workflow `.github/workflows/deploy.yml` sera utilisé automatiquement

## 📤 Étape 3 : Déployer

1. **Pousser votre code**
   ```bash
   git add .
   git commit -m "Configuration GitHub Actions"
   git push origin main
   ```

2. **Vérifier le déploiement**
   - Allez dans l'onglet **Actions** de votre dépôt
   - Vous verrez le workflow "Deploy to GitHub Pages" en cours d'exécution
   - Attendez qu'il se termine (icône verte = succès)

3. **Accéder à votre site**
   - Une fois le déploiement terminé, votre site sera accessible à :
     `https://votre-username.github.io/nom-du-depot`
   - Le lien exact s'affiche dans l'onglet **Actions** après le déploiement

## 🔄 Mettre à jour les secrets

Si vous devez changer vos clés Supabase :

1. Allez dans **Settings** → **Secrets and variables** → **Actions**
2. Cliquez sur le secret à modifier
3. Cliquez sur **Update**
4. Modifiez la valeur et sauvegardez
5. Poussez un nouveau commit pour redéployer avec les nouvelles valeurs

## 🐛 Dépannage

### Le déploiement échoue

1. Vérifiez que les secrets sont bien configurés :
   - `SUPABASE_URL` existe et contient une URL valide
   - `SUPABASE_ANON_KEY` existe et contient une clé valide

2. Vérifiez les logs dans l'onglet **Actions**
   - Cliquez sur le workflow qui a échoué
   - Regardez les logs pour identifier l'erreur

### Le site ne fonctionne pas après le déploiement

1. Ouvrez la console du navigateur (F12)
2. Vérifiez s'il y a des erreurs liées à Supabase
3. Vérifiez que `config.js` est bien présent dans le code source déployé
4. Vérifiez que les secrets GitHub sont corrects

## 💻 Développement local

Pour développer localement, vous devez créer un fichier `config.js` manuellement :

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

## ✅ Vérification

Une fois déployé, vérifiez que :

- ✅ Le site est accessible sur GitHub Pages
- ✅ La connexion Supabase fonctionne (pas d'erreur dans la console)
- ✅ Vous pouvez vous inscrire/se connecter
- ✅ Les données sont sauvegardées correctement

---

**Note** : Le fichier `config.js` est généré automatiquement lors du déploiement et n'est **jamais** commité dans le dépôt. Vos secrets restent sécurisés dans GitHub Secrets.

