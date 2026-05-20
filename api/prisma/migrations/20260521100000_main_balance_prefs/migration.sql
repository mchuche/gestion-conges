-- Préférences : types affichés dans le bandeau « Jours restants » (choix utilisateur).
ALTER TABLE "UserPreferences" ADD COLUMN "mainBalanceTypeIds" JSONB NOT NULL DEFAULT '[]';

-- Catalogue : le type peut être proposé dans ce bandeau (ex. enfant malade = false).
ALTER TABLE "GlobalLeaveType" ADD COLUMN "eligibleForMainBalance" BOOLEAN NOT NULL DEFAULT true;

UPDATE "GlobalLeaveType" SET "eligibleForMainBalance" = false WHERE id IN ('maladie', 'grève');
