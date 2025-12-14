<template>
  <div
    :class="dayClasses"
    :data-date-key="dateKey"
    @click="handleClick"
    @mousedown="handleMouseDown"
  >
    <template v-if="list">
      <span class="day-date">{{ dayNumber }}</span>
      <span class="day-letter">{{ dayLetter }}</span>
      <div v-if="hasLeave" class="leave-badges">
        <span
          v-if="leaveInfo.full"
          class="leave-badge full"
          :class="{ 'is-event': isEventCategory(leaveInfo.full) }"
          :style="{ backgroundColor: getLeaveColor(leaveInfo.full) }"
          :title="getLeaveLabel(leaveInfo.full)"
        >
          {{ getLeaveLabel(leaveInfo.full) }}
        </span>
        <span
          v-else
          class="leave-badges-split"
        >
          <span
            v-if="leaveInfo.morning"
            class="leave-badge morning"
            :class="{ 'is-event': isEventCategory(leaveInfo.morning) }"
            :style="{ backgroundColor: getLeaveColor(leaveInfo.morning) }"
            :title="getLeaveLabel(leaveInfo.morning)"
          >
            {{ getLeaveLabel(leaveInfo.morning) }}
          </span>
          <span
            v-if="leaveInfo.afternoon"
            class="leave-badge afternoon"
            :class="{ 'is-event': isEventCategory(leaveInfo.afternoon) }"
            :style="{ backgroundColor: getLeaveColor(leaveInfo.afternoon) }"
            :title="getLeaveLabel(leaveInfo.afternoon)"
          >
            {{ getLeaveLabel(leaveInfo.afternoon) }}
          </span>
        </span>
      </div>
    </template>
    <template v-else>
      <span class="day-number">{{ dayNumber }}</span>
      <div v-if="hasLeave" class="leave-badges">
      <span
        v-if="leaveInfo.full"
        class="leave-badge full"
        :class="{ 'is-event': isEventCategory(leaveInfo.full) }"
        :style="{ backgroundColor: getLeaveColor(leaveInfo.full) }"
        :title="getLeaveLabel(leaveInfo.full)"
      >
        {{ getLeaveLabel(leaveInfo.full) }}
      </span>
      <span
        v-else
        class="leave-badges-split"
      >
        <span
          v-if="leaveInfo.morning"
          class="leave-badge morning"
          :class="{ 'is-event': isEventCategory(leaveInfo.morning) }"
          :style="{ backgroundColor: getLeaveColor(leaveInfo.morning) }"
          :title="getLeaveLabel(leaveInfo.morning)"
        >
          {{ getLeaveLabel(leaveInfo.morning) }}
        </span>
        <span
          v-if="leaveInfo.afternoon"
          class="leave-badge afternoon"
          :class="{ 'is-event': isEventCategory(leaveInfo.afternoon) }"
          :style="{ backgroundColor: getLeaveColor(leaveInfo.afternoon) }"
          :title="getLeaveLabel(leaveInfo.afternoon)"
        >
          {{ getLeaveLabel(leaveInfo.afternoon) }}
        </span>
      </span>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useLeavesStore } from '../../stores/leaves'
import { useLeaveTypesStore } from '../../stores/leaveTypes'
import { useUIStore } from '../../stores/ui'
import { useLeaves } from '../../composables/useLeaves'
import { today, isSameDay, isBefore, getDay } from '../../services/dateUtils'
import { getDateKey } from '../../services/utils'
import { getPublicHolidays } from '../../services/holidays'

const props = defineProps({
  date: {
    type: Date,
    required: true
  },
  compact: {
    type: Boolean,
    default: false
  },
  list: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click', 'mousedown'])

const leavesStore = useLeavesStore()
const leaveTypesStore = useLeaveTypesStore()
const uiStore = useUIStore()
const { getLeaveForDate, getLeaveTypeConfig } = useLeaves()

const dateKey = computed(() => getDateKey(props.date))
const dayNumber = computed(() => props.date.getDate())

const leaveInfo = computed(() => getLeaveForDate(props.date))
const hasLeave = computed(() => {
  return leaveInfo.value.full || leaveInfo.value.morning || leaveInfo.value.afternoon
})

const isToday = computed(() => isSameDay(props.date, today()))
const isPast = computed(() => isBefore(props.date, today()))
const isWeekend = computed(() => {
  const dayOfWeek = getDay(props.date)
  return dayOfWeek === 0 || dayOfWeek === 6
})

const isHoliday = computed(() => {
  const year = props.date.getFullYear()
  const holidays = getPublicHolidays(uiStore.selectedCountry, year)
  return holidays[dateKey.value] !== undefined
})

const isSelected = computed(() => {
  if (!uiStore.selectedDate) return false
  return getDateKey(props.date) === getDateKey(uiStore.selectedDate)
})

const isInMultiSelect = computed(() => {
  if (!uiStore.selectedDates || uiStore.selectedDates.length === 0) {
    return false
  }
  const currentKey = dateKey.value
  return uiStore.selectedDates.some(d => {
    try {
      return getDateKey(d) === currentKey
    } catch (e) {
      return false
    }
  })
})

const dayLetter = computed(() => {
  const dayOfWeek = getDay(props.date)
  // Utiliser la lettre du jour selon la préférence de début de semaine
  // Pour la vue liste, on garde la lettre du jour réel (pas ajustée)
  const letters = ['D', 'L', 'M', 'M', 'J', 'V', 'S']
  return letters[dayOfWeek]
})

// Computed properties pour obtenir les couleurs selon l'intensité (mode clair)
const weekendColor = computed(() => {
  const intensity = uiStore.holidayWeekendIntensity || 'normal'
  const colors = {
    light: '#f5f5f5',
    normal: '#f9f9f9',
    strong: '#e8e8e8'
  }
  return colors[intensity] || colors.normal
})

const holidayColor = computed(() => {
  const intensity = uiStore.holidayWeekendIntensity || 'normal'
  const colors = {
    light: '#fffef0',
    normal: '#fff3cd',
    strong: '#ffd54f'
  }
  return colors[intensity] || colors.normal
})

// Computed properties pour obtenir les couleurs selon l'intensité (mode sombre)
const weekendColorDark = computed(() => {
  const intensity = uiStore.holidayWeekendIntensity || 'normal'
  const colors = {
    light: 'rgba(255, 255, 255, 0.01)',
    normal: 'rgba(255, 255, 255, 0.03)',
    strong: 'rgba(255, 255, 255, 0.06)'
  }
  return colors[intensity] || colors.normal
})

const holidayColorDark = computed(() => {
  const intensity = uiStore.holidayWeekendIntensity || 'normal'
  const colors = {
    light: 'rgba(255, 193, 7, 0.03)',
    normal: 'rgba(255, 193, 7, 0.08)',
    strong: 'rgba(255, 193, 7, 0.15)'
  }
  return colors[intensity] || colors.normal
})

const dayClasses = computed(() => {
  if (props.list) {
    return [
      'calendar-day-list',
      {
        'today': isToday.value,
        'past-day': isPast.value,
        'future-day': !isPast.value && !isToday.value,
        'weekend': isWeekend.value,
        'public-holiday': isHoliday.value,
        'has-leave': hasLeave.value,
        'selected': isSelected.value,
        'multi-selected': isInMultiSelect.value
      }
    ]
  }
  return [
    props.compact ? 'year-view-day' : 'calendar-day',
    {
      'today': isToday.value,
      'past-day': isPast.value,
      'future-day': !isPast.value && !isToday.value,
      'weekend': isWeekend.value,
      'public-holiday': isHoliday.value,
      'has-leave': hasLeave.value,
      'selected': isSelected.value,
      'multi-selected': isInMultiSelect.value
    }
  ]
})

// Fonction pour convertir une couleur hex en rgba avec opacité
function colorWithOpacity(color, opacity = 0.3) {
  if (!color) return color
  if (color.startsWith('#')) {
    const hex = color.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  } else if (color.startsWith('rgba')) {
    return color.replace(/[\d.]+\)$/g, `${opacity})`)
  } else if (color.startsWith('rgb')) {
    return color.replace('rgb(', 'rgba(').replace(')', `, ${opacity})`)
  }
  return color
}

function getLeaveColor(leaveTypeId) {
  const config = getLeaveTypeConfig(leaveTypeId)
  const color = config?.color || '#cccccc'
  // Si c'est un événement, utiliser l'opacité configurée par l'utilisateur
  if (isEventCategory(leaveTypeId)) {
    const opacity = uiStore.eventOpacity ?? 0.15
    return colorWithOpacity(color, opacity)
  }
  return color
}

function getLeaveLabel(leaveTypeId) {
  const config = getLeaveTypeConfig(leaveTypeId)
  return config?.label || leaveTypeId
}

function isEventCategory(leaveTypeId) {
  const config = getLeaveTypeConfig(leaveTypeId)
  return config?.category === 'event'
}

function handleClick(event) {
  // Vérifier si Ctrl/Cmd est pressé dans l'événement ou dans le store
  const ctrlKey = (event && (event.ctrlKey || event.metaKey)) || uiStore.ctrlKeyPressed
  
  // Si Ctrl est pressé, ne pas émettre le click (le mousedown gère la sélection)
  if (ctrlKey) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault()
    }
    return
  }
  
  // Comportement normal : émettre le click pour ouvrir la modale
  // Arrêter la propagation de l'événement DOM natif
  if (event && typeof event.stopPropagation === 'function') {
    event.stopPropagation()
  }
  emit('click', props.date, event)
}

function handleMouseDown(event) {
  // S'assurer que nous avons bien l'événement DOM natif
  // L'événement passé par Vue devrait être l'événement DOM natif
  const nativeEvent = event || window.event
  
  // Arrêter la propagation de l'événement DOM natif
  if (nativeEvent && typeof nativeEvent.stopPropagation === 'function') {
    nativeEvent.stopPropagation()
  }
  
  // Émettre l'événement avec l'événement DOM natif pour préserver ctrlKey/metaKey
  // Note: Vue passe automatiquement l'événement DOM natif dans les handlers
  emit('mousedown', props.date, nativeEvent)
}
</script>

<style scoped>
.calendar-day {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.75em;
  transition: all 0.2s ease;
  background: var(--card-bg, white);
  color: var(--text-color, #2c3e50);
  position: relative;
  min-height: 24px;
  padding: 2px;
}

.year-view-day {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 3px;
  cursor: pointer;
  font-size: clamp(0.6em, 1vw, 0.75em);
  transition: all 0.2s ease;
  background: var(--card-bg, white);
  color: var(--text-color, #2c3e50);
  position: relative;
  padding: 2px;
  overflow: hidden;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
}

.calendar-day:hover,
.year-view-day:hover {
  background: var(--hover-color, #f5f5f5);
  transform: scale(1.1);
  z-index: 5;
}

.calendar-day.today,
.year-view-day.today {
  border: 2px solid var(--primary-color, #4a90e2);
  font-weight: bold;
}

.calendar-day.past-day,
.year-view-day.past-day {
  opacity: 0.6;
}

/* Weekends - Mode clair */
.calendar-day.weekend,
.year-view-day.weekend {
  background: v-bind('weekendColor');
}

/* Jours fériés - Mode clair */
.calendar-day.public-holiday,
.year-view-day.public-holiday {
  background: v-bind('holidayColor');
}

/* Weekends - Mode sombre */
[data-theme="dark"] .calendar-day.weekend,
[data-theme="dark"] .year-view-day.weekend {
  background: v-bind('weekendColorDark');
}

/* Jours fériés - Mode sombre */
[data-theme="dark"] .calendar-day.public-holiday,
[data-theme="dark"] .year-view-day.public-holiday {
  background: v-bind('holidayColorDark');
}

.calendar-day.selected,
.year-view-day.selected {
  border: 2px solid var(--primary-color, #4a90e2);
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.3);
}

.calendar-day.multi-selected,
.year-view-day.multi-selected {
  background: var(--primary-color, #4a90e2) !important;
  color: white !important;
}

/* S'assurer que la sélection est visible même avec d'autres classes */
.year-view-day.multi-selected.weekend,
.year-view-day.multi-selected.public-holiday,
.year-view-day.multi-selected.has-leave,
.year-view-day.multi-selected.past-day {
  background: var(--primary-color, #4a90e2) !important;
  color: white !important;
  opacity: 1 !important;
}

.day-number {
  font-size: 0.9em;
  font-weight: 500;
}

.year-view-day .day-number {
  font-size: 0.7em;
  line-height: 1.1;
  padding: 0 2px;
  text-align: center;
  flex-shrink: 0;
  height: auto;
}

.leave-badges {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1px;
  margin-top: 2px;
  flex: 1;
  min-height: 0;
}

.year-view-day .leave-badges {
  margin-top: 0;
  gap: 0;
  overflow: hidden;
}

.leave-badge {
  font-size: 0.65em;
  padding: 1px 3px;
  border-radius: 2px;
  color: white;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
}

.year-view-day .leave-badge {
  font-size: 0.55em;
  padding: 0 2px;
  line-height: 1.2;
  min-height: 0;
  flex: 1;
}

/* Les badges dans leave-badges-split ont leur propre gestion de flex */
.year-view-day .leave-badges-split .leave-badge {
  flex: 0 0 50%; /* Par défaut 50% de la hauteur */
  max-height: 50%;
}

.leave-badges-split {
  display: flex;
  flex-direction: column;
  gap: 1px;
  width: 100%;
  flex: 1;
  min-height: 0;
}

.year-view-day .leave-badges-split {
  gap: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between; /* Espace les demi-journées : matin en haut, après-midi en bas */
}

/* Aligner le matin seul en haut */
.year-view-day .leave-badges-split .leave-badge.morning:only-child {
  margin-bottom: auto;
  flex: 0 0 50%; /* Prend 50% de la hauteur */
  max-height: 50%;
}

/* Aligner l'après-midi seul en bas */
.year-view-day .leave-badges-split .leave-badge.afternoon:only-child {
  margin-top: auto;
  flex: 0 0 50%; /* Prend 50% de la hauteur */
  max-height: 50%;
}

/* Quand on a les deux, chacun prend 50% */
.year-view-day .leave-badges-split .leave-badge.morning:not(:only-child),
.year-view-day .leave-badges-split .leave-badge.afternoon:not(:only-child) {
  flex: 0 0 50%;
  max-height: 50%;
}

.leave-badge.morning {
  border-top-left-radius: 3px;
  border-top-right-radius: 3px;
}

.leave-badge.afternoon {
  border-bottom-left-radius: 3px;
  border-bottom-right-radius: 3px;
}

/* Liseré pour différencier les événements des congés - plus discret */
.leave-badge.is-event {
  border: 1px solid rgba(0, 0, 0, 0.2);
  box-shadow: inset 0 0 0 0.5px rgba(255, 255, 255, 0.3);
}

/* Assurer que les demi-journées dans le mode liste prennent 50% de la largeur */
.calendar-day-list .leave-badges-split .leave-badge.morning,
.calendar-day-list .leave-badges-split .leave-badge.afternoon {
  flex: 0 0 calc(50% - 1px);
  max-width: calc(50% - 1px);
}

/* Styles pour le mode liste */
.calendar-day-list {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 2px;
  padding: 4px 8px 4px 4px;
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.85em;
  transition: all 0.2s ease;
  background: var(--card-bg, white);
  color: var(--text-color, #2c3e50);
  min-height: 28px;
  height: 28px;
}

.calendar-day-list:hover {
  background: var(--hover-color, #f5f5f5);
  border-color: var(--primary-color, #4a90e2);
}

.calendar-day-list.today {
  border: 2px solid var(--primary-color, #4a90e2);
  font-weight: bold;
  background: #e3f2fd;
}

.calendar-day-list.past-day {
  opacity: 0.6;
}

/* Weekends - Vue liste - Mode clair */
.calendar-day-list.weekend {
  background: v-bind('weekendColor');
}

/* Jours fériés - Vue liste - Mode clair */
.calendar-day-list.public-holiday {
  background: v-bind('holidayColor');
}

/* Weekends - Vue liste - Mode sombre */
[data-theme="dark"] .calendar-day-list.weekend {
  background: v-bind('weekendColorDark');
}

/* Jours fériés - Vue liste - Mode sombre */
[data-theme="dark"] .calendar-day-list.public-holiday {
  background: v-bind('holidayColorDark');
}

.calendar-day-list.selected {
  border: 2px solid var(--primary-color, #4a90e2);
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.3);
}

.calendar-day-list.multi-selected {
  background: var(--primary-color, #4a90e2);
  color: white;
}

.day-date {
  font-weight: 400;
  min-width: 20px;
  text-align: left;
  color: var(--text-color, #2c3e50);
  opacity: 0.6;
  font-size: 0.85em;
}

.day-letter {
  font-weight: 400;
  color: var(--text-color, #2c3e50);
  opacity: 0.5;
  min-width: 16px;
  text-align: center;
  font-size: 0.75em;
  padding: 0;
  margin: 0 8px 0 0;
}

.calendar-day-list .leave-badges {
  display: flex;
  flex-direction: row;
  gap: 4px;
  margin-top: 0;
  flex: 1;
}

.calendar-day-list .leave-badge {
  font-size: 0.7em;
  padding: 2px 6px;
  border-radius: 3px;
  white-space: nowrap;
}

.calendar-day-list .leave-badges-split {
  display: flex;
  flex-direction: row;
  gap: 2px;
  width: 100%;
  justify-content: space-between; /* Espace les demi-journées : matin à gauche, après-midi à droite */
}

.calendar-day-list .leave-badges-split .leave-badge {
  flex: 0 0 calc(50% - 1px); /* Prend 50% de la largeur moins la moitié du gap */
  max-width: calc(50% - 1px);
}

/* Aligner le matin seul à gauche */
.calendar-day-list .leave-badges-split .leave-badge.morning:only-child {
  margin-right: auto;
}

/* Aligner l'après-midi seul à droite */
.calendar-day-list .leave-badges-split .leave-badge.afternoon:only-child {
  margin-left: auto;
}
</style>

