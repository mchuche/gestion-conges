/**
 * Store UI — préférences persistées via API Nest (`GET/PATCH /preferences`).
 * Le reste (modales, navigation calendrier) reste local.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiJson } from '../services/api'
import logger from '../services/logger'
import { useAuthStore } from './auth'
import { getDateKey } from '../services/utils'
import { normalizeMainBalanceTypeIds } from '../constants/mainBalanceDefaults'

export const useUIStore = defineStore('ui', () => {
  // State
  const currentDate = ref(new Date())
  const currentYear = computed(() => currentDate.value ? currentDate.value.getFullYear() : new Date().getFullYear())
  const selectedDate = ref(null)
  const selectedDates = ref([]) // Pour la sélection multiple
  const selectedPeriod = ref('full') // 'full', 'morning', 'afternoon'
  const selectedTargetUserId = ref(null) // Pour modifier les événements d'un autre utilisateur
  const multiSelectMode = ref(false)
  const viewMode = ref('year') // 'year', 'month', etc.
  const yearViewFormat = ref('columns') // 'columns', 'presence-vertical'
  const configYear = ref(new Date().getFullYear())
  const selectedCountry = ref('FR')
  const weekStartDay = ref(0) // 0 = Dimanche, 1 = Lundi, etc.
  const eventOpacity = ref(0.15) // Opacité des événements (0.0 à 1.0)
  const holidayWeekendIntensity = ref('normal') // Intensité des jours fériés et weekends: 'light', 'normal', 'strong'
  const ctrlKeyPressed = ref(false)
  const theme = ref('light') // 'light' ou 'dark' (thème effectif)
  const themeMode = ref('auto') // 'auto', 'light' ou 'dark' (préférence utilisateur)
  const fullWidth = ref(true)
  const minimizeHeader = ref(false) // Mode header minimal
  /** IDs des types inclus dans le bandeau « Jours restants » (préférence utilisateur). */
  const mainBalanceTypeIds = ref([])
  /** Pose autorisée les samedi, dimanche et jours fériés. */
  const allowWeekendHolidayLeave = ref(false)
  /** Essai vacances scolaires : couleur du chiffre du jour (désactivé = calendrier inchangé). */
  const showSchoolHolidays = ref(false)
  const schoolHolidayZone = ref(null)

  // Formats de vue annuelle autorisés
  const ALLOWED_YEAR_VIEW_FORMATS = ['columns', 'presence-vertical']
  
  // Modales
  const showModal = ref(false)
  const showConfigModal = ref(false)
  const showHelpModal = ref(false)
  const showTeamsModal = ref(false)
  const showLeaveRecapModal = ref(false)
  const showRecurringEventModal = ref(false)
  const showDateRangeModal = ref(false)
  const selectedEventTypeId = ref(null) // Pour la modale d'événements récurrents
  const recurringEventDateRange = ref(null) // Plage de dates pour la récurrence [startDate, endDate]

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

  function setSelectedTargetUserId(userId) {
    selectedTargetUserId.value = userId
  }

  function addSelectedDate(date) {
    const dateKey = getDateKey(date)
    if (!selectedDates.value.find(d => getDateKey(d) === dateKey)) {
      selectedDates.value.push(date)
    }
  }

  function removeSelectedDate(date) {
    const dateKey = getDateKey(date)
    selectedDates.value = selectedDates.value.filter(d => getDateKey(d) !== dateKey)
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
    // Fallback: si une ancienne valeur ('semester') traîne, revenir sur 'columns'
    yearViewFormat.value = ALLOWED_YEAR_VIEW_FORMATS.includes(format) ? format : 'columns'
  }

  function setConfigYear(year) {
    configYear.value = year
  }

  // --- Préférences serveur (GET/PATCH /preferences, corps PATCH en camelCase) ---

  /** Cache mémoire : évite plusieurs GET identiques au montage (App + Calendar…). */
  let prefsCache = null
  let prefsLoading = null

  /** À appeler après déconnexion pour ne pas réutiliser les prefs d’un autre utilisateur. */
  function resetPreferencesCache() {
    prefsCache = null
    prefsLoading = null
  }

  /**
   * Récupère une fois la ligne `UserPreferences` (réponse snake_case).
   * Retourne `null` si pas d’utilisateur connecté.
   */
  async function fetchPreferencesPayload() {
    const authStore = useAuthStore()
    if (!authStore.user) return null
    if (prefsCache) return prefsCache
    if (prefsLoading) return prefsLoading
    prefsLoading = apiJson('/preferences', { method: 'GET' })
      .then((p) => {
        prefsCache = p
        prefsLoading = null
        return p
      })
      .catch((e) => {
        prefsLoading = null
        throw e
      })
    return prefsLoading
  }

  /** Applique tous les champs utiles de la réponse GET vers les refs du store. */
  function applyPreferencesPayload(p) {
    if (!p) return
    if (p.selected_country) selectedCountry.value = p.selected_country
    if (p.week_start_day !== undefined && p.week_start_day !== null) {
      weekStartDay.value = p.week_start_day
    }
    if (p.event_opacity !== undefined && p.event_opacity !== null) {
      const op = parseFloat(p.event_opacity)
      if (!Number.isNaN(op) && op >= 0 && op <= 1) eventOpacity.value = op
    }
    if (p.holiday_weekend_intensity && ['light', 'normal', 'strong'].includes(p.holiday_weekend_intensity)) {
      holidayWeekendIntensity.value = p.holiday_weekend_intensity
    }
    if (p.theme_mode && ['auto', 'light', 'dark'].includes(p.theme_mode)) {
      themeMode.value = p.theme_mode
    }
    if (p.main_balance_type_ids) {
      mainBalanceTypeIds.value = normalizeMainBalanceTypeIds(p.main_balance_type_ids)
    }
    if (p.allow_weekend_holiday_leave != null) {
      allowWeekendHolidayLeave.value = Boolean(p.allow_weekend_holiday_leave)
    }
    if (p.show_school_holidays != null) {
      showSchoolHolidays.value = Boolean(p.show_school_holidays)
    }
    if (p.school_holiday_zone !== undefined) {
      const z = p.school_holiday_zone
      schoolHolidayZone.value = z && ['A', 'B', 'C'].includes(z) ? z : null
    }
  }

  /** PATCH partiel ; invalide le cache pour le prochain GET. */
  async function patchPreferences(partial) {
    const authStore = useAuthStore()
    if (!authStore.user) return
    await apiJson('/preferences', {
      method: 'PATCH',
      body: JSON.stringify(partial),
    })
    prefsCache = null
  }

  async function loadAllowWeekendHolidayLeave() {
    const authStore = useAuthStore()
    if (!authStore.user) {
      allowWeekendHolidayLeave.value = false
      return
    }
    try {
      const p = await fetchPreferencesPayload()
      applyPreferencesPayload(p)
    } catch (err) {
      logger.error('Erreur chargement option week-end/férié:', err)
      allowWeekendHolidayLeave.value = false
    }
  }

  async function saveAllowWeekendHolidayLeave(value) {
    const authStore = useAuthStore()
    if (!authStore.user) return
    allowWeekendHolidayLeave.value = Boolean(value)
    await patchPreferences({ allowWeekendHolidayLeave: allowWeekendHolidayLeave.value })
  }

  async function saveSchoolHolidaysPrefs({ show, zone }) {
    const authStore = useAuthStore()
    if (!authStore.user) return
    if (show !== undefined) showSchoolHolidays.value = Boolean(show)
    if (zone !== undefined) {
      const z = zone ? String(zone).toUpperCase() : null
      schoolHolidayZone.value = z && ['A', 'B', 'C'].includes(z) ? z : null
    }
    const body = { showSchoolHolidays: showSchoolHolidays.value }
    if (schoolHolidayZone.value) {
      body.schoolHolidayZone = schoolHolidayZone.value
    }
    await patchPreferences(body)
  }

  async function loadMainBalanceTypeIds() {
    const authStore = useAuthStore()
    if (!authStore.user) {
      mainBalanceTypeIds.value = []
      return
    }
    try {
      const p = await fetchPreferencesPayload()
      applyPreferencesPayload(p)
    } catch (err) {
      logger.error('Erreur chargement résumé congés:', err)
      mainBalanceTypeIds.value = normalizeMainBalanceTypeIds([])
    }
  }

  async function saveMainBalanceTypeIds(ids) {
    const authStore = useAuthStore()
    if (!authStore.user) return
    const normalized = normalizeMainBalanceTypeIds(ids)
    mainBalanceTypeIds.value = normalized
    await patchPreferences({ mainBalanceTypeIds: normalized })
  }

  function isTypeInMainBalance(typeId) {
    const ids =
      mainBalanceTypeIds.value.length > 0
        ? mainBalanceTypeIds.value
        : normalizeMainBalanceTypeIds([])
    return ids.includes(typeId)
  }

  async function loadSelectedCountry() {
    const authStore = useAuthStore()
    if (!authStore.user) {
      selectedCountry.value = 'FR'
      return
    }

    try {
      const p = await fetchPreferencesPayload()
      applyPreferencesPayload(p)
      if (!p?.selected_country) {
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
    if (!authStore.user) return

    try {
      await patchPreferences({ selectedCountry: selectedCountry.value })
    } catch (err) {
      logger.error('Erreur lors de la sauvegarde du pays:', err)
      throw err
    }
  }

  function setSelectedCountry(country) {
    selectedCountry.value = country
    saveSelectedCountry()
  }

  async function loadWeekStartDay() {
    const authStore = useAuthStore()
    if (!authStore.user) {
      weekStartDay.value = 0
      eventOpacity.value = 0.15
      return
    }

    try {
      const p = await fetchPreferencesPayload()
      applyPreferencesPayload(p)
    } catch (err) {
      logger.error('Erreur lors du chargement du jour de début de semaine:', err)
      weekStartDay.value = 0
    }
  }

  async function saveWeekStartDay() {
    const authStore = useAuthStore()
    if (!authStore.user) return

    try {
      await patchPreferences({ weekStartDay: weekStartDay.value })
    } catch (err) {
      logger.error('Erreur lors de la sauvegarde du jour de début de semaine:', err)
    }
  }

  function setWeekStartDay(day) {
    weekStartDay.value = day
    saveWeekStartDay()
  }

  async function loadEventOpacity() {
    const authStore = useAuthStore()
    if (!authStore.user) {
      eventOpacity.value = 0.15
      return
    }

    try {
      const p = await fetchPreferencesPayload()
      applyPreferencesPayload(p)
    } catch (err) {
      logger.error('Erreur lors du chargement de event_opacity:', err)
      eventOpacity.value = 0.15
    }
  }

  async function saveEventOpacity() {
    const authStore = useAuthStore()
    if (!authStore.user) return

    try {
      await patchPreferences({ eventOpacity: eventOpacity.value })
    } catch (err) {
      logger.error('Erreur lors de la sauvegarde de event_opacity:', err)
    }
  }

  function setEventOpacity(opacity) {
    const value = parseFloat(opacity)
    if (!isNaN(value) && value >= 0 && value <= 1) {
      eventOpacity.value = value
      saveEventOpacity()
    }
  }

  async function loadHolidayWeekendIntensity() {
    const authStore = useAuthStore()
    if (!authStore.user) {
      holidayWeekendIntensity.value = 'normal'
      return
    }

    try {
      const p = await fetchPreferencesPayload()
      applyPreferencesPayload(p)
    } catch (err) {
      logger.error('Erreur lors du chargement de holiday_weekend_intensity:', err)
      holidayWeekendIntensity.value = 'normal'
    }
  }

  async function saveHolidayWeekendIntensity() {
    const authStore = useAuthStore()
    if (!authStore.user) return

    try {
      await patchPreferences({ holidayWeekendIntensity: holidayWeekendIntensity.value })
    } catch (err) {
      logger.error('Erreur lors de la sauvegarde de holiday_weekend_intensity:', err)
    }
  }

  function setHolidayWeekendIntensity(intensity) {
    if (['light', 'normal', 'strong'].includes(intensity)) {
      holidayWeekendIntensity.value = intensity
      saveHolidayWeekendIntensity()
    }
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
    if (!authStore.user) return

    try {
      await patchPreferences({ themeMode: themeMode.value })
    } catch (err) {
      logger.error('Erreur lors de la sauvegarde du thème:', err)
    }
  }

  async function loadThemePreference() {
    const authStore = useAuthStore()

    // localStorage d’abord (affichage immédiat avant session)
    const savedMode = localStorage.getItem('themeMode') || 'auto'
    themeMode.value = savedMode

    if (authStore.user) {
      try {
        const p = await fetchPreferencesPayload()
        applyPreferencesPayload(p)
      } catch (err) {
        logger.error('Erreur lors du chargement du thème depuis l’API:', err)
      }
    }

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
    } else {
      // Par défaut, activer le mode pleine largeur
      fullWidth.value = true
    }
    // Appliquer immédiatement la classe au body
    if (fullWidth.value) {
      document.body.classList.add('full-width')
    } else {
      document.body.classList.remove('full-width')
    }
  }

  function toggleMinimizeHeader() {
    minimizeHeader.value = !minimizeHeader.value
    localStorage.setItem('minimizeHeader', minimizeHeader.value.toString())
    // Appliquer immédiatement la classe au body et au mainContainer
    if (minimizeHeader.value) {
      document.body.classList.add('minimal-header')
      const mainContainer = document.getElementById('mainContainer')
      if (mainContainer) {
        mainContainer.classList.add('calendar-minimized')
      }
    } else {
      document.body.classList.remove('minimal-header')
      const mainContainer = document.getElementById('mainContainer')
      if (mainContainer) {
        mainContainer.classList.remove('calendar-minimized')
      }
    }
  }

  function loadMinimizeHeader() {
    const saved = localStorage.getItem('minimizeHeader')
    if (saved !== null) {
      minimizeHeader.value = saved === 'true'
      // Appliquer immédiatement la classe au body et au mainContainer
      if (minimizeHeader.value) {
        document.body.classList.add('minimal-header')
        const mainContainer = document.getElementById('mainContainer')
        if (mainContainer) {
          mainContainer.classList.add('calendar-minimized')
        }
      } else {
        document.body.classList.remove('minimal-header')
        const mainContainer = document.getElementById('mainContainer')
        if (mainContainer) {
          mainContainer.classList.remove('calendar-minimized')
        }
      }
    }
  }

  // Modales
  function openModal() {
    // Fermer les modales « outils » si elles sont ouvertes
    if (showRecurringEventModal.value) {
      showRecurringEventModal.value = false
    }
    if (showDateRangeModal.value) {
      showDateRangeModal.value = false
    }
    showModal.value = true
  }

  function closeModal() {
    showModal.value = false
    selectedDate.value = null
    selectedTargetUserId.value = null
    clearSelectedDates()
  }

  function openConfigModal() {
    logger.debug('[UIStore] openConfigModal appelé, showConfigModal avant:', showConfigModal.value)
    showConfigModal.value = true
    logger.debug('[UIStore] openConfigModal appelé, showConfigModal après:', showConfigModal.value)
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

  function openLeaveRecapModal() {
    showLeaveRecapModal.value = true
  }

  function closeLeaveRecapModal() {
    showLeaveRecapModal.value = false
  }

  function openRecurringEventModal(eventTypeId, dateRange = null) {
    // Fermer la modale de sélection de congé si elle est ouverte
    if (showModal.value) {
      showModal.value = false
    }
    selectedEventTypeId.value = eventTypeId
    recurringEventDateRange.value = dateRange
    showRecurringEventModal.value = true
  }

  function closeRecurringEventModal() {
    showRecurringEventModal.value = false
    selectedEventTypeId.value = null
    recurringEventDateRange.value = null
  }

  /**
   * Masque la modale congé sans effacer la sélection (passage vers plage / récurrence).
   */
  function hideLeaveModal() {
    showModal.value = false
  }

  /** Ouvre la modale de plage de dates (ferme la modale congé, conserve selectedDates). */
  function openDateRangeModal() {
    if (showRecurringEventModal.value) {
      showRecurringEventModal.value = false
    }
    showModal.value = false
    showDateRangeModal.value = true
  }

  /**
   * Ferme la modale plage ; rouvre la modale congé si une date est encore sélectionnée.
   * @param {{ reopenLeave?: boolean }} [options]
   */
  function closeDateRangeModal(options = { reopenLeave: true }) {
    showDateRangeModal.value = false
    const shouldReopen =
      options.reopenLeave &&
      (selectedDate.value != null || selectedDates.value.length > 0)
    if (shouldReopen) {
      showModal.value = true
    }
  }

  /**
   * Nettoyage "logout" : vider les sélections et fermer les modales,
   * sans toucher aux préférences UI (thème, fullWidth, etc.).
   * On invalide quand même le cache serveur pour le prochain utilisateur.
   */
  function resetForLogout() {
    resetPreferencesCache()

    // Sélections / mode multi
    selectedDate.value = null
    selectedDates.value = []
    selectedPeriod.value = 'full'
    selectedTargetUserId.value = null
    multiSelectMode.value = false
    ctrlKeyPressed.value = false

    // Modales
    showModal.value = false
    showConfigModal.value = false
    showHelpModal.value = false
    showTeamsModal.value = false
    showLeaveRecapModal.value = false
    showRecurringEventModal.value = false
    showDateRangeModal.value = false

    // Événements récurrents
    selectedEventTypeId.value = null
    recurringEventDateRange.value = null
    mainBalanceTypeIds.value = []
    allowWeekendHolidayLeave.value = false
  }

  function reset() {
    currentDate.value = new Date()
    selectedDate.value = null
    selectedDates.value = []
    selectedPeriod.value = 'full'
    selectedTargetUserId.value = null
    multiSelectMode.value = false
    viewMode.value = 'year'
    yearViewFormat.value = 'columns'
    configYear.value = new Date().getFullYear()
    selectedCountry.value = 'FR'
    weekStartDay.value = 0
    eventOpacity.value = 0.15
    holidayWeekendIntensity.value = 'normal'
    ctrlKeyPressed.value = false
    theme.value = 'light'
    themeMode.value = 'auto'
    fullWidth.value = false
    minimizeHeader.value = false
    showModal.value = false
    showConfigModal.value = false
    showHelpModal.value = false
    showTeamsModal.value = false
    showLeaveRecapModal.value = false
    showDateRangeModal.value = false
  }

  return {
    // State
    currentDate,
    currentYear,
    selectedDate,
    selectedDates,
    selectedPeriod,
    selectedTargetUserId,
    multiSelectMode,
    viewMode,
    yearViewFormat,
    configYear,
    selectedCountry,
    weekStartDay,
    eventOpacity,
    holidayWeekendIntensity,
    ctrlKeyPressed,
    theme,
    themeMode,
    fullWidth,
    minimizeHeader,
    mainBalanceTypeIds,
    allowWeekendHolidayLeave,
    showSchoolHolidays,
    schoolHolidayZone,
    saveSchoolHolidaysPrefs,
    showModal,
    showConfigModal,
    showHelpModal,
    showTeamsModal,
    showLeaveRecapModal,
    // Getters
    isMultiSelectActive,
    // Actions
    setCurrentDate,
    setSelectedDate,
    setSelectedTargetUserId,
    addSelectedDate,
    removeSelectedDate,
    clearSelectedDates,
    setSelectedPeriod,
    setMultiSelectMode,
    setViewMode,
    setYearViewFormat,
    setConfigYear,
    loadMainBalanceTypeIds,
    saveMainBalanceTypeIds,
    isTypeInMainBalance,
    loadAllowWeekendHolidayLeave,
    saveAllowWeekendHolidayLeave,
    loadSelectedCountry,
    saveSelectedCountry,
    setSelectedCountry,
    loadWeekStartDay,
    saveWeekStartDay,
    setWeekStartDay,
    loadEventOpacity,
    saveEventOpacity,
    setEventOpacity,
    loadHolidayWeekendIntensity,
    saveHolidayWeekendIntensity,
    setHolidayWeekendIntensity,
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
    openLeaveRecapModal,
    closeLeaveRecapModal,
    showRecurringEventModal,
    showDateRangeModal,
    selectedEventTypeId,
    recurringEventDateRange,
    openRecurringEventModal,
    closeRecurringEventModal,
    hideLeaveModal,
    openDateRangeModal,
    closeDateRangeModal,
    resetForLogout,
    resetPreferencesCache,
    reset
  }
})

