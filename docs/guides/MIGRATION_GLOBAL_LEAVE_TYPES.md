# Types de congés globaux et personnalisations

Ce document décrit le **modèle métier actuel** (Nest + Prisma), pas une procédure SQL à rejouer à la main.

## Catégories (`GlobalLeaveType.category`)

| Valeur | Libellé UI | Effet |
|--------|------------|--------|
| **`absence`** | Absence | Retire l’ETP (matrice de présence), quotas possibles (CP, RTT, maladie, grève…) |
| **`event`** | Événement | Présence conservée, pas de quota (télétravail, formation…) |

L’ancienne valeur **`leave`** a été renommée en **`absence`** (alpha) : le mot « congé » ne couvrait pas maladie / grève.

Constantes code : `api/src/leave-types/leave-type-category.ts`, `src/constants/leaveTypeCategory.js`.

## Idée générale

- **`GlobalLeaveType`** : référentiel des types (id stable, nom, libellé, catégorie). Géré côté **administration**.
- **`LeaveTypeCustomization`** : par utilisateur, personnalisation (couleur, etc.) liée à un type global.
- **Quotas** : par utilisateur / année / type, en pratique pour les types **`absence`**.

## Déploiement (bases existantes)

1. `npm run migrate` — migration `20260520180000_category_absence`
2. `npm run prisma:seed` — types globaux + correction éventuelle de `default_leave_types` dans `AppSetting`

En alpha, un `npm run db:reset` repart aussi d’un état propre.

## Pour les administrateurs (UI)

- Gérer les types globaux depuis **Admin** (catégorie Absence / Événement).
- Les utilisateurs ajustent couleurs / quotas depuis la **configuration** (⚙️).

## Bandeau « Jours restants » (individu)

- **`UserPreferences.mainBalanceTypeIds`** : types cochés par l’utilisateur (Configuration ⚙️).
- **`GlobalLeaveType.eligibleForMainBalance`** : l’admin peut exclure un type du choix (ex. enfant malade = `false`).
- Défaut nouveau compte : `congé-payé`, `rtt`, `jours-hiver`.

## Compatibilité front

Le store `leaveTypes` normalise encore `leave` → `absence` si une vieille réponse API traîne.

Fichiers : `src/stores/leaveTypes.js`, `src/stores/ui.js`, `src/composables/useStats.js`.
