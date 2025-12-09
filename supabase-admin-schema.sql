-- Script SQL pour créer les tables d'administration
-- Exécutez ce script dans Supabase > SQL Editor

-- ===== TABLE ADMINISTRATION =====

-- Table pour les administrateurs de l'application
CREATE TABLE IF NOT EXISTS app_admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    role TEXT DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les paramètres par défaut de l'application
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS pour les tables admin
ALTER TABLE app_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Fonction pour vérifier si un utilisateur est admin
CREATE OR REPLACE FUNCTION is_app_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM app_admins
        WHERE user_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fonction pour vérifier si un utilisateur est super_admin
CREATE OR REPLACE FUNCTION is_super_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM app_admins
        WHERE user_id = user_uuid
        AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Politiques RLS pour app_admins
DROP POLICY IF EXISTS "Admins can view admins" ON app_admins;
CREATE POLICY "Admins can view admins" ON app_admins
    FOR SELECT USING (is_app_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins can manage admins" ON app_admins;
CREATE POLICY "Super admins can manage admins" ON app_admins
    FOR ALL USING (is_super_admin(auth.uid()));

-- Politiques RLS pour app_settings
DROP POLICY IF EXISTS "Anyone can read settings" ON app_settings;
CREATE POLICY "Anyone can read settings" ON app_settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can update settings" ON app_settings;
CREATE POLICY "Admins can update settings" ON app_settings
    FOR UPDATE USING (is_app_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert settings" ON app_settings;
CREATE POLICY "Admins can insert settings" ON app_settings
    FOR INSERT WITH CHECK (is_app_admin(auth.uid()));

-- Insérer les paramètres par défaut
INSERT INTO app_settings (key, value, description) VALUES
    ('default_leave_types', '[
        {"id": "congé-payé", "name": "Congé Payé", "label": "CP", "color": "#4a90e2"},
        {"id": "rtt", "name": "RTT", "label": "RTT", "color": "#50c878"},
        {"id": "jours-hiver", "name": "Jours Hiver", "label": "JH", "color": "#87ceeb"},
        {"id": "maladie", "name": "Maladie", "label": "Mal", "color": "#ff6b6b"},
        {"id": "télétravail", "name": "Télétravail", "label": "TT", "color": "#9b59b6"},
        {"id": "formation", "name": "Formation", "label": "Form", "color": "#f39c12"},
        {"id": "grève", "name": "Grève", "label": "Grève", "color": "#e74c3c"}
    ]'::jsonb, 'Types de congés par défaut pour les nouveaux utilisateurs'),
    ('default_quotas', '{"congé-payé": 25, "rtt": 22, "jours-hiver": 2}'::jsonb, 'Quotas par défaut pour les nouveaux utilisateurs'),
    ('default_country', '"FR"'::jsonb, 'Pays par défaut pour les nouveaux utilisateurs')
ON CONFLICT (key) DO NOTHING;

-- ===== TABLE AUDIT LOGS =====

-- Table pour les logs d'audit des événements importants
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS pour audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour audit_logs : seuls les admins peuvent voir les logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT USING (is_app_admin(auth.uid()));

DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;
-- Permettre l'insertion pour tous (le système doit pouvoir logger)
CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- Index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);

