-- Préférences vacances scolaires (essai visuel : chiffre du jour coloré). Désactivé par défaut.
ALTER TABLE "UserPreferences" ADD COLUMN "showSchoolHolidays" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "UserPreferences" ADD COLUMN "schoolHolidayZone" TEXT;
