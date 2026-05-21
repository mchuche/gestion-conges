-- Préférence : griser ou non les jours / congés passés dans le calendrier (défaut = grisé, comportement actuel).
ALTER TABLE "UserPreferences" ADD COLUMN "grayPastLeaves" BOOLEAN NOT NULL DEFAULT true;
