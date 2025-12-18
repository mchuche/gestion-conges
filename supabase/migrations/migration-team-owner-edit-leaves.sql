-- Migration pour permettre aux propriétaires d'équipe de modifier les congés des membres
-- Exécutez ce script dans Supabase > SQL Editor

-- Fonction pour vérifier si un utilisateur est propriétaire d'une équipe contenant un autre utilisateur
CREATE OR REPLACE FUNCTION is_team_owner_of_user(owner_id UUID, member_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Vérifier si owner_id est propriétaire d'une équipe dont member_id est membre
    RETURN EXISTS (
        SELECT 1 FROM team_members tm_owner
        INNER JOIN team_members tm_member ON tm_owner.team_id = tm_member.team_id
        WHERE tm_owner.user_id = owner_id
        AND tm_owner.role = 'owner'
        AND tm_member.user_id = member_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Modifier les politiques RLS pour permettre aux propriétaires d'équipe de modifier les congés des membres

-- Supprimer TOUTES les anciennes politiques (avec tous les noms possibles)
DROP POLICY IF EXISTS "Users can insert own leaves" ON leaves;
DROP POLICY IF EXISTS "Users can update own leaves" ON leaves;
DROP POLICY IF EXISTS "Users can delete own leaves" ON leaves;
DROP POLICY IF EXISTS "Users and team owners can insert leaves" ON leaves;
DROP POLICY IF EXISTS "Users and team owners can update leaves" ON leaves;
DROP POLICY IF EXISTS "Users and team owners can delete leaves" ON leaves;

-- Nouvelle politique INSERT : l'utilisateur peut ajouter ses propres congés OU
-- le propriétaire d'équipe peut ajouter des congés pour les membres
CREATE POLICY "Users and team owners can insert leaves" ON leaves
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        OR is_team_owner_of_user(auth.uid(), user_id)
    );

-- Nouvelle politique UPDATE : l'utilisateur peut modifier ses propres congés OU
-- le propriétaire d'équipe peut modifier les congés des membres
CREATE POLICY "Users and team owners can update leaves" ON leaves
    FOR UPDATE USING (
        auth.uid() = user_id 
        OR is_team_owner_of_user(auth.uid(), user_id)
    );

-- Nouvelle politique DELETE : l'utilisateur peut supprimer ses propres congés OU
-- le propriétaire d'équipe peut supprimer les congés des membres
CREATE POLICY "Users and team owners can delete leaves" ON leaves
    FOR DELETE USING (
        auth.uid() = user_id 
        OR is_team_owner_of_user(auth.uid(), user_id)
    );

-- Optionnel : Même logique pour les événements récurrents
DROP POLICY IF EXISTS "Users can insert own recurring_events" ON recurring_events;
DROP POLICY IF EXISTS "Users can update own recurring_events" ON recurring_events;
DROP POLICY IF EXISTS "Users can delete own recurring_events" ON recurring_events;
DROP POLICY IF EXISTS "Users and team owners can insert recurring_events" ON recurring_events;
DROP POLICY IF EXISTS "Users and team owners can update recurring_events" ON recurring_events;
DROP POLICY IF EXISTS "Users and team owners can delete recurring_events" ON recurring_events;

-- INSERT pour événements récurrents
CREATE POLICY "Users and team owners can insert recurring_events" ON recurring_events
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        OR is_team_owner_of_user(auth.uid(), user_id)
    );

-- UPDATE pour événements récurrents
CREATE POLICY "Users and team owners can update recurring_events" ON recurring_events
    FOR UPDATE USING (
        auth.uid() = user_id 
        OR is_team_owner_of_user(auth.uid(), user_id)
    );

-- DELETE pour événements récurrents
CREATE POLICY "Users and team owners can delete recurring_events" ON recurring_events
    FOR DELETE USING (
        auth.uid() = user_id 
        OR is_team_owner_of_user(auth.uid(), user_id)
    );

