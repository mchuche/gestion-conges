/**
 * Service équipes — API Nest (`/teams`)
 *
 * Remplace PocketBase : mêmes signatures de fonctions pour TeamsModal et YearViewPresenceVertical.
 */

import { apiJson } from './api'
import logger from './logger'

/**
 * @param {string} userId — conservé pour la compatibilité ; l’API utilise le JWT.
 */
export async function loadUserTeams(userId) {
  if (!userId) {
    return []
  }
  try {
    const data = await apiJson('/teams', { method: 'GET' })
    const teams = data.teams || []
    return teams.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description ?? '',
      role: t.role,
      createdBy: t.createdBy,
      createdAt: t.createdAt,
    }))
  } catch (e) {
    logger.error('[loadUserTeams] Erreur:', e)
    return []
  }
}

/**
 * @param {string} userId — ignoré côté API (JWT)
 */
export async function createTeam(userId, name, description = '') {
  return apiJson('/teams', {
    method: 'POST',
    body: JSON.stringify({
      name: name.trim(),
      description: (description || '').trim(),
    }),
  })
}

export async function loadTeamMembers(teamId) {
  if (!teamId) return []
  try {
    const data = await apiJson(`/teams/${encodeURIComponent(teamId)}/members`, {
      method: 'GET',
    })
    return data.members || []
  } catch (e) {
    logger.error('[loadTeamMembers] Erreur:', e)
    return []
  }
}

export async function inviteTeamMember(teamId, inviterId, email) {
  return apiJson(`/teams/${encodeURIComponent(teamId)}/invitations`, {
    method: 'POST',
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  })
}

export async function loadMyTeamInvitations() {
  try {
    const data = await apiJson('/teams/invitations/mine', { method: 'GET' })
    return data.invitations || []
  } catch (e) {
    logger.error('[loadMyTeamInvitations] Erreur:', e)
    return []
  }
}

export async function acceptTeamInvitation(invitationId) {
  return apiJson(`/teams/invitations/${encodeURIComponent(invitationId)}/accept`, {
    method: 'POST',
  })
}

export async function declineTeamInvitation(invitationId) {
  return apiJson(`/teams/invitations/${encodeURIComponent(invitationId)}/decline`, {
    method: 'POST',
  })
}

export async function loadTeamInvitations(teamId) {
  if (!teamId) return []
  try {
    const data = await apiJson(`/teams/${encodeURIComponent(teamId)}/invitations`, {
      method: 'GET',
    })
    return data.invitations || []
  } catch (e) {
    logger.error('[loadTeamInvitations] Erreur:', e)
    return []
  }
}

export async function removeTeamMember(teamId, userId) {
  return apiJson(
    `/teams/${encodeURIComponent(teamId)}/members/${encodeURIComponent(userId)}`,
    { method: 'DELETE' },
  )
}

export async function deleteTeamInvitation(teamId, invitationId) {
  return apiJson(
    `/teams/${encodeURIComponent(teamId)}/invitations/${encodeURIComponent(invitationId)}`,
    { method: 'DELETE' },
  )
}

export async function transferTeamOwnership(teamId, newOwnerId) {
  return apiJson(`/teams/${encodeURIComponent(teamId)}/transfer`, {
    method: 'POST',
    body: JSON.stringify({ newOwnerId }),
  })
}

export async function deleteTeam(teamId) {
  return apiJson(`/teams/${encodeURIComponent(teamId)}`, { method: 'DELETE' })
}
