-- Migration : Ajouter la catégorie aux types de congés
-- À exécuter dans Supabase > SQL Editor
-- Date: 2025

-- Ajouter la colonne category à leave_types
ALTER TABLE leave_types ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'leave';

-- Ajouter une contrainte pour s'assurer que category est soit 'leave' soit 'event'
ALTER TABLE leave_types 
ADD CONSTRAINT check_category 
CHECK (category IN ('leave', 'event'));

-- Classer les types existants
-- Congés (avec quotas) - par défaut
UPDATE leave_types 
SET category = 'leave' 
WHERE category IS NULL OR category = 'leave';

-- Événements (sans quotas) - identifier par leur ID
UPDATE leave_types 
SET category = 'event' 
WHERE id IN ('télétravail', 'formation', 'grève', 'maladie');

-- Mettre à jour les types par défaut dans app_settings si nécessaire
-- (Cette partie peut être faite manuellement par l'admin si besoin)

