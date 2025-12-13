import { computed } from 'vue'
import { useLeavesStore } from '../stores/leaves'
import { useLeaveTypesStore } from '../stores/leaveTypes'
import { useQuotasStore } from '../stores/quotas'
import { useUIStore } from '../stores/ui'
import { getYear } from '../services/dateUtils'
import { formatNumber } from '../services/utils'
import logger from '../services/logger'

export function useStats() {
  const leavesStore = useLeavesStore()
  const leaveTypesStore = useLeaveTypesStore()
  const quotasStore = useQuotasStore()
  const uiStore = useUIStore()

  // Obtenir le quota d'un type de congé pour une année donnée
  function getQuotaForYear(typeId, year) {
    // Si l'année demandée a des quotas configurés, les utiliser
    const quota = quotasStore.getQuota(year, typeId)
    if (quota !== undefined && quota !== null) {
      return quota
    }
    
    // Sinon, utiliser les quotas de l'année en cours par défaut
    const currentYear = new Date().getFullYear()
    const currentQuota = quotasStore.getQuota(currentYear, typeId)
    if (currentQuota !== undefined && currentQuota !== null) {
      return currentQuota
    }
    
    return null
  }

  // Vérifier si un type de congé a un quota valide (> 0)
  function hasValidQuota(typeId, year) {
    const quota = getQuotaForYear(typeId, year)
    return quota !== null && quota !== undefined && quota > 0
  }

  // Calculer les statistiques pour une année donnée
  function calculateStats(year = null) {
    const targetYear = year || getYear(uiStore.currentDate)
    
    // Compter les jours (0.5 pour demi-journée, 1 pour journée complète) pour l'année en cours uniquement
    // Exclure les types sans quota ou avec quota = 0
    const usedDays = {}
    const processedDatesForQuota = new Set()

    Object.keys(leavesStore.leaves).forEach(dateKey => {
      const baseDateKey = dateKey.split('-').slice(0, 3).join('-')
      const date = new Date(baseDateKey)
      
      // Filtrer par année
      if (getYear(date) !== targetYear) {
        return
      }
      
      if (!processedDatesForQuota.has(baseDateKey)) {
        processedDatesForQuota.add(baseDateKey)
        const leaveInfo = getLeaveForDate(date)
        
        // Ne compter que les congés (category: 'leave') avec quota valide (> 0)
        const fullConfig = leaveInfo.full ? leaveTypesStore.getLeaveType(leaveInfo.full) : null
        const morningConfig = leaveInfo.morning ? leaveTypesStore.getLeaveType(leaveInfo.morning) : null
        const afternoonConfig = leaveInfo.afternoon ? leaveTypesStore.getLeaveType(leaveInfo.afternoon) : null
        
        if (leaveInfo.full && fullConfig && fullConfig.category === 'leave' && hasValidQuota(leaveInfo.full, targetYear)) {
          usedDays[leaveInfo.full] = (usedDays[leaveInfo.full] || 0) + 1
        } else {
          if (leaveInfo.morning && morningConfig && morningConfig.category === 'leave' && hasValidQuota(leaveInfo.morning, targetYear)) {
            usedDays[leaveInfo.morning] = (usedDays[leaveInfo.morning] || 0) + 0.5
          }
          if (leaveInfo.afternoon && afternoonConfig && afternoonConfig.category === 'leave' && hasValidQuota(leaveInfo.afternoon, targetYear)) {
            usedDays[leaveInfo.afternoon] = (usedDays[leaveInfo.afternoon] || 0) + 0.5
          }
        }
      }
    })

    // Calculer les jours restants et le total des quotas pour chaque type avec quota
    let totalQuotas = 0
    let totalUsed = 0
    let totalRemaining = 0
    const statsByType = []

    leaveTypesStore.leaveTypes.forEach(typeConfig => {
      const quota = getQuotaForYear(typeConfig.id, targetYear)
      if (quota !== null && quota !== undefined && quota > 0) {
        totalQuotas += quota
        const used = usedDays[typeConfig.id] || 0
        totalUsed += used
        const remaining = quota - used
        totalRemaining += Math.max(0, remaining)
        
        statsByType.push({
          typeId: typeConfig.id,
          typeName: typeConfig.name,
          quota,
          used,
          remaining: Math.max(0, remaining)
        })
      }
    })

    return {
      year: targetYear,
      totalQuotas,
      totalUsed,
      totalRemaining,
      statsByType
    }
  }

  // Obtenir les informations de congé pour une date
  function getLeaveForDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const baseKey = `${year}-${month}-${day}`
    
    return {
      full: leavesStore.leaves[baseKey] || null,
      morning: leavesStore.leaves[`${baseKey}-morning`] || null,
      afternoon: leavesStore.leaves[`${baseKey}-afternoon`] || null
    }
  }

  // Statistiques réactives pour l'année courante
  const currentYearStats = computed(() => {
    return calculateStats()
  })

  return {
    getQuotaForYear,
    hasValidQuota,
    calculateStats,
    getLeaveForDate,
    currentYearStats
  }
}

