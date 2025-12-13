import { computed } from 'vue'
import { useLeavesStore } from '../stores/leaves'
import { useLeaveTypesStore } from '../stores/leaveTypes'
import { useQuotasStore } from '../stores/quotas'
import { useUIStore } from '../stores/ui'
import { useLeaves } from './useLeaves'
import { getYear } from '../services/dateUtils'
import { getDateKey } from '../services/utils'

export function useStats() {
  const leavesStore = useLeavesStore()
  const leaveTypesStore = useLeaveTypesStore()
  const quotasStore = useQuotasStore()
  const uiStore = useUIStore()
  const { getLeaveForDate, getLeaveTypeConfig } = useLeaves()

  // Vérifier si un type a un quota valide pour une année
  function hasValidQuota(typeId, year) {
    const quota = quotasStore.getQuota(year, typeId)
    return quota !== null && quota !== undefined && quota > 0
  }

  // Formater un nombre (gérer les demi-journées)
  function formatNumber(num) {
    if (num % 1 === 0) {
      return num.toString()
    }
    return num.toFixed(1)
  }

  // Calculer les statistiques pour l'année en cours
  const stats = computed(() => {
    const currentYear = getYear(uiStore.currentDate)
    
    // Compter les jours utilisés par type (0.5 pour demi-journée, 1 pour journée complète)
    // Exclure les types sans quota ou avec quota = 0
    const usedDays = {}
    const processedDates = new Set()

    Object.keys(leavesStore.leaves).forEach(dateKey => {
      // Extraire la date de base (sans période)
      const dateParts = dateKey.split('-')
      const baseDateKey = `${dateParts[0]}-${dateParts[1]}-${dateParts[2]}`
      
      // Éviter de traiter deux fois la même date (matin et après-midi)
      if (processedDates.has(baseDateKey)) {
        return
      }
      
      const date = new Date(baseDateKey + 'T00:00:00')
      
      // Filtrer par année
      if (getYear(date) !== currentYear) {
        return
      }
      
      processedDates.add(baseDateKey)
      const leaveInfo = getLeaveForDate(date)
      
      // Ne compter que les congés (category: 'leave') avec quota valide (> 0)
      if (leaveInfo.full) {
        const config = getLeaveTypeConfig(leaveInfo.full)
        if (config && config.category === 'leave' && hasValidQuota(leaveInfo.full, currentYear)) {
          usedDays[leaveInfo.full] = (usedDays[leaveInfo.full] || 0) + 1
        }
      } else {
        if (leaveInfo.morning) {
          const config = getLeaveTypeConfig(leaveInfo.morning)
          if (config && config.category === 'leave' && hasValidQuota(leaveInfo.morning, currentYear)) {
            usedDays[leaveInfo.morning] = (usedDays[leaveInfo.morning] || 0) + 0.5
          }
        }
        if (leaveInfo.afternoon) {
          const config = getLeaveTypeConfig(leaveInfo.afternoon)
          if (config && config.category === 'leave' && hasValidQuota(leaveInfo.afternoon, currentYear)) {
            usedDays[leaveInfo.afternoon] = (usedDays[leaveInfo.afternoon] || 0) + 0.5
          }
        }
      }
    })

    // Calculer les totaux
    let totalQuotas = 0
    let totalUsed = 0
    let totalRemaining = 0

    leaveTypesStore.leaveTypes.forEach(typeConfig => {
      const quota = quotasStore.getQuota(currentYear, typeConfig.id)
      if (quota !== null && quota !== undefined && quota > 0 && typeConfig.category === 'leave') {
        totalQuotas += quota
        const used = usedDays[typeConfig.id] || 0
        totalUsed += used
        const remaining = quota - used
        totalRemaining += Math.max(0, remaining) // Ne pas compter les dépassements négatifs
      }
    })

    return {
      totalUsed,
      totalQuotas,
      totalRemaining,
      usedDays,
      formatNumber
    }
  })

  // Calculer les quotas par type pour l'année en cours
  const quotasByType = computed(() => {
    const currentYear = getYear(uiStore.currentDate)
    const usedDays = {}
    const processedDates = new Set()

    // Compter les jours utilisés
    Object.keys(leavesStore.leaves).forEach(dateKey => {
      const dateParts = dateKey.split('-')
      const baseDateKey = `${dateParts[0]}-${dateParts[1]}-${dateParts[2]}`
      
      if (processedDates.has(baseDateKey)) {
        return
      }
      
      const date = new Date(baseDateKey + 'T00:00:00')
      
      if (getYear(date) !== currentYear) {
        return
      }
      
      processedDates.add(baseDateKey)
      const leaveInfo = getLeaveForDate(date)
      
      if (leaveInfo.full) {
        const config = getLeaveTypeConfig(leaveInfo.full)
        if (config && config.category === 'leave' && hasValidQuota(leaveInfo.full, currentYear)) {
          usedDays[leaveInfo.full] = (usedDays[leaveInfo.full] || 0) + 1
        }
      } else {
        if (leaveInfo.morning) {
          const config = getLeaveTypeConfig(leaveInfo.morning)
          if (config && config.category === 'leave' && hasValidQuota(leaveInfo.morning, currentYear)) {
            usedDays[leaveInfo.morning] = (usedDays[leaveInfo.morning] || 0) + 0.5
          }
        }
        if (leaveInfo.afternoon) {
          const config = getLeaveTypeConfig(leaveInfo.afternoon)
          if (config && config.category === 'leave' && hasValidQuota(leaveInfo.afternoon, currentYear)) {
            usedDays[leaveInfo.afternoon] = (usedDays[leaveInfo.afternoon] || 0) + 0.5
          }
        }
      }
    })

    // Créer les données de quotas par type
    const quotas = []
    leaveTypesStore.leaveTypes.forEach(typeConfig => {
      // Ne montrer que les congés (category: 'leave')
      if (typeConfig.category !== 'leave') {
        return
      }
      
      const quota = quotasStore.getQuota(currentYear, typeConfig.id)
      if (quota !== null && quota !== undefined && quota > 0) {
        const used = usedDays[typeConfig.id] || 0
        const remaining = quota - used
        const percentage = quota > 0 ? (used / quota) * 100 : 0

        quotas.push({
          type: typeConfig,
          quota,
          used,
          remaining,
          percentage: Math.min(percentage, 100),
          exceeded: remaining < 0
        })
      }
    })

    return quotas
  })

  return {
    stats,
    quotasByType,
    formatNumber,
    hasValidQuota
  }
}
