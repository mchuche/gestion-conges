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

-- Table publique pour stocker les emails des utilisateurs (pour permettre la recherche)
-- Cette table est mise à jour automatiquement lors de l'inscription
CREATE TABLE IF NOT EXISTS user_emails (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS pour user_emails
ALTER TABLE user_emails ENABLE ROW LEVEL SECURITY;

-- Politique RLS : tout le monde peut lire les emails (pour permettre la recherche)
CREATE POLICY "Anyone can read user emails" ON user_emails
    FOR SELECT USING (true);

-- Politique RLS : les utilisateurs peuvent insérer leur propre email
CREATE POLICY "Users can insert own email" ON user_emails
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Fonction pour obtenir l'ID utilisateur par email
CREATE OR REPLACE FUNCTION get_user_id_by_email(user_email TEXT)
RETURNS UUID AS $$
DECLARE
    found_user_id UUID;
BEGIN
    SELECT user_id INTO found_user_id
    FROM user_emails
    WHERE email = LOWER(TRIM(user_email));
    
    RETURN found_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour insérer automatiquement l'email dans user_emails lors de l'inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_emails (user_id, email)
    VALUES (NEW.id, LOWER(NEW.email))
    ON CONFLICT (user_id) DO UPDATE SET email = LOWER(NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger si il n'existe pas déjà
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Mettre à jour user_emails pour les utilisateurs existants
INSERT INTO user_emails (user_id, email)
SELECT id, LOWER(email)
FROM auth.users
WHERE email IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

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

-- Table pour les invitations d'équipe
CREATE TABLE IF NOT EXISTS team_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(team_id, email)
);

-- Activer RLS pour les équipes
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- IMPORTANT : Créer les fonctions SECURITY DEFINER AVANT les politiques qui les utilisent
-- pour éviter la récursion infinie dans les politiques RLS
-- Ces fonctions s'exécutent avec les privilèges du créateur et contournent RLS
CREATE OR REPLACE FUNCTION is_team_member(team_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Utiliser SECURITY DEFINER pour contourner RLS
    RETURN EXISTS (
        SELECT 1 FROM team_members
        WHERE team_id = team_uuid
        AND user_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_team_owner_or_admin(team_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Utiliser SECURITY DEFINER pour contourner RLS
    RETURN EXISTS (
        SELECT 1 FROM team_members
        WHERE team_id = team_uuid
        AND user_id = user_uuid
        AND role IN ('owner', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION user_is_team_member(team_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Utiliser SECURITY DEFINER pour contourner RLS
    RETURN EXISTS (
        SELECT 1 FROM team_members
        WHERE team_id = team_uuid
        AND user_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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

-- Maintenant créer les politiques qui utilisent les fonctions (déjà créées ci-dessus)
CREATE POLICY "Team members can view their teams" ON teams
    FOR SELECT USING (
        -- Soit l'utilisateur est le créateur
        created_by = auth.uid()
        -- Soit l'utilisateur est membre de l'équipe (via fonction pour éviter récursion)
        OR user_is_team_member(teams.id, auth.uid())
    );

CREATE POLICY "Users can create teams" ON teams
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Team owners can update their teams" ON teams
    FOR UPDATE USING (
        auth.uid() = created_by OR
        is_team_owner_or_admin(teams.id, auth.uid())
    );

CREATE POLICY "Team owners can delete their teams" ON teams
    FOR DELETE USING (auth.uid() = created_by);

-- Politiques RLS pour les membres d'équipe
-- Utiliser les fonctions SECURITY DEFINER pour éviter la récursion
CREATE POLICY "Team members can view team members" ON team_members
    FOR SELECT USING (
        is_team_member(team_id, auth.uid())
    );

-- Pour INSERT : permettre si l'utilisateur est le créateur de l'équipe (via teams) ou owner/admin
-- IMPORTANT : Pour la première insertion (création de l'équipe), on vérifie UNIQUEMENT teams.created_by
-- Pour éviter la récursion, on ne vérifie pas d'abord si l'utilisateur est membre
CREATE POLICY "Team owners/admins can add members" ON team_members
    FOR INSERT WITH CHECK (
        -- Condition 1 : L'utilisateur est le créateur de l'équipe (permet la première insertion)
        EXISTS (
            SELECT 1 FROM teams
            WHERE teams.id = team_members.team_id
            AND teams.created_by = auth.uid()
        )
        -- Condition 2 : L'utilisateur est déjà owner/admin (pour les ajouts ultérieurs)
        -- Cette fonction utilise SECURITY DEFINER et contourne RLS
        OR is_team_owner_or_admin(team_members.team_id, auth.uid())
    );

CREATE POLICY "Team owners/admins can update members" ON team_members
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM teams
            WHERE teams.id = team_members.team_id
            AND teams.created_by = auth.uid()
        )
        OR is_team_owner_or_admin(team_members.team_id, auth.uid())
    );

CREATE POLICY "Team owners/admins can remove members" ON team_members
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM teams
            WHERE teams.id = team_members.team_id
            AND teams.created_by = auth.uid()
        )
        OR is_team_owner_or_admin(team_members.team_id, auth.uid())
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

-- Politiques RLS pour les invitations d'équipe
DROP POLICY IF EXISTS "Team members can view invitations" ON team_invitations;
DROP POLICY IF EXISTS "Team owners/admins can create invitations" ON team_invitations;
DROP POLICY IF EXISTS "Users can view their invitations" ON team_invitations;
DROP POLICY IF EXISTS "Users can accept invitations" ON team_invitations;

-- Les membres d'équipe peuvent voir les invitations de leur équipe
CREATE POLICY "Team members can view invitations" ON team_invitations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM teams
            WHERE teams.id = team_invitations.team_id
            AND teams.created_by = auth.uid()
        )
        OR user_is_team_member(team_invitations.team_id, auth.uid())
    );

-- Les owners/admins peuvent créer des invitations
CREATE POLICY "Team owners/admins can create invitations" ON team_invitations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM teams
            WHERE teams.id = team_invitations.team_id
            AND teams.created_by = auth.uid()
        )
        OR is_team_owner_or_admin(team_invitations.team_id, auth.uid())
    );

-- Les utilisateurs peuvent voir leurs propres invitations (par email)
CREATE POLICY "Users can view their invitations" ON team_invitations
    FOR SELECT USING (
        -- L'utilisateur peut voir les invitations à son email
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- Les utilisateurs peuvent accepter/refuser leurs invitations
CREATE POLICY "Users can accept invitations" ON team_invitations
    FOR UPDATE USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- Les owners/admins peuvent supprimer les invitations de leur équipe
DROP POLICY IF EXISTS "Team owners/admins can delete invitations" ON team_invitations;
CREATE POLICY "Team owners/admins can delete invitations" ON team_invitations
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM teams
            WHERE teams.id = team_invitations.team_id
            AND teams.created_by = auth.uid()
        )
        OR is_team_owner_or_admin(team_invitations.team_id, auth.uid())
    );




