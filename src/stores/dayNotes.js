/**
 * Carnet de notes par jour — API Nest (`/day-notes`)
 * Une note par dateKey (journée entière), indépendante des congés posés.
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiJson } from '../services/api'
import logger from '../services/logger'
import { handleError } from '../services/errorHandler'
import { useAuthStore } from './auth'

export const useDayNotesStore = defineStore('dayNotes', () => {
  /** { 'YYYY-MM-DD': 'texte' } */
  const notesByDate = ref({})
  const loading = ref(false)
  const loadedYear = ref(null)

  function getNote(dateKey) {
    return notesByDate.value[dateKey] || ''
  }

  async function loadForYear(year) {
    const authStore = useAuthStore()
    if (!authStore.user) {
      notesByDate.value = {}
      loadedYear.value = null
      return
    }

    try {
      loading.value = true
      const data = await apiJson(`/day-notes?year=${encodeURIComponent(year)}`, {
        method: 'GET',
      })
      const map = {}
      for (const row of data.items || []) {
        if (row.text?.trim()) {
          map[row.dateKey] = row.text.trim()
        }
      }
      notesByDate.value = map
      loadedYear.value = year
      logger.log('[DayNotes] chargées:', Object.keys(map).length, 'jours pour', year)
    } catch (err) {
      handleError(err, { context: 'dayNotes.loadForYear' })
      notesByDate.value = {}
    } finally {
      loading.value = false
    }
  }

  async function saveNote(dateKey, text) {
    const authStore = useAuthStore()
    if (!authStore.user || !dateKey) return

    const trimmed = (text ?? '').trim().slice(0, 500)
    try {
      await apiJson('/day-notes', {
        method: 'PATCH',
        body: JSON.stringify({ dateKey, text: trimmed }),
      })
      if (trimmed) {
        notesByDate.value = { ...notesByDate.value, [dateKey]: trimmed }
      } else {
        const next = { ...notesByDate.value }
        delete next[dateKey]
        notesByDate.value = next
      }
    } catch (err) {
      handleError(err, { context: 'dayNotes.saveNote' })
      throw err
    }
  }

  function clear() {
    notesByDate.value = {}
    loadedYear.value = null
  }

  return {
    notesByDate,
    loading,
    loadedYear,
    getNote,
    loadForYear,
    saveNote,
    clear,
  }
})
