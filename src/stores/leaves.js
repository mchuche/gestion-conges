import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../services/supabase'
import logger from '../services/logger'
import { handleError } from '../services/errorHandler'
import { useAuthStore } from './auth'
import { useLeavesRealtime } from '../composables/useRealtime'

export const useLeavesStore = defineStore('leaves', () => {
  // State
  const leaves = ref({}) // { date_key: leave_type_id }
  const leaveIdMap = ref({}) // { id: date_key } - Mapping pour résoudre date_key depuis l'ID lors des DELETE Realtime
  const loading = ref(false)
  const error = ref(null)
  const realtimeEnabled = ref(false)
  const realtimeSubscription = ref(null) // Référence à la subscription Realtime

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
      leaveIdMap.value = {}
      if (data) {
        data.forEach(leave => {
          leaves.value[leave.date_key] = leave.leave_type_id
          // Stocker le mapping ID -> date_key pour les DELETE Realtime
          if (leave.id) {
            leaveIdMap.value[leave.id] = leave.date_key
          }
        })
      }

      logger.log('Jours de congé chargés:', Object.keys(leaves.value).length, 'entrées')
      
      // Activer Realtime après le premier chargement
      if (!realtimeEnabled.value) {
        setupRealtime()
      }
    } catch (err) {
      const errorMessage = handleError(err, {
        context: 'LeavesStore.loadLeaves',
        showToast: false // Ne pas afficher de toast ici, laisser le composant décider
      })
      error.value = errorMessage
      leaves.value = {}
    } finally {
      loading.value = false
    }
  }

  /**
   * Charger les congés de tous les membres d'une équipe
   * @param {string[]} userIds - Liste des IDs des membres de l'équipe
   * @returns {Promise<Object>} - Objet avec userId comme clé et { date_key: leave_type_id } comme valeur
   */
  async function loadTeamLeaves(userIds) {
    if (!userIds || userIds.length === 0 || !supabase) {
      return {}
    }

    try {
      logger.debug('[LeavesStore] Chargement des congés pour l\'équipe:', userIds.length, 'membres')
      
      const { data, error: fetchError } = await supabase
        .from('leaves')
        .select('*')
        .in('user_id', userIds)

      if (fetchError) throw fetchError

      // Organiser les congés par utilisateur
      const teamLeaves = {}
      if (data) {
        data.forEach(leave => {
          if (!teamLeaves[leave.user_id]) {
            teamLeaves[leave.user_id] = {}
          }
          teamLeaves[leave.user_id][leave.date_key] = leave.leave_type_id
        })
      }

      logger.log('[LeavesStore] Congés d\'équipe chargés:', Object.keys(teamLeaves).length, 'utilisateurs')
      return teamLeaves
    } catch (err) {
      logger.error('[LeavesStore] Erreur lors du chargement des congés d\'équipe:', err)
      return {}
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
    realtimeSubscription.value = useLeavesRealtime(authStore.user.id, {
      onInsert: (newLeave) => {
        logger.log('[Realtime] Nouveau congé inséré:', newLeave)
        // Ajouter le congé au store
        if (newLeave && newLeave.date_key) {
          leaves.value[newLeave.date_key] = newLeave.leave_type_id
          // Mettre à jour le mapping ID -> date_key
          if (newLeave.id) {
            leaveIdMap.value[newLeave.id] = newLeave.date_key
          }
        }
      },
      onUpdate: (updatedLeave, oldLeave) => {
        logger.log('[Realtime] Congé mis à jour:', updatedLeave)
        // Mettre à jour le congé dans le store
        if (oldLeave && oldLeave.date_key && updatedLeave && updatedLeave.date_key) {
          if (leaves.value.hasOwnProperty(oldLeave.date_key)) {
            leaves.value[updatedLeave.date_key] = updatedLeave.leave_type_id
            // Si la date_key a changé, supprimer l'ancienne et mettre à jour le mapping
            if (oldLeave.date_key !== updatedLeave.date_key) {
              removeLeave(oldLeave.date_key)
              // Mettre à jour le mapping ID -> date_key
              if (updatedLeave.id && oldLeave.id === updatedLeave.id) {
                leaveIdMap.value[updatedLeave.id] = updatedLeave.date_key
              }
            }
          }
        }
        // Mettre à jour le mapping ID -> date_key
        if (updatedLeave && updatedLeave.id && updatedLeave.date_key) {
          leaveIdMap.value[updatedLeave.id] = updatedLeave.date_key
        }
      },
      onDelete: (deletedLeave) => {
        logger.log('[Realtime] Congé supprimé - payload complet:', deletedLeave)
        
        // Essayer plusieurs façons d'obtenir date_key
        let dateKey = null
        
        if (deletedLeave) {
          // Méthode 1: date_key directement dans le payload (si REPLICA IDENTITY FULL fonctionne)
          if (deletedLeave.date_key) {
            dateKey = deletedLeave.date_key
          }
          // Méthode 2: résoudre depuis le mapping ID -> date_key
          else if (deletedLeave.id && leaveIdMap.value[deletedLeave.id]) {
            dateKey = leaveIdMap.value[deletedLeave.id]
            logger.log('[Realtime] date_key résolu depuis le mapping ID:', deletedLeave.id, '->', dateKey)
          }
        }
        
        if (dateKey) {
          // Utiliser directement la suppression pour garantir la réactivité Vue
          if (dateKey in leaves.value) {
            removeLeave(dateKey)
            logger.log('[Realtime] Congé supprimé du store:', dateKey)
          } else {
            // Le congé a peut-être déjà été supprimé localement (suppression manuelle)
            // C'est normal, on ne log qu'en debug
            logger.debug('[Realtime] Congé déjà supprimé du store (suppression locale probable):', dateKey)
          }
          // Toujours nettoyer le mapping ID -> date_key même si le congé n'existe plus
          if (deletedLeave.id && leaveIdMap.value[deletedLeave.id]) {
            delete leaveIdMap.value[deletedLeave.id]
          }
        } else {
          // Fallback: si on n'a toujours pas date_key, recharger les congés
          // Cela ne devrait normalement plus arriver avec le mapping
          logger.warn('[Realtime] date_key manquant dans DELETE et non trouvé dans le mapping. ID:', deletedLeave?.id, '- Rechargement des congés')
          loadLeaves()
        }
      }
    })
    
    logger.log('[Realtime] Subscription activée pour les congés')
  }

  function disableRealtime() {
    // Nettoyer la subscription si elle existe
    if (realtimeSubscription.value && typeof realtimeSubscription.value.unsubscribe === 'function') {
      realtimeSubscription.value.unsubscribe()
      logger.log('[Realtime] Subscription nettoyée pour les congés')
    }
    realtimeSubscription.value = null
    realtimeEnabled.value = false
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
        const { data: insertedLeaves } = await supabase
          .from('leaves')
          .insert(leavesToInsert)
          .select('id, date_key')
        
        // Mettre à jour le mapping ID -> date_key pour les nouveaux inserts
        if (insertedLeaves) {
          insertedLeaves.forEach(leave => {
            if (leave.id && leave.date_key) {
              leaveIdMap.value[leave.id] = leave.date_key
            }
          })
        }
      }

      logger.log('Jours de congé sauvegardés:', Object.keys(leaves.value).length, 'entrées')
    } catch (err) {
      const errorMessage = handleError(err, {
        context: 'LeavesStore.saveLeaves',
        showToast: false // Re-lancer l'erreur pour que l'appelant puisse afficher le toast
      })
      error.value = errorMessage
      throw err
    } finally {
      loading.value = false
    }
  }

  function setLeave(dateKey, leaveTypeId) {
    leaves.value[dateKey] = leaveTypeId
  }

  function removeLeave(dateKey) {
    // Créer un nouvel objet pour forcer la réactivité Vue
    const newLeaves = { ...leaves.value }
    delete newLeaves[dateKey]
    leaves.value = newLeaves
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
    leaveIdMap.value = {}
  }

  // Supprimer tous les congés (catégorie 'leave') pour une année donnée
  function clearLeavesForYear(year, leaveTypesStore) {
    const newLeaves = { ...leaves.value }
    const newLeaveIdMap = { ...leaveIdMap.value }
    
    Object.keys(leaves.value).forEach(dateKey => {
      // Extraire l'année de la date_key (format: YYYY-MM-DD ou YYYY-MM-DD-period)
      const yearFromKey = parseInt(dateKey.split('-')[0])
      
      if (yearFromKey === year) {
        const leaveTypeId = leaves.value[dateKey]
        const leaveType = leaveTypesStore.getLeaveType(leaveTypeId)
        const category = leaveType?.category || 'leave'
        
        // Supprimer seulement les congés de catégorie 'leave'
        if (category === 'leave') {
          delete newLeaves[dateKey]
          // Supprimer aussi du mapping si présent
          Object.keys(newLeaveIdMap).forEach(id => {
            if (newLeaveIdMap[id] === dateKey) {
              delete newLeaveIdMap[id]
            }
          })
        }
      }
    })
    
    leaves.value = newLeaves
    leaveIdMap.value = newLeaveIdMap
  }

  // Supprimer tous les événements (catégorie 'event') pour une année donnée
  function clearEventsForYear(year, leaveTypesStore) {
    const newLeaves = { ...leaves.value }
    const newLeaveIdMap = { ...leaveIdMap.value }
    
    Object.keys(leaves.value).forEach(dateKey => {
      // Extraire l'année de la date_key (format: YYYY-MM-DD ou YYYY-MM-DD-period)
      const yearFromKey = parseInt(dateKey.split('-')[0])
      
      if (yearFromKey === year) {
        const leaveTypeId = leaves.value[dateKey]
        const leaveType = leaveTypesStore.getLeaveType(leaveTypeId)
        const category = leaveType?.category || 'leave'
        
        // Supprimer seulement les événements de catégorie 'event'
        if (category === 'event') {
          delete newLeaves[dateKey]
          // Supprimer aussi du mapping si présent
          Object.keys(newLeaveIdMap).forEach(id => {
            if (newLeaveIdMap[id] === dateKey) {
              delete newLeaveIdMap[id]
            }
          })
        }
      }
    })
    
    leaves.value = newLeaves
    leaveIdMap.value = newLeaveIdMap
  }

  function reset() {
    leaves.value = {}
    leaveIdMap.value = {}
    loading.value = false
    error.value = null
    realtimeEnabled.value = false
    realtimeSubscription.value = null
    disableRealtime()
  }

  return {
    // State
    leaves,
    loading,
    error,
    realtimeEnabled,
    // Getters
    leavesCount,
    getLeaveForDate,
    hasLeave,
    // Actions
    loadLeaves,
    loadTeamLeaves,
    saveLeaves,
    setLeave,
    removeLeave,
    removeLeavesByType,
    clearAllLeaves,
    clearLeavesForYear,
    clearEventsForYear,
    setupRealtime,
    disableRealtime,
    reset
  }
})

