-- Migration pour ajouter la table recurring_events
-- Exécutez ce script dans Supabase > SQL Editor

-- Table pour les événements récurrents
CREATE TABLE IF NOT EXISTS recurring_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    leave_type_id TEXT NOT NULL,
    period TEXT DEFAULT 'full' CHECK (period IN ('full', 'morning', 'afternoon')),
    
    -- Règle de récurrence
    recurrence_type TEXT NOT NULL CHECK (recurrence_type IN ('daily', 'weekly', 'monthly', 'yearly')),
    recurrence_pattern JSONB NOT NULL, -- Stocke les détails (jours de la semaine, etc.)
    
    -- Période de validité
    start_date DATE NOT NULL,
    end_date DATE, -- NULL = sans fin
    max_occurrences INTEGER, -- Limite le nombre d'occurrences
    
    -- Exclusion de dates spécifiques
    excluded_dates DATE[] DEFAULT '{}',
    
    -- Métadonnées
    name TEXT, -- Nom optionnel pour identifier la série
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_recurring_events_user_active ON recurring_events(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_recurring_events_dates ON recurring_events(start_date, end_date);

-- Activer Row Level Security (RLS)
ALTER TABLE recurring_events ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
DROP POLICY IF EXISTS "Users can view own recurring_events" ON recurring_events;
DROP POLICY IF EXISTS "Users can insert own recurring_events" ON recurring_events;
DROP POLICY IF EXISTS "Users can update own recurring_events" ON recurring_events;
DROP POLICY IF EXISTS "Users can delete own recurring_events" ON recurring_events;

CREATE POLICY "Users can view own recurring_events" ON recurring_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recurring_events" ON recurring_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurring_events" ON recurring_events
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurring_events" ON recurring_events
    FOR DELETE USING (auth.uid() = user_id);

-- Commentaire sur la structure
COMMENT ON TABLE recurring_events IS 'Table pour stocker les règles de récurrence des événements';
COMMENT ON COLUMN recurring_events.recurrence_pattern IS 'JSONB contenant les détails de la récurrence (ex: {"type": "weekly", "daysOfWeek": [2], "interval": 1})';

