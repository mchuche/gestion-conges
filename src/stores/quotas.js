/**
 * Store des quotas — API Nest (`/quotas`)
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiJson } from '../services/api'
import logger from '../services/logger'
import { useAuthStore } from './auth'

export const useQuotasStore = defineStore('quotas', () => {
  const quotasByYear = ref({})
  const loading = ref(false)
  const error = ref(null)
  const realtimeEnabled = ref(false)
  const realtimeSubscription = ref(null)

  const getQuota = (year, leaveTypeId) => {
    if (!quotasByYear.value[year]) {
      return undefined
    }
    return quotasByYear.value[year][leaveTypeId]
  }

  const getQuotasForYear = (year) => {
    return quotasByYear.value[year] || {}
  }

  async function loadQuotas() {
    const authStore = useAuthStore()
    if (!authStore.user) {
      quotasByYear.value = {}
      return
    }

    try {
      loading.value = true
      error.value = null

      const data = await apiJson('/quotas', { method: 'GET' })
      const byYear = data.byYear || {}
      quotasByYear.value = {}
      for (const [y, types] of Object.entries(byYear)) {
        quotasByYear.value[y] = { ...types }
      }

      const currentYear = new Date().getFullYear()
      if (!quotasByYear.value[currentYear]) {
        quotasByYear.value[currentYear] = {
          'congé-payé': 25,
          rtt: 22,
          'jours-hiver': 2,
        }
        await saveQuotas()
      }

      logger.log('Quotas chargés pour', Object.keys(quotasByYear.value).length, 'années')
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
    if (!authStore.user) return

    try {
      loading.value = true
      error.value = null

      await apiJson('/quotas', {
        method: 'PUT',
        body: JSON.stringify({ byYear: { ...quotasByYear.value } }),
      })

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
      if (Object.keys(quotasByYear.value[year]).length === 0) {
        delete quotasByYear.value[year]
      }
    }
  }

  function setupRealtime() {
    realtimeEnabled.value = true
    realtimeSubscription.value = null
    logger.debug('[QuotasStore] Realtime désactivé (API Nest)')
  }

  function disableRealtime() {
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
    quotasByYear,
    loading,
    error,
    realtimeEnabled,
    getQuota,
    getQuotasForYear,
    loadQuotas,
    saveQuotas,
    setQuota,
    removeQuota,
    setupRealtime,
    disableRealtime,
    reset,
  }
})
