<template>
  <div class="year-columns-view">
    <div
      v-for="month in months"
      :key="month.index"
      class="year-month-column"
    >
      <div class="year-month-column-header">
        {{ month.name }}
      </div>
      <div class="year-days-list">
        <CalendarDay
          v-for="day in month.days"
          :key="getDateKey(day)"
          :date="day"
          :compact="false"
          :list="true"
          class="year-day-row"
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

    const days = []
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(createDate(year, month, day))
    }

    result.push({
      index: month,
      name: monthNames[month],
      days
    })
  }

  return result
})

function handleDayClick(date, event) {
  emit('day-click', date, event)
}

function handleDayMouseDown(date, event) {
  emit('day-mousedown', date, event)
}

const emit = defineEmits(['day-click', 'day-mousedown'])
</script>

<style scoped>
.year-columns-view {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  max-width: 100%;
  padding: 15px;
  background: var(--bg-color, #f5f5f5);
  min-height: calc(100vh - 300px);
  width: 100%;
  box-sizing: border-box;
  position: relative;
  z-index: 1; /* Assure que la vue colonne reste en arrière-plan */
}

.year-month-column {
  background: var(--card-bg, white);
  border: 2px solid var(--border-color, #e0e0e0);
  border-radius: 8px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  min-height: 200px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  min-width: 0;
  max-width: 100%;
  position: relative;
  z-index: 0; /* Assure que les colonnes restent en arrière-plan */
}

.year-month-column:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.year-month-column-header {
  background: var(--primary-color, #4a90e2);
  color: white;
  padding: 8px;
  text-align: center;
  font-weight: 600;
  font-size: 0.9em;
  border-radius: 4px;
  margin-bottom: 8px;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 1; /* Réduit pour éviter les conflits avec la modale (z-index: 1000) */
}

.year-days-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  overflow-y: auto;
}

.year-day-row {
  width: 100%;
}

/* Responsive - Utiliser des nombres de colonnes qui divisent 12 pour équilibrer les lignes */
@media (min-width: 1800px) {
  .year-columns-view {
    grid-template-columns: repeat(12, 1fr);
  }
}

@media (max-width: 1200px) {
  .year-columns-view {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 900px) {
  .year-columns-view {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 600px) {
  .year-columns-view {
    grid-template-columns: repeat(2, 1fr);
    padding: 10px;
    gap: 6px;
  }

  .year-month-column {
    padding: 6px;
  }

  .year-month-column-header {
    font-size: 0.7em;
    padding: 3px 6px;
  }

  .year-week-day {
    font-size: 0.6em;
    padding: 1px;
  }

  .year-days-grid {
    gap: 1px;
  }
}
</style>

