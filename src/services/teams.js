import { supabase } from './supabase'
import logger from './logger'

/**
 * Charger les équipes de l'utilisateur
 */
export async function loadUserTeams(userId) {
  if (!userId || !supabase) {
    logger.warn('[loadUserTeams] Utilisateur ou Supabase non disponible')
    return []
  }

  try {
    logger.debug('[loadUserTeams] Chargement des équipes pour l\'utilisateur:', userId)
    
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        team_id,
        role,
        teams (
          id,
          name,
          description,
          created_by,
          created_at
        )
      `)
      .eq('user_id', userId)

    if (error) {
      logger.error('[loadUserTeams] Erreur Supabase:', error)
      throw error
    }

    if (!data || !Array.isArray(data)) {
      logger.warn('[loadUserTeams] Données invalides')
      return []
    }

    const teams = data
      .filter(member => member.teams && member.teams.id)
      .map(member => ({
        id: member.teams.id,
        name: member.teams.name,
        description: member.teams.description,
        role: member.role,
        createdBy: member.teams.created_by,
        createdAt: member.teams.created_at
      }))

    logger.debug('[loadUserTeams] Équipes chargées:', teams.length)
    return teams
  } catch (e) {
    logger.error('[loadUserTeams] Erreur:', e)
    return []
  }
}

/**
 * Créer une nouvelle équipe
 */
export async function createTeam(userId, name, description = '') {
  if (!userId || !supabase) {
    throw new Error('Utilisateur non connecté')
  }

  try {
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        name: name,
        description: description,
        created_by: userId
      })
      .select()
      .single()

    if (teamError) throw teamError

    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: userId,
        role: 'owner',
        invited_by: userId
      })

    if (memberError) throw memberError

    return team
  } catch (e) {
    logger.error('Erreur lors de la création de l\'équipe:', e)
    throw e
  }
}

/**
 * Charger les membres d'une équipe
 */
export async function loadTeamMembers(teamId) {
  if (!teamId || !supabase) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        user_id,
        role,
        invited_by,
        profiles!team_members_user_id_fkey (
          email,
          name
        )
      `)
      .eq('team_id', teamId)

    if (error) {
      logger.error('[loadTeamMembers] Erreur:', error)
      return []
    }

    return (data || []).map(member => ({
      userId: member.user_id,
      email: member.profiles?.email || 'Email inconnu',
      name: member.profiles?.name || 'Nom inconnu',
      role: member.role
    }))
  } catch (e) {
    logger.error('[loadTeamMembers] Erreur:', e)
    return []
  }
}

/**
 * Inviter un membre à une équipe
 */
export async function inviteTeamMember(teamId, inviterId, email) {
  if (!teamId || !inviterId || !email || !supabase) {
    throw new Error('Paramètres manquants')
  }

  try {
    // Vérifier si l'utilisateur existe
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (userError || !user) {
      throw new Error('Utilisateur non trouvé')
    }

    // Créer l'invitation
    const { data, error } = await supabase
      .from('team_invitations')
      .insert({
        team_id: teamId,
        user_id: user.id,
        invited_by: inviterId,
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error

    return data
  } catch (e) {
    logger.error('[inviteTeamMember] Erreur:', e)
    throw e
  }
}

/**
 * Charger les invitations d'une équipe
 */
export async function loadTeamInvitations(teamId) {
  if (!teamId || !supabase) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('team_invitations')
      .select(`
        id,
        user_id,
        status,
        invited_by,
        profiles!team_invitations_user_id_fkey (
          email
        )
      `)
      .eq('team_id', teamId)

    if (error) {
      logger.error('[loadTeamInvitations] Erreur:', error)
      return []
    }

    return (data || []).map(inv => ({
      id: inv.id,
      userId: inv.user_id,
      email: inv.profiles?.email || 'Email inconnu',
      status: inv.status
    }))
  } catch (e) {
    logger.error('[loadTeamInvitations] Erreur:', e)
    return []
  }
}

/**
 * Supprimer un membre d'une équipe
 */
export async function removeTeamMember(teamId, userId) {
  if (!teamId || !userId || !supabase) {
    throw new Error('Paramètres manquants')
  }

  try {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId)

    if (error) throw error

    return { success: true }
  } catch (e) {
    logger.error('[removeTeamMember] Erreur:', e)
    throw e
  }
}

/**
 * Supprimer une invitation
 */
export async function deleteTeamInvitation(invitationId) {
  if (!invitationId || !supabase) {
    throw new Error('Paramètres manquants')
  }

  try {
    const { error } = await supabase
      .from('team_invitations')
      .delete()
      .eq('id', invitationId)

    if (error) throw error

    return { success: true }
  } catch (e) {
    logger.error('[deleteTeamInvitation] Erreur:', e)
    throw e
  }
}

/**
 * Transférer la propriété d'une équipe
 */
export async function transferTeamOwnership(teamId, newOwnerId) {
  if (!teamId || !newOwnerId || !supabase) {
    throw new Error('Paramètres manquants')
  }

  try {
    // Mettre à jour le rôle de l'ancien propriétaire
    const { data: team } = await supabase
      .from('teams')
      .select('created_by')
      .eq('id', teamId)
      .single()

    if (team && team.created_by) {
      await supabase
        .from('team_members')
        .update({ role: 'member' })
        .eq('team_id', teamId)
        .eq('user_id', team.created_by)
    }

    // Mettre à jour le nouveau propriétaire
    await supabase
      .from('team_members')
      .update({ role: 'owner' })
      .eq('team_id', teamId)
      .eq('user_id', newOwnerId)

    // Mettre à jour created_by dans teams
    await supabase
      .from('teams')
      .update({ created_by: newOwnerId })
      .eq('id', teamId)

    return { success: true }
  } catch (e) {
    logger.error('[transferTeamOwnership] Erreur:', e)
    throw e
  }
}

/**
 * Supprimer une équipe
 */
export async function deleteTeam(teamId) {
  if (!teamId || !supabase) {
    throw new Error('Paramètres manquants')
  }

  try {
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId)

    if (error) throw error

    return { success: true }
  } catch (e) {
    logger.error('[deleteTeam] Erreur:', e)
    throw e
  }
}

