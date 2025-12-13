import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../services/supabase'
import logger from '../services/logger'
import { useAuthStore } from './auth'

export const useUIStore = defineStore('ui', () => {
  // State
  const currentDate = ref(new Date())
  const currentYear = computed(() => currentDate.value ? currentDate.value.getFullYear() : new Date().getFullYear())
  const selectedDate = ref(null)
  const selectedDates = ref([]) // Pour la sélection multiple
  const selectedPeriod = ref('full') // 'full', 'morning', 'afternoon'
  const multiSelectMode = ref(false)
  const viewMode = ref('year') // 'year', 'month', etc.
  const yearViewFormat = ref('semester') // 'semester', 'presence', 'presence-vertical'
  const configYear = ref(new Date().getFullYear())
  const selectedCountry = ref('FR')
  const ctrlKeyPressed = ref(false)
  const theme = ref('light') // 'light' ou 'dark'
  const fullWidth = ref(false)
  const minimizeHeader = ref(false) // Mode header minimal
  
  // Modales
  const showModal = ref(false)
  const showConfigModal = ref(false)
  const showHelpModal = ref(false)
  const showTeamsModal = ref(false)
  const showAdminModal = ref(false)

  // Getters
  const isMultiSelectActive = computed(() => multiSelectMode.value && selectedDates.value.length > 0)

  // Actions
  function setCurrentDate(date) {
    currentDate.value = date
    currentYear.value = date.getFullYear()
  }

  function setSelectedDate(date) {
    selectedDate.value = date
  }

  function addSelectedDate(date) {
    if (!selectedDates.value.find(d => d.getTime() === date.getTime())) {
      selectedDates.value.push(date)
    }
  }

  function removeSelectedDate(date) {
    selectedDates.value = selectedDates.value.filter(d => d.getTime() !== date.getTime())
  }

  function clearSelectedDates() {
    selectedDates.value = []
  }

  function setSelectedPeriod(period) {
    selectedPeriod.value = period
  }

  function setMultiSelectMode(enabled) {
    multiSelectMode.value = enabled
    if (!enabled) {
      clearSelectedDates()
    }
  }

  function setViewMode(mode) {
    viewMode.value = mode
  }

  function setYearViewFormat(format) {
    yearViewFormat.value = format
  }

  function setConfigYear(year) {
    configYear.value = year
  }

  async function loadSelectedCountry() {
    const authStore = useAuthStore()
    if (!authStore.user || !supabase) {
      selectedCountry.value = 'FR'
      return
    }

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('selected_country')
        .eq('user_id', authStore.user.id)
        .maybeSingle()

      if (error) throw error

      if (data && data.selected_country) {
        selectedCountry.value = data.selected_country
      } else {
        selectedCountry.value = 'FR'
        await saveSelectedCountry()
      }
    } catch (err) {
      logger.error('Erreur lors du chargement du pays:', err)
      selectedCountry.value = 'FR'
    }
  }

  async function saveSelectedCountry() {
    const authStore = useAuthStore()
    if (!authStore.user || !supabase) return

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: authStore.user.id,
          selected_country: selectedCountry.value,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (error) throw error
    } catch (err) {
      logger.error('Erreur lors de la sauvegarde du pays:', err)
      throw err
    }
  }

  function setSelectedCountry(country) {
    selectedCountry.value = country
    saveSelectedCountry()
  }

  function setCtrlKeyPressed(pressed) {
    ctrlKeyPressed.value = pressed
  }

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    applyTheme()
  }

  function setTheme(newTheme) {
    theme.value = newTheme
    applyTheme()
  }

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', theme.value)
    localStorage.setItem('theme', theme.value)
  }

  function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light'
    theme.value = savedTheme
    applyTheme()
  }

  function toggleFullWidth() {
    fullWidth.value = !fullWidth.value
    localStorage.setItem('fullWidth', fullWidth.value.toString())
    // Appliquer immédiatement la classe au body
    if (fullWidth.value) {
      document.body.classList.add('full-width')
    } else {
      document.body.classList.remove('full-width')
    }
  }

  function loadFullWidth() {
    const saved = localStorage.getItem('fullWidth')
    if (saved !== null) {
      fullWidth.value = saved === 'true'
      // Appliquer immédiatement la classe au body
      if (fullWidth.value) {
        document.body.classList.add('full-width')
      } else {
        document.body.classList.remove('full-width')
      }
    }
  }

  function toggleMinimizeHeader() {
    minimizeHeader.value = !minimizeHeader.value
    localStorage.setItem('minimizeHeader', minimizeHeader.value.toString())
    // Appliquer immédiatement la classe au body
    if (minimizeHeader.value) {
      document.body.classList.add('minimal-header')
    } else {
      document.body.classList.remove('minimal-header')
    }
  }

  function loadMinimizeHeader() {
    const saved = localStorage.getItem('minimizeHeader')
    if (saved !== null) {
      minimizeHeader.value = saved === 'true'
      // Appliquer immédiatement la classe au body
      if (minimizeHeader.value) {
        document.body.classList.add('minimal-header')
      } else {
        document.body.classList.remove('minimal-header')
      }
    }
  }

  // Modales
  function openModal() {
    showModal.value = true
  }

  function closeModal() {
    showModal.value = false
    selectedDate.value = null
    clearSelectedDates()
  }

  function openConfigModal() {
    showConfigModal.value = true
  }

  function closeConfigModal() {
    showConfigModal.value = false
  }

  function openHelpModal() {
    showHelpModal.value = true
  }

  function closeHelpModal() {
    showHelpModal.value = false
  }

  function openTeamsModal() {
    showTeamsModal.value = true
  }

  function closeTeamsModal() {
    showTeamsModal.value = false
  }

  function openAdminModal() {
    showAdminModal.value = true
  }

  function closeAdminModal() {
    showAdminModal.value = false
  }

  function reset() {
    currentDate.value = new Date()
    currentYear.value = new Date().getFullYear()
    selectedDate.value = null
    selectedDates.value = []
    selectedPeriod.value = 'full'
    multiSelectMode.value = false
    viewMode.value = 'year'
    yearViewFormat.value = 'semester'
    configYear.value = new Date().getFullYear()
    selectedCountry.value = 'FR'
    ctrlKeyPressed.value = false
    showModal.value = false
    showConfigModal.value = false
    showHelpModal.value = false
    showTeamsModal.value = false
    showAdminModal.value = false
  }

  return {
    // State
    currentDate,
    currentYear,
    selectedDate,
    selectedDates,
    selectedPeriod,
    multiSelectMode,
    viewMode,
    yearViewFormat,
    configYear,
    selectedCountry,
    ctrlKeyPressed,
    theme,
    fullWidth,
    minimizeHeader,
    showModal,
    showConfigModal,
    showHelpModal,
    showTeamsModal,
    showAdminModal,
    // Getters
    isMultiSelectActive,
    // Actions
    setCurrentDate,
    setSelectedDate,
    addSelectedDate,
    removeSelectedDate,
    clearSelectedDates,
    setSelectedPeriod,
    setMultiSelectMode,
    setViewMode,
    setYearViewFormat,
    setConfigYear,
    loadSelectedCountry,
    saveSelectedCountry,
    setSelectedCountry,
    setCtrlKeyPressed,
    toggleTheme,
    setTheme,
    applyTheme,
    loadTheme,
    toggleFullWidth,
    loadFullWidth,
    toggleMinimizeHeader,
    loadMinimizeHeader,
    openModal,
    closeModal,
    openConfigModal,
    closeConfigModal,
    openHelpModal,
    closeHelpModal,
    openTeamsModal,
    closeTeamsModal,
    openAdminModal,
    closeAdminModal,
    reset
  }
})

