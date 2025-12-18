-- Migration pour ajouter le partage d'événements récurrents entre membres d'équipe
-- Exécutez ce script dans Supabase > SQL Editor

-- Ajouter une politique pour permettre aux membres d'équipe de voir les événements récurrents des autres
-- (la fonction users_in_same_team doit déjà exister dans supabase-schema.sql)
DROP POLICY IF EXISTS "Team members can view team recurring_events" ON recurring_events;
CREATE POLICY "Team members can view team recurring_events" ON recurring_events
    FOR SELECT USING (
        auth.uid() = user_id OR
        users_in_same_team(auth.uid(), user_id)
    );

