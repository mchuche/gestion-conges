<template>
  <div
    :class="cellClasses"
    :data-date-key="dateKey"
    @click="handleClick"
    @mousedown="handleMouseDown"
    :title="cellTitle"
  >
    <div
      v-if="hasSplit"
      class="presence-cell-half presence-cell-morning"
      :class="{ 'is-event': isMorningEvent }"
      :style="{ backgroundColor: isMorningEvent && morningColor ? colorWithOpacity(morningColor, uiStore.eventOpacity ?? 0.15) : morningColor }"
    ></div>
    <div
      v-if="hasSplit"
      class="presence-cell-half presence-cell-afternoon"
      :class="{ 'is-event': isAfternoonEvent }"
      :style="{ backgroundColor: isAfternoonEvent && afternoonColor ? colorWithOpacity(afternoonColor, uiStore.eventOpacity ?? 0.15) : afternoonColor }"
    ></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useLeavesStore } from '../../stores/leaves'
import { useLeaveTypesStore } from '../../stores/leaveTypes'
import { useUIStore } from '../../stores/ui'
import { useLeaves } from '../../composables/useLeaves'
import { useAuthStore } from '../../stores/auth'
import { today, isSameDay, isBefore, getDay, getYear } from '../../services/dateUtils'
import { getDateKey } from '../../services/utils'
import { getPublicHolidays } from '../../services/holidays'

const props = defineProps({
  date: {
    type: Date,
    required: true
  },
  user: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['click', 'mousedown'])

const leavesStore = useLeavesStore()
const leaveTypesStore = useLeaveTypesStore()
const uiStore = useUIStore()
const authStore = useAuthStore()
const { getLeaveForDate, getLeaveTypeConfig } = useLeaves()

const dateKey = computed(() => getDateKey(props.date))

// Pour l'utilisateur actuel, utiliser les leaves du store
// Pour d'autres utilisateurs, utiliser user.leaves (pour gestion d'équipe future)
const userLeaves = computed(() => {
  if (props.user && props.user.id !== authStore.user?.id) {
    return props.user.leaves || {}
  }
  return leavesStore.leaves
})

const leaveInfo = computed(() => {
  if (props.user && props.user.id !== authStore.user?.id) {
    const keys = {
      full: dateKey.value,
      morning: `${dateKey.value}-morning`,
      afternoon: `${dateKey.value}-afternoon`
    }
    return {
      full: userLeaves.value[keys.full] || null,
      morning: userLeaves.value[keys.morning] || null,
      afternoon: userLeaves.value[keys.afternoon] || null
    }
  }
  return getLeaveForDate(props.date)
})

const hasLeave = computed(() => {
  return leaveInfo.value.full || leaveInfo.value.morning || leaveInfo.value.afternoon
})

const hasSplit = computed(() => {
  return leaveInfo.value.morning && 
         leaveInfo.value.afternoon && 
         leaveInfo.value.morning !== leaveInfo.value.afternoon
})

const morningColor = computed(() => {
  if (leaveInfo.value.morning) {
    const config = getLeaveTypeConfig(leaveInfo.value.morning)
    return config?.color || '#cccccc'
  }
  return null
})

const afternoonColor = computed(() => {
  if (leaveInfo.value.afternoon) {
    const config = getLeaveTypeConfig(leaveInfo.value.afternoon)
    return config?.color || '#cccccc'
  }
  return null
})

const fullColor = computed(() => {
  if (leaveInfo.value.full) {
    const config = getLeaveTypeConfig(leaveInfo.value.full)
    return config?.color || '#cccccc'
  }
  return null
})

const isEvent = computed(() => {
  if (!hasLeave.value) return false
  const leaveType = leaveInfo.value.full || leaveInfo.value.morning || leaveInfo.value.afternoon
  if (!leaveType) return false
  const config = getLeaveTypeConfig(leaveType)
  return config?.category === 'event'
})

const isMorningEvent = computed(() => {
  if (leaveInfo.value.morning) {
    const config = getLeaveTypeConfig(leaveInfo.value.morning)
    return config?.category === 'event'
  }
  return false
})

const isAfternoonEvent = computed(() => {
  if (leaveInfo.value.afternoon) {
    const config = getLeaveTypeConfig(leaveInfo.value.afternoon)
    return config?.category === 'event'
  }
  return false
})

const isFullEvent = computed(() => {
  if (leaveInfo.value.full) {
    const config = getLeaveTypeConfig(leaveInfo.value.full)
    return config?.category === 'event'
  }
  return false
})

const isToday = computed(() => isSameDay(props.date, today()))
const isPast = computed(() => isBefore(props.date, today()))
const isWeekend = computed(() => {
  const dayOfWeek = getDay(props.date)
  return dayOfWeek === 0 || dayOfWeek === 6
})

const isHoliday = computed(() => {
  const year = getYear(props.date)
  const holidays = getPublicHolidays(uiStore.selectedCountry, year)
  return holidays[dateKey.value] !== undefined
})

const isInMultiSelect = computed(() => {
  if (!uiStore.selectedDates || uiStore.selectedDates.length === 0) {
    return false
  }
  const currentKey = dateKey.value
  const isSelected = uiStore.selectedDates.some(d => {
    try {
      return getDateKey(d) === currentKey
    } catch (e) {
      return false
    }
  })
  return isSelected
})

// Computed properties pour obtenir les couleurs selon l'intensité (vue présence)
const weekendOpacity = computed(() => {
  const intensity = uiStore.holidayWeekendIntensity || 'normal'
  const opacities = {
    light: 0.4,
    normal: 0.6,
    strong: 0.8
  }
  return opacities[intensity] || opacities.normal
})

const holidayBorderColor = computed(() => {
  const intensity = uiStore.holidayWeekendIntensity || 'normal'
  const colors = {
    light: '#ffc107',
    normal: '#ffc107',
    strong: '#ff9800'
  }
  return colors[intensity] || colors.normal
})

const holidayBorderWidth = computed(() => {
  const intensity = uiStore.holidayWeekendIntensity || 'normal'
  const widths = {
    light: '1px',
    normal: '2px',
    strong: '3px'
  }
  return widths[intensity] || widths.normal
})

const cellClasses = computed(() => {
  const classes = ['year-presence-day-cell']
  
  if (isToday.value) classes.push('today')
  if (isPast.value) classes.push('past-day')
  if (isWeekend.value) classes.push('weekend')
  if (isHoliday.value) classes.push('public-holiday')
  if (hasLeave.value) classes.push('has-leave')
  if (hasSplit.value) classes.push('has-split')
  if (!hasLeave.value && !isWeekend.value && !isHoliday.value) classes.push('present')
  if (isInMultiSelect.value) classes.push('multi-selected')
  if (isEvent.value) classes.push('is-event')
  
  return classes
})

const cellTitle = computed(() => {
  const userName = props.user?.name || authStore.user?.name || 'Moi'
  
  if (hasSplit.value) {
    const morningConfig = getLeaveTypeConfig(leaveInfo.value.morning)
    const afternoonConfig = getLeaveTypeConfig(leaveInfo.value.afternoon)
    return `${userName} - Matin: ${morningConfig?.name || ''}, Après-midi: ${afternoonConfig?.name || ''}`
  } else if (hasLeave.value) {
    const leaveType = leaveInfo.value.full || leaveInfo.value.morning || leaveInfo.value.afternoon
    const config = getLeaveTypeConfig(leaveType)
    return `${userName} - ${config?.name || ''}`
  } else {
    return `${userName} - Présent`
  }
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

const cellStyle = computed(() => {
  const style = {}
  
  if (hasSplit.value) {
    style.position = 'relative'
    style.overflow = 'hidden'
    style.background = 'transparent'
  } else if (fullColor.value) {
    if (isFullEvent.value) {
      const opacity = uiStore.eventOpacity ?? 0.15
      style.backgroundColor = colorWithOpacity(fullColor.value, opacity)
      style.color = 'white'
    } else {
      style.backgroundColor = fullColor.value
      style.color = 'white'
    }
  } else if (morningColor.value && !leaveInfo.value.afternoon) {
    if (isMorningEvent.value) {
      const opacity = uiStore.eventOpacity ?? 0.15
      style.backgroundColor = colorWithOpacity(morningColor.value, opacity)
      style.color = 'white'
    } else {
      style.backgroundColor = morningColor.value
      style.color = 'white'
    }
    style.borderTopWidth = '3px'
    style.borderTopColor = 'white'
  } else if (afternoonColor.value && !leaveInfo.value.morning) {
    if (isAfternoonEvent.value) {
      const opacity = uiStore.eventOpacity ?? 0.15
      style.backgroundColor = colorWithOpacity(afternoonColor.value, opacity)
      style.color = 'white'
    } else {
      style.backgroundColor = afternoonColor.value
      style.color = 'white'
    }
    style.borderBottomWidth = '3px'
    style.borderBottomColor = 'white'
  }
  
  return style
})

function handleClick(event) {
  // Seulement pour l'utilisateur actuel
  if (props.user && props.user.id !== authStore.user?.id) {
    return
  }
  emit('click', props.date, event)
}

function handleMouseDown(event) {
  // Seulement pour l'utilisateur actuel
  if (props.user && props.user.id !== authStore.user?.id) {
    return
  }
  emit('mousedown', props.date, event)
}
</script>

<style scoped>
.year-presence-day-cell {
  aspect-ratio: 1;
  min-width: 20px;
  min-height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-color);
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--bg-color);
  position: relative;
}

.year-presence-day-cell:hover {
  transform: scale(1.2);
  z-index: 5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.year-presence-day-cell.today {
  border: 2px solid var(--primary-color);
  background: rgba(74, 144, 226, 0.08);
}

.year-presence-day-cell.past-day {
  opacity: 0.7;
}

/* Weekends - Vue présence */
.year-presence-day-cell.weekend {
  background: var(--bg-color);
  opacity: v-bind('weekendOpacity');
}

/* Jours fériés - Vue présence */
.year-presence-day-cell.public-holiday {
  border-color: v-bind('holidayBorderColor');
  border-width: v-bind('holidayBorderWidth');
}

.year-presence-day-cell.present {
  background: #4caf50;
  border-color: #4caf50;
}

.year-presence-day-cell.has-leave {
  border-width: 2px;
}

.year-presence-day-cell.has-split {
  background: transparent !important;
}

.presence-cell-half {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.presence-cell-morning {
  clip-path: polygon(0 0, 100% 0, 0 100%);
}

.presence-cell-afternoon {
  clip-path: polygon(100% 0, 100% 100%, 0 100%);
}

.year-presence-day-cell.multi-selected {
  border: 3px solid var(--primary-color, #4a90e2) !important;
  box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.3) !important;
  z-index: 10 !important;
  position: relative;
  background: rgba(74, 144, 226, 0.2) !important;
}

/* Assurer que la sélection multiple reste visible même avec des couleurs de congé */
.year-presence-day-cell.multi-selected .presence-cell-half {
  opacity: 0.6 !important;
  mix-blend-mode: multiply;
}

/* Assurer que la sélection est visible même sur les cellules avec présence */
.year-presence-day-cell.multi-selected.present {
  background: rgba(74, 144, 226, 0.3) !important;
  border-color: var(--primary-color, #4a90e2) !important;
}

/* Liseré pour différencier les événements des congés - plus discret */
.year-presence-day-cell.is-event {
  border: 1px solid rgba(0, 0, 0, 0.2);
  box-shadow: inset 0 0 0 0.5px rgba(255, 255, 255, 0.3);
}

/* L'opacité des couleurs d'événements dans les demi-journées est gérée par le style inline */
</style>





