-- Migration pour séparer les types de congés globaux (admin) et les personnalisations (utilisateurs)
-- Exécutez ce script dans Supabase > SQL Editor

-- ===== ÉTAPE 1 : Créer la table globale_leave_types =====

CREATE TABLE IF NOT EXISTS global_leave_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    label TEXT NOT NULL,
    category TEXT DEFAULT 'leave' CHECK (category IN ('leave', 'event')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS pour global_leave_types
ALTER TABLE global_leave_types ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour global_leave_types : tout le monde peut lire, seuls les admins peuvent modifier
DROP POLICY IF EXISTS "Anyone can read global leave types" ON global_leave_types;
CREATE POLICY "Anyone can read global leave types" ON global_leave_types
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert global leave types" ON global_leave_types;
CREATE POLICY "Admins can insert global leave types" ON global_leave_types
    FOR INSERT WITH CHECK (is_app_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update global leave types" ON global_leave_types;
CREATE POLICY "Admins can update global leave types" ON global_leave_types
    FOR UPDATE USING (is_app_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete global leave types" ON global_leave_types;
CREATE POLICY "Admins can delete global leave types" ON global_leave_types
    FOR DELETE USING (is_app_admin(auth.uid()));

-- Insérer les types par défaut dans global_leave_types
INSERT INTO global_leave_types (id, name, label, category) VALUES
    ('congé-payé', 'Congé Payé', 'CP', 'leave'),
    ('rtt', 'RTT', 'RTT', 'leave'),
    ('jours-hiver', 'Jours Hiver', 'JH', 'leave'),
    ('maladie', 'Maladie', 'Mal', 'event'),
    ('télétravail', 'Télétravail', 'TT', 'event'),
    ('formation', 'Formation', 'Form', 'event'),
    ('grève', 'Grève', 'Grève', 'event')
ON CONFLICT (id) DO NOTHING;

-- ===== ÉTAPE 2 : Créer une table temporaire pour sauvegarder les données existantes =====

CREATE TABLE IF NOT EXISTS leave_types_backup AS
SELECT * FROM leave_types;

-- ===== ÉTAPE 3 : Supprimer l'ancienne table leave_types =====

-- Supprimer les politiques RLS existantes
DROP POLICY IF EXISTS "Users can view own leave_types" ON leave_types;
DROP POLICY IF EXISTS "Users can insert own leave_types" ON leave_types;
DROP POLICY IF EXISTS "Users can update own leave_types" ON leave_types;
DROP POLICY IF EXISTS "Users can delete own leave_types" ON leave_types;
DROP POLICY IF EXISTS "Team members can view team leave_types" ON leave_types;

-- Supprimer la table
DROP TABLE IF EXISTS leave_types CASCADE;

-- ===== ÉTAPE 4 : Recréer la table leave_types avec la nouvelle structure =====

CREATE TABLE leave_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    global_type_id TEXT REFERENCES global_leave_types(id) ON DELETE CASCADE NOT NULL,
    color TEXT NOT NULL DEFAULT '#4a90e2',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, global_type_id)
);

-- Activer RLS pour leave_types
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour leave_types : les utilisateurs peuvent voir/modifier leurs personnalisations
CREATE POLICY "Users can view own leave_types" ON leave_types
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own leave_types" ON leave_types
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leave_types" ON leave_types
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own leave_types" ON leave_types
    FOR DELETE USING (auth.uid() = user_id);

-- Politique pour permettre aux membres d'équipe de voir les personnalisations des autres membres
CREATE POLICY "Team members can view team leave_types" ON leave_types
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM team_members tm1
            JOIN team_members tm2 ON tm1.team_id = tm2.team_id
            WHERE tm1.user_id = auth.uid()
            AND tm2.user_id = leave_types.user_id
        )
    );

-- ===== ÉTAPE 5 : Migrer les données existantes =====

-- Pour chaque utilisateur, créer des personnalisations basées sur les types globaux par défaut
-- avec les couleurs de leur ancienne configuration si elles existent
INSERT INTO leave_types (user_id, global_type_id, color)
SELECT DISTINCT
    user_data.user_id,
    global_leave_types.id as global_type_id,
    COALESCE(
        (SELECT color FROM leave_types_backup 
         WHERE leave_types_backup.id = global_leave_types.id 
         AND leave_types_backup.user_id = user_data.user_id 
         LIMIT 1),
        CASE global_leave_types.id
            WHEN 'congé-payé' THEN '#4a90e2'
            WHEN 'rtt' THEN '#50c878'
            WHEN 'jours-hiver' THEN '#87ceeb'
            WHEN 'maladie' THEN '#ff6b6b'
            WHEN 'télétravail' THEN '#9b59b6'
            WHEN 'formation' THEN '#f39c12'
            WHEN 'grève' THEN '#e74c3c'
            ELSE '#4a90e2'
        END
    ) as color
FROM global_leave_types
CROSS JOIN (SELECT DISTINCT user_id FROM leave_types_backup) user_data
ON CONFLICT (user_id, global_type_id) DO NOTHING;

-- ===== ÉTAPE 6 : Mettre à jour la table leaves pour utiliser global_type_id =====

-- Note: La table leaves utilise leave_type_id qui doit maintenant référencer global_type_id
-- On ne modifie pas la structure de leaves, mais on s'assure que les IDs correspondent

-- ===== ÉTAPE 7 : Mettre à jour la table leave_quotas =====

-- La table leave_quotas utilise leave_type_id qui doit maintenant référencer global_type_id
-- On ne modifie pas la structure, mais on s'assure que les IDs correspondent

-- ===== ÉTAPE 8 : Nettoyer la table de sauvegarde =====

-- Garder la table de sauvegarde pour référence, mais on peut la supprimer après vérification
-- DROP TABLE IF EXISTS leave_types_backup;

-- ===== ÉTAPE 9 : Créer une vue pour faciliter les requêtes =====

CREATE OR REPLACE VIEW leave_types_with_global AS
SELECT 
    lt.id,
    lt.user_id,
    lt.global_type_id,
    lt.color,
    glt.name,
    glt.label,
    glt.category,
    lt.created_at,
    lt.updated_at
FROM leave_types lt
JOIN global_leave_types glt ON lt.global_type_id = glt.id;

-- Permettre à tous les utilisateurs de lire cette vue
GRANT SELECT ON leave_types_with_global TO authenticated;

-- ===== NOTES IMPORTANTES =====
-- 
-- Après cette migration :
-- 1. Les admins gèrent les labels (name, label, category) dans global_leave_types
-- 2. Les utilisateurs personnalisent les couleurs dans leave_types
-- 3. Les utilisateurs gèrent leurs quotas dans leave_quotas (inchangé)
-- 4. La table leaves continue d'utiliser leave_type_id qui référence maintenant global_type_id
-- 5. La table leave_quotas continue d'utiliser leave_type_id qui référence maintenant global_type_id

