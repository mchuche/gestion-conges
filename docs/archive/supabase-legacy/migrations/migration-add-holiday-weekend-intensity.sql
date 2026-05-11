-- Migration pour ajouter holiday_weekend_intensity dans user_preferences
-- Exécutez ce script dans Supabase > SQL Editor

ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS holiday_weekend_intensity TEXT DEFAULT 'normal';

-- Commentaire :
-- 'light' = Pâle (couleurs très discrètes)
-- 'normal' = Normal (couleurs par défaut)
-- 'strong' = Foncé (couleurs plus intenses)


