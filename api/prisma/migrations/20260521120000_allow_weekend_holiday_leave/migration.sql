-- Préférence individuelle : autoriser la pose d'absences/événements les week-ends et jours fériés.
ALTER TABLE "UserPreferences" ADD COLUMN "allowWeekendHolidayLeave" BOOLEAN NOT NULL DEFAULT false;
