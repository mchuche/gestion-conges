# Docker — ce dépôt

L’**installation pas à pas** (`.env`, migrations, commandes npm à la racine) est dans **`docs/INSTALL.md`**.

Ce fichier décrit uniquement **docker compose** et les URLs des services.

---

## Postgres seul (développement avec Node sur la machine)

À la racine du repo :

```bash
docker compose up -d
```

PostgreSQL est exposé sur **`localhost:5433`** dans `docker-compose.yml` (mapping **5433** → 5432 dans le conteneur). Lance l’API et Vite comme dans **`docs/INSTALL.md`**.

---

## Stack complète : Postgres + Nest + Nginx (sans HTTPS)

```bash
docker compose --profile docker up -d --build
```

Si le démarrage échoue sur le **port 3000**, une autre app (souvent l’API Nest lancée avec `npm run api:dev`) utilise déjà le port : arrête-la ou change le mapping dans `docker-compose.yml` (ex. `3001:3000`) et rebuild le front avec **`VITE_API_URL`** pointant vers ce port.

| Service | URL / port |
|---------|------------|
| Front (Nginx) | **http://localhost:8080/gestion-conges/** |
| API Nest | **http://localhost:3000** |
| Postgres | `localhost:5433` (même volume qu’en mode « Postgres seul ») |

### Variables côté conteneur `api`

Les secrets JWT peuvent être passés via **`docker-compose.yml`** ou `docker compose exec -e …`. En prod, **`JWT_ACCESS_SECRET`** doit être fort.

### Seed et admins

```bash
docker compose exec api npm run prisma:seed
docker compose exec -e BOOTSTRAP_ADMIN_EMAIL=toi@example.com -e BOOTSTRAP_ADMIN_PASSWORD="MotDePasseSûr" api npm run bootstrap-admin
docker compose exec -e PROMOTE_SUPER_ADMIN_EMAIL=collegue@example.com api npm run promote-super-admin
```

Détails : **`docs/guides/CREATE_FIRST_ADMIN.md`**.

---

HTTPS en production : placer un reverse-proxy (Caddy, Traefik, Nginx + Let’s Encrypt) devant ces services — pas encore configuré ici.
