-- Migration pour ajouter week_start_day dans user_preferences
-- Exécutez ce script dans Supabase > SQL Editor

ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS week_start_day INTEGER DEFAULT 0;

-- Commentaire : 
-- 0 = Dimanche (par défaut)
-- 1 = Lundi
-- 2 = Mardi
-- 3 = Mercredi
-- 4 = Jeudi
-- 5 = Vendredi
-- 6 = Samedi


