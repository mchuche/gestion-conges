import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../services/supabase'
import logger from '../services/logger'
import { useAuthStore } from './auth'
import { useLeaveTypesRealtime } from '../composables/useRealtime'

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
      const category = type.category || 'leave'
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
    return leaveTypes.value.filter(t => (t.category || 'leave') === category)
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
        category: globalType.category || 'leave'
      }
    })
  }

  // Actions
  async function loadLeaveTypes() {
    const authStore = useAuthStore()
    if (!authStore.user || !supabase) {
      leaveTypes.value = []
      return
    }

    try {
      loading.value = true
      error.value = null

      // Charger les types globaux (accessibles à tous)
      let globalData = null
      let globalError = null
      
      try {
        const result = await supabase
          .from('global_leave_types')
          .select('*')
          .order('created_at')
        globalData = result.data
        globalError = result.error
      } catch (err) {
        globalError = err
      }

      if (globalError) {
        // Si la table n'existe pas encore (migration non exécutée), utiliser les types par défaut
        if (globalError.code === '42P01' || globalError.message?.includes('does not exist') || globalError.message?.includes('relation') || globalError.message?.includes('table')) {
          logger.warn('Table global_leave_types non trouvée. Migration SQL non exécutée. Utilisation des types par défaut.')
          // Utiliser les types par défaut temporairement
          globalLeaveTypes.value = [
            { id: 'congé-payé', name: 'Congé Payé', label: 'CP', category: 'leave' },
            { id: 'rtt', name: 'RTT', label: 'RTT', category: 'leave' },
            { id: 'jours-hiver', name: 'Jours Hiver', label: 'JH', category: 'leave' },
            { id: 'maladie', name: 'Maladie', label: 'Mal', category: 'event' },
            { id: 'télétravail', name: 'Télétravail', label: 'TT', category: 'event' },
            { id: 'formation', name: 'Formation', label: 'Form', category: 'event' },
            { id: 'grève', name: 'Grève', label: 'Grève', category: 'event' }
          ]
        } else {
          throw globalError
        }
      } else if (globalData) {
        globalLeaveTypes.value = globalData.map(t => ({
          id: t.id,
          name: t.name,
          label: t.label,
          category: t.category || 'leave'
        }))
      } else {
        // Fallback si aucune donnée
        globalLeaveTypes.value = []
      }

      // Charger les personnalisations de l'utilisateur (couleurs)
      // Si la table leave_types a encore l'ancienne structure, essayer de la charger quand même
      let customData = null
      let customError = null
      
      try {
        const result = await supabase
          .from('leave_types')
          .select('global_type_id, color')
          .eq('user_id', authStore.user.id)
        customData = result.data
        customError = result.error
      } catch (err) {
        // Si la requête échoue (ancienne structure), ignorer les personnalisations
        logger.warn('Impossible de charger les personnalisations (migration non exécutée?):', err)
        customData = []
        customError = null
      }

      if (customError && customError.code !== '42P01') {
        // Ignorer seulement si la table n'existe pas, sinon lancer l'erreur
        throw customError
      }

      // Construire le map des personnalisations
      userCustomizations.value = {}
      if (customData) {
        customData.forEach(custom => {
          userCustomizations.value[custom.global_type_id] = {
            color: custom.color
          }
        })
      }

      // Créer les personnalisations par défaut pour les types globaux qui n'en ont pas
      const missingCustomizations = []
      globalLeaveTypes.value.forEach(globalType => {
        if (!userCustomizations.value[globalType.id]) {
          missingCustomizations.push({
            user_id: authStore.user.id,
            global_type_id: globalType.id,
            color: DEFAULT_COLORS[globalType.id] || '#4a90e2'
          })
        }
      })

      if (missingCustomizations.length > 0) {
        const { error: insertError } = await supabase
          .from('leave_types')
          .insert(missingCustomizations)
        
        if (insertError) {
          logger.warn('Erreur lors de la création des personnalisations par défaut:', insertError)
        } else {
          // Recharger les personnalisations
          const { data: newCustomData } = await supabase
            .from('leave_types')
            .select('global_type_id, color')
            .eq('user_id', authStore.user.id)
          
          if (newCustomData) {
            newCustomData.forEach(custom => {
              userCustomizations.value[custom.global_type_id] = {
                color: custom.color
              }
            })
          }
        }
      }

      // Fusionner les types globaux avec les personnalisations
      mergeTypesWithCustomizations()

      logger.log('Types de congés chargés:', leaveTypes.value.length, 'types')
      
      // Activer Realtime après le premier chargement
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

  async function saveLeaveTypes() {
    const authStore = useAuthStore()
    if (!authStore.user || !supabase) {
      return
    }

    try {
      loading.value = true
      error.value = null

      // Récupérer toutes les personnalisations existantes
      const { data: existingCustomizations } = await supabase
        .from('leave_types')
        .select('id, global_type_id')
        .eq('user_id', authStore.user.id)

      const existingGlobalIds = new Set(existingCustomizations?.map(t => t.global_type_id) || [])
      const currentGlobalIds = new Set(leaveTypes.value.map(t => t.global_type_id || t.id))

      // Mettre à jour ou insérer les personnalisations (couleurs uniquement)
      const updates = []
      const inserts = []

      leaveTypes.value.forEach(type => {
        const globalTypeId = type.global_type_id || type.id
        if (existingGlobalIds.has(globalTypeId)) {
          // Mettre à jour la couleur
          const existingId = existingCustomizations.find(c => c.global_type_id === globalTypeId)?.id
          if (existingId) {
            updates.push({
              id: existingId,
              color: type.color
            })
          }
        } else {
          // Insérer une nouvelle personnalisation
          inserts.push({
            user_id: authStore.user.id,
            global_type_id: globalTypeId,
            color: type.color
          })
        }
      })

      // Insérer les nouvelles personnalisations
      if (inserts.length > 0) {
        await supabase
          .from('leave_types')
          .insert(inserts)
      }

      // Mettre à jour les personnalisations existantes
      for (const update of updates) {
        await supabase
          .from('leave_types')
          .update({ color: update.color })
          .eq('id', update.id)
      }

      // Mettre à jour le cache des personnalisations
      leaveTypes.value.forEach(type => {
        const globalTypeId = type.global_type_id || type.id
        userCustomizations.value[globalTypeId] = {
          color: type.color
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

  // Configuration Realtime
  function setupRealtime() {
    const authStore = useAuthStore()
    if (!authStore.user || realtimeEnabled.value) return

    // Nettoyer les anciennes subscriptions si elles existent
    disableRealtime()

    realtimeEnabled.value = true
    
    // Subscription pour les personnalisations utilisateur (leave_types)
    realtimeSubscription.value = useLeaveTypesRealtime(authStore.user.id, {
      onInsert: (newCustomization) => {
        logger.log('[Realtime] Nouvelle personnalisation insérée:', newCustomization)
        if (newCustomization.global_type_id) {
          userCustomizations.value[newCustomization.global_type_id] = {
            color: newCustomization.color
          }
          mergeTypesWithCustomizations()
        }
      },
      onUpdate: (updatedCustomization, oldCustomization) => {
        logger.log('[Realtime] Personnalisation mise à jour:', updatedCustomization)
        if (updatedCustomization.global_type_id) {
          userCustomizations.value[updatedCustomization.global_type_id] = {
            color: updatedCustomization.color
          }
          mergeTypesWithCustomizations()
        }
      },
      onDelete: (deletedCustomization) => {
        logger.log('[Realtime] Personnalisation supprimée:', deletedCustomization)
        if (deletedCustomization.global_type_id) {
          delete userCustomizations.value[deletedCustomization.global_type_id]
          mergeTypesWithCustomizations()
        }
      }
    })

    // Subscription pour les types globaux (global_leave_types)
    // Utiliser une subscription Supabase directe car useLeaveTypesRealtime est pour leave_types
    const globalChannel = supabase
      .channel('global_leave_types_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'global_leave_types'
      }, (payload) => {
        logger.log('[Realtime] Changement dans global_leave_types:', payload)
        // Recharger les types globaux
        loadLeaveTypes()
      })
      .subscribe()

    globalRealtimeSubscription.value = globalChannel
    
    logger.log('[Realtime] Subscriptions activées pour les types de congés')
  }

  function disableRealtime() {
    // Nettoyer les subscriptions si elles existent
    if (realtimeSubscription.value && typeof realtimeSubscription.value.unsubscribe === 'function') {
      realtimeSubscription.value.unsubscribe()
      logger.log('[Realtime] Subscription nettoyée pour les personnalisations')
    }
    if (globalRealtimeSubscription.value) {
      supabase.removeChannel(globalRealtimeSubscription.value)
      logger.log('[Realtime] Subscription nettoyée pour les types globaux')
    }
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
