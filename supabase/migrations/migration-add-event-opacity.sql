-- Migration pour ajouter event_opacity dans user_preferences
-- Exécutez ce script dans Supabase > SQL Editor

ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS event_opacity NUMERIC(3,2) DEFAULT 0.15;

-- Commentaire : 
-- event_opacity est un nombre entre 0.0 (transparent) et 1.0 (opaque)
-- La valeur par défaut est 0.15 (15% d'opacité) pour rendre les événements discrets
-- Les utilisateurs peuvent ajuster cette valeur dans la configuration


