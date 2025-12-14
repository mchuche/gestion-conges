<template>
  <div class="calendar-container" :class="{ 'minimized': minimizeHeader }">
    <div class="calendar-header">
      <div class="header-controls-row">
        <div class="header-controls">
          <button
            v-if="minimizeHeader"
            id="minimizeHeaderBtn"
            class="minimize-header-btn"
            :class="{ active: minimizeHeader }"
            @click="toggleMinimizeHeader"
            :title="minimizeHeader ? 'Afficher les éléments du header' : 'Masquer les éléments du header'"
          >
            <Icon :name="minimizeHeader ? 'chevrons-down' : 'chevrons-up'" />
          </button>
          <button class="nav-btn" @click="previousYear" title="Année précédente">
            ◀
          </button>
          <h2 id="currentMonth">{{ calendarTitle }}</h2>
          <button class="nav-btn" @click="nextYear" title="Année suivante">
            ▶
          </button>
        </div>
        <div class="calendar-header-options">
          <ViewFormatSelector id="yearViewFormatSelect" />
          <TeamSelector v-if="yearViewFormat === 'presence' || yearViewFormat === 'presence-vertical'" />
        </div>
      </div>
    </div>

    <Stats class="stats" />
    <Quotas class="leave-quotas" />
    
    <HelpHint />
    
    <div id="semesterCalendar" :class="calendarViewClass">
      <YearViewSemester
        v-if="yearViewFormat === 'semester'"
        @day-click="handleDayClick"
        @day-mousedown="handleDayMouseDown"
      />
      <YearViewColumns
        v-if="yearViewFormat === 'columns'"
        @day-click="handleDayClick"
        @day-mousedown="handleDayMouseDown"
      />
      <YearViewPresence
        v-if="yearViewFormat === 'presence'"
        @day-click="handleDayClick"
        @day-mousedown="handleDayMouseDown"
      />
      <YearViewPresenceVertical
        v-if="yearViewFormat === 'presence-vertical'"
        @day-click="handleDayClick"
        @day-mousedown="handleDayMouseDown"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { useUIStore } from '../../stores/ui'
import { useLeavesStore } from '../../stores/leaves'
import logger from '../../services/logger'
import { useLeaveTypesStore } from '../../stores/leaveTypes'
import { useQuotasStore } from '../../stores/quotas'
import { useAuthStore } from '../../stores/auth'
import { defineAsyncComponent } from 'vue'
import YearViewSemester from './YearViewSemester.vue'
import YearViewColumns from './YearViewColumns.vue'
import ViewFormatSelector from './ViewFormatSelector.vue'
import TeamSelector from '../common/TeamSelector.vue'
import Stats from '../stats/Stats.vue'
import Quotas from '../stats/Quotas.vue'
import HelpHint from '../common/HelpHint.vue'
import Icon from '../common/Icon.vue'
import { getYear, addYears } from '../../services/dateUtils'
import { getDateKey } from '../../services/utils'

// Lazy loading des vues de présence (chargées uniquement quand nécessaires)
const YearViewPresence = defineAsyncComponent(() => import('./YearViewPresence.vue'))
const YearViewPresenceVertical = defineAsyncComponent(() => import('./YearViewPresenceVertical.vue'))

const uiStore = useUIStore()
const leavesStore = useLeavesStore()
const leaveTypesStore = useLeaveTypesStore()
const quotasStore = useQuotasStore()
const authStore = useAuthStore()

// Watcher pour mettre à jour l'affichage visuel des sélections
watch(() => uiStore.selectedDates, () => {
  // La mise à jour visuelle se fait automatiquement via les classes CSS
  // Les composants CalendarDay réagissent aux changements de selectedDates
}, { deep: true })

const yearViewFormat = computed(() => uiStore.yearViewFormat)
const minimizeHeader = computed(() => uiStore.minimizeHeader)
const currentYear = computed(() => {
  if (!uiStore.currentDate) return new Date().getFullYear()
  return getYear(uiStore.currentDate)
})
const currentYearTitle = computed(() => `Année ${currentYear.value}`)

const calendarTitle = computed(() => {
  if (yearViewFormat.value === 'presence') {
    return `Matrice de Présence ${currentYear.value}`
  } else if (yearViewFormat.value === 'presence-vertical') {
    return `Matrice de Présence ${currentYear.value} (Verticale)`
  } else if (yearViewFormat.value === 'columns') {
    return `Vue Colonnes ${currentYear.value}`
  }
  return currentYearTitle.value
})

const calendarViewClass = computed(() => {
  if (yearViewFormat.value === 'presence') {
    return 'year-presence-view'
  } else if (yearViewFormat.value === 'presence-vertical') {
    return 'year-presence-vertical-view'
  }
  return ''
})

async function loadAllData() {
  try {
    // Charger toutes les données en parallèle
    await Promise.all([
      leavesStore.loadLeaves(),
      leaveTypesStore.loadLeaveTypes(),
      quotasStore.loadQuotas(),
      uiStore.loadSelectedCountry(),
      uiStore.loadTheme(),
      uiStore.loadFullWidth()
    ])
    logger.log('Toutes les données chargées')
  } catch (err) {
    logger.error('Erreur lors du chargement des données:', err)
  }
}

function previousYear() {
  const newDate = addYears(uiStore.currentDate, -1)
  uiStore.setCurrentDate(newDate)
}

function nextYear() {
  const newDate = addYears(uiStore.currentDate, 1)
  uiStore.setCurrentDate(newDate)
}

function toggleMinimizeHeader() {
  uiStore.toggleMinimizeHeader()
}

function handleDayClick(date, event) {
  // Si on est en mode sélection multiple avec des dates déjà sélectionnées,
  // ouvrir la modale pour appliquer le congé aux jours sélectionnés
  if (uiStore.multiSelectMode && uiStore.selectedDates.length > 0) {
    // Ouvrir la modale avec la date courante comme référence
    // La modale devra gérer l'application aux dates sélectionnées
    uiStore.setSelectedDate(date)
    uiStore.openModal()
    return
  }
  
  // Ne pas ouvrir la modale si on est en train de sélectionner (mode multi activé mais aucune date encore)
  if (uiStore.multiSelectMode) {
    return
  }
  
  // Ouvrir la modale pour sélectionner le type de congé (clic simple)
  uiStore.setSelectedDate(date)
  uiStore.openModal()
  
  // Empêcher la propagation si l'événement existe
  if (event && typeof event.stopPropagation === 'function') {
    event.stopPropagation()
  }
}

function handleDayMouseDown(date, event) {
  // Gérer la sélection multiple avec Ctrl/Cmd
  // Utiliser le store en priorité (plus fiable car mis à jour par les listeners globaux)
  // Vérifier aussi l'événement natif comme fallback
  let ctrlKey = uiStore.ctrlKeyPressed
  let metaKey = false
  
  // Fallback : vérifier dans l'événement natif si disponible
  if (!ctrlKey && event && typeof event === 'object') {
    if (event instanceof MouseEvent || ('ctrlKey' in event) || ('metaKey' in event)) {
      ctrlKey = event.ctrlKey === true
      metaKey = event.metaKey === true
    }
  }
  
  const isMultiSelect = ctrlKey || metaKey
  
  if (isMultiSelect) {
    uiStore.setMultiSelectMode(true)
    // Empêcher le click d'ouvrir la modale immédiatement
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault()
    }
    if (uiStore.selectedDates.find(d => getDateKey(d) === getDateKey(date))) {
      uiStore.removeSelectedDate(date)
    } else {
      uiStore.addSelectedDate(date)
    }
  } else {
    // Clic simple sans Ctrl
    // Si on a déjà des dates sélectionnées en mode multi, ne pas les effacer
    // mais permettre l'ouverture de la modale pour les appliquer
    if (uiStore.multiSelectMode && uiStore.selectedDates.length > 0) {
      // Garder le mode sélection multiple et les dates sélectionnées
      // Ne pas empêcher le click - il doit ouvrir la modale
      uiStore.setSelectedDate(date)
      // Ne pas faire preventDefault ici pour permettre au click de se déclencher
    } else {
      // Clic simple sans sélection multiple : sélectionner ce jour uniquement
      uiStore.setSelectedDate(date)
      uiStore.clearSelectedDates()
      uiStore.setMultiSelectMode(false)
    }
  }
  
  // Empêcher la propagation si l'événement existe
  if (event && typeof event.stopPropagation === 'function') {
    event.stopPropagation()
  }
}


onMounted(async () => {
  await loadAllData()
})
</script>

<style scoped>
.calendar-container {
  width: 100%;
  padding: 20px;
}

/* Mode minimisé - calendar-container prend tout l'espace de la fenêtre */
.calendar-container.minimized {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  padding: 0;
  margin: 0;
  z-index: 999;
  background: var(--bg-color, #f5f5f5);
  overflow: auto;
}

.calendar-header {
  margin-bottom: 20px;
}

.header-controls-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

.header-controls {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 20px;
  flex: 1;
  min-width: 0;
}

.calendar-header-options {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  padding: 0;
  background: transparent;
  border: none;
  box-shadow: none;
  flex-shrink: 0;
}

.calendar-header h2 {
  margin: 0;
  color: var(--text-color, #2c3e50);
  font-size: 2em;
}

.nav-btn {
  background: var(--primary-color, #4a90e2);
  color: white;
  border: none;
  width: 45px;
  height: 45px;
  border-radius: 4px;
  font-size: 1.3em;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(74, 144, 226, 0.3);
}

.nav-btn:hover {
  background: #357abd;
  transform: scale(1.1);
}

.nav-btn:active {
  transform: scale(0.95);
}

.calendar-header-title-row #currentMonth {
  font-size: 2em;
  font-weight: 600;
  color: var(--text-color, #2c3e50);
  line-height: 1.2;
  text-align: left;
  margin: 0;
}

#semesterCalendar {
  width: 100%;
  overflow-x: auto;
  overflow-y: visible;
}

#semesterCalendar.year-presence-view {
  overflow-x: auto;
  overflow-y: auto;
}

#semesterCalendar.year-presence-vertical-view {
  overflow-x: auto;
  overflow-y: auto;
}

/* Styles pour le bouton minimize dans header-controls */
.header-controls .minimize-header-btn {
  background: var(--primary-color, #4a90e2);
  color: white;
  border: none;
  width: 35px;
  height: 35px;
  border-radius: 4px;
  font-size: 1em;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(74, 144, 226, 0.3);
  flex-shrink: 0;
  order: 0;
}

.header-controls .minimize-header-btn:hover {
  background: #357abd;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.4);
}

.header-controls .minimize-header-btn.active {
  background: var(--secondary-color, #50c878);
}

@media (max-width: 768px) {
  .header-controls-row {
    flex-direction: column;
    align-items: stretch;
  }

  .header-controls {
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
  }

  .calendar-header h2 {
    font-size: 1.5em;
  }

  .calendar-header-options {
    justify-content: center;
  }
}
</style>

