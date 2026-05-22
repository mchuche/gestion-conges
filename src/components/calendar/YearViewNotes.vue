<template>
  <div class="year-notes-view">
    <div
      v-for="month in months"
      :key="month.index"
      class="year-notes-month-column"
    >
      <div class="year-notes-month-header">{{ month.name }}</div>

      <div class="year-notes-days-list">
        <button
          v-for="day in month.days"
          :key="day.dateKey"
          type="button"
          class="year-notes-day-row"
          :class="rowClasses(day)"
          :title="rowTitle(day)"
          @click="emit('day-click', day.date, $event)"
        >
          <span
            class="notes-cell notes-cell-date"
            :class="{ 'school-holiday-day-number': day.isSchoolHoliday }"
          >{{ day.dayNumber }}</span>
          <span class="notes-cell notes-cell-letter">{{ day.dayLetter }}</span>
          <span
            class="notes-cell notes-cell-text"
            :class="{ 'has-leave-bg': day.hasLeaveBg }"
            :style="day.leaveNoteStyle"
          >
            <span v-if="day.noteText" class="note-text">{{ day.noteText }}</span>
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useUIStore } from '../../stores/ui'
import { useDayNotesStore } from '../../stores/dayNotes'
import { useLeavesStore } from '../../stores/leaves'
import { useLeaveTypesStore } from '../../stores/leaveTypes'
import { getLeaveBadgeBackground } from '../../services/leaveBadgeColor'
import {
  getYear,
  getDaysInMonth,
  createDate,
  getDay,
  today,
  isSameDay,
  isBefore,
} from '../../services/dateUtils'
import { getDateKey } from '../../services/utils'
import { getPublicHolidays } from '../../services/holidays'
import { getSchoolHolidayForDate } from '../../services/school-holidays'

const uiStore = useUIStore()
const dayNotesStore = useDayNotesStore()
const leavesStore = useLeavesStore()
const leaveTypesStore = useLeaveTypesStore()

const emit = defineEmits(['day-click'])

const monthNames = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

const dayLetters = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

const currentYear = computed(() => getYear(uiStore.currentDate))

const months = computed(() => {
  // Réactivité : recalcul quand les congés ou types changent
  const leavesMap = leavesStore.leaves
  const eventOpacity = uiStore.eventOpacity ?? 0.15

  const year = currentYear.value
  const country = uiStore.selectedCountry || 'FR'
  const result = []

  for (let month = 0; month < 12; month++) {
    const firstDay = createDate(year, month, 1)
    const daysInMonth = getDaysInMonth(firstDay)
    const holidays = getPublicHolidays(country, year)
    const days = []

    for (let d = 1; d <= daysInMonth; d++) {
      const date = createDate(year, month, d)
      const dateKey = getDateKey(date)

      let schoolHoliday = null
      if (uiStore.showSchoolHolidays && uiStore.schoolHolidayZone) {
        schoolHoliday = getSchoolHolidayForDate(uiStore.schoolHolidayZone, dateKey)
      }

      const leaveNoteStyle = buildLeaveNoteStyle(dateKey, leavesMap, eventOpacity)

      days.push({
        date,
        dateKey,
        dayNumber: d,
        dayLetter: dayLetters[getDay(date)],
        noteText: dayNotesStore.getNote(dateKey),
        leaveNoteStyle,
        hasLeaveBg: Boolean(leaveNoteStyle.backgroundColor),
        isWeekend: getDay(date) === 0 || getDay(date) === 6,
        isHoliday: holidays[dateKey] !== undefined,
        holidayName: holidays[dateKey],
        isSchoolHoliday: !!schoolHoliday,
        schoolHolidayName: schoolHoliday?.name,
        isToday: isSameDay(date, today()),
        isPast: isBefore(date, today()),
      })
    }

    result.push({ index: month, name: monthNames[month], days })
  }

  return result
})

function rowClasses(day) {
  return {
    'is-weekend': day.isWeekend,
    'is-holiday': day.isHoliday,
    'has-note': !!day.noteText,
    'has-leave-bg': day.hasLeaveBg,
    'is-today': day.isToday,
    'is-past': day.isPast,
  }
}

/** Type de congé posé ce jour (journée entière ou demi-journée). */
function getLeaveTypeIdForDay(dateKey) {
  return (
    leavesStore.leaves[dateKey] ||
    leavesStore.leaves[`${dateKey}-morning`] ||
    leavesStore.leaves[`${dateKey}-afternoon`] ||
    null
  )
}

/** Fond case Note = même couleur que le badge en vue Congés (absence ou événement). */
function buildLeaveNoteStyle(dateKey, leavesMap, eventOpacity) {
  const leaveTypeId =
    leavesMap[dateKey] ||
    leavesMap[`${dateKey}-morning`] ||
    leavesMap[`${dateKey}-afternoon`] ||
    null
  if (!leaveTypeId) return {}

  const bg = getLeaveBadgeBackground(leaveTypeId, {
    getLeaveType: (id) => leaveTypesStore.getLeaveType(id),
    eventOpacity,
  })
  if (!bg) return {}

  return { backgroundColor: bg }
}

function rowTitle(day) {
  const parts = []
  if (day.schoolHolidayName) {
    parts.push(`${day.schoolHolidayName} (zone ${uiStore.schoolHolidayZone})`)
  }
  if (day.holidayName) parts.push(day.holidayName)
  const leaveTypeId = getLeaveTypeIdForDay(day.dateKey)
  if (leaveTypeId) {
    const type = leaveTypesStore.getLeaveType(leaveTypeId)
    if (type) parts.push(`${type.label || type.name}`)
  }
  if (day.noteText) parts.push(day.noteText)
  return parts.join(' — ') || 'Cliquer pour ajouter une note'
}
</script>

<style scoped>
/*
 * Essai « feuille Excel » : pas d’espace entre les mois (gap/padding/radius),
 * traits 1px partagés entre colonnes (margin négatif = bordures qui se chevauchent).
 */
.year-notes-view {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0;
  max-width: 100%;
  padding: 0;
  background: transparent;
  border: none;
  min-height: calc(100vh - 300px);
  width: 100%;
  box-sizing: border-box;
}

.year-notes-month-column {
  background: var(--card-bg, white);
  border: 1px solid var(--border-color, #d0d0d0);
  border-radius: 0;
  padding: 0;
  margin-top: -1px;
  margin-left: -1px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  overflow: visible;
}

.year-notes-month-header {
  background: var(--primary-color, #4a90e2);
  color: white;
  padding: 4px 6px;
  text-align: center;
  font-weight: 600;
  font-size: 0.85em;
  border-radius: 0;
  margin-bottom: 0;
  border-bottom: 1px solid var(--border-color, #d0d0d0);
  flex-shrink: 0;
}

/* Liste des jours : pas d’ascenseur interne (tous les jours visibles, scroll = page) */
.year-notes-days-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  flex: 1;
  overflow: visible;
  /* Grille type Excel : trait au-dessus du 1er jour du mois */
  border-top: 1px solid var(--border-color, #d0d0d0);
}

/* Une ligne = 3 cases (date | jour | note) + trait fin sous chaque jour */
.year-notes-day-row {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  width: 100%;
  margin: 0;
  padding: 0;
  border: none;
  border-bottom: 1px solid var(--border-color, #d0d0d0);
  border-radius: 0;
  background: transparent;
  cursor: pointer;
  font-size: 0.85em;
  font-family: inherit;
  color: var(--text-color, #2c3e50);
  text-align: left;
  gap: 0;
}

.notes-cell {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  border: none;
  background: var(--card-bg, white);
  padding: 2px 4px;
  min-height: 22px;
  line-height: 1.2;
}

.notes-cell-date,
.notes-cell-letter {
  border-right: 1px solid var(--border-color, #d0d0d0);
}

/* Case date */
.notes-cell-date {
  width: 32px;
  min-width: 32px;
  max-width: 32px;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
}

.notes-cell-date.school-holiday-day-number {
  color: var(--school-holiday-number-color, #d97706);
}

[data-theme='dark'] .notes-cell-date.school-holiday-day-number {
  color: var(--school-holiday-number-color-dark, #fbbf24);
}

/* Case lettre du jour (L, M, …) */
.notes-cell-letter {
  width: 28px;
  min-width: 28px;
  max-width: 28px;
  justify-content: center;
  flex-shrink: 0;
  opacity: 0.75;
  font-size: 0.9em;
}

/* Case note (prend le reste de la largeur) */
.notes-cell-text {
  flex: 1;
  min-width: 0;
  justify-content: flex-start;
}

.note-text {
  display: block;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.year-notes-day-row:hover .notes-cell-date,
.year-notes-day-row:hover .notes-cell-letter {
  background: var(--hover-color, #f5f5f5);
}

.year-notes-day-row:hover .notes-cell-text:not(.has-leave-bg) {
  background: var(--hover-color, #f5f5f5);
}

/* Jour actuel : un seul liseret autour de toute la ligne (3 cases) */
.year-notes-day-row.is-today {
  outline: 2px solid var(--primary-color, #4a90e2);
  outline-offset: 0;
  position: relative;
  z-index: 1;
}

.year-notes-day-row.is-today .notes-cell {
  box-shadow: none;
}

/* Week-end : seulement date + lettre (pas la case note → garde la couleur événement) */
.year-notes-day-row.is-weekend .notes-cell-date,
.year-notes-day-row.is-weekend .notes-cell-letter {
  background: var(--bg-color, #f5f5f5);
}

[data-theme='dark'] .year-notes-day-row.is-weekend .notes-cell-date,
[data-theme='dark'] .year-notes-day-row.is-weekend .notes-cell-letter {
  background: rgba(255, 255, 255, 0.04);
}

.year-notes-day-row.is-holiday .notes-cell-date {
  background: rgba(255, 193, 7, 0.15);
}

.year-notes-day-row.has-note .notes-cell-text {
  font-weight: 500;
}

.notes-cell-text.has-leave-bg {
  /* backgroundColor inline = badge vue Congés */
}

.year-notes-day-row.is-past {
  opacity: var(--past-leave-opacity);
}

@media (min-width: 1800px) {
  .year-notes-view {
    grid-template-columns: repeat(12, 1fr);
  }
}

@media (max-width: 1200px) {
  .year-notes-view {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 900px) {
  .year-notes-view {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 600px) {
  .year-notes-view {
    grid-template-columns: repeat(2, 1fr);
  }

  .notes-cell-date {
    width: 28px;
    min-width: 28px;
    max-width: 28px;
  }

  .notes-cell-letter {
    width: 24px;
    min-width: 24px;
    max-width: 24px;
  }
}
</style>
