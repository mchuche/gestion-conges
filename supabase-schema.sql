-- Script SQL pour créer les tables dans Supabase
-- Copiez-collez ce script dans Supabase > SQL Editor et exécutez-le

-- Table pour stocker les congés
CREATE TABLE IF NOT EXISTS leaves (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date_key TEXT NOT NULL,
    leave_type_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date_key)
);

-- Table pour les types de congés (par utilisateur)
CREATE TABLE IF NOT EXISTS leave_types (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    label TEXT NOT NULL,
    color TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, id)
);

-- Table pour les quotas par année (par utilisateur)
CREATE TABLE IF NOT EXISTS leave_quotas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    leave_type_id TEXT NOT NULL,
    year INTEGER NOT NULL,
    quota INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, leave_type_id, year)
);

-- Table pour les préférences utilisateur (pays, etc.)
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    selected_country TEXT DEFAULT 'FR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer Row Level Security (RLS)
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Politiques RLS : les utilisateurs ne peuvent voir/modifier que leurs propres données
CREATE POLICY "Users can view own leaves" ON leaves
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own leaves" ON leaves
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leaves" ON leaves
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own leaves" ON leaves
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own leave_types" ON leave_types
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own leave_types" ON leave_types
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leave_types" ON leave_types
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own leave_types" ON leave_types
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own leave_quotas" ON leave_quotas
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own leave_quotas" ON leave_quotas
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leave_quotas" ON leave_quotas
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own leave_quotas" ON leave_quotas
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id);




