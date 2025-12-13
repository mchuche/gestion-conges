import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../services/supabase'
import logger from '../services/logger'
import { useAuthStore } from './auth'

export const useLeavesStore = defineStore('leaves', () => {
  // State
  const leaves = ref({}) // { date_key: leave_type_id }
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const leavesCount = computed(() => Object.keys(leaves.value).length)
  
  const getLeaveForDate = (date, period = 'full') => {
    const dateKey = period === 'full' 
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${period}`
    
    return leaves.value[dateKey] || null
  }

  const hasLeave = (dateKey) => {
    return leaves.value.hasOwnProperty(dateKey)
  }

  // Actions
  async function loadLeaves() {
    const authStore = useAuthStore()
    if (!authStore.user || !supabase) {
      leaves.value = {}
      return
    }

    try {
      loading.value = true
      error.value = null

      const { data, error: fetchError } = await supabase
        .from('leaves')
        .select('*')
        .eq('user_id', authStore.user.id)

      if (fetchError) throw fetchError

      // Convertir les données en format interne
      leaves.value = {}
      if (data) {
        data.forEach(leave => {
          leaves.value[leave.date_key] = leave.leave_type_id
        })
      }

      logger.log('Jours de congé chargés:', Object.keys(leaves.value).length, 'entrées')
    } catch (err) {
      error.value = err.message
      logger.error('Erreur lors du chargement des congés:', err)
      leaves.value = {}
    } finally {
      loading.value = false
    }
  }

  async function saveLeaves() {
    const authStore = useAuthStore()
    if (!authStore.user || !supabase) return

    try {
      loading.value = true
      error.value = null

      // Récupérer tous les congés existants pour cet utilisateur
      const { data: existingLeaves } = await supabase
        .from('leaves')
        .select('id, date_key')
        .eq('user_id', authStore.user.id)

      const existingKeys = new Set(existingLeaves?.map(l => l.date_key) || [])
      const currentKeys = new Set(Object.keys(leaves.value))

      // Supprimer les congés qui n'existent plus
      const toDelete = existingLeaves?.filter(l => !currentKeys.has(l.date_key)) || []
      if (toDelete.length > 0) {
        const idsToDelete = toDelete.map(l => l.id)
        await supabase
          .from('leaves')
          .delete()
          .in('id', idsToDelete)
      }

      // Insérer ou mettre à jour les congés
      const leavesToInsert = []
      Object.keys(leaves.value).forEach(dateKey => {
        if (!existingKeys.has(dateKey)) {
          leavesToInsert.push({
            user_id: authStore.user.id,
            date_key: dateKey,
            leave_type_id: leaves.value[dateKey]
          })
        }
      })

      if (leavesToInsert.length > 0) {
        await supabase
          .from('leaves')
          .insert(leavesToInsert)
      }

      logger.log('Jours de congé sauvegardés:', Object.keys(leaves.value).length, 'entrées')
    } catch (err) {
      error.value = err.message
      logger.error('Erreur lors de la sauvegarde des congés:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  function setLeave(dateKey, leaveTypeId) {
    leaves.value[dateKey] = leaveTypeId
  }

  function removeLeave(dateKey) {
    delete leaves.value[dateKey]
  }

  function removeLeavesByType(leaveTypeId) {
    Object.keys(leaves.value).forEach(key => {
      if (leaves.value[key] === leaveTypeId) {
        delete leaves.value[key]
      }
    })
  }

  function clearAllLeaves() {
    leaves.value = {}
  }

  function reset() {
    leaves.value = {}
    loading.value = false
    error.value = null
  }

  return {
    // State
    leaves,
    loading,
    error,
    // Getters
    leavesCount,
    getLeaveForDate,
    hasLeave,
    // Actions
    loadLeaves,
    saveLeaves,
    setLeave,
    removeLeave,
    removeLeavesByType,
    clearAllLeaves,
    reset
  }
})

