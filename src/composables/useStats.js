import { computed, shallowRef } from 'vue'
import { useLeavesStore } from '../stores/leaves'
import { useLeaveTypesStore } from '../stores/leaveTypes'
import { useQuotasStore } from '../stores/quotas'
import { useUIStore } from '../stores/ui'
import { useLeaves } from './useLeaves'
import { getYear } from '../services/dateUtils'
import { getDateKey } from '../services/utils'

// Cache pour les dates uniques par année (mémoization)
const uniqueDatesCache = new Map()

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
    if (!uiStore.currentDate) return { totalUsed: 0, totalQuotas: 0, totalRemaining: 0, usedDays: {}, formatNumber }
    const currentYear = getYear(uiStore.currentDate)
    
    // Compter les jours utilisés par type (0.5 pour demi-journée, 1 pour journée complète)
    // Exclure les types sans quota ou avec quota = 0
    const usedDays = {}

    // Collecter toutes les dates uniques d'abord (avec cache)
    const cacheKey = `${currentYear}-${Object.keys(leavesStore.leaves).length}`
    let uniqueDates = uniqueDatesCache.get(cacheKey)
    
    if (!uniqueDates) {
      uniqueDates = new Set()
      Object.keys(leavesStore.leaves).forEach(dateKey => {
        const dateParts = dateKey.split('-')
        const baseDateKey = `${dateParts[0]}-${dateParts[1]}-${dateParts[2]}`
        uniqueDates.add(baseDateKey)
      })
      uniqueDatesCache.set(cacheKey, uniqueDates)
      // Limiter la taille du cache à 5 entrées
      if (uniqueDatesCache.size > 5) {
        const firstKey = uniqueDatesCache.keys().next().value
        uniqueDatesCache.delete(firstKey)
      }
    }

    // Traiter chaque date unique
    uniqueDates.forEach(baseDateKey => {
      const date = new Date(baseDateKey + 'T00:00:00')
      
      // Filtrer par année
      if (getYear(date) !== currentYear) {
        return
      }
      
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
    if (!uiStore.currentDate) return []
    const currentYear = getYear(uiStore.currentDate)
    const usedDays = {}

    // Collecter toutes les dates uniques d'abord (réutiliser le cache de stats)
    const cacheKey = `${currentYear}-${Object.keys(leavesStore.leaves).length}`
    let uniqueDatesForQuotas = uniqueDatesCache.get(cacheKey)
    
    if (!uniqueDatesForQuotas) {
      uniqueDatesForQuotas = new Set()
      Object.keys(leavesStore.leaves).forEach(dateKey => {
        const dateParts = dateKey.split('-')
        const baseDateKey = `${dateParts[0]}-${dateParts[1]}-${dateParts[2]}`
        uniqueDatesForQuotas.add(baseDateKey)
      })
      uniqueDatesCache.set(cacheKey, uniqueDatesForQuotas)
      // Limiter la taille du cache à 5 entrées
      if (uniqueDatesCache.size > 5) {
        const firstKey = uniqueDatesCache.keys().next().value
        uniqueDatesCache.delete(firstKey)
      }
    }

    // Traiter chaque date unique
    uniqueDatesForQuotas.forEach(baseDateKey => {
      const date = new Date(baseDateKey + 'T00:00:00')
      
      if (getYear(date) !== currentYear) {
        return
      }
      
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
