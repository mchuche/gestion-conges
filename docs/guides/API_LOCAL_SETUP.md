# API NestJS + PostgreSQL — démarrage local

Le backend vit dans le dossier `api/` (monorepo avec le front Vue).

## Prérequis

- Node.js 20+ (recommandé)
- Docker (pour PostgreSQL uniquement, au choix)

## 1) Lancer PostgreSQL

À la racine du dépôt :

```bash
docker compose up -d
```

Attendre que le conteneur soit prêt (`healthy`).

PostgreSQL est exposé sur le port **5433** de la machine hôte (pour éviter un conflit avec un Postgres déjà installé sur **5432**). Si tu vois des conteneurs orphelins d’un ancien compose, tu peux lancer : `docker compose up -d --remove-orphans`.

## 2) Configurer l’API

```bash
cd api
copy .env.example .env
```

Sur Linux/macOS : `cp .env.example .env`

Vérifier que `DATABASE_URL` correspond au `docker-compose.yml` (utilisateur `gestion`, mot de passe `gestion_dev`, base `gestion_conges`).

Copier aussi les variables JWT depuis `.env.example` : `JWT_ACCESS_SECRET` (obligatoire), `JWT_ACCESS_EXPIRES`, `JWT_REFRESH_EXPIRES_DAYS` (durée du refresh opaque en base).

## 3) Migrations Prisma + démarrage

```bash
npm install
npm run prisma:generate
```

**Première création de schéma** (développement, génère une migration) :

```bash
npm run prisma:migrate
```

**Après un `git clone`** (migrations déjà dans le dépôt) :

```bash
npx prisma migrate deploy
```

L’historique Prisma est réduit à **une migration** (`20260511190000_init`) qui recrée tout le schéma. Si tu avais encore une base construite avec les **anciennes** migrations et que `migrate deploy` échoue (tables déjà présentes), vide le schéma puis réapplique — par exemple avec Postgres sous Docker :

```bash
docker exec gestion-conges-db psql -U gestion -d gestion_conges -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public; GRANT ALL ON SCHEMA public TO gestion;"
cd api && npx prisma migrate deploy && npm run prisma:seed
```

```bash
npm run start:dev
```

## 4) Vérifier

- `GET http://localhost:3000/health` → `status: ok`, `database: connected`

## Endpoints utiles (résumé)

| Méthode | Chemin | Auth | Rôle |
|--------|--------|------|------|
| POST | `/auth/register` | non | Création de compte + tokens |
| POST | `/auth/login` | non | Connexion + tokens |
| POST | `/auth/refresh` | non | Body `{ "refreshToken" }` |
| POST | `/auth/logout` | non | Body `{ "refreshToken" }` (révocation) |
| GET | `/auth/me` | Bearer | Profil `{ id, email, name, is_admin, is_super_admin }` |
| GET | `/users/me` | Bearer | **Identique** à `/auth/me` (alias pour clients REST) |
| DELETE | `/users/me` | Bearer | Supprime le compte (cascade Prisma) ; le client efface les jetons |
| GET | `/leaves` | Bearer | `{ items: [{ id, dateKey, leaveTypeId }] }` |
| POST | `/leaves/sync` | Bearer | Body `{ "entries": { "2026-04-01": "congé-payé" } }` |
| PATCH | `/leaves` | Bearer | Body `{ "dateKey", "leaveTypeId" \| null }` |
| PATCH | `/leaves/for-user` | Bearer | Idem + `targetUserId` (règles événements pour les autres users) |
| GET | `/leaves/team?userIds=id1,id2` | Bearer | `{ byUser: { [userId]: { [dateKey]: leaveTypeId } } }` |
| GET | `/leave-types` | Bearer | Types fusionnés + création des personnalisations par défaut si besoin |
| POST | `/leave-types/save` | Bearer | Body `{ "items": [{ "global_type_id", "color" }] }` (couleurs `#RRGGBB`) |
| GET | `/teams` | Bearer | `{ teams: [...] }` (rôle, `createdBy`, etc.) |
| POST | `/teams` | Bearer | Body `{ "name", "description?" }` — créateur = owner |
| GET | `/teams/:teamId/members` | Bearer | Membres + emails |
| GET / POST / DELETE | `/teams/:teamId/invitations` … | Bearer | Invitations (owner pour créer / annuler) |
| GET | `/teams/invitations/mine` | Bearer | Invitations `pending` pour l’email du JWT |
| POST | `/teams/invitations/:id/accept` \| `decline` | Bearer | — |
| POST | `/teams/:teamId/transfer` | Bearer | Body `{ "newOwnerId" }` |
| DELETE | `/teams/:teamId` | Bearer | Owner uniquement |
| GET | `/notifications` | Bearer | `{ items }` |
| POST | `/notifications` | Bearer | Body `{ targetUserId, type, title, message, data? }` — règles métier pour `event_modified` |
| PATCH | `/notifications/:id/read` | Bearer | — |
| POST | `/notifications/read-all` | Bearer | Tout marquer lu |
| DELETE | `/notifications/read/all` | Bearer | Supprimer les lues |
| DELETE | `/notifications/:id` | Bearer | — |
| GET | `/quotas` | Bearer | `{ byYear: { [year]: { [leaveTypeId]: number } } }` |
| PUT | `/quotas` | Bearer | Body `{ "byYear": { ... } }` (remplace les quotas de l’utilisateur) |
| GET | `/preferences` | Bearer | Préférences UI en **snake_case** (`selected_country`, `week_start_day`, `event_opacity`, `holiday_weekend_intensity`, `theme_mode`) |
| PATCH | `/preferences` | Bearer | Champs optionnels en **camelCase** (`selectedCountry`, `weekStartDay`, `eventOpacity`, `holidayWeekendIntensity`, `themeMode`) |
| GET | `/recurring-events` | Bearer | `{ events: [...] }` (règles sérialisées en snake_case pour le front) |
| GET | `/recurring-events/team?userIds=id1,id2` | Bearer | `{ byUser: { [userId]: events[] } }` (actifs seulement) |
| POST | `/recurring-events` | Bearer | Création (DTO camelCase : `leaveTypeId`, `recurrenceType`, `recurrencePattern`, `startDate`, etc.) |
| PATCH | `/recurring-events/:id` | Bearer | Mise à jour partielle |
| DELETE | `/recurring-events/:id` | Bearer | Suppression |
| GET | `/admin/stats` | Bearer | Admin : compteurs globaux |
| GET | `/admin/users?q=` | Bearer | Admin : liste utilisateurs (+ `leavesCount`, `teamsCount`) |
| DELETE | `/admin/users/:id` | Bearer | **Super-admin** uniquement |
| GET | `/admin/teams` | Bearer | Admin : équipes + `membersCount` |
| DELETE | `/admin/teams/:id` | Bearer | Admin |
| GET / POST / PATCH / DELETE | `/admin/global-leave-types` … | Bearer | CRUD types globaux (suppression : cascade congés/quotas/personnalisations côté serveur) |
| GET | `/admin/app-settings` | Bearer | `{ defaultLeaveTypes, defaultQuotas }` (JSON ou `null` si jamais sauvegardé) |
| PUT | `/admin/app-settings` | Bearer | Body `{ defaultLeaveTypes?, defaultQuotas? }` — au moins un champ ; enregistre aussi un log `settings_updated` |
| GET | `/admin/audit-logs?limit=` | Bearer | `{ logs: [{ id, userId, userEmail, action, entityType, entityId, details, createdAt }] }` (actions admin : suppressions, types globaux, paramètres) |

## Front

Dans `.env` à la racine du projet front (Vite) :

```env
VITE_API_URL=http://localhost:3000
```

Les stores **auth**, **leaves**, **leaveTypes**, **teams**, **notifications**, **quotas**, **recurringEvents**, **ui** (préférences), et l’administration (**`AdminView`** via `services/adminApi.js`) utilisent `src/services/api.js`. L’onglet **paramètres** admin persiste les JSON par défaut via **`/admin/app-settings`** ; l’onglet **audit** lit **`/admin/audit-logs`**.

## Alternative : tout Docker (API + Nginx + Postgres)

Voir **`docker/README.md`** à la racine : `docker compose --profile docker up -d --build` — même URL d’API pour le navigateur (`http://localhost:3000`). HTTPS à prévoir plus tard en prod derrière un reverse-proxy.

## Sans Docker

Installer PostgreSQL localement, créer la base `gestion_conges` et un utilisateur, puis adapter `DATABASE_URL` dans `api/.env`.
