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
-- Supprimer les politiques existantes si elles existent déjà (pour éviter les erreurs)
DROP POLICY IF EXISTS "Users can view own leaves" ON leaves;
DROP POLICY IF EXISTS "Users can insert own leaves" ON leaves;
DROP POLICY IF EXISTS "Users can update own leaves" ON leaves;
DROP POLICY IF EXISTS "Users can delete own leaves" ON leaves;

DROP POLICY IF EXISTS "Users can view own leave_types" ON leave_types;
DROP POLICY IF EXISTS "Users can insert own leave_types" ON leave_types;
DROP POLICY IF EXISTS "Users can update own leave_types" ON leave_types;
DROP POLICY IF EXISTS "Users can delete own leave_types" ON leave_types;

DROP POLICY IF EXISTS "Users can view own leave_quotas" ON leave_quotas;
DROP POLICY IF EXISTS "Users can insert own leave_quotas" ON leave_quotas;
DROP POLICY IF EXISTS "Users can update own leave_quotas" ON leave_quotas;
DROP POLICY IF EXISTS "Users can delete own leave_quotas" ON leave_quotas;

DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;

-- Créer les politiques pour les congés (INSERT, UPDATE, DELETE restent limités à l'utilisateur)
CREATE POLICY "Users can insert own leaves" ON leaves
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leaves" ON leaves
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own leaves" ON leaves
    FOR DELETE USING (auth.uid() = user_id);

-- Créer les politiques pour les types de congés (INSERT, UPDATE, DELETE restent limités à l'utilisateur)
CREATE POLICY "Users can insert own leave_types" ON leave_types
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leave_types" ON leave_types
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own leave_types" ON leave_types
    FOR DELETE USING (auth.uid() = user_id);

-- Créer les politiques pour les quotas
CREATE POLICY "Users can view own leave_quotas" ON leave_quotas
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own leave_quotas" ON leave_quotas
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leave_quotas" ON leave_quotas
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own leave_quotas" ON leave_quotas
    FOR DELETE USING (auth.uid() = user_id);

-- Créer les politiques pour les préférences
CREATE POLICY "Users can view own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Table pour les équipes/groups
CREATE TABLE IF NOT EXISTS teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les membres d'équipe
CREATE TABLE IF NOT EXISTS team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- Activer RLS pour les équipes
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les équipes : les membres peuvent voir leur équipe
-- Supprimer les politiques existantes si elles existent déjà
DROP POLICY IF EXISTS "Team members can view their teams" ON teams;
DROP POLICY IF EXISTS "Users can create teams" ON teams;
DROP POLICY IF EXISTS "Team owners can update their teams" ON teams;
DROP POLICY IF EXISTS "Team owners can delete their teams" ON teams;

DROP POLICY IF EXISTS "Team members can view team members" ON team_members;
DROP POLICY IF EXISTS "Team owners/admins can add members" ON team_members;
DROP POLICY IF EXISTS "Team owners/admins can update members" ON team_members;
DROP POLICY IF EXISTS "Team owners/admins can remove members" ON team_members;

CREATE POLICY "Team members can view their teams" ON teams
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM team_members 
            WHERE team_members.team_id = teams.id 
            AND team_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create teams" ON teams
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Team owners can update their teams" ON teams
    FOR UPDATE USING (
        auth.uid() = created_by OR
        EXISTS (
            SELECT 1 FROM team_members 
            WHERE team_members.team_id = teams.id 
            AND team_members.user_id = auth.uid()
            AND team_members.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Team owners can delete their teams" ON teams
    FOR DELETE USING (auth.uid() = created_by);

-- Politiques RLS pour les membres d'équipe
CREATE POLICY "Team members can view team members" ON team_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.team_id = team_members.team_id
            AND tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Team owners/admins can add members" ON team_members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.team_id = team_members.team_id
            AND tm.user_id = auth.uid()
            AND tm.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Team owners/admins can update members" ON team_members
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.team_id = team_members.team_id
            AND tm.user_id = auth.uid()
            AND tm.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Team owners/admins can remove members" ON team_members
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.team_id = team_members.team_id
            AND tm.user_id = auth.uid()
            AND tm.role IN ('owner', 'admin')
        )
    );

-- Modifier les politiques RLS pour permettre aux membres d'équipe de voir les congés des autres membres
-- On crée une fonction pour vérifier si deux utilisateurs sont dans la même équipe
CREATE OR REPLACE FUNCTION users_in_same_team(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM team_members tm1
        INNER JOIN team_members tm2 ON tm1.team_id = tm2.team_id
        WHERE tm1.user_id = user1_id
        AND tm2.user_id = user2_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ajouter une politique pour permettre aux membres d'équipe de voir les congés des autres
DROP POLICY IF EXISTS "Team members can view team leaves" ON leaves;
CREATE POLICY "Team members can view team leaves" ON leaves
    FOR SELECT USING (
        auth.uid() = user_id OR
        users_in_same_team(auth.uid(), user_id)
    );

-- Ajouter une politique pour permettre aux membres d'équipe de voir les types de congés des autres
DROP POLICY IF EXISTS "Team members can view team leave_types" ON leave_types;
CREATE POLICY "Team members can view team leave_types" ON leave_types
    FOR SELECT USING (
        auth.uid() = user_id OR
        users_in_same_team(auth.uid(), user_id)
    );




