<template>
  <div
    :class="dayClasses"
    :data-date-key="dateKey"
    @click="handleClick"
    @mousedown="handleMouseDown"
  >
    <span class="day-number">{{ dayNumber }}</span>
    <div v-if="hasLeave" class="leave-badges">
      <span
        v-if="leaveInfo.full"
        class="leave-badge full"
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
          :style="{ backgroundColor: getLeaveColor(leaveInfo.morning) }"
          :title="getLeaveLabel(leaveInfo.morning)"
        >
          {{ getLeaveLabel(leaveInfo.morning) }}
        </span>
        <span
          v-if="leaveInfo.afternoon"
          class="leave-badge afternoon"
          :style="{ backgroundColor: getLeaveColor(leaveInfo.afternoon) }"
          :title="getLeaveLabel(leaveInfo.afternoon)"
        >
          {{ getLeaveLabel(leaveInfo.afternoon) }}
        </span>
      </span>
    </div>
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
  return uiStore.selectedDates.some(d => getDateKey(d) === dateKey.value)
})

const dayClasses = computed(() => {
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

function getLeaveColor(leaveTypeId) {
  const config = getLeaveTypeConfig(leaveTypeId)
  return config?.color || '#cccccc'
}

function getLeaveLabel(leaveTypeId) {
  const config = getLeaveTypeConfig(leaveTypeId)
  return config?.label || leaveTypeId
}

function handleClick(event) {
  emit('click', props.date, event)
}

function handleMouseDown(event) {
  emit('mousedown', props.date, event)
}
</script>

<style scoped>
.calendar-day,
.year-view-day {
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

.calendar-day.weekend,
.year-view-day.weekend {
  background: var(--weekend-bg, #f9f9f9);
}

.calendar-day.public-holiday,
.year-view-day.public-holiday {
  background: var(--holiday-bg, #fff3cd);
}

.calendar-day.selected,
.year-view-day.selected {
  border: 2px solid var(--primary-color, #4a90e2);
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.3);
}

.calendar-day.multi-selected,
.year-view-day.multi-selected {
  background: var(--primary-color, #4a90e2);
  color: white;
}

.day-number {
  font-size: 0.9em;
  font-weight: 500;
}

.leave-badges {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1px;
  margin-top: 2px;
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

.leave-badges-split {
  display: flex;
  flex-direction: column;
  gap: 1px;
  width: 100%;
}

.leave-badge.morning {
  border-top-left-radius: 3px;
  border-top-right-radius: 3px;
}

.leave-badge.afternoon {
  border-bottom-left-radius: 3px;
  border-bottom-right-radius: 3px;
}
</style>

