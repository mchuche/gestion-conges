-- Script SQL pour optimiser les performances
-- Exécutez ce script dans Supabase > SQL Editor
-- Ce script crée des fonctions optimisées pour réduire le nombre de requêtes

-- ===== FONCTION OPTIMISÉE POUR CHARGER LES UTILISATEURS AVEC STATISTIQUES =====

-- Fonction pour obtenir les statistiques des utilisateurs en une seule requête
-- Remplace les requêtes N+1 par une seule requête avec des jointures
CREATE OR REPLACE FUNCTION get_users_with_stats(search_email TEXT DEFAULT NULL)
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    leaves_count BIGINT,
    teams_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ue.user_id,
        ue.email,
        ue.created_at,
        COALESCE(COUNT(DISTINCT l.id), 0)::BIGINT as leaves_count,
        COALESCE(COUNT(DISTINCT tm.team_id), 0)::BIGINT as teams_count
    FROM user_emails ue
    LEFT JOIN leaves l ON ue.user_id = l.user_id
    LEFT JOIN team_members tm ON ue.user_id = tm.user_id
    WHERE 
        (search_email IS NULL OR ue.email ILIKE '%' || search_email || '%')
    GROUP BY ue.user_id, ue.email, ue.created_at
    ORDER BY ue.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Commentaire pour documenter la fonction
COMMENT ON FUNCTION get_users_with_stats IS 
'Retourne la liste des utilisateurs avec leurs statistiques (congés et équipes) en une seule requête optimisée. 
Remplace les requêtes N+1 par une requête unique avec jointures.';

-- ===== FONCTION OPTIMISÉE POUR CHARGER LES MEMBRES D'UNE ÉQUIPE =====

-- Fonction pour obtenir les membres d'une équipe avec leurs emails en une seule requête
CREATE OR REPLACE FUNCTION get_team_members_with_emails(team_uuid UUID)
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    role TEXT,
    joined_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tm.user_id,
        ue.email,
        tm.role,
        tm.joined_at
    FROM team_members tm
    INNER JOIN user_emails ue ON tm.user_id = ue.user_id
    WHERE tm.team_id = team_uuid
    ORDER BY tm.joined_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Commentaire pour documenter la fonction
COMMENT ON FUNCTION get_team_members_with_emails IS 
'Retourne les membres d''une équipe avec leurs emails en une seule requête optimisée. 
Remplace les requêtes multiples pour récupérer les emails des membres.';

-- ===== INDEX POUR OPTIMISER LES RECHERCHES =====

-- Index pour optimiser les recherches d'emails (si pas déjà créé)
CREATE INDEX IF NOT EXISTS idx_user_emails_email ON user_emails(email);
CREATE INDEX IF NOT EXISTS idx_user_emails_email_lower ON user_emails(LOWER(email));

-- Index pour optimiser les jointures
CREATE INDEX IF NOT EXISTS idx_leaves_user_id ON leaves(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);

-- ===== VUE MATÉRIALISÉE POUR LES STATISTIQUES GLOBALES (OPTIONNEL) =====
-- Cette vue peut être rafraîchie périodiquement pour améliorer les performances
-- des statistiques globales si elles sont consultées fréquemment

-- Note: Les vues matérialisées nécessitent un rafraîchissement manuel ou programmé
-- Pour l'instant, on garde les requêtes directes qui sont suffisamment rapides

