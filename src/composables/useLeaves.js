import { computed } from 'vue'
import { useLeavesStore } from '../stores/leaves'
import { useLeaveTypesStore } from '../stores/leaveTypes'
import { useUIStore } from '../stores/ui'
import { getDateKey, getDateKeyWithPeriod, getDateKeys } from '../services/utils'
import { getDay } from '../services/dateUtils'
import { getPublicHolidays } from '../services/holidays'
import logger from '../services/logger'

export function useLeaves() {
  const leavesStore = useLeavesStore()
  const leaveTypesStore = useLeaveTypesStore()
  const uiStore = useUIStore()

  // Obtenir les informations de congé pour une date
  function getLeaveForDate(date) {
    const keys = getDateKeys(date)
    return {
      full: leavesStore.leaves[keys.full] || null,
      morning: leavesStore.leaves[keys.morning] || null,
      afternoon: leavesStore.leaves[keys.afternoon] || null
    }
  }

  // Vérifier si une date est un weekend ou un jour férié
  function isWeekendOrHoliday(date) {
    // Vérifier si c'est un weekend
    const dayOfWeek = getDay(date)
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    
    // Vérifier si c'est un jour férié
    const year = date.getFullYear()
    const holidays = getPublicHolidays(uiStore.selectedCountry, year)
    const dateKey = getDateKey(date)
    const isHoliday = holidays[dateKey] !== undefined
    
    return isWeekend || isHoliday
  }

  // Définir un congé pour une date et une période
  async function setLeave(date, leaveTypeId, period = 'full') {
    // Empêcher l'ajout de congés sur les weekends et jours fériés
    if (isWeekendOrHoliday(date)) {
      const dayOfWeek = getDay(date)
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
      const year = date.getFullYear()
      const holidays = getPublicHolidays(uiStore.selectedCountry, year)
      const dateKey = getDateKey(date)
      const isHoliday = holidays[dateKey] !== undefined
      
      let errorMessage = 'Impossible de poser un congé sur '
      if (isWeekend && isHoliday) {
        errorMessage += 'un weekend et jour férié'
      } else if (isWeekend) {
        errorMessage += 'un weekend'
      } else {
        errorMessage += 'un jour férié'
      }
      
      const error = new Error(errorMessage)
      error.code = 'WEEKEND_OR_HOLIDAY'
      throw error
    }
    
    const keys = getDateKeys(date)
    const dateKey = period === 'full' ? keys.full : keys[period]

    // Si on définit une journée complète, supprimer les demi-journées
    if (period === 'full') {
      if (leavesStore.leaves[keys.morning]) {
        leavesStore.removeLeave(keys.morning)
      }
      if (leavesStore.leaves[keys.afternoon]) {
        leavesStore.removeLeave(keys.afternoon)
      }
      leavesStore.setLeave(keys.full, leaveTypeId)
    } else {
      // Si on définit une demi-journée, supprimer la journée complète si elle existe
      // (mais on garde l'autre demi-journée si elle existe pour permettre matin+après-midi)
      if (leavesStore.leaves[keys.full]) {
        leavesStore.removeLeave(keys.full)
      }
      // Utiliser la clé de la période spécifique
      leavesStore.setLeave(keys[period], leaveTypeId)
    }

    // Sauvegarder dans Supabase
    try {
      await leavesStore.saveLeaves()
    } catch (err) {
      logger.error('Erreur lors de la sauvegarde du congé:', err)
      throw err
    }
  }

  // Supprimer un congé pour une date
  async function removeLeave(date, period = null) {
    const keys = getDateKeys(date)

    if (period) {
      // Supprimer une période spécifique
      const dateKey = period === 'full' ? keys.full : keys[period]
      leavesStore.removeLeave(dateKey)
    } else {
      // Supprimer toutes les périodes pour cette date
      if (leavesStore.leaves[keys.full]) {
        leavesStore.removeLeave(keys.full)
      }
      if (leavesStore.leaves[keys.morning]) {
        leavesStore.removeLeave(keys.morning)
      }
      if (leavesStore.leaves[keys.afternoon]) {
        leavesStore.removeLeave(keys.afternoon)
      }
    }

    // Sauvegarder dans Supabase
    try {
      await leavesStore.saveLeaves()
    } catch (err) {
      logger.error('Erreur lors de la suppression du congé:', err)
      throw err
    }
  }

  // Vérifier si un type de congé est utilisé
  function isLeaveTypeUsed(leaveTypeId) {
    return Object.values(leavesStore.leaves).includes(leaveTypeId)
  }

  // Compter l'utilisation d'un type de congé
  function countLeaveTypeUsage(leaveTypeId) {
    return Object.values(leavesStore.leaves).filter(id => id === leaveTypeId).length
  }

  // Obtenir la configuration d'un type de congé
  function getLeaveTypeConfig(leaveTypeId) {
    return leaveTypesStore.getLeaveType(leaveTypeId)
  }

  return {
    getLeaveForDate,
    setLeave,
    removeLeave,
    isLeaveTypeUsed,
    countLeaveTypeUsage,
    getLeaveTypeConfig,
    isWeekendOrHoliday
  }
}

