<template>
  <div class="leave-recap">
    <div class="recap-header">
      <h3>📅 Récapitulatif</h3>
    </div>
    
    <!-- Périodes de congés -->
    <div v-if="leavePeriods.length > 0" class="recap-section">
      <h4>Périodes de congés</h4>
      <div class="periods-list">
        <div
          v-for="period in leavePeriods"
          :key="period.id"
          class="period-item"
          :style="{ borderLeftColor: period.color }"
        >
          <div class="period-header">
            <span class="period-type" :style="{ color: period.color }">
              {{ period.typeName }}
            </span>
            <span class="period-days">{{ period.days }} jour{{ period.days > 1 ? 's' : '' }}</span>
          </div>
          <div class="period-dates">
            {{ formatDate(period.startDate) }} → {{ formatDate(period.endDate) }}
          </div>
        </div>
      </div>
    </div>
    <div v-else class="recap-section empty">
      <p>Aucun congé posé</p>
    </div>

    <!-- Événements -->
    <div v-if="eventStats.length > 0" class="recap-section">
      <h4>Événements</h4>
      <div class="events-list">
        <div
          v-for="event in eventStats"
          :key="event.typeId"
          class="event-item"
          :style="{ borderLeftColor: event.color }"
        >
          <span class="event-name" :style="{ color: event.color }">
            {{ event.name }}
          </span>
          <span class="event-count">{{ event.count }} jour{{ event.count > 1 ? 's' : '' }}</span>
        </div>
      </div>
    </div>

    <!-- Statistiques rapides -->
    <div class="recap-section stats">
      <h4>Statistiques</h4>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">Congés posés</span>
          <span class="stat-value">{{ totalLeaveDays }} jour{{ totalLeaveDays > 1 ? 's' : '' }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Événements</span>
          <span class="stat-value">{{ totalEventDays }} jour{{ totalEventDays > 1 ? 's' : '' }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Périodes</span>
          <span class="stat-value">{{ leavePeriods.length }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useLeavesStore } from '../../stores/leaves'
import { useLeaveTypesStore } from '../../stores/leaveTypes'
import { useUIStore } from '../../stores/ui'
import { useLeaves } from '../../composables/useLeaves'
import { getYear, isSameDay, addDays, isBefore, getDay } from '../../services/dateUtils'
import { getDateKey } from '../../services/utils'
import { getPublicHolidays } from '../../services/holidays'

const leavesStore = useLeavesStore()
const leaveTypesStore = useLeaveTypesStore()
const uiStore = useUIStore()
const { getLeaveForDate, getLeaveTypeConfig } = useLeaves()

// Formater une date
function formatDate(date) {
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short'
  })
}

// Trouver les périodes de congés consécutives
// Regroupe tous les congés de catégorie 'leave' ensemble, même s'ils sont de types différents
// Inclut les weekends et jours fériés dans les périodes
const leavePeriods = computed(() => {
  const currentYear = getYear(uiStore.currentDate || new Date())
  const periods = []
  const processed = new Set()
  const holidays = getPublicHolidays(uiStore.selectedCountry, currentYear)
  
  // Fonction pour vérifier si une date fait partie d'une période (congé, weekend ou férié)
  function isInPeriod(date) {
    const dateKey = getDateKey(date)
    
    // Vérifier si c'est un weekend
    const dayOfWeek = getDay(date)
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    
    // Vérifier si c'est un jour férié
    const isHoliday = holidays[dateKey] !== undefined
    
    // Vérifier si c'est un congé de catégorie 'leave'
    const leaveInfo = getLeaveForDate(date)
    const isLeave = leaveInfo && leaveInfo.full && (() => {
      const config = getLeaveTypeConfig(leaveInfo.full)
      return config && config.category === 'leave'
    })()
    
    return isLeave || isWeekend || isHoliday
  }
  
  // Trier toutes les dates avec congés de catégorie 'leave' (journées complètes uniquement)
  const datesWithLeaves = []
  Object.keys(leavesStore.leaves).forEach(dateKey => {
    // Ignorer les demi-journées pour les périodes
    if (dateKey.includes('-morning') || dateKey.includes('-afternoon')) {
      return
    }
    
    const dateParts = dateKey.split('-')
    if (dateParts.length >= 3) {
      const date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]))
      if (!isNaN(date.getTime()) && getYear(date) === currentYear) {
        const leaveInfo = getLeaveForDate(date)
        if (leaveInfo.full) {
          const config = getLeaveTypeConfig(leaveInfo.full)
          if (config && config.category === 'leave') {
            datesWithLeaves.push({ date, typeId: leaveInfo.full, config })
          }
        }
      }
    }
  })
  
  // Trier par date
  datesWithLeaves.sort((a, b) => a.date.getTime() - b.date.getTime())
  
  // Pour chaque date avec congé, trouver la période complète (incluant weekends/fériés)
  datesWithLeaves.forEach(({ date, typeId, config }) => {
    const dateKey = getDateKey(date)
    if (processed.has(dateKey)) return
    
    // Trouver le début de la période en remontant tant qu'on trouve des jours de période
    let startDate = new Date(date)
    let currentDate = new Date(date)
    currentDate.setDate(currentDate.getDate() - 1)
    
    while (getYear(currentDate) === currentYear && isInPeriod(currentDate)) {
      const prevKey = getDateKey(currentDate)
      if (!processed.has(prevKey)) {
        startDate = new Date(currentDate)
        processed.add(prevKey)
      }
      currentDate.setDate(currentDate.getDate() - 1)
    }
    
    // Trouver la fin de la période en avançant tant qu'on trouve des jours de période
    let endDate = new Date(date)
    currentDate = new Date(date)
    currentDate.setDate(currentDate.getDate() + 1)
    
    while (getYear(currentDate) === currentYear && isInPeriod(currentDate)) {
      const nextKey = getDateKey(currentDate)
      if (!processed.has(nextKey)) {
        endDate = new Date(currentDate)
        processed.add(nextKey)
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    processed.add(dateKey)
    
    // Calculer le nombre de jours
    const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    
    // Collecter tous les types de congés dans cette période pour l'affichage
    const typesInPeriod = new Set()
    const currentPeriodDate = new Date(startDate)
    const endDateCopy = new Date(endDate)
    let loopCount = 0
    const maxDays = 365 // Sécurité pour éviter les boucles infinies
    
    while (currentPeriodDate <= endDateCopy && loopCount < maxDays) {
      const periodKey = getDateKey(currentPeriodDate)
      const periodLeave = getLeaveForDate(currentPeriodDate)
      
      // Si c'est un congé de catégorie 'leave', l'ajouter aux types
      if (periodLeave && periodLeave.full) {
        const periodConfig = getLeaveTypeConfig(periodLeave.full)
        if (periodConfig && periodConfig.category === 'leave') {
          typesInPeriod.add(periodConfig.name)
        }
      }
      
      currentPeriodDate.setDate(currentPeriodDate.getDate() + 1)
      loopCount++
    }
    
    // Créer un nom de période qui liste tous les types
    const typeNames = Array.from(typesInPeriod).join(' / ')
    
    // Utiliser la couleur du premier type trouvé, ou une couleur par défaut
    periods.push({
      id: `period-${startDate.getTime()}`,
      typeId: 'mixed', // Indique que c'est une période mixte
      typeName: typeNames,
      color: config.color, // Couleur du premier type
      startDate,
      endDate,
      days
    })
  })
  
  return periods.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
})

// Statistiques des événements
const eventStats = computed(() => {
  const currentYear = getYear(uiStore.currentDate || new Date())
  const eventCounts = {}
  
  Object.keys(leavesStore.leaves).forEach(dateKey => {
    // Ignorer les demi-journées pour simplifier
    if (dateKey.includes('-morning') || dateKey.includes('-afternoon')) {
      return
    }
    
    const dateParts = dateKey.split('-')
    if (dateParts.length >= 3) {
      const date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]))
      if (!isNaN(date.getTime()) && getYear(date) === currentYear) {
        const leaveInfo = getLeaveForDate(date)
        const typeId = leaveInfo.full || leaveInfo.morning || leaveInfo.afternoon
        if (typeId) {
          const config = getLeaveTypeConfig(typeId)
          if (config && config.category === 'event') {
            eventCounts[typeId] = (eventCounts[typeId] || 0) + (leaveInfo.full ? 1 : 0.5)
          }
        }
      }
    }
  })
  
  return Object.entries(eventCounts)
    .map(([typeId, count]) => {
      const config = getLeaveTypeConfig(typeId)
      return {
        typeId,
        name: config?.name || typeId,
        color: config?.color || '#cccccc',
        count: Math.round(count * 2) / 2 // Arrondir à 0.5
      }
    })
    .sort((a, b) => b.count - a.count)
})

// Totaux
const totalLeaveDays = computed(() => {
  return leavePeriods.value.reduce((sum, period) => sum + period.days, 0)
})

const totalEventDays = computed(() => {
  return eventStats.value.reduce((sum, event) => sum + event.count, 0)
})
</script>

<style scoped>
.leave-recap {
  padding: 20px;
  max-width: 100%;
}

.recap-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--border-color, #e0e0e0);
}

.recap-header h3 {
  margin: 0;
  font-size: 1.1em;
  font-weight: 600;
  color: var(--text-color);
}

.recap-section {
  margin-bottom: 20px;
}

.recap-section:last-child {
  margin-bottom: 0;
}

.recap-section h4 {
  margin: 0 0 10px 0;
  font-size: 0.9em;
  font-weight: 600;
  color: var(--text-color);
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.recap-section.empty {
  text-align: center;
  padding: 20px;
  color: var(--text-color);
  opacity: 0.6;
  font-size: 0.9em;
}

.periods-list,
.events-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.period-item,
.event-item {
  padding: 6px 10px;
  background: var(--bg-color, #f5f5f5);
  border-left: 3px solid;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.period-item:hover,
.event-item:hover {
  background: var(--hover-color);
  transform: translateX(2px);
}

.period-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}

.period-type,
.event-name {
  font-weight: 600;
  font-size: 0.85em;
}

.period-days,
.event-count {
  font-size: 0.8em;
  font-weight: 500;
  color: var(--text-color);
  opacity: 0.7;
}

.period-dates {
  font-size: 0.75em;
  color: var(--text-color);
  opacity: 0.6;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  background: var(--bg-color, #f5f5f5);
  border-radius: 4px;
}

.stat-label {
  font-size: 0.75em;
  color: var(--text-color);
  opacity: 0.7;
  margin-bottom: 4px;
  text-align: center;
}

.stat-value {
  font-size: 1.1em;
  font-weight: 600;
  color: var(--primary-color, #4a90e2);
}

/* Mode sombre */
[data-theme="dark"] .period-item,
[data-theme="dark"] .event-item,
[data-theme="dark"] .stat-item {
  background: var(--card-bg, #2d2d2d);
}

[data-theme="dark"] .recap-header {
  border-bottom-color: var(--border-color, #404040);
}
</style>

