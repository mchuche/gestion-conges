# Mémo — démarrage / arrêt (local)

Référence détaillée : **`docs/INSTALL.md`** · Docker : **`docker/README.md`**

Toutes les commandes sont à exécuter **à la racine du dépôt** (`gestion-conges/`).

---

## Mode Docker (tout en conteneurs)

Comme en prod sur la VM : front Nginx + API Nest + Postgres.

| Action | Commande |
|--------|----------|
| **Démarrer** | `docker compose --profile docker up -d` |
| **Démarrer + rebuild** (après modif code) | `docker compose --profile docker up -d --build` |
| **Rebuild un seul service** | `docker compose --profile docker up -d --build api` ou `web` |
| **Arrêter** | `docker compose --profile docker down` |
| **État** | `docker compose --profile docker ps` |

**URLs :**

| Service | URL |
|---------|-----|
| Application | http://localhost:8080/ |
| API (test) | http://localhost:3000/health |

**Équivalent npm :** `npm run docker-stack` (avec `--build`) · LAN : `npm run docker-stack-lan` (fichier `.env.docker`).

**Attention :** ne pas lancer `npm run api:dev` en parallèle (port **3000** déjà pris par le conteneur).

**Données / admin (optionnel) :**

```bash
docker compose exec api npm run prisma:seed
docker compose exec -e BOOTSTRAP_ADMIN_EMAIL=toi@example.com -e BOOTSTRAP_ADMIN_PASSWORD="MotDePasse" api npm run bootstrap-admin
```

**Base locale incohérente (dev uniquement, données perdues) :**

```bash
npm run db:reset
# ou depuis Docker si l’API ne démarre pas : voir docs/INSTALL.md « Dépannage migrations »
```

---

## Mode dev (recommandé pour coder)

**Postgres dans Docker** ; **API** (`npm run api:dev`) et **front** (`npm run dev`) sur ta machine. Prisma et Nest lisent la base via **`api/.env`**.

### 1. PostgreSQL (Docker, sans profil `docker`)

Une seule commande démarre **uniquement** le conteneur Postgres (pas l’API ni le front Docker) :

```bash
docker compose up -d
```

| Info | Valeur |
|------|--------|
| Conteneur | `gestion-conges-db` |
| Port sur ton PC | **5433** (mappé sur 5432 dans le conteneur) |
| Base | `gestion_conges` |
| Utilisateur / mot de passe | `gestion` / `gestion_dev` |

**Vérifier que Postgres tourne :**

```bash
docker compose ps
# ou test direct :
docker exec gestion-conges-db pg_isready -U gestion -d gestion_conges
```

**Arrêter Postgres seul** (API/front déjà coupés) : `docker compose down` — les données restent dans le volume Docker.

**Explorer les tables** (optionnel) : `npm run prisma:studio` (lit `DATABASE_URL` dans `api/.env`).

### 2. Fichiers `.env` (une fois)

```bash
copy .env.example .env
copy api\.env.example api\.env
```

**Racine `.env`** (front Vite) :

```env
VITE_API_URL=http://localhost:3000
```

**`api/.env`** (Nest + Prisma) — ligne **essentielle** pour joindre Postgres Docker :

```env
DATABASE_URL="postgresql://gestion:gestion_dev@localhost:5433/gestion_conges?schema=public"
PORT=3000
CORS_ORIGIN=http://localhost:5173
JWT_ACCESS_SECRET=change-me-access-secret-min-32-chars
```

Le port **5433** est obligatoire en mode dev : c’est le port **hôte** du `docker-compose.yml`, pas `5432`.

### 3. Schéma Prisma (première fois ou après clone)

```bash
npm run api:install
npm run prisma:generate
npm run migrate
npm run prisma:seed
```

Ces commandes s’exécutent **sur ton PC** (Node) mais appliquent le schéma **sur la base dans Docker** grâce à `DATABASE_URL`.

**Après modification de `api/prisma/schema.prisma` :** `npm run migrate:dev` (crée + applique une migration).

**Base locale cassée / migrations en échec (dev, données perdues) :** `npm run db:reset`

### 4. Lancer (2 terminaux)

**Terminal 1 — API :**

```bash
npm run api:dev
```

**Terminal 2 — Front :**

```bash
npm install
npm run dev
```

| Service | URL |
|---------|-----|
| Application | http://localhost:5173/ |
| API (test) | http://localhost:3000/health |

### 5. Arrêter

- `Ctrl+C` dans chaque terminal (api:dev, dev).
- Postgres : `docker compose down` (données conservées dans le volume).

### 6. Tester sur le téléphone (même Wi‑Fi)

1. IP du PC : `ipconfig` → IPv4 Wi‑Fi (ex. `192.168.0.47`).
2. **`.env`** : `VITE_API_URL=http://192.168.0.47:3000` (ton IP, pas `localhost`).
3. **`api/.env`** : ajouter à `CORS_ORIGIN` : `http://192.168.0.47:5173` (en plus de localhost).
4. Lancer **`npm run api:dev`** puis **`npm run dev:lan`** (obligatoire : `dev:lan`, pas `dev`).
5. Téléphone : **`http://192.168.0.47:5173/`** — autoriser Node dans le pare-feu Windows si besoin.

---

## Choisir le mode

| Besoin | Mode |
|--------|------|
| Modifier le code souvent | **dev** (5173 + api:dev) |
| Tester comme la VM / sans Node sur le PC | **Docker** (8080 + conteneur api) |
| Port 3000 déjà utilisé | Arrêter l’autre mode avant de lancer |

---

## Préproduction (LXC Proxmox, branche `develop`)

**Branche Git :** `develop` (préprod) · `main` (production).

### Première installation sur le LXC

```bash
cd /opt
git clone https://github.com/mchuche/gestion-conges.git
cd gestion-conges
git fetch origin
git checkout develop

cp .env.docker.example .env.docker
nano .env.docker   # voir ci-dessous
docker compose --env-file .env.docker --profile docker up -d --build

docker compose exec api npm run migrate:deploy
docker compose exec api npm run prisma:seed
docker compose exec -e BOOTSTRAP_ADMIN_EMAIL=toi@example.com \
  -e BOOTSTRAP_ADMIN_PASSWORD="MotDePasse" \
  api npm run bootstrap-admin
```

**`.env.docker` (exemple)** — remplacer `IP_DU_LXC` par l’IP du conteneur Proxmox :

```env
DOCKER_PUBLIC_API_URL=http://IP_DU_LXC:3000
DOCKER_CORS_ORIGINS=http://IP_DU_LXC:8080,http://127.0.0.1:8080
JWT_ACCESS_SECRET=secret-preprod-long-minimum-32-caracteres-differents-de-la-prod
```

Navigateur : `http://IP_DU_LXC:8080/` · test API : `http://IP_DU_LXC:3000/health`

### Mise à jour après un push sur `develop`

```bash
cd /opt/gestion-conges
git pull origin develop
docker compose --env-file .env.docker --profile docker up -d --build
docker compose exec api npm run migrate:deploy
```

---

## VM / production (branche `main`)

```bash
cd /opt/gestion-conges   # ou le chemin sur le LXC prod
git checkout main
git pull origin main
docker compose --env-file .env.docker --profile docker up -d --build
docker compose exec api npm run migrate:deploy
```

URLs : `https://freetime.chuche.eu/` · `https://api.freetime.chuche.eu/health`
