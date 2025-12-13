import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../services/supabase'
import logger from '../services/logger'
import { useAuthStore } from './auth'

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

  function reset() {
    leaveTypes.value = getDefaultLeaveTypes()
    loading.value = false
    error.value = null
  }

  return {
    // State
    leaveTypes,
    loading,
    error,
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
    reset
  }
})

