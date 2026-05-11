# Guides — stack actuelle

Documentation **à jour** pour faire tourner et déployer l’app (**Vue 3 + Vite**, **API NestJS + Prisma + PostgreSQL**).

| Fichier | Contenu |
|--------|---------|
| [INSTALL.md](../INSTALL.md) | **Référence unique** : `.env`, Postgres, `npm run migrate`, `api:dev`, front |
| [API_LOCAL_SETUP.md](./API_LOCAL_SETUP.md) | Table des **endpoints** REST + sans Docker / Docker complet |
| [CREATE_FIRST_ADMIN.md](./CREATE_FIRST_ADMIN.md) | `bootstrap-admin`, `promote-super-admin`, ou SQL manuel |
| [DEPLOY_GITHUB_PAGES.md](./DEPLOY_GITHUB_PAGES.md) | Build Pages + secret `VITE_API_URL` |
| [INSTRUCTIONS_SERVEUR.md](./INSTRUCTIONS_SERVEUR.md) | Lancer Vite en dev (`scripts/`, port) |
| [MIGRATION_GLOBAL_LEAVE_TYPES.md](./MIGRATION_GLOBAL_LEAVE_TYPES.md) | Modèle métier types globaux vs personnalisations (Prisma) |

Docker (Postgres seul ou stack complète) : **`docker/README.md`** à la racine du dépôt.

## Archives (ne pas suivre pour l’installation)

Anciennes stacks et procédures : **`docs/archive/`** (migration Vue, SQL historiques, guides temps réel / backends abandonnés). Voir [docs/archive/README.md](../archive/README.md).
