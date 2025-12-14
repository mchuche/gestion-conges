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

  // Valider que teamId est un UUID valide
  if (typeof teamId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(teamId)) {
    logger.warn('[loadTeamMembers] ID d\'équipe invalide:', teamId)
    return []
  }

  try {
    // Charger les membres
    const { data: membersData, error: membersError } = await supabase
      .from('team_members')
      .select('user_id, role, invited_by')
      .eq('team_id', teamId)

    if (membersError) {
      logger.error('[loadTeamMembers] Erreur:', membersError)
      return []
    }

    if (!membersData || membersData.length === 0) {
      return []
    }

    // Récupérer les emails depuis user_emails pour chaque membre
    const userIds = membersData.map(m => m.user_id)
    const { data: emailsData, error: emailsError } = await supabase
      .from('user_emails')
      .select('user_id, email')
      .in('user_id', userIds)

    if (emailsError) {
      logger.warn('[loadTeamMembers] Erreur lors du chargement des emails:', emailsError)
    }

    // Créer un map pour accéder rapidement aux emails
    const emailMap = {}
    if (emailsData) {
      emailsData.forEach(item => {
        emailMap[item.user_id] = item.email
      })
    }

    // Mapper les membres avec leurs emails
    return membersData.map(member => ({
      userId: member.user_id,
      email: emailMap[member.user_id] || 'Email inconnu',
      name: emailMap[member.user_id] || 'Nom inconnu', // Utiliser l'email comme nom par défaut
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
    const trimmedEmail = email.toLowerCase().trim()
    
    // Vérifier qu'il n'y a pas déjà une invitation en attente pour cet email
    const { data: existingInvitations, error: checkError } = await supabase
      .from('team_invitations')
      .select('id, status')
      .eq('team_id', teamId)
      .eq('email', trimmedEmail)
      .eq('status', 'pending')

    if (checkError) {
      logger.warn('[inviteTeamMember] Erreur lors de la vérification:', checkError)
    }

    if (existingInvitations && existingInvitations.length > 0) {
      throw new Error('Une invitation est déjà en attente pour cet email')
    }

    // Créer l'invitation (la table stocke directement l'email, pas le user_id)
    const { data, error } = await supabase
      .from('team_invitations')
      .insert({
        team_id: teamId,
        email: trimmedEmail,
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
    // Charger les invitations (la table contient directement l'email)
    const { data, error } = await supabase
      .from('team_invitations')
      .select('id, email, status, invited_by, created_at, accepted_at')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('[loadTeamInvitations] Erreur:', error)
      return []
    }

    // Mapper les invitations (l'email est déjà dans la table)
    return (data || []).map(inv => ({
      id: inv.id,
      userId: null, // Pas de user_id dans team_invitations, seulement email
      email: inv.email,
      status: inv.status,
      createdAt: inv.created_at,
      acceptedAt: inv.accepted_at
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

