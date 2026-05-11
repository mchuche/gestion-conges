# Installation — référence unique (développement local)

Ce fichier est la **source de vérité** pour démarrer le projet. Les autres guides (`README`, `API_LOCAL_SETUP`, `docker/README`) renvoient ici pour les commandes communes.

---

## Variables d’environnement

Il y a **deux** fichiers `.env` distincts :

| Emplacement | Rôle | Copier depuis |
|-------------|------|----------------|
| **`.env`** à la **racine** du dépôt | Front **Vite** (`import.meta.env.VITE_*`) | `.env.example` |
| **`api/.env`** | **NestJS** + **Prisma** (base, JWT, CORS) | `api/.env.example` |

| Variable (racine) | Exemple | Usage |
|-------------------|---------|--------|
| `VITE_API_URL` | `http://localhost:3000` | URL de base de l’API pour le navigateur (sans slash final). |

| Variables typiques (`api/.env`) | Rôle |
|---------------------------------|------|
| `DATABASE_URL` | PostgreSQL — avec Docker local : port hôte **5433** (voir `docker-compose.yml`) |
| `JWT_ACCESS_SECRET` | Obligatoire ; chaîne longue et aléatoire en production |
| `PORT` | API (défaut `3000`) |
| `CORS_ORIGIN` | Origines du front (ex. `http://localhost:5173`) |

Ne **committe jamais** les fichiers `.env` réels (déjà dans `.gitignore`).

---

## Parcours minimal (recommandé)

**Postgres** via Docker à la racine, **API** et **front** lancés avec Node sur ta machine.

### 1. PostgreSQL

```bash
docker compose up -d
```

Port **5433** → base `gestion_conges` (voir `docker-compose.yml`).

### 2. Dépendances et configuration API

```bash
npm run api:install
copy api\.env.example api\.env
```

Sur Linux/macOS : `cp api/.env.example api/.env`

Vérifie **`DATABASE_URL`** dans `api/.env` (utilisateur `gestion`, mot de passe `gestion_dev`, port **5433** si tu utilises le compose du dépôt).

### 3. Schéma base de données

```bash
npm run prisma:generate
npm run migrate
```

Après un **`git clone`**, les migrations sont déjà dans `api/prisma/migrations/` : `migrate` exécute `prisma migrate deploy`.

Si `migrate` échoue (anciennes tables / historique incompatible), voir **Dépannage migrations** ci-dessous.

### 4. Données initiales (optionnel)

```bash
npm run prisma:seed
```

Types globaux + scripts admin si tu as défini `BOOTSTRAP_*` / `PROMOTE_SUPER_ADMIN_EMAIL` dans `api/.env` — voir **`docs/guides/CREATE_FIRST_ADMIN.md`**.

### 5. Lancer l’API

```bash
npm run api:dev
```

Vérification : **`GET http://localhost:3000/health`**.

### 6. Front Vue

À la **racine** :

```bash
npm install
copy .env.example .env
```

Renseigne **`VITE_API_URL=http://localhost:3000`** dans `.env`, puis :

```bash
npm run dev
```

Navigateur : **`http://localhost:5173/gestion-conges/`** (base path `/gestion-conges/`).

### Scripts utiles à la racine

| Commande | Effet |
|----------|--------|
| `npm run api:install` | Installe les dépendances dans **`api/`** |
| `npm run api:dev` | API Nest en mode watch (`nest start --watch`) |
| `npm run migrate` | Applique les migrations (`prisma migrate deploy` dans `api/`) |
| `npm run migrate:dev` | Crée une migration après modification de `schema.prisma` |
| `npm run prisma:generate` | Régénère le client Prisma |
| `npm run prisma:studio` | Ouvre Prisma Studio |
| `npm run prisma:seed` | Seed + bootstrap admin si variables définies |
| `npm run bootstrap-admin` | Premier super-admin (`BOOTSTRAP_*`) |
| `npm run promote-super-admin` | Promouvoir un utilisateur existant (`PROMOTE_SUPER_ADMIN_EMAIL`) |
| `npm run db:reset` | **Dev uniquement** — vide la base, réapplique les migrations + **seed** (`prisma migrate reset --force`) |
| `npm run docker-stack` | Compose **profil docker** : Postgres + API + Nginx (URLs par défaut localhost) |
| `npm run docker-stack-lan` | Idem avec **`--env-file .env.docker`** (LAN / VM — voir **`.env.docker.example`**) |

---

## Base de données et Prisma — workflows

### Modifier le schéma (`schema.prisma`)

1. Éditer **`api/prisma/schema.prisma`**
2. Lancer **`npm run migrate:dev`** — Prisma crée une migration, l’applique à ta base locale et régénère le client (tu choisis le nom de la migration).
3. **Commit** le nouveau dossier sous **`api/prisma/migrations/`**

Sur une autre machine ou après déploiement : **`npm run migrate`** (équivalent `prisma migrate deploy`).

### Repartir de zéro en développement (**toutes les données perdues**)

Quand l’historique Prisma et la base locale ne correspondent plus (`migrate` échoue, tables fantômes, tests ratés) :

```bash
npm run db:reset
```

Cela exécute **`prisma migrate reset --force`** dans **`api/`** : effacement des données, réapplication de **toutes** les migrations, puis **`npm run prisma:seed`** (seed Prisma configuré dans `api/package.json`).

**Prérequis :** PostgreSQL joignable (`DATABASE_URL` dans `api/.env`) ; avec Docker, le service **`postgres`** doit tourner (`docker compose up -d`).

---

## Docker

- **Postgres seul** ou **stack complète** (API + Nginx) : **`docker/README.md`**
- Stack complète depuis une **autre machine que la VM** (navigateur ≠ hôte Docker) : fichier **`.env.docker.example`** → **`.env.docker`**, variables **`DOCKER_PUBLIC_API_URL`** et **`DOCKER_CORS_ORIGINS`**, puis **`npm run docker-stack-lan`** (ou commande équivalente dans **`docker/README.md`**).
- Les **variables JWT** pour les conteneurs passent par le compose ou `docker compose exec -e …`.

### Lien avec Prisma / migrations (« éviter les surprises »)

Les commandes **`npm run migrate`**, **`migrate:dev`**, **`db:reset`**, etc. ne remplacent **pas** Docker : elles s’exécutent **sur ton PC** (Node installé localement) et ne font qu’une chose — se connecter à PostgreSQL via **`DATABASE_URL`** dans **`api/.env`**.

| Situation | Ce qu’il faut pour que ce soit cohérent |
|-----------|----------------------------------------|
| Tu utilises **Postgres du `docker compose`** + API **`npm run api:dev`** | **`DATABASE_URL`** doit cibler **`localhost:5433`** (port **hôte** mappé dans `docker-compose.yml`), pas `5432`, sauf si tu parles à un Postgres **autre** que ce conteneur. |
| Le conteneur **`api`** parle à Postgres | Dans le compose, l’URL utilise **`postgres:5432`** (nom de service réseau Docker, port **interne** du conteneur) — c’est **différent** de la config sur ta machine hôte. |
| Docker / Postgres **arrêtés** | `migrate` / `db:reset` **échouent** (rien à joindre) ou peuvent se rabattre sur une erreur réseau — pas un bug Prisma. |

En résumé : **Docker** = *où* tourne le serveur PostgreSQL et *quel port* tu dois mettre dans **`DATABASE_URL`**. **Prisma** = *quel schéma* appliquer **sur cette base**. Si `DATABASE_URL` pointe vers une autre instance (ex. Postgres local sur 5432 alors que tu crois utiliser Docker), tu peux « réparer » une base pendant que l’app parle à une autre — d’où les surprises. Détail des URLs et profils : **`docker/README.md`**.

---

## Déploiement front statique (GitHub Pages)

**`docs/guides/DEPLOY_GITHUB_PAGES.md`** — secret **`VITE_API_URL`** vers ton API en HTTPS.

---

## Dépannage migrations

L’historique Prisma est une **migration baseline** (`*_init`). Si **`npm run migrate`** échoue (tables déjà présentes, `_prisma_migrations` incohérent) :

1. **Le plus simple en dev** : **`npm run db:reset`** (voir section « Repartir de zéro » ci-dessus).

2. **Alternative manuelle** (même effet que reset sur le schéma, sans passer par Prisma reset) :

```bash
docker exec gestion-conges-db psql -U gestion -d gestion_conges -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public; GRANT ALL ON SCHEMA public TO gestion;"
npm run migrate
npm run prisma:seed
```

---

## Suite de la doc

| Fichier | Contenu |
|---------|---------|
| **`docs/guides/API_LOCAL_SETUP.md`** | Table des **endpoints** REST, détail Vite / sans Docker |
| **`docs/guides/README.md`** | Index des guides |
| **`docs/notes/`** | Notes internes (TODO, revue, etc.) |
| **`docs/archive/`** | Archives historiques |
