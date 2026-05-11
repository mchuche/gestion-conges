# Déploiement sur GitHub Pages

Le dépôt publie **uniquement le front** (build Vite). L’**API Nest** doit être hébergée ailleurs (VPS, Railway, Fly.io, etc.) et exposée en **HTTPS** pour que le navigateur accepte les appels depuis `*.github.io`.

## Prérequis

1. Dépôt GitHub avec Pages activé.
2. Une URL publique pour l’API, par exemple `https://api.mondomaine.com` (sans slash final de préférence, les deux fonctionnent en général).

## 1. Secret GitHub

1. **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
2. Nom : **`VITE_API_URL`**
3. Valeur : l’URL de base de ton API (ex. `https://api.mondomaine.com`)

Le workflow `.github/workflows/deploy.yml` crée un `.env` au build avec cette variable ; Vite l’injecte dans le bundle (`import.meta.env.VITE_API_URL`).

## 2. Activer GitHub Pages

1. **Settings** → **Pages**
2. **Source** : **GitHub Actions**

## 3. Déployer

Push sur `main` (ou déclenchement manuel **Actions** → **Deploy to GitHub Pages** → **Run workflow**).

Après succès, l’URL du site s’affiche dans l’environnement **github-pages** (souvent `https://<user>.github.io/<repo>/`).

## CORS

L’API Nest doit autoriser l’origine de ton site Pages dans sa configuration CORS (origine exacte avec ou sans slash final selon ce que le navigateur envoie).

## Développement local

À la racine : `copy .env.example .env` puis définir **`VITE_API_URL=http://localhost:3000`** (ou l’URL de ton API locale). Voir aussi **`docs/INSTALL.md`**.

## Dépannage

| Problème | Piste |
|----------|--------|
| Build Actions en erreur « VITE_API_URL manquant » | Créer le secret `VITE_API_URL` dans le dépôt. |
| Page blanche / erreurs réseau après déploiement | Vérifier que l’API est joignable en HTTPS, CORS, et que `VITE_API_URL` pointe vers la bonne base URL. |
| 404 sur les routes Vue | Pages sert du statique : le SPA doit utiliser le bon `base` Vite (ici `/gestion-conges/`). |
