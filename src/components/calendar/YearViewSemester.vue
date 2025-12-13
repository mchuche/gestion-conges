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
  createDate
} from '../../services/dateUtils'
import { getDateKey } from '../../services/utils'

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
  max-width: 100%;
  padding: 15px;
  background: var(--bg-color, #f5f5f5);
  min-height: 600px;
  width: 100%;
  box-sizing: border-box;
}

.year-month-card {
  background: var(--card-bg, white);
  border: 2px solid var(--border-color, #e0e0e0);
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  min-height: 0;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.year-month-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.year-month-card-header {
  background: var(--primary-color, #4a90e2);
  color: white;
  padding: 8px;
  text-align: center;
  font-weight: 600;
  font-size: 0.9em;
  border-radius: 4px;
  margin-bottom: 8px;
  flex-shrink: 0;
}

.year-week-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin-bottom: 6px;
  flex-shrink: 0;
}

.year-week-day {
  text-align: center;
  font-size: 0.75em;
  font-weight: 600;
  color: var(--text-color, #2c3e50);
  padding: 4px 2px;
  opacity: 0.8;
}

.year-days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 3px;
  flex: 1;
  min-height: 0;
  align-content: start;
}

.year-day-empty {
  /* Cellules vides pour aligner le premier jour */
  background: transparent;
  aspect-ratio: 1;
}

/* Responsive */
@media (max-width: 1400px) {
  .year-calendar-view {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(6, 1fr);
  }
}

@media (max-width: 900px) {
  .year-calendar-view {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
    gap: 10px;
  }

  .year-month-card {
    min-height: 200px;
  }
}

@media (max-width: 600px) {
  .year-calendar-view {
    padding: 10px;
    gap: 8px;
  }

  .year-month-card {
    padding: 8px;
  }

  .year-month-card-header {
    font-size: 0.85em;
    padding: 6px;
  }

  .year-week-day {
    font-size: 0.7em;
    padding: 2px;
  }

  .year-days-grid {
    gap: 2px;
  }
}
</style>

