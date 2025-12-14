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
  const yearViewFormat = ref('semester') // 'semester', 'columns', 'presence', 'presence-vertical'
  const configYear = ref(new Date().getFullYear())
  const selectedCountry = ref('FR')
  const ctrlKeyPressed = ref(false)
  const theme = ref('light') // 'light' ou 'dark' (thème effectif)
  const themeMode = ref('auto') // 'auto', 'light' ou 'dark' (préférence utilisateur)
  const fullWidth = ref(false)
  const minimizeHeader = ref(false) // Mode header minimal
  
  // Modales
  const showModal = ref(false)
  const showConfigModal = ref(false)
  const showHelpModal = ref(false)
  const showTeamsModal = ref(false)

  // Getters
  const isMultiSelectActive = computed(() => multiSelectMode.value && selectedDates.value.length > 0)

  // Actions
  function setCurrentDate(date) {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      currentDate.value = new Date()
    } else {
      currentDate.value = date
    }
    // currentYear est maintenant un computed, pas besoin de le mettre à jour
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

  // Fonction pour détecter la préférence système
  function getSystemTheme() {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  }

  // Fonction pour obtenir le thème effectif
  function getEffectiveTheme() {
    if (themeMode.value === 'auto') {
      return getSystemTheme()
    }
    return themeMode.value
  }

  // Mettre à jour le meta theme-color
  function updateThemeColor(themeValue) {
    if (typeof document === 'undefined') return
    
    let metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta')
      metaThemeColor.name = 'theme-color'
      document.head.appendChild(metaThemeColor)
    }
    
    // Couleurs adaptées selon le thème
    metaThemeColor.content = themeValue === 'dark' ? '#1a1a1a' : '#4a90e2'
  }

  function toggleTheme() {
    // Cycle entre auto -> light -> dark -> auto
    if (themeMode.value === 'auto') {
      themeMode.value = 'light'
    } else if (themeMode.value === 'light') {
      themeMode.value = 'dark'
    } else {
      themeMode.value = 'auto'
    }
    applyTheme()
    saveThemePreference()
  }

  function setTheme(newTheme) {
    if (newTheme === 'auto' || newTheme === 'light' || newTheme === 'dark') {
      themeMode.value = newTheme
      applyTheme()
      saveThemePreference()
    }
  }

  function applyTheme() {
    const effectiveTheme = getEffectiveTheme()
    theme.value = effectiveTheme
    
    if (typeof document !== 'undefined') {
      // Ajouter une classe de transition temporaire pour une animation fluide
      document.documentElement.classList.add('theme-transitioning')
      setTimeout(() => {
        document.documentElement.classList.remove('theme-transitioning')
      }, 300)
      
      document.documentElement.setAttribute('data-theme', effectiveTheme)
      
      // Mettre à jour le meta theme-color
      updateThemeColor(effectiveTheme)
      
      // Synchroniser avec localStorage
      localStorage.setItem('theme', effectiveTheme)
      localStorage.setItem('themeMode', themeMode.value)
    }
  }

  // Écouter les changements de préférence système
  let systemThemeListener = null
  
  function setupSystemThemeListener() {
    if (typeof window === 'undefined' || !window.matchMedia) return
    
    // Nettoyer l'ancien listener s'il existe
    if (systemThemeListener) {
      systemThemeListener()
      systemThemeListener = null
    }
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    // Fonction de callback
    const handleChange = (e) => {
      if (themeMode.value === 'auto') {
        applyTheme()
      }
    }
    
    // Support moderne et ancien
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      systemThemeListener = () => {
        mediaQuery.removeEventListener('change', handleChange)
      }
    } else if (mediaQuery.addListener) {
      // Fallback pour anciens navigateurs
      mediaQuery.addListener(handleChange)
      systemThemeListener = () => {
        mediaQuery.removeListener(handleChange)
      }
    }
  }

  async function saveThemePreference() {
    const authStore = useAuthStore()
    if (!authStore.user || !supabase) return

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: authStore.user.id,
          theme_mode: themeMode.value,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (error) throw error
    } catch (err) {
      logger.error('Erreur lors de la sauvegarde du thème:', err)
    }
  }

  async function loadThemePreference() {
    const authStore = useAuthStore()
    
    // Charger depuis localStorage d'abord (pour une application immédiate)
    const savedMode = localStorage.getItem('themeMode') || 'auto'
    themeMode.value = savedMode
    
    // Si l'utilisateur est connecté, charger depuis Supabase
    if (authStore.user && supabase) {
      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('theme_mode')
          .eq('user_id', authStore.user.id)
          .maybeSingle()

        if (error) throw error

        if (data && data.theme_mode) {
          themeMode.value = data.theme_mode
        }
      } catch (err) {
        logger.error('Erreur lors du chargement du thème depuis Supabase:', err)
        // Continuer avec la valeur localStorage
      }
    }
    
    // Appliquer le thème et configurer l'écouteur système
    applyTheme()
    setupSystemThemeListener()
  }

  function loadTheme() {
    // Fonction de compatibilité, utilise loadThemePreference maintenant
    loadThemePreference()
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
    themeMode,
    fullWidth,
    minimizeHeader,
    showModal,
    showConfigModal,
    showHelpModal,
    showTeamsModal,
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
    loadThemePreference,
    saveThemePreference,
    getSystemTheme,
    getEffectiveTheme,
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
    reset
  }
})

