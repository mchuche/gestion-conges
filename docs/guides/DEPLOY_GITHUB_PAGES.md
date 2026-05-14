# Déploiement sur GitHub Pages

Le dépôt publie **uniquement le front** (build Vite). L’**API Nest** doit être hébergée ailleurs (VPS, Railway, Fly.io, etc.) et exposée en **HTTPS** pour que le navigateur accepte les appels depuis `*.github.io`.

**Important :** le front est buildé avec **`base: /`** par défaut. Si ton site Pages est encore à l’URL **`https://<user>.github.io/<repo>/`**, crée une **variable dépôt** **`VITE_BASE_PATH`** égale à **`/<repo>/`** (voir § 1 ci-dessous). Sinon les assets (`/assets/...`) seront chargés depuis la racine du domaine et la page sera blanche.

## Prérequis

1. Dépôt GitHub avec Pages activé.
2. Une URL publique pour l’API, par exemple `https://api.mondomaine.com` (sans slash final de préférence, les deux fonctionnent en général).

## 1. Secrets et variables GitHub

### Secret `VITE_API_URL` (obligatoire)

1. **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
2. Nom : **`VITE_API_URL`**
3. Valeur : l’URL de base de ton API (ex. `https://api.mondomaine.com`)

Le workflow `.github/workflows/deploy.yml` crée un `.env` au build avec cette variable ; Vite l’injecte dans le bundle (`import.meta.env.VITE_API_URL`).

### Variable `VITE_BASE_PATH` (selon l’URL du site)

En local et sur Docker, le front utilise **`base: /`** (ex. `http://localhost:5173/`).

L’URL par défaut d’un **site projet** GitHub Pages est **`https://<user>.github.io/<nom-du-depot>/`** : le premier segment d’URL après le domaine est le nom du dépôt. Les assets Vite doivent alors être préfixés par **`/<nom-du-depot>/`**.

1. **Settings** → **Secrets and variables** → **Actions** → onglet **Variables**
2. **New repository variable** : nom **`VITE_BASE_PATH`**, valeur **`/gestion-conges/`** (remplace par le **nom exact** de ton dépôt si différent, avec slash initial et final).

Si tu utilises un **domaine personnalisé** configuré pour servir le site **à la racine** du domaine, tu peux **ne pas** définir cette variable : le build utilisera **`/`**.

Le fichier **`public/404.html`** (hack SPA Pages) est réglé pour **`pathSegmentsToKeep = 0`** (site à la racine). Si tu déploies encore sous **`github.io/<repo>/`** avec **`VITE_BASE_PATH=/<repo>/`**, ouvre **`public/404.html`** et remets **`pathSegmentsToKeep`** à **`1`** pour que les rechargements directs sur une route (ex. `/admin`) fonctionnent.

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
| 404 sur les routes Vue / assets manquants | Vérifier **`VITE_BASE_PATH`** (variable dépôt) : doit correspondre à **`/<repo>/`** pour l’URL `github.io/<repo>/`, ou **`/`** pour un domaine à la racine. Voir **`public/404.html`** (`pathSegmentsToKeep`). |
