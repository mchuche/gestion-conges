-- Correctifs pour les alertes Supabase Database Linter (SECURITY / RLS)
-- À exécuter dans Supabase > SQL Editor
--
-- Corrige :
-- - public.team_invitations : policies existent mais RLS désactivé
-- - public.leave_types_backup : table publique avec RLS désactivé
-- - public.leave_types_with_global : vue SECURITY DEFINER (forcer security_invoker)
--
-- IMPORTANT : lis le script avant exécution. La partie "DROP TABLE" est commentée par défaut.

BEGIN;

-- 1) team_invitations : activer RLS (indispensable si tu as des policies)
ALTER TABLE IF EXISTS public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.team_invitations FORCE ROW LEVEL SECURITY;

-- 2) leave_types_backup : soit la supprimer, soit la verrouiller.
-- Option A (recommandée si migration terminée) :
-- DROP TABLE IF EXISTS public.leave_types_backup;

-- Option B (sécuriser si tu la gardes) :
ALTER TABLE IF EXISTS public.leave_types_backup ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.leave_types_backup FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.leave_types_backup FROM anon, authenticated;

-- 3) leave_types_with_global : éviter SECURITY DEFINER → forcer security_invoker (Postgres 15+)
-- Si la vue n'existe pas, cette commande n'aura pas d'effet.
ALTER VIEW IF EXISTS public.leave_types_with_global SET (security_invoker = true);

COMMIT;


