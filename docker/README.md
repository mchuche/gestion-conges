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

Ou depuis la racine du dépôt : **`npm run docker-stack`** (équivalent).

Si le démarrage échoue sur le **port 3000**, une autre app (souvent l’API Nest lancée avec `npm run api:dev`) utilise déjà le port : arrête-la ou change le mapping dans `docker-compose.yml` (ex. `3001:3000`) et rebuild le front avec **`DOCKER_PUBLIC_API_URL`** pointant vers ce port.

| Service | URL / port |
|---------|------------|
| Front (Nginx) | **http://localhost:8080/gestion-conges/** |
| API Nest | **http://localhost:3000** |
| Postgres | `localhost:5433` (même volume qu’en mode « Postgres seul ») |

### Accès depuis une autre machine (LAN, VM Proxmox, téléphone)

Le front est compilé avec l’URL de l’API (**`DOCKER_PUBLIC_API_URL`**). Si tu ouvres le site avec **`http://IP_DE_LA_VM:8080`** alors **`localhost:3000`** dans le navigateur désigne **ton PC**, pas la VM — l’API semble « injoignable ».

1. Copier le modèle : **`cp .env.docker.example .env.docker`**
2. Éditer **`.env.docker`** (fichier **non versionné**) :
   - **`DOCKER_PUBLIC_API_URL`** = URL vue par le navigateur pour l’API, ex. **`http://192.168.1.47:3000`**
   - **`DOCKER_CORS_ORIGINS`** = liste des origines du **front**, séparées par des **virgules sans espace**, ex.  
     `http://localhost:8080,http://127.0.0.1:8080,http://192.168.1.47:8080`
3. Rebuild obligatoire pour le front :  
   **`docker compose --env-file .env.docker --profile docker up -d --build`**  
   ou **`npm run docker-stack-lan`**

**Alternative :** ajouter les mêmes variables dans ton **`.env`** à la racine (avec **`VITE_API_URL`** pour `npm run dev`). Compose lit **`.env`** automatiquement ; pas besoin de **`--env-file .env.docker`**.

**Overrides Compose locaux :** un fichier **`docker-compose.override.yml`** est ignoré par Git — tu peux t’en servir pour surcharges ponctuelles sans toucher au dépôt.

### Variables côté conteneur `api`

- **`CORS_ORIGIN`** provient de **`DOCKER_CORS_ORIGINS`** (voir **`docker-compose.yml`**).
- Les secrets JWT peuvent être passés via l’environnement ou **`docker compose exec -e …`**. En prod, **`JWT_ACCESS_SECRET`** doit être fort.

### Seed et admins

```bash
docker compose exec api npm run prisma:seed
docker compose exec -e BOOTSTRAP_ADMIN_EMAIL=toi@example.com -e BOOTSTRAP_ADMIN_PASSWORD="MotDePasseSûr" api npm run bootstrap-admin
docker compose exec -e PROMOTE_SUPER_ADMIN_EMAIL=collegue@example.com api npm run promote-super-admin
```

Détails : **`docs/guides/CREATE_FIRST_ADMIN.md`**.

---

HTTPS en production : placer un reverse-proxy (Caddy, Traefik, Nginx + Let’s Encrypt) devant ces services — pas encore configuré ici.
