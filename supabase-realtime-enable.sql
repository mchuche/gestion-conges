-- Script SQL pour activer Realtime sur les tables Supabase
-- Exécutez ce script dans Supabase > SQL Editor
-- 
-- IMPORTANT: Realtime doit être activé dans le dashboard Supabase :
-- 1. Allez dans Database > Replication
-- 2. Activez la réplication pour les tables suivantes : leaves, leave_types, leave_quotas, notifications

-- Activer la publication pour les tables (nécessaire pour Realtime)
-- Note: Cette publication est généralement déjà créée par Supabase, mais on s'assure qu'elle existe

-- Créer la publication si elle n'existe pas déjà
-- Note: La publication supabase_realtime existe généralement déjà dans Supabase
-- Si vous obtenez une erreur "publication already exists", vous pouvez ignorer cette erreur
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
    END IF;
END $$;

-- Activer Realtime sur la table leaves
-- Note: Cette commande peut échouer si la table est déjà dans la publication, c'est normal
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'leaves'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE leaves;
    END IF;
END $$;

-- Activer Realtime sur la table leave_types
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'leave_types'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE leave_types;
    END IF;
END $$;

-- Activer Realtime sur la table leave_quotas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'leave_quotas'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE leave_quotas;
    END IF;
END $$;

-- Activer Realtime sur la table notifications
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    END IF;
END $$;

-- Vérifier que les tables sont dans la publication
SELECT 
    schemaname,
    tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- IMPORTANT: Pour que Realtime fonctionne correctement avec UPDATE et DELETE,
-- vous devez configurer REPLICA IDENTITY FULL sur chaque table
-- Cette commande permet à Realtime de voir les valeurs avant modification/suppression
ALTER TABLE leaves REPLICA IDENTITY FULL;
ALTER TABLE leave_types REPLICA IDENTITY FULL;
ALTER TABLE leave_quotas REPLICA IDENTITY FULL;
ALTER TABLE notifications REPLICA IDENTITY FULL;

