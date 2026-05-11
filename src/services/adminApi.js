/**
 * API administration Nest (`/admin`) — réservé aux JWT avec is_admin.
 */

import { apiJson } from './api'

export async function fetchAdminStats() {
  return apiJson('/admin/stats', { method: 'GET' })
}

export async function fetchAdminUsers(q) {
  const qs = q ? `?q=${encodeURIComponent(q)}` : ''
  return apiJson(`/admin/users${qs}`, { method: 'GET' })
}

export async function deleteAdminUser(userId) {
  return apiJson(`/admin/users/${encodeURIComponent(userId)}`, { method: 'DELETE' })
}

export async function fetchAdminTeams() {
  return apiJson('/admin/teams', { method: 'GET' })
}

export async function deleteAdminTeam(teamId) {
  return apiJson(`/admin/teams/${encodeURIComponent(teamId)}`, { method: 'DELETE' })
}

export async function fetchGlobalLeaveTypes() {
  return apiJson('/admin/global-leave-types', { method: 'GET' })
}

export async function createGlobalLeaveType(body) {
  return apiJson('/admin/global-leave-types', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function updateGlobalLeaveType(id, body) {
  return apiJson(`/admin/global-leave-types/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export async function deleteGlobalLeaveType(id) {
  return apiJson(`/admin/global-leave-types/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

/** Paramètres globaux (types / quotas JSON par défaut). */
export async function fetchAdminAppSettings() {
  return apiJson('/admin/app-settings', { method: 'GET' })
}

export async function putAdminAppSettings(body) {
  return apiJson('/admin/app-settings', {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

/** Journal d’audit admin. */
export async function fetchAdminAuditLogs(limit = 200) {
  const q = limit != null ? `?limit=${encodeURIComponent(String(limit))}` : ''
  return apiJson(`/admin/audit-logs${q}`, { method: 'GET' })
}
