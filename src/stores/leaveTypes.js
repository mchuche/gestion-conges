import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../services/supabase'
import logger from '../services/logger'
import { useAuthStore } from './auth'
import { useLeaveTypesRealtime } from '../composables/useRealtime'

// Types de congés par défaut
function getDefaultLeaveTypes() {
  return [
    { id: 'congé-payé', name: 'Congé Payé', label: 'CP', color: '#4a90e2', category: 'leave' },
    { id: 'rtt', name: 'RTT', label: 'RTT', color: '#50c878', category: 'leave' },
    { id: 'jours-hiver', name: 'Jours Hiver', label: 'JH', color: '#87ceeb', category: 'leave' },
    { id: 'maladie', name: 'Maladie', label: 'Mal', color: '#ff6b6b', category: 'event' },
    { id: 'télétravail', name: 'Télétravail', label: 'TT', color: '#9b59b6', category: 'event' },
    { id: 'formation', name: 'Formation', label: 'Form', color: '#f39c12', category: 'event' },
    { id: 'grève', name: 'Grève', label: 'Grève', color: '#e74c3c', category: 'event' }
  ]
}

export const useLeaveTypesStore = defineStore('leaveTypes', () => {
  // State
  const leaveTypes = ref([])
  const loading = ref(false)
  const error = ref(null)
  const realtimeEnabled = ref(false)
  const realtimeSubscription = ref(null) // Référence à la subscription Realtime

  // Getters
  const leaveTypesCount = computed(() => leaveTypes.value.length)
  
  const leaveTypesByCategory = computed(() => {
    const result = { leave: [], event: [] }
    leaveTypes.value.forEach(type => {
      const category = type.category || 'leave'
      if (result[category]) {
        result[category].push(type)
      }
    })
    return result
  })

  const getLeaveType = (id) => {
    return leaveTypes.value.find(t => t.id === id) || null
  }

  const getLeaveTypesByCategory = (category) => {
    return leaveTypes.value.filter(t => (t.category || 'leave') === category)
  }

  // Actions
  async function loadLeaveTypes() {
    const authStore = useAuthStore()
    if (!authStore.user || !supabase) {
      leaveTypes.value = getDefaultLeaveTypes()
      return
    }

    try {
      loading.value = true
      error.value = null

      const { data, error: fetchError } = await supabase
        .from('leave_types')
        .select('*')
        .eq('user_id', authStore.user.id)
        .order('created_at')

      if (fetchError) throw fetchError

      if (data && data.length > 0) {
        leaveTypes.value = data.map(t => ({
          id: t.id,
          name: t.name,
          label: t.label,
          color: t.color,
          category: t.category || 'leave'
        }))
      } else {
        // Si aucun type n'existe, créer les types par défaut
        leaveTypes.value = getDefaultLeaveTypes()
        await saveLeaveTypes()
      }

      logger.log('Types de congés chargés:', leaveTypes.value.length, 'types')
      
      // Activer Realtime après le premier chargement
      if (!realtimeEnabled.value) {
        setupRealtime()
      }
    } catch (err) {
      error.value = err.message
      logger.error('Erreur lors du chargement des types de congés:', err)
      leaveTypes.value = getDefaultLeaveTypes()
    } finally {
      loading.value = false
    }
  }

  async function saveLeaveTypes() {
    const authStore = useAuthStore()
    if (!authStore.user || !supabase) {
      return
    }

    try {
      loading.value = true
      error.value = null

      // Récupérer tous les types existants
      const { data: existingTypes } = await supabase
        .from('leave_types')
        .select('id')
        .eq('user_id', authStore.user.id)

      const existingIds = new Set(existingTypes?.map(t => t.id) || [])
      const currentIds = new Set(leaveTypes.value.map(t => t.id))

      // Supprimer les types qui n'existent plus
      const toDelete = existingTypes?.filter(t => !currentIds.has(t.id)) || []
      if (toDelete.length > 0) {
        const idsToDelete = toDelete.map(t => t.id)
        await supabase
          .from('leave_types')
          .delete()
          .in('id', idsToDelete)
      }

      // Insérer ou mettre à jour les types
      const typesToInsert = []
      const typesToUpdate = []

      leaveTypes.value.forEach(type => {
        if (existingIds.has(type.id)) {
          typesToUpdate.push(type)
        } else {
          typesToInsert.push({
            id: type.id,
            user_id: authStore.user.id,
            name: type.name,
            label: type.label,
            color: type.color,
            category: type.category || 'leave'
          })
        }
      })

      // Insérer les nouveaux types
      if (typesToInsert.length > 0) {
        await supabase
          .from('leave_types')
          .insert(typesToInsert)
      }

      // Mettre à jour les types existants
      for (const type of typesToUpdate) {
        await supabase
          .from('leave_types')
          .update({
            name: type.name,
            label: type.label,
            color: type.color,
            category: type.category || 'leave'
          })
          .eq('id', type.id)
          .eq('user_id', authStore.user.id)
      }

      logger.log('Types de congés sauvegardés:', leaveTypes.value.length, 'types')
    } catch (err) {
      error.value = err.message
      logger.error('Erreur lors de la sauvegarde des types de congés:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  function addLeaveType(type) {
    // Vérifier que l'ID n'existe pas déjà
    if (leaveTypes.value.find(t => t.id === type.id)) {
      throw new Error(`Le type avec l'ID "${type.id}" existe déjà`)
    }
    leaveTypes.value.push({
      id: type.id,
      name: type.name,
      label: type.label,
      color: type.color,
      category: type.category || 'leave'
    })
  }

  function updateLeaveType(id, updates) {
    const index = leaveTypes.value.findIndex(t => t.id === id)
    if (index === -1) {
      throw new Error(`Type avec l'ID "${id}" introuvable`)
    }
    leaveTypes.value[index] = {
      ...leaveTypes.value[index],
      ...updates
    }
  }

  function removeLeaveType(id) {
    const index = leaveTypes.value.findIndex(t => t.id === id)
    if (index === -1) {
      throw new Error(`Type avec l'ID "${id}" introuvable`)
    }
    leaveTypes.value.splice(index, 1)
    
    // S'assurer qu'il reste au moins un type
    if (leaveTypes.value.length === 0) {
      leaveTypes.value = getDefaultLeaveTypes()
    }
  }

  function setLeaveTypes(newTypes) {
    leaveTypes.value = newTypes
  }

  // Configuration Realtime
  function setupRealtime() {
    const authStore = useAuthStore()
    if (!authStore.user || realtimeEnabled.value) return

    // Nettoyer l'ancienne subscription si elle existe
    disableRealtime()

    realtimeEnabled.value = true
    
    // Stocker la référence de la subscription pour pouvoir la nettoyer
    realtimeSubscription.value = useLeaveTypesRealtime(authStore.user.id, {
      onInsert: (newType) => {
        logger.log('[Realtime] Nouveau type de congé inséré:', newType)
        // Ajouter le type s'il n'existe pas déjà
        const exists = leaveTypes.value.find(t => t.id === newType.id)
        if (!exists) {
          leaveTypes.value.push({
            id: newType.id,
            name: newType.name,
            label: newType.label,
            color: newType.color,
            category: newType.category || 'leave'
          })
        }
      },
      onUpdate: (updatedType, oldType) => {
        logger.log('[Realtime] Type de congé mis à jour:', updatedType)
        // Mettre à jour le type dans le store
        const index = leaveTypes.value.findIndex(t => t.id === oldType.id)
        if (index !== -1) {
          leaveTypes.value[index] = {
            id: updatedType.id,
            name: updatedType.name,
            label: updatedType.label,
            color: updatedType.color,
            category: updatedType.category || 'leave'
          }
        }
      },
      onDelete: (deletedType) => {
        logger.log('[Realtime] Type de congé supprimé:', deletedType)
        // Supprimer le type du store
        const index = leaveTypes.value.findIndex(t => t.id === deletedType.id)
        if (index !== -1) {
          leaveTypes.value.splice(index, 1)
        }
      }
    })
    
    logger.log('[Realtime] Subscription activée pour les types de congés')
  }

  function disableRealtime() {
    // Nettoyer la subscription si elle existe
    if (realtimeSubscription.value && typeof realtimeSubscription.value.unsubscribe === 'function') {
      realtimeSubscription.value.unsubscribe()
      logger.log('[Realtime] Subscription nettoyée pour les types de congés')
    }
    realtimeSubscription.value = null
    realtimeEnabled.value = false
  }

  function reset() {
    leaveTypes.value = getDefaultLeaveTypes()
    loading.value = false
    error.value = null
    realtimeEnabled.value = false
    realtimeSubscription.value = null
    disableRealtime()
  }

  return {
    // State
    leaveTypes,
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
    setupRealtime,
    disableRealtime,
    reset
  }
})

