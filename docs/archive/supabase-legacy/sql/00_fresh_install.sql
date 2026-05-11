-- Fresh install (Supabase) - Gestion Congés
-- Exécutez ce script dans Supabase > SQL Editor
-- Idéal pour un NOUVEAU projet Supabase (base vide).
--
-- Notes:
-- - Script majoritairement idempotent (IF NOT EXISTS / CREATE OR REPLACE)
-- - Certaines parties (triggers auth.users) nécessitent d'être exécutées dans le SQL Editor (pas via PostgREST)

BEGIN;

-- UUID helpers (gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================
-- ADMIN
-- =========================

CREATE TABLE IF NOT EXISTS public.app_admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role TEXT DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.app_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_app_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.app_admins WHERE user_id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_super_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.app_admins WHERE user_id = user_uuid AND role = 'super_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP POLICY IF EXISTS "Admins can view admins" ON public.app_admins;
CREATE POLICY "Admins can view admins" ON public.app_admins
  FOR SELECT USING (public.is_app_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins can manage admins" ON public.app_admins;
CREATE POLICY "Super admins can manage admins" ON public.app_admins
  FOR ALL USING (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can read settings" ON public.app_settings;
CREATE POLICY "Anyone can read settings" ON public.app_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can update settings" ON public.app_settings;
CREATE POLICY "Admins can update settings" ON public.app_settings
  FOR UPDATE USING (public.is_app_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert settings" ON public.app_settings;
CREATE POLICY "Admins can insert settings" ON public.app_settings
  FOR INSERT WITH CHECK (public.is_app_admin(auth.uid()));

INSERT INTO public.app_settings (key, value, description)
VALUES
  ('default_quotas', '{"congé-payé": 25, "rtt": 22, "jours-hiver": 2}'::jsonb, 'Quotas par défaut')
ON CONFLICT (key) DO NOTHING;

-- =========================
-- PUBLIC: user_emails (lookup)
-- =========================

CREATE TABLE IF NOT EXISTS public.user_emails (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.user_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read user emails" ON public.user_emails;
CREATE POLICY "Anyone can read user emails" ON public.user_emails
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own email" ON public.user_emails;
CREATE POLICY "Users can insert own email" ON public.user_emails
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.get_user_id_by_email(user_email TEXT)
RETURNS UUID AS $$
DECLARE
  found_user_id UUID;
BEGIN
  SELECT user_id INTO found_user_id
  FROM public.user_emails
  WHERE email = LOWER(TRIM(user_email));
  RETURN found_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Email courant (JWT -> fallback table)
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS TEXT AS $$
DECLARE
  user_email TEXT;
BEGIN
  BEGIN
    user_email := NULLIF(auth.jwt() ->> 'email', '');
    IF user_email IS NULL THEN
      user_email := NULLIF((auth.jwt() -> 'user_metadata' ->> 'email'), '');
    END IF;
  EXCEPTION WHEN undefined_function THEN
    user_email := NULL;
  END;

  IF user_email IS NULL THEN
    SELECT email INTO user_email
    FROM public.user_emails
    WHERE user_id = auth.uid();
  END IF;

  RETURN LOWER(user_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_current_user_email() TO authenticated;

-- Trigger: sync user_emails depuis auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_emails (user_id, email)
  VALUES (NEW.id, LOWER(NEW.email))
  ON CONFLICT (user_id) DO UPDATE SET email = LOWER(EXCLUDED.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill (si des users existent déjà)
INSERT INTO public.user_emails (user_id, email)
SELECT id, LOWER(email)
FROM auth.users
WHERE email IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- =========================
-- USER PREFERENCES
-- =========================

CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  selected_country TEXT DEFAULT 'FR',
  week_start_day INTEGER DEFAULT 0,
  theme_mode TEXT DEFAULT 'auto' CHECK (theme_mode IN ('auto', 'light', 'dark')),
  event_opacity NUMERIC(3,2) DEFAULT 0.15,
  holiday_weekend_intensity TEXT DEFAULT 'normal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
CREATE POLICY "Users can view own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
CREATE POLICY "Users can insert own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
CREATE POLICY "Users can update own preferences" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- =========================
-- GLOBAL LEAVE TYPES + USER CUSTOMIZATIONS
-- =========================

CREATE TABLE IF NOT EXISTS public.global_leave_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  category TEXT DEFAULT 'leave' CHECK (category IN ('leave', 'event')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.global_leave_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read global leave types" ON public.global_leave_types;
CREATE POLICY "Anyone can read global leave types" ON public.global_leave_types
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert global leave types" ON public.global_leave_types;
CREATE POLICY "Admins can insert global leave types" ON public.global_leave_types
  FOR INSERT WITH CHECK (public.is_app_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update global leave types" ON public.global_leave_types;
CREATE POLICY "Admins can update global leave types" ON public.global_leave_types
  FOR UPDATE USING (public.is_app_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete global leave types" ON public.global_leave_types;
CREATE POLICY "Admins can delete global leave types" ON public.global_leave_types
  FOR DELETE USING (public.is_app_admin(auth.uid()));

INSERT INTO public.global_leave_types (id, name, label, category) VALUES
  ('congé-payé', 'Congé Payé', 'CP', 'leave'),
  ('rtt', 'RTT', 'RTT', 'leave'),
  ('jours-hiver', 'Jours Hiver', 'JH', 'leave'),
  ('maladie', 'Maladie', 'Mal', 'event'),
  ('télétravail', 'Télétravail', 'TT', 'event'),
  ('formation', 'Formation', 'Form', 'event'),
  ('grève', 'Grève', 'Grève', 'event')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.leave_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  global_type_id TEXT REFERENCES public.global_leave_types(id) ON DELETE CASCADE NOT NULL,
  color TEXT NOT NULL DEFAULT '#4a90e2',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, global_type_id)
);

ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own leave_types" ON public.leave_types;
CREATE POLICY "Users can view own leave_types" ON public.leave_types
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own leave_types" ON public.leave_types;
CREATE POLICY "Users can insert own leave_types" ON public.leave_types
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own leave_types" ON public.leave_types;
CREATE POLICY "Users can update own leave_types" ON public.leave_types
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own leave_types" ON public.leave_types;
CREATE POLICY "Users can delete own leave_types" ON public.leave_types
  FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE VIEW public.leave_types_with_global
WITH (security_invoker = true) AS
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
FROM public.leave_types lt
JOIN public.global_leave_types glt ON lt.global_type_id = glt.id;

GRANT SELECT ON public.leave_types_with_global TO authenticated;

-- =========================
-- LEAVES + QUOTAS
-- =========================

CREATE TABLE IF NOT EXISTS public.leaves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date_key TEXT NOT NULL,
  leave_type_id TEXT REFERENCES public.global_leave_types(id) ON DELETE RESTRICT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date_key)
);

CREATE TABLE IF NOT EXISTS public.leave_quotas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  leave_type_id TEXT REFERENCES public.global_leave_types(id) ON DELETE RESTRICT NOT NULL,
  year INTEGER NOT NULL,
  quota INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, leave_type_id, year)
);

ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_quotas ENABLE ROW LEVEL SECURITY;

-- =========================
-- TEAMS / MEMBERS / INVITATIONS
-- =========================

CREATE TABLE IF NOT EXISTS public.teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.team_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(team_id, email)
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations FORCE ROW LEVEL SECURITY;

-- Functions to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.is_team_member(team_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = team_uuid AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_team_owner_or_admin(team_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = team_uuid AND user_id = user_uuid AND role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.user_is_team_member(team_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = team_uuid AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.users_in_same_team(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members tm1
    INNER JOIN public.team_members tm2 ON tm1.team_id = tm2.team_id
    WHERE tm1.user_id = user1_id AND tm2.user_id = user2_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_team_owner_of_user(owner_id UUID, member_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members tm_owner
    INNER JOIN public.team_members tm_member ON tm_owner.team_id = tm_member.team_id
    WHERE tm_owner.user_id = owner_id
      AND tm_owner.role = 'owner'
      AND tm_member.user_id = member_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- teams policies
DROP POLICY IF EXISTS "Team members can view their teams" ON public.teams;
CREATE POLICY "Team members can view their teams" ON public.teams
  FOR SELECT USING (
    created_by = auth.uid()
    OR public.user_is_team_member(public.teams.id, auth.uid())
  );

DROP POLICY IF EXISTS "Users can create teams" ON public.teams;
CREATE POLICY "Users can create teams" ON public.teams
  FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Team owners can update their teams" ON public.teams;
CREATE POLICY "Team owners can update their teams" ON public.teams
  FOR UPDATE USING (auth.uid() = created_by OR public.is_team_owner_or_admin(public.teams.id, auth.uid()));

DROP POLICY IF EXISTS "Team owners can delete their teams" ON public.teams;
CREATE POLICY "Team owners can delete their teams" ON public.teams
  FOR DELETE USING (auth.uid() = created_by);

-- team_members policies
DROP POLICY IF EXISTS "Team members can view team members" ON public.team_members;
CREATE POLICY "Team members can view team members" ON public.team_members
  FOR SELECT USING (public.is_team_member(team_id, auth.uid()));

DROP POLICY IF EXISTS "Team owners/admins can add members" ON public.team_members;
CREATE POLICY "Team owners/admins can add members" ON public.team_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE public.teams.id = public.team_members.team_id
        AND public.teams.created_by = auth.uid()
    )
    OR public.is_team_owner_or_admin(public.team_members.team_id, auth.uid())
  );

DROP POLICY IF EXISTS "Team owners/admins can update members" ON public.team_members;
CREATE POLICY "Team owners/admins can update members" ON public.team_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE public.teams.id = public.team_members.team_id
        AND public.teams.created_by = auth.uid()
    )
    OR public.is_team_owner_or_admin(public.team_members.team_id, auth.uid())
  );

DROP POLICY IF EXISTS "Team owners/admins can remove members" ON public.team_members;
CREATE POLICY "Team owners/admins can remove members" ON public.team_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE public.teams.id = public.team_members.team_id
        AND public.teams.created_by = auth.uid()
    )
    OR public.is_team_owner_or_admin(public.team_members.team_id, auth.uid())
  );

-- team_invitations policies
DROP POLICY IF EXISTS "Team members can view invitations" ON public.team_invitations;
CREATE POLICY "Team members can view invitations" ON public.team_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE public.teams.id = public.team_invitations.team_id
        AND public.teams.created_by = auth.uid()
    )
    OR public.user_is_team_member(public.team_invitations.team_id, auth.uid())
  );

DROP POLICY IF EXISTS "Team owners/admins can create invitations" ON public.team_invitations;
CREATE POLICY "Team owners/admins can create invitations" ON public.team_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE public.teams.id = public.team_invitations.team_id
        AND public.teams.created_by = auth.uid()
    )
    OR public.is_team_owner_or_admin(public.team_invitations.team_id, auth.uid())
  );

DROP POLICY IF EXISTS "Users can view their invitations" ON public.team_invitations;
CREATE POLICY "Users can view their invitations" ON public.team_invitations
  FOR SELECT USING (lower(public.team_invitations.email) = public.get_current_user_email());

DROP POLICY IF EXISTS "Users can accept invitations" ON public.team_invitations;
CREATE POLICY "Users can accept invitations" ON public.team_invitations
  FOR UPDATE USING (lower(public.team_invitations.email) = public.get_current_user_email());

DROP POLICY IF EXISTS "Team owners/admins can delete invitations" ON public.team_invitations;
CREATE POLICY "Team owners/admins can delete invitations" ON public.team_invitations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE public.teams.id = public.team_invitations.team_id
        AND public.teams.created_by = auth.uid()
    )
    OR public.is_team_owner_or_admin(public.team_invitations.team_id, auth.uid())
  );

-- RPC: invitations reçues + accept/refuse
CREATE OR REPLACE FUNCTION public.list_my_team_invitations()
RETURNS TABLE (
  id uuid,
  team_id uuid,
  team_name text,
  team_description text,
  invited_by uuid,
  invited_by_email text,
  status text,
  created_at timestamptz,
  accepted_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ti.id,
    ti.team_id,
    t.name AS team_name,
    t.description AS team_description,
    ti.invited_by,
    ue.email AS invited_by_email,
    ti.status,
    ti.created_at,
    ti.accepted_at
  FROM public.team_invitations ti
  JOIN public.teams t ON t.id = ti.team_id
  LEFT JOIN public.user_emails ue ON ue.user_id = ti.invited_by
  WHERE lower(ti.email) = public.get_current_user_email()
  ORDER BY ti.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.list_my_team_invitations() TO authenticated;

CREATE OR REPLACE FUNCTION public.decline_team_invitation(invitation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv record;
  me_email text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  me_email := public.get_current_user_email();
  IF me_email IS NULL THEN
    RAISE EXCEPTION 'No email for current user';
  END IF;

  SELECT * INTO inv
  FROM public.team_invitations
  WHERE id = invitation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;

  IF lower(inv.email) <> lower(me_email) THEN
    RAISE EXCEPTION 'Invitation not for current user';
  END IF;

  IF inv.status <> 'pending' THEN
    RETURN jsonb_build_object('ok', true, 'status', inv.status);
  END IF;

  UPDATE public.team_invitations
  SET status = 'declined', accepted_at = NULL
  WHERE id = invitation_id;

  RETURN jsonb_build_object('ok', true, 'status', 'declined');
END;
$$;

GRANT EXECUTE ON FUNCTION public.decline_team_invitation(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.accept_team_invitation(invitation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv record;
  me_id uuid;
  me_email text;
BEGIN
  me_id := auth.uid();
  IF me_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  me_email := public.get_current_user_email();
  IF me_email IS NULL THEN
    RAISE EXCEPTION 'No email for current user';
  END IF;

  SELECT * INTO inv
  FROM public.team_invitations
  WHERE id = invitation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;

  IF lower(inv.email) <> lower(me_email) THEN
    RAISE EXCEPTION 'Invitation not for current user';
  END IF;

  IF inv.status <> 'pending' THEN
    RETURN jsonb_build_object('ok', true, 'status', inv.status, 'team_id', inv.team_id);
  END IF;

  INSERT INTO public.team_members (team_id, user_id, role, invited_by, joined_at)
  VALUES (inv.team_id, me_id, 'member', inv.invited_by, now())
  ON CONFLICT (team_id, user_id) DO NOTHING;

  UPDATE public.team_invitations
  SET status = 'accepted', accepted_at = now()
  WHERE id = invitation_id;

  RETURN jsonb_build_object('ok', true, 'status', 'accepted', 'team_id', inv.team_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_team_invitation(uuid) TO authenticated;

-- =========================
-- LEAVES policies (incl. team visibility + owners can edit members)
-- =========================

DROP POLICY IF EXISTS "Team members can view team leaves" ON public.leaves;
CREATE POLICY "Team members can view team leaves" ON public.leaves
  FOR SELECT USING (auth.uid() = user_id OR public.users_in_same_team(auth.uid(), user_id));

DROP POLICY IF EXISTS "Users and team owners can insert leaves" ON public.leaves;
CREATE POLICY "Users and team owners can insert leaves" ON public.leaves
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_team_owner_of_user(auth.uid(), user_id));

DROP POLICY IF EXISTS "Users and team owners can update leaves" ON public.leaves;
CREATE POLICY "Users and team owners can update leaves" ON public.leaves
  FOR UPDATE USING (auth.uid() = user_id OR public.is_team_owner_of_user(auth.uid(), user_id));

DROP POLICY IF EXISTS "Users and team owners can delete leaves" ON public.leaves;
CREATE POLICY "Users and team owners can delete leaves" ON public.leaves
  FOR DELETE USING (auth.uid() = user_id OR public.is_team_owner_of_user(auth.uid(), user_id));

-- quotas policies
DROP POLICY IF EXISTS "Users can view own leave_quotas" ON public.leave_quotas;
CREATE POLICY "Users can view own leave_quotas" ON public.leave_quotas
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own leave_quotas" ON public.leave_quotas;
CREATE POLICY "Users can insert own leave_quotas" ON public.leave_quotas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own leave_quotas" ON public.leave_quotas;
CREATE POLICY "Users can update own leave_quotas" ON public.leave_quotas
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own leave_quotas" ON public.leave_quotas;
CREATE POLICY "Users can delete own leave_quotas" ON public.leave_quotas
  FOR DELETE USING (auth.uid() = user_id);

-- =========================
-- RECURRING EVENTS
-- =========================

CREATE TABLE IF NOT EXISTS public.recurring_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  leave_type_id TEXT REFERENCES public.global_leave_types(id) ON DELETE RESTRICT NOT NULL,
  period TEXT DEFAULT 'full' CHECK (period IN ('full', 'morning', 'afternoon')),
  recurrence_type TEXT NOT NULL CHECK (recurrence_type IN ('daily', 'weekly', 'monthly', 'yearly')),
  recurrence_pattern JSONB NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  max_occurrences INTEGER,
  excluded_dates DATE[] DEFAULT '{}',
  name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recurring_events_user_active ON public.recurring_events(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_recurring_events_dates ON public.recurring_events(start_date, end_date);

ALTER TABLE public.recurring_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own recurring_events" ON public.recurring_events;
CREATE POLICY "Users can view own recurring_events" ON public.recurring_events
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users and team owners can insert recurring_events" ON public.recurring_events;
CREATE POLICY "Users and team owners can insert recurring_events" ON public.recurring_events
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_team_owner_of_user(auth.uid(), user_id));

DROP POLICY IF EXISTS "Users and team owners can update recurring_events" ON public.recurring_events;
CREATE POLICY "Users and team owners can update recurring_events" ON public.recurring_events
  FOR UPDATE USING (auth.uid() = user_id OR public.is_team_owner_of_user(auth.uid(), user_id));

DROP POLICY IF EXISTS "Users and team owners can delete recurring_events" ON public.recurring_events;
CREATE POLICY "Users and team owners can delete recurring_events" ON public.recurring_events
  FOR DELETE USING (auth.uid() = user_id OR public.is_team_owner_of_user(auth.uid(), user_id));

DROP POLICY IF EXISTS "Team members can view team recurring_events" ON public.recurring_events;
CREATE POLICY "Team members can view team recurring_events" ON public.recurring_events
  FOR SELECT USING (auth.uid() = user_id OR public.users_in_same_team(auth.uid(), user_id));

-- =========================
-- NOTIFICATIONS
-- =========================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('leave_modified', 'event_modified', 'team_invite', 'other')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

COMMIT;


