/**
 * Store des types de congés — API Nest (`/leave-types`)
 *
 * Les types globaux viennent du seed Prisma ; les couleurs sont des personnalisations
 * par utilisateur (table LeaveTypeCustomization).
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiJson } from '../services/api'
import logger from '../services/logger'
import { useAuthStore } from './auth'

// Couleurs par défaut pour chaque type
const DEFAULT_COLORS = {
  'congé-payé': '#4a90e2',
  'rtt': '#50c878',
  'jours-hiver': '#87ceeb',
  'maladie': '#ff6b6b',
  'télétravail': '#9b59b6',
  'formation': '#f39c12',
  'grève': '#e74c3c'
}

export const useLeaveTypesStore = defineStore('leaveTypes', () => {
  // State
  const leaveTypes = ref([]) // Types fusionnés (global + personnalisation)
  const globalLeaveTypes = ref([]) // Types globaux (admin)
  const userCustomizations = ref({}) // { global_type_id: { color, ... } }
  const loading = ref(false)
  const error = ref(null)
  const realtimeEnabled = ref(false)
  const realtimeSubscription = ref(null) // Référence à la subscription Realtime
  const globalRealtimeSubscription = ref(null) // Subscription pour global_leave_types

  // Getters
  const leaveTypesCount = computed(() => leaveTypes.value.length)
  
  const leaveTypesByCategory = computed(() => {
    const result = { leave: [], event: [] }
    leaveTypes.value.forEach(type => {
      const category = type.category || 'absence'
      if (result[category]) {
        result[category].push(type)
      }
    })
    return result
  })

  const getLeaveType = (id) => {
    // id peut être soit global_type_id soit l'ancien id
    return leaveTypes.value.find(t => t.id === id || t.global_type_id === id) || null
  }

  const getLeaveTypesByCategory = (category) => {
    return leaveTypes.value.filter(t => (t.category || 'absence') === category)
  }

  // Fusionner les types globaux avec les personnalisations utilisateur
  function mergeTypesWithCustomizations() {
    leaveTypes.value = globalLeaveTypes.value.map(globalType => {
      const customization = userCustomizations.value[globalType.id]
      return {
        id: globalType.id, // Utiliser global_type_id comme id pour compatibilité
        global_type_id: globalType.id,
        name: globalType.name,
        label: globalType.label,
        color: customization?.color || DEFAULT_COLORS[globalType.id] || '#4a90e2',
        category: globalType.category || 'absence',
        eligible_for_main_balance: globalType.eligible_for_main_balance !== false,
      }
    })
  }

  // ============================================
  // ACTIONS
  // ============================================
  
  /**
   * Charge les types de congés globaux et les personnalisations utilisateur
   */
  async function loadLeaveTypes() {
    const authStore = useAuthStore()
    if (!authStore.user) {
      leaveTypes.value = []
      return
    }

    try {
      loading.value = true
      error.value = null

      const data = await apiJson('/leave-types', { method: 'GET' })
      const list = data.leaveTypes || []

      globalLeaveTypes.value = list.map((t) => {
        let category = t.category === 'leave' ? 'absence' : (t.category || 'absence')
        if (['maladie', 'grève'].includes(t.id) && category === 'event') {
          category = 'absence'
        }
        return {
          id: t.id,
          name: t.name,
          label: t.label,
          category,
          eligible_for_main_balance: t.eligible_for_main_balance !== false,
        }
      })

      userCustomizations.value = {}
      list.forEach((t) => {
        const gid = t.global_type_id || t.id
        userCustomizations.value[gid] = { color: t.color }
      })

      mergeTypesWithCustomizations()

      logger.log('Types de congés chargés:', leaveTypes.value.length, 'types')

      if (!realtimeEnabled.value) {
        setupRealtime()
      }
    } catch (err) {
      error.value = err.message
      logger.error('Erreur lors du chargement des types de congés:', err)
      leaveTypes.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Sauvegarde les personnalisations utilisateur (couleurs) dans PocketBase
   */
  async function saveLeaveTypes() {
    const authStore = useAuthStore()
    if (!authStore.user) {
      return
    }

    try {
      loading.value = true
      error.value = null

      const items = leaveTypes.value.map((type) => ({
        id: type.id,
        global_type_id: type.global_type_id || type.id,
        color: type.color,
      }))

      await apiJson('/leave-types/save', {
        method: 'POST',
        body: JSON.stringify({ items }),
      })

      leaveTypes.value.forEach((type) => {
        const globalTypeId = type.global_type_id || type.id
        userCustomizations.value[globalTypeId] = {
          color: type.color,
        }
      })

      logger.log('Personnalisations sauvegardées:', leaveTypes.value.length, 'types')
    } catch (err) {
      error.value = err.message
      logger.error('Erreur lors de la sauvegarde des personnalisations:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Les utilisateurs ne peuvent pas ajouter de types (seuls les admins le font dans global_leave_types)
  // Cette fonction est gardée pour compatibilité mais ne fait rien
  function addLeaveType(type) {
    logger.warn('addLeaveType appelé mais les utilisateurs ne peuvent pas ajouter de types. Utilisez l interface admin.')
    // Fonction désactivée - les utilisateurs ne peuvent pas ajouter de types
  }

  // Mettre à jour uniquement la couleur (les autres champs sont gérés par l'admin)
  function updateLeaveType(id, updates) {
    const index = leaveTypes.value.findIndex(t => t.id === id || t.global_type_id === id)
    if (index === -1) {
      throw new Error(`Type avec l'ID "${id}" introuvable`)
    }
    
    // Ne permettre que la modification de la couleur
    if (updates.color !== undefined) {
      leaveTypes.value[index].color = updates.color
      const globalTypeId = leaveTypes.value[index].global_type_id || leaveTypes.value[index].id
      if (userCustomizations.value[globalTypeId]) {
        userCustomizations.value[globalTypeId].color = updates.color
      }
    }
  }

  // Les utilisateurs ne peuvent pas supprimer de types (seuls les admins le font dans global_leave_types)
  function removeLeaveType(id) {
    logger.warn('removeLeaveType appelé mais les utilisateurs ne peuvent pas supprimer de types. Utilisez l interface admin.')
    // Fonction désactivée - les utilisateurs ne peuvent pas supprimer de types
  }

  function setLeaveTypes(newTypes) {
    leaveTypes.value = newTypes
  }

  /** Anciennement PocketBase Realtime — désactivé avec l’API Nest. */
  function setupRealtime() {
    const authStore = useAuthStore()
    if (!authStore.user || realtimeEnabled.value) return

    disableRealtime()
    realtimeEnabled.value = true
    realtimeSubscription.value = null
    globalRealtimeSubscription.value = null
    logger.debug('[LeaveTypesStore] Realtime désactivé (API Nest).')
  }

  function disableRealtime() {
    realtimeSubscription.value = null
    globalRealtimeSubscription.value = null
    realtimeEnabled.value = false
  }

  function reset() {
    leaveTypes.value = []
    globalLeaveTypes.value = []
    userCustomizations.value = {}
    loading.value = false
    error.value = null
    realtimeEnabled.value = false
    realtimeSubscription.value = null
    globalRealtimeSubscription.value = null
    disableRealtime()
  }

  return {
    // State
    leaveTypes,
    globalLeaveTypes,
    userCustomizations,
    loading,
    error,
    realtimeEnabled,
    // Getters
    leaveTypesCount,
    leaveTypesByCategory,
    getLeaveType,
    getLeaveTypesByCategory,
    // Actions
    loadLeaveTypes,
    saveLeaveTypes,
    addLeaveType,
    updateLeaveType,
    removeLeaveType,
    setLeaveTypes,
    mergeTypesWithCustomizations,
    setupRealtime,
    disableRealtime,
    reset
  }
})
