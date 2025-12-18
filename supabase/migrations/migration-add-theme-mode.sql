-- Script SQL pour ajouter le support du mode thème dans user_preferences
-- Exécutez ce script dans Supabase > SQL Editor

-- Ajouter la colonne theme_mode si elle n'existe pas déjà
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS theme_mode TEXT DEFAULT 'auto' 
CHECK (theme_mode IN ('auto', 'light', 'dark'));

-- Commentaire pour documenter la colonne
COMMENT ON COLUMN user_preferences.theme_mode IS 'Mode de thème: auto (suit la préférence système), light (clair), dark (sombre)';

-- Mettre à jour les préférences existantes pour utiliser 'auto' par défaut si NULL
UPDATE user_preferences 
SET theme_mode = 'auto' 
WHERE theme_mode IS NULL;

