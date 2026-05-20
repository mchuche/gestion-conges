/**
 * Store des congés — API NestJS (`/leaves`)
 *
 * Les congés sont stockés en PostgreSQL via Prisma ; le format local reste
 * `{ date_key: leave_type_id }` pour compatibilité avec le calendrier.
 * Le temps réel PocketBase est remplacé par un no-op (futur WebSocket ou polling).
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiJson } from '../services/api'
import logger from '../services/logger'
import { handleError } from '../services/errorHandler'
import { useAuthStore } from './auth'
import { useLeaveTypesStore } from './leaveTypes'
import { useNotificationsStore } from './notifications'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export const useLeavesStore = defineStore('leaves', () => {
  // State
  const leaves = ref({}) // { date_key: leave_type_id }
  const leaveIdMap = ref({}) // { id: date_key } - Mapping pour résoudre date_key depuis l'ID lors des DELETE Realtime
  const loading = ref(false)
  const error = ref(null)
  const realtimeEnabled = ref(false)
  const realtimeSubscription = ref(null) // Référence à la subscription Realtime
  const teamLeavesUpdateTrigger = ref(0) // Compteur pour déclencher le rechargement des congés d'équipe

  // Getters
  const leavesCount = computed(() => Object.keys(leaves.value).length)
  
  const getLeaveForDate = (date, period = 'full') => {
    const dateKey = period === 'full' 
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${period}`
    
    return leaves.value[dateKey] || null
  }

  const hasLeave = (dateKey) => {
    return leaves.value.hasOwnProperty(dateKey)
  }

  // ============================================
  // ACTIONS
  // ============================================
  
  /**
   * Charge tous les congés de l'utilisateur connecté depuis PocketBase
   */
  async function loadLeaves() {
    const authStore = useAuthStore()
    if (!authStore.user) {
      leaves.value = {}
      return
    }

    try {
      loading.value = true
      error.value = null

      const data = await apiJson('/leaves', { method: 'GET' })
      leaves.value = {}
      leaveIdMap.value = {}

      const rows = data.items || []
      rows.forEach((leave) => {
        leaves.value[leave.dateKey] = leave.leaveTypeId
        if (leave.id) {
          leaveIdMap.value[leave.id] = leave.dateKey
        }
      })

      logger.log('Jours de congé chargés:', Object.keys(leaves.value).length, 'entrées')

      if (!realtimeEnabled.value) {
        setupRealtime()
      }
    } catch (err) {
      const errorMessage = handleError(err, {
        context: 'LeavesStore.loadLeaves',
        showToast: false // Ne pas afficher de toast ici, laisser le composant décider
      })
      error.value = errorMessage
      leaves.value = {}
    } finally {
      loading.value = false
    }
  }

  /**
   * Charge les congés de tous les membres d'une équipe
   * 
   * @param {string[]} userIds - Liste des IDs des membres de l'équipe
   * @returns {Promise<Object>} - Objet avec userId comme clé et { date_key: leave_type_id } comme valeur
   */
  async function loadTeamLeaves(userIds) {
    if (!userIds || userIds.length === 0) {
      return {}
    }

    try {
      logger.debug('[LeavesStore] Chargement des congés pour l\'équipe:', userIds.length, 'membres')

      const qs = userIds.map(encodeURIComponent).join(',')
      const data = await apiJson(`/leaves/team?userIds=${qs}`, { method: 'GET' })
      const teamLeaves = data.byUser || {}

      const totalLeaves = Object.values(teamLeaves).reduce((sum, u) => sum + Object.keys(u).length, 0)
      logger.log('[LeavesStore] Congés d\'équipe chargés:', Object.keys(teamLeaves).length, 'utilisateurs,', totalLeaves, 'congés/événements')
      return teamLeaves
    } catch (err) {
      logger.error('[LeavesStore] Erreur lors du chargement des congés d\'équipe:', err)
      return {}
    }
  }

  /**
   * Anciennement : abonnement PocketBase Realtime.
   * Avec Nest : pas de flux temps réel pour l’instant — recharger manuellement ou prévoir WebSockets plus tard.
   */
  function setupRealtime() {
    const authStore = useAuthStore()
    if (!authStore.user || realtimeEnabled.value) return

    disableRealtime()
    realtimeEnabled.value = true
    realtimeSubscription.value = null
    logger.debug('[LeavesStore] Realtime désactivé (API Nest). Utilisez loadLeaves() après les changements distants.')
  }

  function disableRealtime() {
    realtimeSubscription.value = null
    realtimeEnabled.value = false
  }

  /**
   * Sauvegarde tous les congés de l'utilisateur dans PocketBase
   * Compare les congés existants avec les congés actuels et fait les mises à jour nécessaires
   */
  async function saveLeaves() {
    const authStore = useAuthStore()
    if (!authStore.user) return

    try {
      loading.value = true
      error.value = null

      await apiJson('/leaves/sync', {
        method: 'POST',
        body: JSON.stringify({ entries: { ...leaves.value } }),
      })

      await loadLeaves()

      logger.log('Jours de congé sauvegardés:', Object.keys(leaves.value).length, 'entrées')
    } catch (err) {
      const errorMessage = handleError(err, {
        context: 'LeavesStore.saveLeaves',
        showToast: false // Re-lancer l'erreur pour que l'appelant puisse afficher le toast
      })
      error.value = errorMessage
      throw err
    } finally {
      loading.value = false
    }
  }

  function setLeave(dateKey, leaveTypeId) {
    leaves.value[dateKey] = leaveTypeId
  }

  // Sauvegarder un congé pour un utilisateur spécifique (utilisé par les propriétaires d'équipe)
  /**
   * Créer une notification pour informer l'utilisateur qu'un événement a été modifié
   */
  async function createNotificationForLeaveChange(currentUser, targetUserId, dateKey, leaveTypeId, previousLeaveTypeId = null) {
    try {
      const notificationsStore = useNotificationsStore()
      const leaveTypesStore = useLeaveTypesStore()
      
      // Déterminer le type de modification
      let actionText = ''
      const effectiveLeaveTypeId = leaveTypeId || previousLeaveTypeId || null
      const leaveType = effectiveLeaveTypeId ? leaveTypesStore.getLeaveType(effectiveLeaveTypeId) : null
      // IMPORTANT: on veut le nom complet (pas l'abréviation/label)
      const leaveTypeFullName = leaveType?.name || effectiveLeaveTypeId || 'événement'

      const previousType = previousLeaveTypeId ? leaveTypesStore.getLeaveType(previousLeaveTypeId) : null
      const previousFullName = previousType?.name || previousLeaveTypeId || null
      
      // Extraire la date du dateKey (format: YYYY-MM-DD ou YYYY-MM-DD-period)
      const dateParts = dateKey.split('-')
      const year = parseInt(dateParts[0])
      const month = parseInt(dateParts[1]) - 1
      const day = parseInt(dateParts[2])
      const period = dateParts[3] // 'morning' ou 'afternoon' si présent

      const date = new Date(year, month, day)
      const dateFormatted = format(date, 'dd MMMM yyyy', { locale: fr })

      let periodText = ''
      if (period === 'morning') {
        periodText = ' (matin)'
      } else if (period === 'afternoon') {
        periodText = ' (après-midi)'
      }

      if (leaveTypeId) {
        // Extraire la date du dateKey (format: YYYY-MM-DD ou YYYY-MM-DD-period)
        if (previousFullName && previousLeaveTypeId && previousLeaveTypeId !== leaveTypeId) {
          actionText = `a remplacé "${previousFullName}" par "${leaveTypeFullName}" le ${dateFormatted}${periodText}`
        } else {
          actionText = `a ajouté "${leaveTypeFullName}" le ${dateFormatted}${periodText}`
        }
      } else {
        // Suppression
        actionText = `a supprimé "${leaveTypeFullName}" le ${dateFormatted}${periodText}`
      }
      
      await notificationsStore.createNotification(
        targetUserId,
        'event_modified',
        `Événement modifié : ${leaveTypeFullName}`,
        `${currentUser.email} ${actionText}`,
        {
          date_key: dateKey,
          leave_type_id: effectiveLeaveTypeId,
          modified_by: currentUser.email
        }
      )
      
      logger.log('[LeavesStore] Notification créée pour:', targetUserId)
    } catch (error) {
      // Ne pas bloquer l'opération principale si la notification échoue
      logger.error('[LeavesStore] Erreur lors de la création de notification:', error)
    }
  }

  /**
   * Sauvegarde un congé pour un utilisateur spécifique
   * Utilisé notamment par les propriétaires d'équipe pour modifier les événements des membres
   * 
   * @param {string} targetUserId - ID de l'utilisateur cible
   * @param {string} dateKey - Clé de date (format: YYYY-MM-DD ou YYYY-MM-DD-period)
   * @param {string|null} leaveTypeId - ID du type de congé (null pour supprimer)
   */
  async function saveLeaveForUser(targetUserId, dateKey, leaveTypeId) {
    if (!targetUserId) {
      logger.error('[LeavesStore] saveLeaveForUser: paramètres invalides', { targetUserId })
      throw new Error('Utilisateur cible non spécifié')
    }

    logger.log('[LeavesStore] saveLeaveForUser DÉBUT:', { targetUserId, dateKey, leaveTypeId })

    try {
      loading.value = true
      error.value = null

      const authStore = useAuthStore()
      if (leaveTypeId && targetUserId !== authStore.user?.id) {
        const leaveTypesStore = useLeaveTypesStore()
        const leaveType = leaveTypesStore.getLeaveType(leaveTypeId)
        if (leaveType && leaveType.category !== 'event') {
          logger.warn('[LeavesStore] Tentative de modification d\'un congé pour un autre utilisateur bloquée')
          throw new Error('Vous ne pouvez modifier que les événements des autres utilisateurs, pas les congés.')
        }
      }

      if (targetUserId === authStore.user?.id && leaveTypeId && leaves.value[dateKey] === leaveTypeId) {
        logger.debug('[LeavesStore] Aucun changement (même type) - skip:', { targetUserId, dateKey, leaveTypeId })
        return
      }

      const previousLeaveTypeId =
        targetUserId === authStore.user?.id ? (leaves.value[dateKey] || null) : null

      const data = await apiJson('/leaves/for-user', {
        method: 'PATCH',
        body: JSON.stringify({
          targetUserId,
          dateKey,
          leaveTypeId: leaveTypeId ?? null,
        }),
      })

      const item = data.item
      if (targetUserId === authStore.user?.id) {
        if (item) {
          leaves.value = { ...leaves.value, [dateKey]: item.leaveTypeId }
          leaveIdMap.value = { ...leaveIdMap.value, [item.id]: item.dateKey }
        } else {
          removeLeave(dateKey)
          const next = { ...leaveIdMap.value }
          for (const id of Object.keys(next)) {
            if (next[id] === dateKey) delete next[id]
          }
          leaveIdMap.value = next
        }
      }

      if (targetUserId !== authStore.user?.id) {
        await createNotificationForLeaveChange(
          authStore.user,
          targetUserId,
          dateKey,
          leaveTypeId,
          previousLeaveTypeId
        )
      }

      logger.log('[LeavesStore] ✅ saveLeaveForUser TERMINÉ avec succès')

      teamLeavesUpdateTrigger.value++
    } catch (err) {
      logger.error('[LeavesStore] ❌ saveLeaveForUser ÉCHEC:', err)
      const errorMessage = handleError(err, {
        context: 'LeavesStore.saveLeaveForUser',
        showToast: true
      })
      error.value = errorMessage
      throw err
    } finally {
      loading.value = false
    }
  }

  function removeLeave(dateKey) {
    // Créer un nouvel objet pour forcer la réactivité Vue
    const newLeaves = { ...leaves.value }
    delete newLeaves[dateKey]
    leaves.value = newLeaves
  }

  function removeLeavesByType(leaveTypeId) {
    Object.keys(leaves.value).forEach(key => {
      if (leaves.value[key] === leaveTypeId) {
        delete leaves.value[key]
      }
    })
  }

  function clearAllLeaves() {
    leaves.value = {}
    leaveIdMap.value = {}
  }

  // Supprimer tous les congés (catégorie 'leave') pour une année donnée
  function clearLeavesForYear(year, leaveTypesStore) {
    const newLeaves = { ...leaves.value }
    const newLeaveIdMap = { ...leaveIdMap.value }
    
    Object.keys(leaves.value).forEach(dateKey => {
      // Extraire l'année de la date_key (format: YYYY-MM-DD ou YYYY-MM-DD-period)
      const yearFromKey = parseInt(dateKey.split('-')[0])
      
      if (yearFromKey === year) {
        const leaveTypeId = leaves.value[dateKey]
        const leaveType = leaveTypesStore.getLeaveType(leaveTypeId)
        const category = leaveType?.category || 'absence'

        // Supprimer seulement les absences (catégorie absence)
        if (category === 'absence') {
          delete newLeaves[dateKey]
          // Supprimer aussi du mapping si présent
          Object.keys(newLeaveIdMap).forEach(id => {
            if (newLeaveIdMap[id] === dateKey) {
              delete newLeaveIdMap[id]
            }
          })
        }
      }
    })
    
    leaves.value = newLeaves
    leaveIdMap.value = newLeaveIdMap
  }

  // Supprimer tous les événements (catégorie 'event') pour une année donnée
  function clearEventsForYear(year, leaveTypesStore) {
    const newLeaves = { ...leaves.value }
    const newLeaveIdMap = { ...leaveIdMap.value }
    
    Object.keys(leaves.value).forEach(dateKey => {
      // Extraire l'année de la date_key (format: YYYY-MM-DD ou YYYY-MM-DD-period)
      const yearFromKey = parseInt(dateKey.split('-')[0])
      
      if (yearFromKey === year) {
        const leaveTypeId = leaves.value[dateKey]
        const leaveType = leaveTypesStore.getLeaveType(leaveTypeId)
        const category = leaveType?.category || 'absence'

        // Supprimer seulement les événements (catégorie event)
        if (category === 'event') {
          delete newLeaves[dateKey]
          // Supprimer aussi du mapping si présent
          Object.keys(newLeaveIdMap).forEach(id => {
            if (newLeaveIdMap[id] === dateKey) {
              delete newLeaveIdMap[id]
            }
          })
        }
      }
    })
    
    leaves.value = newLeaves
    leaveIdMap.value = newLeaveIdMap
  }

  function reset() {
    leaves.value = {}
    leaveIdMap.value = {}
    loading.value = false
    error.value = null
    realtimeEnabled.value = false
    realtimeSubscription.value = null
    disableRealtime()
  }

  return {
    // State
    leaves,
    loading,
    error,
    realtimeEnabled,
    teamLeavesUpdateTrigger,
    // Getters
    leavesCount,
    getLeaveForDate,
    hasLeave,
    // Actions
    loadLeaves,
    loadTeamLeaves,
    saveLeaves,
    saveLeaveForUser,
    setLeave,
    removeLeave,
    removeLeavesByType,
    clearAllLeaves,
    clearLeavesForYear,
    clearEventsForYear,
    setupRealtime,
    disableRealtime,
    reset
  }
})
