# Préprod — connexion & droits admin

## Pourquoi le bootstrap dit « super_admin existe déjà »

`bootstrap-admin` ne crée un super_admin **que s’il n’y en a aucun**.  
S’il en existe déjà un (même un ancien compte de test), **rien n’est modifié** — c’est normal.

Ce n’est **pas** la bonne commande pour récupérer **vos** droits.

## Récupérer le super_admin sur **votre** email

1. Votre compte doit exister dans **`User`** (inscription sur la préprod ou compte déjà créé).
2. Sur le serveur préprod :

```bash
cd /opt/gestion-conges   # ou PREPROD_DEPLOY_PATH
docker compose exec -e PROMOTE_SUPER_ADMIN_EMAIL=votre@email.com api npm run promote-super-admin
```

3. **Déconnexion** puis reconnexion (le JWT doit être régénéré avec `is_super_admin: true`).

PowerShell en local (API pointée sur la base préprod via `DATABASE_URL` dans `api/.env`) :

```powershell
$env:PROMOTE_SUPER_ADMIN_EMAIL="votre@email.com"
npm run promote-super-admin
```

## Voir qui est admin en base

```bash
docker compose exec api npm run list-admins
```

Le bootstrap affiche aussi l’email du super_admin existant s’il refuse de s’exécuter.

## Comptes démo (marie.dubois@…)

- Email exact : `marie.dubois@demo.gestion-conges.test` (pas `@demo.local`)
- Mot de passe : `Demo2026!`
- Le seed démo ne tourne **que** si GitHub a la variable **`PREPROD_DEMO_SEED=1`** (voir `DEMO_SEED.md`).

Si `list-admins` affiche **0 comptes démo** :

```bash
docker compose exec -e ALLOW_DEMO_SEED=1 api npm run prisma:seed-demo
```

Puis réessayez la connexion.

## Rôle `admin` vs `super_admin`

Seul **`super_admin`** donne `is_super_admin: true` dans le JWT (écran admin complet).  
Un rôle **`admin`** seul donne `is_admin` mais pas super.

`promote-super-admin` force toujours le rôle **`super_admin`**.
