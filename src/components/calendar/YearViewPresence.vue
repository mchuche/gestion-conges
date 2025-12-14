<template>
  <div class="year-presence-container">
    <!-- En-tête avec les jours de l'année (groupés par mois) -->
    <div class="year-presence-header-row">
      <div class="year-presence-user-label">Utilisateur</div>
      <div
        v-for="month in months"
        :key="month.index"
        :class="['year-presence-month-column', { 'current-month': month.isCurrent }]"
        :id="month.isCurrent ? 'current-month-column' : null"
      >
        <div :class="['year-presence-month-header', { 'current-month-header': month.isCurrent }]">
          {{ month.name }}
        </div>
        <div class="year-presence-days-container">
          <div
            v-for="day in month.days"
            :key="day.dateKey"
            :class="['year-presence-day-header', { weekend: day.isWeekend, 'public-holiday': day.isHoliday }]"
            :title="day.holidayName"
          >
            {{ day.dayNumber }}
          </div>
        </div>
      </div>
    </div>

    <!-- Ligne pour chaque utilisateur (actuellement seulement l'utilisateur actuel) -->
    <div
      v-for="user in users"
      :key="user.id"
      class="year-presence-user-row"
    >
      <div class="year-presence-user-name">{{ user.name }}</div>
      <div
        v-for="month in months"
        :key="`${user.id}-${month.index}`"
        class="year-presence-month-column"
      >
        <div class="year-presence-days-container">
          <PresenceDayCell
            v-for="day in month.days"
            :key="`${user.id}-${day.dateKey}`"
            :date="day.date"
            :user="user"
            @click="(date, event) => emit('day-click', date, event)"
            @mousedown="(date, event) => emit('day-mousedown', date, event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, nextTick, ref, watch } from 'vue'
import { useUIStore } from '../../stores/ui'
import { useAuthStore } from '../../stores/auth'
import { useTeamsStore } from '../../stores/teams'
import PresenceDayCell from './PresenceDayCell.vue'
import * as teamsService from '../../services/teams'
import {
  getYear,
  getMonth,
  getDay,
  getDaysInMonth,
  createDate,
  today
} from '../../services/dateUtils'
import { getDateKey } from '../../services/utils'
import { getPublicHolidays } from '../../services/holidays'
import logger from '../../services/logger'

const emit = defineEmits(['day-click', 'day-mousedown'])

const uiStore = useUIStore()
const authStore = useAuthStore()
const teamsStore = useTeamsStore()

const year = computed(() => getYear(uiStore.currentDate))
const currentYear = computed(() => getYear(today()))
const currentMonth = computed(() => getMonth(today()))
const isCurrentYear = computed(() => year.value === currentYear.value)

const monthNames = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

const teamMembers = ref([])
const loadingMembers = ref(false)

// Charger les membres de l'équipe sélectionnée
async function loadTeamMembers() {
  if (!teamsStore.currentTeamId) {
    teamMembers.value = []
    return
  }

  try {
    loadingMembers.value = true
    const members = await teamsService.loadTeamMembers(teamsStore.currentTeamId)
    teamMembers.value = members.map(member => ({
      id: member.userId,
      name: member.email || member.name || 'Utilisateur inconnu',
      leaves: {} // Les leaves sont gérés par le store
    }))
    logger.debug('[YearViewPresence] Membres chargés:', teamMembers.value.length)
  } catch (err) {
    logger.error('[YearViewPresence] Erreur lors du chargement des membres:', err)
    teamMembers.value = []
  } finally {
    loadingMembers.value = false
  }
}

// Créer la liste des utilisateurs
const users = computed(() => {
  // Si une équipe est sélectionnée, utiliser ses membres
  if (teamsStore.currentTeamId && teamMembers.value.length > 0) {
    return teamMembers.value
  }
  
  // Sinon, utiliser seulement l'utilisateur actuel
  if (authStore.user) {
    return [{
      id: authStore.user.id,
      name: authStore.user.name || authStore.user.email || 'Moi',
      leaves: {}
    }]
  }
  
  return []
})

// Watcher pour charger les membres quand l'équipe change
watch(() => teamsStore.currentTeamId, async (newTeamId) => {
  if (newTeamId) {
    await loadTeamMembers()
  } else {
    teamMembers.value = []
  }
}, { immediate: true })

// Créer la structure des mois avec leurs jours
const months = computed(() => {
  const holidays = getPublicHolidays(uiStore.selectedCountry, year.value)
  const monthsData = []

  for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
    const firstDay = createDate(year.value, monthIndex, 1)
    const daysInMonth = getDaysInMonth(firstDay)
    const days = []

    for (let day = 1; day <= daysInMonth; day++) {
      const date = createDate(year.value, monthIndex, day)
      const dateKey = getDateKey(date)
      const dayOfWeek = getDay(date)
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
      const holidayName = holidays[dateKey]

      days.push({
        date,
        dateKey,
        dayNumber: day,
        isWeekend,
        isHoliday: !!holidayName,
        holidayName
      })
    }

    monthsData.push({
      index: monthIndex,
      name: monthNames[monthIndex],
      days,
      isCurrent: isCurrentYear.value && monthIndex === currentMonth.value
    })
  }

  return monthsData
})

// Scroll automatique vers le mois courant
onMounted(async () => {
  await loadTeamMembers()
  await nextTick()
  if (isCurrentYear.value) {
    setTimeout(() => {
      const currentMonthColumn = document.getElementById('current-month-column')
      if (currentMonthColumn) {
        currentMonthColumn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }, 100)
  }
})
</script>

<style scoped>
/* Les styles sont dans year-view.css */
</style>

