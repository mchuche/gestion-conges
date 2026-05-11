# Docker — ce dépôt

## Postgres seul (développement avec Node sur la machine)

À la racine du repo :

```bash
docker compose up -d
```

Tu exposes **PostgreSQL** sur le port **5433** (voir `docker-compose.yml`). Lance l’API et Vite avec `npm` comme dans **`docs/INSTALL.md`**.

## Stack complète : Postgres + Nest + Nginx (sans HTTPS)

```bash
docker compose --profile docker up -d --build
```

Si le démarrage échoue sur le **port 3000**, une autre app (souvent ton API Nest lancée avec `npm`) l’utilise déjà : arrête-la ou change le mapping dans `docker-compose.yml` (ex. `3001:3000`) et rebuild le front avec `VITE_API_URL` pointant vers ce port.

| Service | URL / port |
|---------|------------|
| Front (Nginx) | **http://localhost:8080/gestion-conges/** |
| API Nest | **http://localhost:3000** |
| Postgres | `localhost:5433` (même volume qu’en mode « Postgres seul ») |

Variables utiles (fichier `.env` à la racine du repo ou environnement) :

- **`JWT_ACCESS_SECRET`** — si absent, une valeur de développement par défaut est utilisée (à changer en prod).

Seed optionnel après premier démarrage (types de congés globaux) :

```bash
docker compose exec api npm run prisma:seed
```

**Premier super-admin** (si aucun n’existe encore) — préférable avant la mise en prod :

```bash
docker compose exec -e BOOTSTRAP_ADMIN_EMAIL=toi@example.com -e BOOTSTRAP_ADMIN_PASSWORD="MotDePasseSûr" api npm run bootstrap-admin
```

Promouvoir un compte déjà créé :

```bash
docker compose exec -e PROMOTE_SUPER_ADMIN_EMAIL=collegue@example.com api npm run promote-super-admin
```

Voir **`docs/guides/CREATE_FIRST_ADMIN.md`**.

HTTPS en production : placer un reverse-proxy (Caddy, Traefik, Nginx + Let’s Encrypt) devant ces services — pas encore configuré ici.
