# Créer le premier administrateur

Stack actuelle : **NestJS + Prisma**, table **`AppAdmin`** liée à **`User`**.

## Méthode recommandée : script de bootstrap (installation)

### Variables (`api/.env` ou environnement shell)

| Variable | Obligatoire | Rôle |
|----------|-------------|------|
| `BOOTSTRAP_ADMIN_EMAIL` | oui* | Email du compte super-admin |
| `BOOTSTRAP_ADMIN_PASSWORD` | oui* | Mot de passe initial |
| `BOOTSTRAP_ADMIN_NAME` | non | Nom affiché (défaut : « Administrateur ») |

\*Les deux premières sont **requises ensemble**. Sinon le bootstrap est **ignoré**.

### Comportement

1. S’il existe **déjà** un enregistrement **`AppAdmin`** avec le rôle **`super_admin`**, **rien n’est fait** (idempotent — tu peux relancer en prod sans risque).
2. Sinon : création du **`User`** (hash bcrypt comme à l’inscription) s’il n’existe pas, puis **`AppAdmin`** en **`super_admin`**.
3. Si l’utilisateur existe déjà (ex. tu t’es inscrit avant), **seul le lien admin** est créé ; le **mot de passe** reste celui déjà en base.

### Commandes

À la **racine du dépôt** (recommandé) :

```bash
npm run bootstrap-admin
```

Ou dans **`api/`** :

```bash
cd api
npm run bootstrap-admin
```

Ou via le seed complet (types globaux + bootstrap si les variables sont définies) :

```bash
npm run prisma:seed
```

Le script réel est **`api/prisma/bootstrap-admin.js`** (également appelé depuis **`api/prisma/seed.js`**).

### Docker

Après `docker compose --profile docker up -d`, avec les variables uniquement pour cette commande :

```bash
docker compose exec -e BOOTSTRAP_ADMIN_EMAIL=toi@example.com -e BOOTSTRAP_ADMIN_PASSWORD="TonMotDePasse" api npm run bootstrap-admin
```

Ou ajoute les trois variables dans **`api/.env`** et monte-le dans le service `api` (compose) puis `docker compose exec api npm run bootstrap-admin`.

---

## Promouvoir quelqu’un qui est déjà dans la base (email)

Utile quand le compte existe déjà (inscription passée) et tu veux le passer en **super_admin**, **même si un autre super_admin existe déjà**.

### Variable

| Variable | Rôle |
|----------|------|
| `PROMOTE_SUPER_ADMIN_EMAIL` | Email exact du **`User`** (insensible à la casse côté script) |

### Commandes

À la racine du dépôt :

```bash
npm run promote-super-admin
```

(`api/.env` doit contenir `PROMOTE_SUPER_ADMIN_EMAIL=...`, ou export dans le shell.)

Exemple PowerShell sans modifier `.env` :

```powershell
$env:PROMOTE_SUPER_ADMIN_EMAIL="collegue@example.com"; npm run promote-super-admin
```

Le seed (`npm run prisma:seed`) exécute aussi cette étape **avant** le bootstrap si la variable est définie.

### Docker

```bash
docker compose exec -e PROMOTE_SUPER_ADMIN_EMAIL=collegue@example.com api npm run promote-super-admin
```

Si l’email n’existe pas en base, la commande **échoue** avec un message explicite.

---

## Méthode manuelle (sans script)

1. Crée un compte via l’app (**inscription**).
2. Récupère **`User.id`** (Prisma Studio : `cd api && npx prisma studio`).
3. SQL sur PostgreSQL :

```sql
INSERT INTO "AppAdmin" ("id", "userId", role)
VALUES (gen_random_uuid()::text, 'REMPLACER_PAR_USER_ID', 'super_admin');
```

4. Déconnexion puis reconnexion pour rafraîchir le JWT.

---

## Après coup

- **`npm run promote-super-admin`** : pour passer un utilisateur existant en super_admin (voir ci-dessus).
- **`npm run bootstrap-admin`** : uniquement tant qu’**aucun** super_admin n’existe (première installation).
- Sinon : SQL / Prisma Studio comme dans la section « Méthode manuelle ».
