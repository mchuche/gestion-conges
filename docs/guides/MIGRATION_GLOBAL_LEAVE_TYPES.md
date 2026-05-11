# Types de congés globaux et personnalisations

Ce document décrit le **modèle métier actuel** (Nest + Prisma), pas une procédure SQL à rejouer à la main.

## Idée générale

- **`GlobalLeaveType`** : référentiel des types (id stable, nom, libellé, catégorie). Géré côté **administration**.
- **`LeaveTypeCustomization`** : par utilisateur, personnalisation (couleur, etc.) liée à un type global.
- **Quotas** : toujours par utilisateur / année / type (voir schéma Prisma et stores front `leaveTypes` / `quotas`).

Les anciennes instructions « exécuter un script dans le SQL Editor » concernaient une stack abandonnée ; aujourd’hui le schéma est porté par **`api/prisma/schema.prisma`** et les migrations dans **`api/prisma/migrations/`**.

## Ce que tu dois faire en pratique

1. **Nouvelle base** : `cd api && npx prisma migrate deploy` (après `docker compose up` et `.env` avec `DATABASE_URL`).
2. **Données de base** : le **seed** Prisma (`api/prisma/seed.js`) peut initialiser les `GlobalLeaveType` ; adapte si besoin.
3. **Évolution du schéma** : modifier `schema.prisma`, générer une migration Prisma, déployer — ne pas copier-coller d’anciens scripts SQL sauf migration de données ponctuelle que tu maîtrises.

## Pour les administrateurs (UI)

- Gérer les labels / types globaux depuis l’interface **Admin** de l’app (selon les écrans implémentés).
- Les utilisateurs ajustent couleurs / quotas depuis la **configuration** (⚙️).

## Compatibilité front

Le store `leaveTypes` expose des identifiants alignés sur les **types globaux** pour le calendrier et les filtres ; les détails d’implémentation sont dans `src/stores/leaveTypes.js` et les appels **`src/services/api.js`**.

## Fichiers SQL historiques

D’éventuels scripts de transition très anciens sont rangés sous **`docs/archive/`** (hors chemin d’installation standard). Pour toute nouvelle installation ou évolution, rester sur **Prisma**.
