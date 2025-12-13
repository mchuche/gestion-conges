<template>
  <div class="calendar-container">
    <div class="calendar-header">
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
      <ViewFormatSelector id="yearViewFormatSelect" />
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
import { useLeaveTypesStore } from '../../stores/leaveTypes'
import { useQuotasStore } from '../../stores/quotas'
import { useAuthStore } from '../../stores/auth'
import YearViewSemester from './YearViewSemester.vue'
import YearViewPresence from './YearViewPresence.vue'
import YearViewPresenceVertical from './YearViewPresenceVertical.vue'
import ViewFormatSelector from './ViewFormatSelector.vue'
import Stats from '../stats/Stats.vue'
import Quotas from '../stats/Quotas.vue'
import HelpHint from '../common/HelpHint.vue'
import Icon from '../common/Icon.vue'
import { getYear, addYears } from '../../services/dateUtils'
import { getDateKey } from '../../services/utils'

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
    console.log('Toutes les données chargées')
  } catch (err) {
    console.error('Erreur lors du chargement des données:', err)
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
  // Ouvrir la modale pour sélectionner le type de congé
  uiStore.setSelectedDate(date)
  uiStore.openModal()
}

function handleDayMouseDown(date, event) {
  // Gérer la sélection multiple avec Ctrl/Cmd
  if (event.ctrlKey || event.metaKey) {
    uiStore.setMultiSelectMode(true)
    if (uiStore.selectedDates.find(d => getDateKey(d) === getDateKey(date))) {
      uiStore.removeSelectedDate(date)
    } else {
      uiStore.addSelectedDate(date)
    }
  } else {
    // Clic simple : sélectionner ce jour uniquement
    uiStore.setSelectedDate(date)
    uiStore.clearSelectedDates()
    uiStore.setMultiSelectMode(false)
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

.calendar-header {
  margin-bottom: 20px;
}

.header-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 20px;
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

#currentMonth {
  font-size: 1.6em;
  font-weight: 600;
  min-width: 250px;
  color: var(--text-color, #2c3e50);
  line-height: 1.2;
  text-align: center;
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
</style>

