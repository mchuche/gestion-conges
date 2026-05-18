# AGENTS.md

## Cursor Cloud specific instructions

### Architecture

Application de gestion de congés (Leave Manager) en 3 tiers :

| Service | Technologie | Port dev |
|---------|------------|----------|
| Frontend | Vue.js 3 + Vite | 5173 |
| API | NestJS (TypeScript) | 3000 |
| Base de données | PostgreSQL 16 (via Docker) | 5433 (hôte) |

### Commandes de référence

Les commandes courantes sont documentées dans `docs/INSTALL.md` et `docs/MEMO_DEMARRAGE.md`.
Les endpoints REST sont listés dans `docs/guides/API_LOCAL_SETUP.md`.

### Démarrage des services (après update script)

1. **PostgreSQL** : `sudo dockerd &>/tmp/dockerd.log &` puis `sudo docker compose up -d` (depuis la racine). Docker doit être démarré manuellement dans l'environnement Cloud Agent car le daemon ne tourne pas au boot.
2. **API** : `npm run api:dev` (NestJS watch mode, port 3000). Vérifier : `curl http://localhost:3000/health`.
3. **Frontend** : `npm run dev` (Vite HMR, port 5173).

### Fichiers `.env`

Les fichiers `.env` (racine) et `api/.env` ne sont pas versionnés. Copier depuis `.env.example` / `api/.env.example`. Les valeurs par défaut fonctionnent en développement local avec le Docker Compose du dépôt (PostgreSQL sur `localhost:5433`, user `gestion` / `gestion_dev`).

### Base de données

- `npm run prisma:generate` — régénère le client Prisma (nécessaire après `npm run api:install`).
- `npm run migrate` — applique les migrations.
- `npm run prisma:seed` — seed les types de congés globaux.
- `npm run db:reset` — repart de zéro (destructif, dev uniquement).

### Gotchas

- **Docker dans Cloud Agent** : nécessite `fuse-overlayfs`, `iptables-legacy`, et `storage-driver: fuse-overlayfs` dans `/etc/docker/daemon.json`. Le daemon Docker doit être démarré manuellement (`sudo dockerd`).
- **Port PostgreSQL** : le Docker Compose mappe le port 5433 (hôte) → 5432 (conteneur). `DATABASE_URL` dans `api/.env` doit utiliser le port **5433**, pas 5432.
- **Frontend ESLint** : le script `npm run lint` à la racine échoue car ESLint v9 est installé mais la config utilise le format legacy `.eslintrc.cjs`. C'est un problème pré-existant du dépôt.
- **API ESLint** : `cd api && npm run lint` fonctionne mais a 2 avertissements pré-existants `@typescript-eslint/no-unused-vars`.
- **Tests API** : `cd api && npm test` lance Jest (unit tests). `npm run test:e2e` pour les tests end-to-end.
