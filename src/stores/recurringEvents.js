/**
 * Store des événements récurrents — API Nest (`/recurring-events`).
 *
 * Les règles sont en base ; la génération des dates se fait côté client
 * (`generateRecurringOccurrences`) puis les lignes sont appliquées via
 * `setLeave` + `saveLeaves()` (sync `/leaves/sync`).
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiJson } from '../services/api'
import logger from '../services/logger'
import { handleError } from '../services/errorHandler'
import { useAuthStore } from './auth'
import { useLeavesStore } from './leaves'
import { useUIStore } from './ui'
import { generateRecurringOccurrences } from '../services/recurrence'
import { getYear } from '../services/dateUtils'
import { getDateKeys } from '../services/utils'

/**
 * Corps PATCH Nest à partir d’objets pouvant être en snake_case (UI historique)
 * ou camelCase.
 */
function toPatchDto(updates) {
  const u = updates || {}
  const dto = {}
  if (u.leave_type_id !== undefined) dto.leaveTypeId = u.leave_type_id
  if (u.leaveTypeId !== undefined) dto.leaveTypeId = u.leaveTypeId
  if (u.period !== undefined) dto.period = u.period
  if (u.recurrence_type !== undefined) dto.recurrenceType = u.recurrence_type
  if (u.recurrenceType !== undefined) dto.recurrenceType = u.recurrenceType
  if (u.recurrence_pattern !== undefined) dto.recurrencePattern = u.recurrence_pattern
  if (u.recurrencePattern !== undefined) dto.recurrencePattern = u.recurrencePattern
  if (u.start_date !== undefined) dto.startDate = u.start_date
  if (u.startDate !== undefined) dto.startDate = u.startDate
  if (u.end_date !== undefined) dto.endDate = u.end_date
  if (u.endDate !== undefined) dto.endDate = u.endDate
  if (u.max_occurrences !== undefined) dto.maxOccurrences = u.max_occurrences
  if (u.maxOccurrences !== undefined) dto.maxOccurrences = u.maxOccurrences
  if (u.excluded_dates !== undefined) dto.excludedDates = u.excluded_dates
  if (u.excludedDates !== undefined) dto.excludedDates = u.excludedDates
  if (u.name !== undefined) dto.name = u.name
  if (u.is_active !== undefined) dto.isActive = u.is_active
  if (u.isActive !== undefined) dto.isActive = u.isActive
  return dto
}

export const useRecurringEventsStore = defineStore('recurringEvents', () => {
  const recurringEvents = ref([])
  const loading = ref(false)
  const error = ref(null)

  const activeRecurringEvents = computed(() =>
    recurringEvents.value.filter((event) => event.is_active),
  )

  /**
   * Pour chaque occurrence générée : si le créneau (date_key) est libre,
   * on pose le type ; puis un seul sync serveur.
   */
  async function applyOccurrencesToLeaves(leavesStore, occurrences) {
    if (!occurrences.length) return
    for (const occ of occurrences) {
      const date = occ.date instanceof Date ? occ.date : new Date(occ.date)
      const keys = getDateKeys(date)
      const dateKey = occ.period === 'full' ? keys.full : keys[occ.period]
      if (leavesStore.leaves[dateKey]) continue
      leavesStore.setLeave(dateKey, occ.leaveTypeId)
    }
    await leavesStore.saveLeaves()
  }

  async function loadRecurringEvents() {
    const authStore = useAuthStore()
    if (!authStore.user) {
      recurringEvents.value = []
      return
    }

    try {
      loading.value = true
      error.value = null

      const data = await apiJson('/recurring-events', { method: 'GET' })
      recurringEvents.value = data.events || []
      logger.log('Événements récurrents chargés:', recurringEvents.value.length)
    } catch (err) {
      const errorMessage = handleError(err, {
        context: 'RecurringEventsStore.loadRecurringEvents',
        showToast: false,
      })
      error.value = errorMessage
      recurringEvents.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Événements récurrents actifs pour une liste d’utilisateurs (vue équipe).
   * Réponse API : `{ byUser: { [userId]: events[] } }`.
   */
  async function loadTeamRecurringEvents(userIds) {
    if (!userIds || userIds.length === 0) {
      return {}
    }

    try {
      const q = userIds.map(encodeURIComponent).join(',')
      const data = await apiJson(`/recurring-events/team?userIds=${q}`, {
        method: 'GET',
      })
      const byUser = data.byUser || {}
      logger.debug(
        '[RecurringEventsStore] Équipe :',
        Object.keys(byUser).length,
        'utilisateurs avec règles',
      )
      return byUser
    } catch (err) {
      logger.error(
        '[RecurringEventsStore] Erreur loadTeamRecurringEvents:',
        err,
      )
      return {}
    }
  }

  /**
   * Crée la règle côté API puis matérialise les occurrences en congés locaux.
   */
  async function createRecurringEvent(eventData) {
    const authStore = useAuthStore()
    const leavesStore = useLeavesStore()
    const uiStore = useUIStore()
    if (!authStore.user) {
      throw new Error('Utilisateur non authentifié')
    }

    try {
      loading.value = true
      error.value = null

      const newEvent = await apiJson('/recurring-events', {
        method: 'POST',
        body: JSON.stringify({
          leaveTypeId: eventData.leave_type_id,
          period: eventData.period || 'full',
          recurrenceType: eventData.recurrence_type,
          recurrencePattern: eventData.recurrence_pattern,
          startDate: eventData.start_date,
          endDate: eventData.end_date ?? undefined,
          maxOccurrences: eventData.max_occurrences ?? null,
          excludedDates: eventData.excluded_dates ?? [],
          name: eventData.name ?? null,
          isActive: eventData.is_active !== false,
        }),
      })

      const eventStartDate = new Date(eventData.start_date)
      let eventEndDate
      if (eventData.end_date) {
        eventEndDate = new Date(eventData.end_date)
      } else {
        eventEndDate = new Date(eventStartDate)
        eventEndDate.setMonth(11, 31)
        eventEndDate.setHours(23, 59, 59, 999)
      }

      const occurrences = generateRecurringOccurrences(
        newEvent,
        eventStartDate,
        eventEndDate,
        uiStore.selectedCountry || 'FR',
      )

      logger.debug(
        `[RecurringEvents] ${occurrences.length} occurrence(s) générée(s)`,
      )

      if (occurrences.length > 0) {
        await applyOccurrencesToLeaves(leavesStore, occurrences)
        await leavesStore.loadLeaves()
      }

      await loadRecurringEvents()

      logger.log(`Événement récurrent créé (${occurrences.length} occurrence(s))`)
      return newEvent
    } catch (err) {
      const errorMessage = handleError(err, {
        context: 'RecurringEventsStore.createRecurringEvent',
        showToast: false,
      })
      error.value = errorMessage
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateRecurringEvent(eventId, updates) {
    const authStore = useAuthStore()
    const leavesStore = useLeavesStore()
    const uiStore = useUIStore()
    if (!authStore.user) {
      throw new Error('Utilisateur non authentifié')
    }

    try {
      loading.value = true
      error.value = null

      let existingEvent = recurringEvents.value.find((e) => e.id === eventId)
      if (!existingEvent) {
        await loadRecurringEvents()
        existingEvent = recurringEvents.value.find((e) => e.id === eventId)
      }
      if (!existingEvent || existingEvent.user_id !== authStore.user.id) {
        throw new Error("Vous n'avez pas le droit de modifier cet événement")
      }

      const dto = toPatchDto(updates)
      const updatedEvent = await apiJson(`/recurring-events/${eventId}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      })

      const u = updates || {}
      const regen =
        u.start_date ||
        u.startDate ||
        u.end_date !== undefined ||
        u.endDate !== undefined ||
        u.recurrence_pattern ||
        u.recurrencePattern ||
        u.recurrence_type ||
        u.recurrenceType

      if (regen) {
        const currentYear = getYear(new Date())
        const startDate = new Date(currentYear, 0, 1)
        const endDate = new Date(currentYear + 1, 11, 31)

        const occurrences = generateRecurringOccurrences(
          updatedEvent,
          startDate,
          endDate,
          uiStore.selectedCountry || 'FR',
        )

        if (occurrences.length > 0) {
          await applyOccurrencesToLeaves(leavesStore, occurrences)
          await leavesStore.loadLeaves()
        }
      }

      await loadRecurringEvents()
      return updatedEvent
    } catch (err) {
      const errorMessage = handleError(err, {
        context: 'RecurringEventsStore.updateRecurringEvent',
        showToast: false,
      })
      error.value = errorMessage
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Supprime la règle ; optionnellement enlève les congés générés sur une fenêtre large.
   */
  async function deleteRecurringEvent(eventId, deleteAllOccurrences = false) {
    const authStore = useAuthStore()
    const leavesStore = useLeavesStore()
    const uiStore = useUIStore()
    if (!authStore.user) {
      throw new Error('Utilisateur non authentifié')
    }

    try {
      loading.value = true
      error.value = null

      if (deleteAllOccurrences) {
        const event = recurringEvents.value.find((e) => e.id === eventId)
        if (event) {
          const currentYear = getYear(new Date())
          const startDate = new Date(currentYear - 1, 0, 1)
          const endDate = new Date(currentYear + 2, 11, 31)

          const occurrences = generateRecurringOccurrences(
            event,
            startDate,
            endDate,
            uiStore.selectedCountry || 'FR',
          )

          if (occurrences.length > 0) {
            const dateKeys = new Set(
              occurrences.map((occ) => {
                const keys = getDateKeys(occ.date)
                return occ.period === 'full' ? keys.full : keys[occ.period]
              }),
            )

            for (const dk of Object.keys(leavesStore.leaves)) {
              if (
                dateKeys.has(dk) &&
                leavesStore.leaves[dk] === event.leave_type_id
              ) {
                leavesStore.removeLeave(dk)
              }
            }
            await leavesStore.saveLeaves()
          }
        }
      }

      await apiJson(`/recurring-events/${eventId}`, { method: 'DELETE' })

      await loadRecurringEvents()
      logger.log('Événement récurrent supprimé')
    } catch (err) {
      const errorMessage = handleError(err, {
        context: 'RecurringEventsStore.deleteRecurringEvent',
        showToast: false,
      })
      error.value = errorMessage
      throw err
    } finally {
      loading.value = false
    }
  }

  async function generateOccurrencesForYear(recurringEvent, year) {
    const authStore = useAuthStore()
    const leavesStore = useLeavesStore()
    const uiStore = useUIStore()
    if (!authStore.user) {
      throw new Error('Utilisateur non authentifié')
    }

    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year, 11, 31)

    const occurrences = generateRecurringOccurrences(
      recurringEvent,
      startDate,
      endDate,
      uiStore.selectedCountry || 'FR',
    )

    if (occurrences.length > 0) {
      await applyOccurrencesToLeaves(leavesStore, occurrences)
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
    recurringEvents,
    loading,
    error,
    activeRecurringEvents,
    loadRecurringEvents,
    loadTeamRecurringEvents,
    createRecurringEvent,
    updateRecurringEvent,
    deleteRecurringEvent,
    generateOccurrencesForYear,
    reset,
  }
})
