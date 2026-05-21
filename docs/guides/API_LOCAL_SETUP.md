# API NestJS — référence locale

Le backend vit dans **`api/`**. Pour **installer Postgres, `.env`, migrations, lancer l’API et le front**, suit d’abord **`docs/INSTALL.md`** (référence unique).

Ce fichier complète avec :

- la **liste des endpoints** ;
- des précisions **sans Docker** ;
- l’option **tout Docker** (profil compose).

---

## Vérifier que l’API répond

- **`GET http://localhost:3000/health`** → `status: ok`, `database: connected`

---

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
| PATCH | `/preferences` | Bearer | Champs optionnels en **camelCase** (`selectedCountry`, `weekStartDay`, `eventOpacity`, `holidayWeekendIntensity`, `themeMode`, `showSchoolHolidays`, `schoolHolidayZone`, …) |
| GET | `/day-notes?year=2026` | Bearer | `{ items: [{ dateKey, text, updatedAt }] }` — carnet (notes non vides) |
| PATCH | `/day-notes` | Bearer | Body `{ dateKey, text }` — texte vide = suppression |
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

---

## Front (rappel)

`VITE_API_URL` dans **`.env` à la racine** — voir **`docs/INSTALL.md`**.

Les stores utilisent **`src/services/api.js`** ; l’admin **`AdminView`** via **`src/services/adminApi.js`**.

---

## Alternative : tout Docker (API + Nginx + Postgres)

Sans HTTPS pour l’instant — **`docker/README.md`** : `docker compose --profile docker up -d --build`.  
Front : **`http://localhost:8080/`** ; API : **`http://localhost:3000`** (ou les URLs LAN si tu utilises **`.env.docker`**).

---

## Sans Docker

Installe PostgreSQL localement, crée la base **`gestion_conges`** et un utilisateur, puis adapte **`DATABASE_URL`** dans **`api/.env`**. Ensuite **`npm run migrate`** depuis la racine (ou `cd api && npx prisma migrate deploy`). En développement, si l’état des migrations et la base ne correspondent plus, **`npm run db:reset`** repart de zéro (migrations + seed — **toutes les données sont supprimées**) ; détail dans **`docs/INSTALL.md`**.
