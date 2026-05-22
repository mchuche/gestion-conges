# Données de démo (dev / préprod)

## Objectif

Peupler la base avec **5 utilisateurs fictifs**, **2 équipes** et des **congés / événements sur 2025–2026** (profils différents : été, RTT, télétravail le mardi, etc.) pour tester calendrier, quotas et matrice sans saisie manuelle.

## Comptes créés

| Email | Rôle fictif |
|-------|-------------|
| `marie.dubois@demo.gestion-conges.test` | Lead — grosse plage août |
| `lucas.martin@demo.gestion-conges.test` | Dev — RTT + Noël |
| `sophie.bernard@demo.gestion-conges.test` | Dev — juillet + jours hiver |
| `thomas.leroy@demo.gestion-conges.test` | Hybride — télétravail (mardis) |
| `emma.petit@demo.gestion-conges.test` | Junior — congés courts |

**Mot de passe** (tous) : `Demo2026!` (ou variable `DEMO_SEED_PASSWORD`).

## Équipes

- **Équipe Produit** — Marie (owner), Lucas, Sophie, Thomas  
- **Support & Ops** — Lucas (owner), Emma, Thomas  

## Préprod automatique (CI/CD)

À chaque deploy sur **`develop`** (`Deploy preprod`), si GitHub a :

**Settings → Secrets and variables → Actions** → secret **ou** variable :

- Nom : `PREPROD_DEMO_SEED`
- Valeur : `1` (ou `true`)

alors le workflow exécute après les migrations :

1. `prisma:seed` (types globaux)
2. `prisma:seed-demo` (comptes fictifs — **réinitialise** uniquement les users `*@demo.gestion-conges.test`)

Pour désactiver : supprimer la variable ou mettre une autre valeur.

**La production n’est pas concernée** (workflow `deploy-prod.yml` inchangé).

## Exécution manuelle

**Prérequis** : migrations à jour + seed des types globaux :

```bash
npm run migrate
npm run prisma:seed
```

**Seed démo** (obligatoire `ALLOW_DEMO_SEED=1`) :

```bash
# PowerShell
$env:ALLOW_DEMO_SEED="1"
npm run prisma:seed-demo

# Linux / conteneur API
ALLOW_DEMO_SEED=1 npm run prisma:seed-demo
```

Docker :

```bash
docker compose exec -e ALLOW_DEMO_SEED=1 api npm run prisma:seed-demo
```

## Sécurité

- Le script **refuse** de tourner sans `ALLOW_DEMO_SEED=1` ou `--force`.
- Il ne supprime **que** les utilisateurs `*@demo.gestion-conges.test` (et leurs données), pas votre compte admin.
- **Ne pas** lancer en production réelle avec de vrais utilisateurs sur la même base sans réfléchir.

## Réexécution

Relancer le script **efface et recrée** les congés / équipes / quotas des comptes démo (idempotent pour la démo).
