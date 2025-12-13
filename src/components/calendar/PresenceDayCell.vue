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
      :style="{ backgroundColor: morningColor }"
    ></div>
    <div
      v-if="hasSplit"
      class="presence-cell-half presence-cell-afternoon"
      :style="{ backgroundColor: afternoonColor }"
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

const cellClasses = computed(() => {
  const classes = ['year-presence-day-cell']
  
  if (isToday.value) classes.push('today')
  if (isPast.value) classes.push('past-day')
  if (isWeekend.value) classes.push('weekend')
  if (isHoliday.value) classes.push('public-holiday')
  if (hasLeave.value) classes.push('has-leave')
  if (hasSplit.value) classes.push('has-split')
  if (!hasLeave.value && !isWeekend.value && !isHoliday.value) classes.push('present')
  
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

const cellStyle = computed(() => {
  const style = {}
  
  if (hasSplit.value) {
    style.position = 'relative'
    style.overflow = 'hidden'
    style.background = 'transparent'
  } else if (fullColor.value) {
    style.backgroundColor = fullColor.value
    style.color = 'white'
  } else if (morningColor.value && !leaveInfo.value.afternoon) {
    style.backgroundColor = morningColor.value
    style.color = 'white'
    style.borderTopWidth = '3px'
    style.borderTopColor = 'white'
  } else if (afternoonColor.value && !leaveInfo.value.morning) {
    style.backgroundColor = afternoonColor.value
    style.color = 'white'
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
  box-shadow: 0 0 0 2px var(--primary-color);
}

.year-presence-day-cell.past-day {
  opacity: 0.7;
}

.year-presence-day-cell.weekend {
  background: var(--bg-color);
  opacity: 0.6;
}

.year-presence-day-cell.public-holiday {
  border-color: #ffc107;
  border-width: 2px;
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
</style>

