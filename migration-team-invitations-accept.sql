-- Migration : invitations d'équipe (accepter/refuser) via RPC
-- Exécutez ce script dans Supabase > SQL Editor
--
-- Objectif :
-- - Permettre à un utilisateur invité (via email) d'accepter/refuser une invitation
-- - À l'acceptation : ajouter automatiquement une ligne dans team_members
-- - Fournir une RPC pour lister les invitations avec le nom d'équipe (sans élargir les policies sur teams)

BEGIN;

-- 1) Lister mes invitations avec infos d'équipe (team name/description) + email de l'invitant
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
  WHERE lower(ti.email) = lower(public.get_current_user_email())
  ORDER BY ti.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.list_my_team_invitations() TO authenticated;

-- 2) Refuser une invitation
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
  SET status = 'declined',
      accepted_at = NULL
  WHERE id = invitation_id;

  RETURN jsonb_build_object('ok', true, 'status', 'declined');
END;
$$;

GRANT EXECUTE ON FUNCTION public.decline_team_invitation(uuid) TO authenticated;

-- 3) Accepter une invitation
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

  -- Ajouter le membre (si déjà membre, ne pas échouer)
  INSERT INTO public.team_members (team_id, user_id, role, invited_by, joined_at)
  VALUES (inv.team_id, me_id, 'member', inv.invited_by, now())
  ON CONFLICT (team_id, user_id) DO NOTHING;

  UPDATE public.team_invitations
  SET status = 'accepted',
      accepted_at = now()
  WHERE id = invitation_id;

  RETURN jsonb_build_object('ok', true, 'status', 'accepted', 'team_id', inv.team_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_team_invitation(uuid) TO authenticated;

COMMIT;


