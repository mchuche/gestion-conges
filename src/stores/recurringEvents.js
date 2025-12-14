import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../services/supabase'
import logger from '../services/logger'
import { handleError } from '../services/errorHandler'
import { useAuthStore } from './auth'
import { useLeavesStore } from './leaves'
import { generateRecurringOccurrences, formatRecurrencePattern } from '../services/recurrence'
import { getYear } from '../services/dateUtils'
import { getDateKeys } from '../services/utils'

export const useRecurringEventsStore = defineStore('recurringEvents', () => {
  // State
  const recurringEvents = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const activeRecurringEvents = computed(() => {
    return recurringEvents.value.filter(event => event.is_active)
  })

  // Actions
  async function loadRecurringEvents() {
    const authStore = useAuthStore()
    if (!authStore.user || !supabase) {
      recurringEvents.value = []
      return
    }

    try {
      loading.value = true
      error.value = null

      const { data, error: fetchError } = await supabase
        .from('recurring_events')
        .select('*')
        .eq('user_id', authStore.user.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      recurringEvents.value = data || []
      logger.log('Événements récurrents chargés:', recurringEvents.value.length)
    } catch (err) {
      const errorMessage = handleError(err, {
        context: 'RecurringEventsStore.loadRecurringEvents',
        showToast: false
      })
      error.value = errorMessage
      recurringEvents.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Crée un événement récurrent et génère les occurrences
   */
  async function createRecurringEvent(eventData) {
    const authStore = useAuthStore()
    const leavesStore = useLeavesStore()
    if (!authStore.user || !supabase) {
      throw new Error('Utilisateur non authentifié')
    }

    try {
      loading.value = true
      error.value = null

      // Créer la règle de récurrence
      const { data: newEvent, error: insertError } = await supabase
        .from('recurring_events')
        .insert({
          user_id: authStore.user.id,
          leave_type_id: eventData.leave_type_id,
          period: eventData.period || 'full',
          recurrence_type: eventData.recurrence_type,
          recurrence_pattern: eventData.recurrence_pattern,
          start_date: eventData.start_date,
          end_date: eventData.end_date || null,
          max_occurrences: eventData.max_occurrences || null,
          excluded_dates: eventData.excluded_dates || [],
          name: eventData.name || null,
          is_active: eventData.is_active !== false
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Générer les occurrences pour l'année en cours et la suivante
      const currentYear = getYear(new Date())
      const startDate = new Date(currentYear, 0, 1)
      const endDate = new Date(currentYear + 1, 11, 31)

      const occurrences = generateRecurringOccurrences(
        newEvent,
        startDate,
        endDate,
        'FR' // TODO: utiliser le pays de l'utilisateur
      )

      // Insérer les occurrences dans la table leaves
      if (occurrences.length > 0) {
        const leavesToInsert = occurrences.map(occ => {
          const keys = getDateKeys(occ.date)
          const dateKey = occ.period === 'full' ? keys.full : keys[occ.period]
          return {
            user_id: authStore.user.id,
            date_key: dateKey,
            leave_type_id: occ.leaveTypeId
          }
        })

        // Utiliser upsert pour éviter les doublons
        const { error: leavesError } = await supabase
          .from('leaves')
          .upsert(leavesToInsert, {
            onConflict: 'user_id,date_key'
          })

        if (leavesError) throw leavesError

        // Recharger les congés
        await leavesStore.loadLeaves()
      }

      // Recharger les événements récurrents
      await loadRecurringEvents()

      logger.log(`Événement récurrent créé avec ${occurrences.length} occurrences`)
      return newEvent
    } catch (err) {
      const errorMessage = handleError(err, {
        context: 'RecurringEventsStore.createRecurringEvent',
        showToast: false
      })
      error.value = errorMessage
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Met à jour un événement récurrent
   */
  async function updateRecurringEvent(eventId, updates) {
    const authStore = useAuthStore()
    const leavesStore = useLeavesStore()
    if (!authStore.user || !supabase) {
      throw new Error('Utilisateur non authentifié')
    }

    try {
      loading.value = true
      error.value = null

      const { data: updatedEvent, error: updateError } = await supabase
        .from('recurring_events')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId)
        .eq('user_id', authStore.user.id)
        .select()
        .single()

      if (updateError) throw updateError

      // Si les dates ou le pattern ont changé, régénérer les occurrences
      if (updates.start_date || updates.end_date || updates.recurrence_pattern || updates.recurrence_type) {
        // Supprimer les anciennes occurrences (optionnel, selon la logique métier)
        // Pour l'instant, on ne supprime pas automatiquement
        
        // Générer les nouvelles occurrences
        const currentYear = getYear(new Date())
        const startDate = new Date(currentYear, 0, 1)
        const endDate = new Date(currentYear + 1, 11, 31)

        const occurrences = generateRecurringOccurrences(
          updatedEvent,
          startDate,
          endDate,
          'FR'
        )

        if (occurrences.length > 0) {
          const leavesToInsert = occurrences.map(occ => {
            const keys = getDateKeys(occ.date)
            const dateKey = occ.period === 'full' ? keys.full : keys[occ.period]
            return {
              user_id: authStore.user.id,
              date_key: dateKey,
              leave_type_id: occ.leaveTypeId
            }
          })

          const { error: leavesError } = await supabase
            .from('leaves')
            .upsert(leavesToInsert, {
              onConflict: 'user_id,date_key'
            })

          if (leavesError) throw leavesError

          await leavesStore.loadLeaves()
        }
      }

      await loadRecurringEvents()
      return updatedEvent
    } catch (err) {
      const errorMessage = handleError(err, {
        context: 'RecurringEventsStore.updateRecurringEvent',
        showToast: false
      })
      error.value = errorMessage
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Supprime un événement récurrent
   */
  async function deleteRecurringEvent(eventId, deleteAllOccurrences = false) {
    const authStore = useAuthStore()
    const leavesStore = useLeavesStore()
    if (!authStore.user || !supabase) {
      throw new Error('Utilisateur non authentifié')
    }

    try {
      loading.value = true
      error.value = null

      // Si on doit supprimer toutes les occurrences
      if (deleteAllOccurrences) {
        // Récupérer l'événement pour connaître le type
        const event = recurringEvents.value.find(e => e.id === eventId)
        if (event) {
          // Générer toutes les occurrences possibles et les supprimer
          const currentYear = getYear(new Date())
          const startDate = new Date(currentYear - 1, 0, 1) // Année précédente
          const endDate = new Date(currentYear + 2, 11, 31) // 2 ans à l'avance

          const occurrences = generateRecurringOccurrences(
            event,
            startDate,
            endDate,
            'FR'
          )

          if (occurrences.length > 0) {
            const dateKeys = occurrences.map(occ => {
              const keys = getDateKeys(occ.date)
              return occ.period === 'full' ? keys.full : keys[occ.period]
            })

            // Supprimer les congés correspondants
            const { error: deleteError } = await supabase
              .from('leaves')
              .delete()
              .eq('user_id', authStore.user.id)
              .in('date_key', dateKeys)
              .eq('leave_type_id', event.leave_type_id)

            if (deleteError) throw deleteError

            await leavesStore.loadLeaves()
          }
        }
      }

      // Supprimer la règle de récurrence
      const { error: deleteError } = await supabase
        .from('recurring_events')
        .delete()
        .eq('id', eventId)
        .eq('user_id', authStore.user.id)

      if (deleteError) throw deleteError

      await loadRecurringEvents()
      logger.log('Événement récurrent supprimé')
    } catch (err) {
      const errorMessage = handleError(err, {
        context: 'RecurringEventsStore.deleteRecurringEvent',
        showToast: false
      })
      error.value = errorMessage
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Génère les occurrences pour une année donnée (utilisé pour la régénération)
   */
  async function generateOccurrencesForYear(recurringEvent, year) {
    const authStore = useAuthStore()
    const leavesStore = useLeavesStore()
    if (!authStore.user || !supabase) {
      throw new Error('Utilisateur non authentifié')
    }

    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year, 11, 31)

    const occurrences = generateRecurringOccurrences(
      recurringEvent,
      startDate,
      endDate,
      'FR'
    )

    if (occurrences.length > 0) {
      const leavesToInsert = occurrences.map(occ => {
        const keys = getDateKeys(occ.date)
        const dateKey = occ.period === 'full' ? keys.full : keys[occ.period]
        return {
          user_id: authStore.user.id,
          date_key: dateKey,
          leave_type_id: occ.leaveTypeId
        }
      })

      const { error: leavesError } = await supabase
        .from('leaves')
        .upsert(leavesToInsert, {
          onConflict: 'user_id,date_key'
        })

      if (leavesError) throw leavesError

      await leavesStore.loadLeaves()
    }

    return occurrences.length
  }

  function reset() {
    recurringEvents.value = []
    loading.value = false
    error.value = null
  }

  return {
    // State
    recurringEvents,
    loading,
    error,
    // Getters
    activeRecurringEvents,
    // Actions
    loadRecurringEvents,
    createRecurringEvent,
    updateRecurringEvent,
    deleteRecurringEvent,
    generateOccurrencesForYear,
    reset
  }
})

