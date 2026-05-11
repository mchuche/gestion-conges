# Installation (développement local)

## Prérequis

- **Node.js 20+** (recommandé) et npm
- **Docker** (optionnel) — **`docker/README.md`** : Postgres seul *ou* stack complète API + Nginx (`--profile docker`)
- Fichier **`.env`** à la racine du front : copier `.env.example` → `.env` et définir **`VITE_API_URL`** (ex. `http://localhost:3000`)

## 1) API NestJS + PostgreSQL

Guide détaillé : **`docs/guides/API_LOCAL_SETUP.md`**

Résumé :

```bash
docker compose up -d
cd api
copy .env.example .env   # Windows ; Linux/macOS : cp
npm install
npx prisma migrate deploy
npm run start:dev
```

## 2) Application Vue (front)

À la racine du dépôt :

```bash
npm install
npm run dev
```

Navigateur : **`http://localhost:5173/gestion-conges/`** (base path `/gestion-conges/`).

## 3) Scripts Windows

**`scripts/start-dev.ps1`** ou **`scripts/start-dev.bat`** — voir **`scripts/README.md`**.

## 4) Déploiement GitHub Pages

**`docs/guides/DEPLOY_GITHUB_PAGES.md`** (secret **`VITE_API_URL`** vers ton API en production).

---

### Index de la documentation

- **Guides actifs** : **`docs/guides/README.md`**
- **Notes internes** (revue, idées, exemples) : **`docs/notes/`**
- **Archives** (anciennes migrations / docs historiques) : **`docs/archive/README.md`**
