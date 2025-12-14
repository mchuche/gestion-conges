import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../services/supabase'
import logger from '../services/logger'
import { useAuthStore } from './auth'
import { useQuotasRealtime } from '../composables/useRealtime'

export const useQuotasStore = defineStore('quotas', () => {
  // State
  const quotasByYear = ref({}) // { year: { leave_type_id: quota } }
  const loading = ref(false)
  const error = ref(null)
  const realtimeEnabled = ref(false)
  const realtimeSubscription = ref(null) // Référence à la subscription Realtime

  // Getters
  const getQuota = (year, leaveTypeId) => {
    if (!quotasByYear.value[year]) {
      return undefined
    }
    return quotasByYear.value[year][leaveTypeId]
  }

  const getQuotasForYear = (year) => {
    return quotasByYear.value[year] || {}
  }

  // Actions
  async function loadQuotas() {
    const authStore = useAuthStore()
    if (!authStore.user || !supabase) {
      quotasByYear.value = {}
      return
    }

    try {
      loading.value = true
      error.value = null

      const { data, error: fetchError } = await supabase
        .from('leave_quotas')
        .select('*')
        .eq('user_id', authStore.user.id)

      if (fetchError) throw fetchError

      // Convertir les données en format interne
      quotasByYear.value = {}
      if (data) {
        data.forEach(quota => {
          if (!quotasByYear.value[quota.year]) {
            quotasByYear.value[quota.year] = {}
          }
          quotasByYear.value[quota.year][quota.leave_type_id] = quota.quota
        })
      }

      // S'assurer que l'année en cours a des quotas par défaut si elle n'existe pas
      const currentYear = new Date().getFullYear()
      if (!quotasByYear.value[currentYear]) {
        quotasByYear.value[currentYear] = {
          'congé-payé': 25,
          'rtt': 22,
          'jours-hiver': 2
        }
        await saveQuotas()
      }

      logger.log('Quotas chargés pour', Object.keys(quotasByYear.value).length, 'années')
      
      // Activer Realtime après le premier chargement
      if (!realtimeEnabled.value) {
        setupRealtime()
      }
    } catch (err) {
      error.value = err.message
      logger.error('Erreur lors du chargement des quotas:', err)
      quotasByYear.value = {}
    } finally {
      loading.value = false
    }
  }

  async function saveQuotas() {
    const authStore = useAuthStore()
    if (!authStore.user || !supabase) return

    try {
      loading.value = true
      error.value = null

      // Récupérer tous les quotas existants
      const { data: existingQuotas } = await supabase
        .from('leave_quotas')
        .select('id, leave_type_id, year')
        .eq('user_id', authStore.user.id)

      const existingMap = new Map()
      existingQuotas?.forEach(q => {
        const key = `${q.year}-${q.leave_type_id}`
        existingMap.set(key, q.id)
      })

      // Insérer ou mettre à jour les quotas
      const quotasToInsert = []
      const quotasToUpdate = []

      Object.keys(quotasByYear.value).forEach(year => {
        Object.keys(quotasByYear.value[year]).forEach(leaveTypeId => {
          const quota = quotasByYear.value[year][leaveTypeId]
          const key = `${year}-${leaveTypeId}`
          const existingId = existingMap.get(key)

          if (existingId) {
            quotasToUpdate.push({
              id: existingId,
              quota: quota
            })
          } else {
            quotasToInsert.push({
              user_id: authStore.user.id,
              leave_type_id: leaveTypeId,
              year: parseInt(year),
              quota: quota
            })
          }
        })
      })

      // Supprimer les quotas qui n'existent plus
      const currentKeys = new Set()
      Object.keys(quotasByYear.value).forEach(year => {
        Object.keys(quotasByYear.value[year]).forEach(leaveTypeId => {
          currentKeys.add(`${year}-${leaveTypeId}`)
        })
      })

      const toDelete = existingQuotas?.filter(q => {
        const key = `${q.year}-${q.leave_type_id}`
        return !currentKeys.has(key)
      }) || []

      if (toDelete.length > 0) {
        const idsToDelete = toDelete.map(q => q.id)
        await supabase
          .from('leave_quotas')
          .delete()
          .in('id', idsToDelete)
      }

      // Insérer les nouveaux quotas
      if (quotasToInsert.length > 0) {
        await supabase
          .from('leave_quotas')
          .insert(quotasToInsert)
      }

      // Mettre à jour les quotas existants
      for (const quota of quotasToUpdate) {
        await supabase
          .from('leave_quotas')
          .update({ quota: quota.quota })
          .eq('id', quota.id)
      }

      logger.log('Quotas sauvegardés pour', Object.keys(quotasByYear.value).length, 'années')
    } catch (err) {
      error.value = err.message
      logger.error('Erreur lors de la sauvegarde des quotas:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  function setQuota(year, leaveTypeId, quota) {
    if (!quotasByYear.value[year]) {
      quotasByYear.value[year] = {}
    }
    quotasByYear.value[year][leaveTypeId] = quota
  }

  function removeQuota(year, leaveTypeId) {
    if (quotasByYear.value[year]) {
      delete quotasByYear.value[year][leaveTypeId]
      // Supprimer l'année si elle est vide
      if (Object.keys(quotasByYear.value[year]).length === 0) {
        delete quotasByYear.value[year]
      }
    }
  }

  // Configuration Realtime
  function setupRealtime() {
    const authStore = useAuthStore()
    if (!authStore.user || realtimeEnabled.value) return

    // Nettoyer l'ancienne subscription si elle existe
    disableRealtime()

    realtimeEnabled.value = true
    
    // Stocker la référence de la subscription pour pouvoir la nettoyer
    realtimeSubscription.value = useQuotasRealtime(authStore.user.id, {
      onInsert: (newQuota) => {
        logger.log('[Realtime] Nouveau quota inséré:', newQuota)
        // Ajouter le quota au store
        if (!quotasByYear.value[newQuota.year]) {
          quotasByYear.value[newQuota.year] = {}
        }
        quotasByYear.value[newQuota.year][newQuota.leave_type_id] = newQuota.quota
      },
      onUpdate: (updatedQuota, oldQuota) => {
        logger.log('[Realtime] Quota mis à jour:', updatedQuota)
        // Mettre à jour le quota dans le store
        if (!quotasByYear.value[updatedQuota.year]) {
          quotasByYear.value[updatedQuota.year] = {}
        }
        quotasByYear.value[updatedQuota.year][updatedQuota.leave_type_id] = updatedQuota.quota
        // Si l'année ou le type a changé, nettoyer l'ancien
        if (oldQuota.year !== updatedQuota.year || oldQuota.leave_type_id !== updatedQuota.leave_type_id) {
          if (quotasByYear.value[oldQuota.year] && quotasByYear.value[oldQuota.year][oldQuota.leave_type_id]) {
            delete quotasByYear.value[oldQuota.year][oldQuota.leave_type_id]
            // Supprimer l'année si elle est vide
            if (Object.keys(quotasByYear.value[oldQuota.year]).length === 0) {
              delete quotasByYear.value[oldQuota.year]
            }
          }
        }
      },
      onDelete: (deletedQuota) => {
        logger.log('[Realtime] Quota supprimé:', deletedQuota)
        // Supprimer le quota du store
        if (quotasByYear.value[deletedQuota.year] && quotasByYear.value[deletedQuota.year][deletedQuota.leave_type_id]) {
          delete quotasByYear.value[deletedQuota.year][deletedQuota.leave_type_id]
          // Supprimer l'année si elle est vide
          if (Object.keys(quotasByYear.value[deletedQuota.year]).length === 0) {
            delete quotasByYear.value[deletedQuota.year]
          }
        }
      }
    })
    
    logger.log('[Realtime] Subscription activée pour les quotas')
  }

  function disableRealtime() {
    // Nettoyer la subscription si elle existe
    if (realtimeSubscription.value && typeof realtimeSubscription.value.unsubscribe === 'function') {
      realtimeSubscription.value.unsubscribe()
      logger.log('[Realtime] Subscription nettoyée pour les quotas')
    }
    realtimeSubscription.value = null
    realtimeEnabled.value = false
  }

  function reset() {
    quotasByYear.value = {}
    loading.value = false
    error.value = null
    realtimeEnabled.value = false
    realtimeSubscription.value = null
    disableRealtime()
  }

  return {
    // State
    quotasByYear,
    loading,
    error,
    realtimeEnabled,
    // Getters
    getQuota,
    getQuotasForYear,
    // Actions
    loadQuotas,
    saveQuotas,
    setQuota,
    removeQuota,
    setupRealtime,
    disableRealtime,
    reset
  }
})

