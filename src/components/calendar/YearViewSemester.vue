<template>
  <div class="year-calendar-view">
    <div
      v-for="month in months"
      :key="month.index"
      class="year-month-card"
    >
      <div class="year-month-card-header">
        {{ month.name }}
      </div>
      <div class="year-week-header">
        <div
          v-for="dayName in dayNames"
          :key="dayName"
          class="year-week-day"
        >
          {{ dayName }}
        </div>
      </div>
      <div class="year-days-grid">
        <div
          v-for="emptyDay in month.emptyDays"
          :key="`empty-${emptyDay}`"
          class="year-day-empty"
        ></div>
        <CalendarDay
          v-for="day in month.days"
          :key="getDateKey(day)"
          :date="day"
          :compact="true"
          @click="handleDayClick"
          @mousedown="handleDayMouseDown"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useUIStore } from '../../stores/ui'
import CalendarDay from './CalendarDay.vue'
import {
  getYear,
  getMonth,
  getDay,
  getDaysInMonth,
  createDate,
  getDateKey
} from '../../services/dateUtils'

const uiStore = useUIStore()

const dayNames = ['D', 'L', 'M', 'M', 'J', 'V', 'S']
const monthNames = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

const currentYear = computed(() => getYear(uiStore.currentDate))

const months = computed(() => {
  const year = currentYear.value
  const result = []

  for (let month = 0; month < 12; month++) {
    const firstDay = createDate(year, month, 1)
    const daysInMonth = getDaysInMonth(firstDay)
    const startingDayOfWeek = getDay(firstDay) // 0 = Dimanche

    const days = []
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(createDate(year, month, day))
    }

    result.push({
      index: month,
      name: monthNames[month],
      days,
      emptyDays: Array(startingDayOfWeek).fill(null)
    })
  }

  return result
})

function handleDayClick(date, event) {
  // Gérer le clic sur un jour
  // Cette logique sera gérée par le composant parent
  emit('day-click', date, event)
}

function handleDayMouseDown(date, event) {
  // Gérer le mousedown pour la sélection multiple
  emit('day-mousedown', date, event)
}

const emit = defineEmits(['day-click', 'day-mousedown'])
</script>

<style scoped>
.year-calendar-view {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(4, 1fr);
  gap: 15px;
  aspect-ratio: 16/10;
  max-width: 100%;
  padding: 10px;
  background: var(--bg-color, #f5f5f5);
  min-height: 600px;
}

.year-month-card {
  background: var(--card-bg, white);
  border: 2px solid var(--border-color, #e0e0e0);
  border-radius: 8px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  min-height: 0;
}

.year-month-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.year-month-card-header {
  background: var(--primary-color, #4a90e2);
  color: white;
  padding: 6px;
  text-align: center;
  font-weight: 600;
  font-size: 0.85em;
  border-radius: 4px;
  margin-bottom: 6px;
}

.year-week-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin-bottom: 4px;
}

.year-week-day {
  text-align: center;
  font-size: 0.7em;
  font-weight: 600;
  color: var(--text-color, #2c3e50);
  padding: 2px;
  opacity: 0.7;
}

.year-days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  flex: 1;
}

.year-day-empty {
  /* Cellules vides pour aligner le premier jour */
  background: transparent;
}
</style>

