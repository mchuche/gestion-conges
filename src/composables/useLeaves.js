import { computed } from 'vue'
import { useLeavesStore } from '../stores/leaves'
import { useUIStore } from '../stores/ui'
import { useLeaveTypesStore } from '../stores/leaveTypes'
import { getDateKey } from '../services/utils'
import { getDay } from '../services/dateUtils'
import { getPublicHolidays } from '../services/holidays'
import logger from '../services/logger'

export function useLeaves() {
  const leavesStore = useLeavesStore()
  const uiStore = useUIStore()
  const leaveTypesStore = useLeaveTypesStore()

  const leaves = computed(() => leavesStore.leaves)
  const loading = computed(() => leavesStore.loading)
  const leavesCount = computed(() => leavesStore.leavesCount)

  function getLeaveForDate(date) {
    // Retourner un objet structuré avec full, morning, afternoon
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    const morningKey = `${dateKey}-morning`
    const afternoonKey = `${dateKey}-afternoon`
    
    return {
      full: leavesStore.leaves[dateKey] || null,
      morning: leavesStore.leaves[morningKey] || null,
      afternoon: leavesStore.leaves[afternoonKey] || null
    }
  }

  async function loadLeaves() {
    await leavesStore.loadLeaves()
  }

  async function setLeave(date, leaveTypeId, period = 'full') {
    const targetUserId = uiStore.selectedTargetUserId
    
    logger.log('[useLeaves] setLeave:', {
      date: date.toISOString().split('T')[0],
      leaveTypeId,
      period,
      targetUserId: targetUserId || 'utilisateur actuel'
    })

    // Si on modifie le congé d'un autre utilisateur (en tant que propriétaire d'équipe)
    if (targetUserId) {
      // Vérifier si c'est un événement ou un congé
      const leaveType = leaveTypesStore.getLeaveType(leaveTypeId)
      if (leaveType && leaveType.category !== 'event') {
        logger.warn('[useLeaves] Tentative de modification d\'un congé pour un autre utilisateur bloquée')
        throw new Error('Vous ne pouvez modifier que les événements des autres utilisateurs, pas les congés.')
      }
      
      const dateKey = period === 'full'
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${period}`
      
      logger.log('[useLeaves] Appel saveLeaveForUser:', { targetUserId, dateKey, leaveTypeId })
      await leavesStore.saveLeaveForUser(targetUserId, dateKey, leaveTypeId)
      return
    }

    // Sinon, modification pour l'utilisateur actuel
    const dateKey = period === 'full'
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${period}`
    
    leavesStore.setLeave(dateKey, leaveTypeId)
    await leavesStore.saveLeaves()
  }

  async function removeLeave(date, period = 'full') {
    const targetUserId = uiStore.selectedTargetUserId
    
    logger.log('[useLeaves] removeLeave:', {
      date: date.toISOString().split('T')[0],
      period,
      targetUserId: targetUserId || 'utilisateur actuel'
    })

    // Si on supprime le congé d'un autre utilisateur (en tant que propriétaire d'équipe)
    if (targetUserId) {
      const dateKey = period === 'full'
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${period}`
      
      logger.log('[useLeaves] Appel saveLeaveForUser (suppression):', { targetUserId, dateKey })
      await leavesStore.saveLeaveForUser(targetUserId, dateKey, null) // null = suppression
      return
    }

    // Sinon, suppression pour l'utilisateur actuel
    const dateKey = period === 'full'
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${period}`
    
    leavesStore.removeLeave(dateKey)
    await leavesStore.saveLeaves()
  }

  function clearAllLeaves() {
    leavesStore.clearAllLeaves()
  }

  // Supprimer tous les congés (catégorie 'leave') pour une année donnée
  async function clearLeavesForYear(year) {
    leavesStore.clearLeavesForYear(year, leaveTypesStore)
    await leavesStore.saveLeaves()
  }

  // Supprimer tous les événements (catégorie 'event') pour une année donnée
  async function clearEventsForYear(year) {
    leavesStore.clearEventsForYear(year, leaveTypesStore)
    await leavesStore.saveLeaves()
  }

  function openLeaveModal(date, period = 'full') {
    uiStore.openModal(date, period)
  }
  
  // Fonction helper pour obtenir la configuration d'un type de congé
  function getLeaveTypeConfig(leaveTypeId) {
    return leaveTypesStore.getLeaveType(leaveTypeId)
  }

  // Vérifier si une date est un weekend ou un jour férié
  function isWeekendOrHoliday(date) {
    // Vérifier si c'est un weekend
    const dayOfWeek = getDay(date)
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    
    // Vérifier si c'est un jour férié
    const year = date.getFullYear()
    const holidays = getPublicHolidays(uiStore.selectedCountry, year)
    const dateKeyVal = getDateKey(date)
    const isHoliday = holidays[dateKeyVal] !== undefined
    
    return isWeekend || isHoliday
  }

  return {
    leaves,
    loading,
    leavesCount,
    getLeaveForDate,
    getLeaveTypeConfig,
    isWeekendOrHoliday,
    loadLeaves,
    setLeave,
    removeLeave,
    clearAllLeaves,
    clearLeavesForYear,
    clearEventsForYear,
    openLeaveModal
  }
}
