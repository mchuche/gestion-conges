<template>
  <Modal :model-value="showModal" @close="closeModal">
    <template #header>
      <h3>Sélectionner un type de congé</h3>
    </template>
    
    <template #body>
      <div v-if="selectedDate" class="modal-content">
        <div class="selected-date-info">
          <p class="date-display">{{ formattedDate }}</p>
          <div v-if="selectedDates.length > 1" class="selection-info">
            <p>{{ selectedDates.length }} jours sélectionnés</p>
            <button @click="openSelectionModal" class="btn-secondary">
              {{ showSelectionList ? 'Masquer' : 'Voir' }} la sélection
            </button>
            <div v-if="showSelectionList" class="selected-dates-list">
              <ul>
                <li v-for="(date, index) in selectedDates" :key="index">
                  {{ date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) }}
                </li>
              </ul>
            </div>
          </div>
          <div class="date-picker-section">
            <button @click="showDatePicker = !showDatePicker" class="btn-secondary">
              📅 {{ showDatePicker ? 'Masquer' : 'Sélectionner une plage de dates' }}
            </button>
            <div v-if="showDatePicker" class="date-picker-container">
              <Datepicker
                v-model="pickerDates"
                :enable-time-picker="false"
                :locale="fr"
                range
                auto-apply
                @update:model-value="handleDatePickerChange"
                placeholder="Sélectionner une plage de dates"
              />
            </div>
          </div>
        </div>

        <div class="period-selection">
          <h4>Période :</h4>
          <div class="period-buttons">
            <button
              :class="['period-btn', { active: selectedPeriod === 'full' }]"
              @click="setPeriod('full')"
            >
              Journée complète
            </button>
            <button
              :class="['period-btn', { active: selectedPeriod === 'morning' }]"
              @click="setPeriod('morning')"
            >
              Matin
            </button>
            <button
              :class="['period-btn', { active: selectedPeriod === 'afternoon' }]"
              @click="setPeriod('afternoon')"
            >
              Après-midi
            </button>
          </div>
        </div>

        <div class="working-days-info" v-if="workingDaysCount > 0">
          <p>Jours ouvrés : <strong>{{ workingDaysCount }}</strong></p>
        </div>

        <div class="leave-types-container">
          <!-- Section Congés -->
          <div class="leave-types-section" v-if="leaveTypesList.length > 0">
            <h4 class="section-title">
              <span class="section-icon">🏖️</span>
              Congés
            </h4>
            <div class="leave-buttons-grid">
              <button
                v-for="type in leaveTypesList"
                :key="type.id"
                :class="['leave-btn', { active: isSelectedType(type.id) }]"
                :style="getButtonStyle(type)"
                @click="selectLeaveType(type.id)"
                :title="getTypeTooltip(type)"
              >
                {{ type.name }}
                <span v-if="type.label !== type.name" class="type-label">
                  ({{ type.label }})
                </span>
              </button>
            </div>
          </div>

          <!-- Section Événements -->
          <div class="leave-types-section" v-if="eventTypesList.length > 0">
            <h4 class="section-title">
              <span class="section-icon">📅</span>
              Événements
            </h4>
            <div class="leave-buttons-grid">
              <button
                v-for="type in eventTypesList"
                :key="type.id"
                :class="['leave-btn', 'event-btn', { active: isSelectedType(type.id) }]"
                :style="getButtonStyle(type)"
                @click="selectLeaveType(type.id)"
                :title="getTypeTooltip(type)"
              >
                {{ type.name }}
                <span v-if="type.label !== type.name" class="type-label">
                  ({{ type.label }})
                </span>
              </button>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button
            v-if="hasLeave"
            class="btn-danger"
            @click="handleRemoveLeave"
          >
            Supprimer le congé
          </button>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { computed, watch, ref } from 'vue'
import { VueDatePicker as Datepicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { fr } from 'date-fns/locale/fr'
import { useUIStore } from '../../stores/ui'
import { useLeavesStore } from '../../stores/leaves'
import { useLeaveTypesStore } from '../../stores/leaveTypes'
import { useLeaves } from '../../composables/useLeaves'
import { useToast } from '../../composables/useToast'
import Modal from '../common/Modal.vue'
import logger from '../../services/logger'
import { handleError } from '../../services/errorHandler'
import { getDateKey, calculateWorkingDaysFromDates } from '../../services/utils'
import { getPublicHolidays } from '../../services/holidays'
// Formatage de date en français
function formatDate(date, options = {}) {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  })
}

const uiStore = useUIStore()
const leavesStore = useLeavesStore()
const leaveTypesStore = useLeaveTypesStore()
const { getLeaveForDate, getLeaveTypeConfig, setLeave, removeLeave: removeLeaveForDate, isWeekendOrHoliday } = useLeaves()
const { error: showErrorToast, success: showSuccessToast } = useToast()

const showModal = computed(() => uiStore.showModal)
const selectedDate = computed(() => uiStore.selectedDate)
const selectedDates = computed(() => uiStore.selectedDates)
const selectedPeriod = computed(() => uiStore.selectedPeriod)
const leaveTypes = computed(() => leaveTypesStore.leaveTypes)

// Séparer les types en congés et événements
const leaveTypesList = computed(() => {
  return leaveTypes.value.filter(type => type.category !== 'event')
})

const eventTypesList = computed(() => {
  return leaveTypes.value.filter(type => type.category === 'event')
})

const formattedDate = computed(() => {
  if (!selectedDate.value) return ''
  return formatDate(selectedDate.value, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const leaveInfo = computed(() => {
  if (!selectedDate.value) return null
  return getLeaveForDate(selectedDate.value)
})

const hasLeave = computed(() => {
  if (!leaveInfo.value) return false
  return !!(leaveInfo.value.full || leaveInfo.value.morning || leaveInfo.value.afternoon)
})

const currentLeaveType = computed(() => {
  if (!leaveInfo.value) return null
  return leaveInfo.value[selectedPeriod.value] || leaveInfo.value.full
})

const workingDaysCount = computed(() => {
  if (selectedDates.value.length === 0) return 0
  if (selectedDates.value.length === 1) {
    // Pour un seul jour, vérifier si c'est un jour ouvré
    const date = selectedDates.value[0]
    const dayOfWeek = date.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) return 0 // Weekend
    
    const holidays = getPublicHolidays(uiStore.selectedCountry, date.getFullYear())
    const dateKey = getDateKey(date)
    if (holidays[dateKey]) return 0 // Jour férié
    
    return 1
  }
  
  // Pour plusieurs jours, utiliser la fonction de calcul
  return calculateWorkingDaysFromDates(selectedDates.value, uiStore.selectedCountry, getPublicHolidays)
})

const showDatePicker = ref(false)
const pickerDates = ref(null)

function formatDatePicker(date) {
  if (!date) return ''
  if (Array.isArray(date) && date.length === 2) {
    return `${date[0].toLocaleDateString('fr-FR')} - ${date[1].toLocaleDateString('fr-FR')}`
  }
  return date.toLocaleDateString('fr-FR')
}

function handleDatePickerChange(dates) {
  if (!dates || !Array.isArray(dates) || dates.length !== 2) return
  
  const [startDate, endDate] = dates
  const selectedDatesArray = []
  
  // Générer toutes les dates entre startDate et endDate
  const currentDate = new Date(startDate)
  currentDate.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(0, 0, 0, 0)
  
  // Filtrer les weekends et jours fériés
  while (currentDate <= end) {
    // Ne pas inclure les weekends et jours fériés
    if (!isWeekendOrHoliday(currentDate)) {
      selectedDatesArray.push(new Date(currentDate))
    }
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  // Mettre à jour le store avec les dates sélectionnées
  if (selectedDatesArray.length > 0) {
    uiStore.clearSelectedDates()
    selectedDatesArray.forEach(date => {
      uiStore.addOrRemoveSelectedDate(date)
    })
    // Définir la première date comme date principale
    uiStore.setSelectedDate(selectedDatesArray[0])
  } else {
    showErrorToast('Aucune date valide dans cette plage. Les weekends et jours fériés sont exclus.')
  }
  
  showDatePicker.value = false
}

function setPeriod(period) {
  uiStore.setSelectedPeriod(period)
  
  // Si une demi-journée est déjà posée, ajuster la période
  if (leaveInfo.value) {
    if (leaveInfo.value.morning && !leaveInfo.value.afternoon && period === 'full') {
      // Si matin seulement et on veut journée complète, garder matin
      return
    }
    if (leaveInfo.value.afternoon && !leaveInfo.value.morning && period === 'full') {
      // Si après-midi seulement et on veut journée complète, garder après-midi
      return
    }
  }
}

function getButtonStyle(type) {
  const isSelected = currentLeaveType.value === type.id
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
  const defaultBg = isDark ? 'var(--card-bg)' : 'white'
  
  return {
    borderColor: type.color,
    background: isSelected ? type.color : defaultBg,
    color: isSelected ? 'white' : 'var(--text-color)'
  }
}

function isSelectedType(typeId) {
  return currentLeaveType.value === typeId
}

function getTypeTooltip(type) {
  if (type.category === 'event') {
    return `${type.name} (Événement - sans quota)`
  }
  return `${type.name} (Congé - avec quota)`
}

async function selectLeaveType(typeId) {
  const config = getLeaveTypeConfig(typeId)
  const isEvent = config && config.category === 'event'
  
  // Si c'est un événement, ouvrir la modale de choix
  if (isEvent) {
    // Ouvrir la modale d'événements récurrents
    uiStore.openRecurringEventModal(typeId)
    // Ne pas fermer la modale principale, elle sera fermée par l'utilisateur
    return
  }
  
  // Comportement normal pour les congés (et événements normaux si besoin)
  const datesToProcess = selectedDates.value.length > 1 
    ? selectedDates.value 
    : [selectedDate.value]
  
  // Filtrer les weekends et jours fériés
  const validDates = datesToProcess.filter(date => !isWeekendOrHoliday(date))
  
  if (validDates.length === 0) {
    showErrorToast('Aucune date valide sélectionnée. Les weekends et jours fériés ne peuvent pas avoir de congés.')
    return
  }
  
  if (validDates.length < datesToProcess.length) {
    const skippedCount = datesToProcess.length - validDates.length
    showErrorToast(`${skippedCount} date(s) ignorée(s) (weekends ou jours fériés).`)
  }
  
  const period = selectedPeriod.value || 'full'
  
  try {
    for (const date of validDates) {
      await setLeave(date, typeId, period)
    }
    closeModal()
  } catch (error) {
    // Si l'erreur est déjà gérée (weekend/holiday), ne pas la re-gérer
    if (error.code === 'WEEKEND_OR_HOLIDAY') {
      showErrorToast(error.message)
      return
    }
    handleError(error, {
      context: 'LeaveModal.selectLeaveType',
      showToast: true
    })
  }
}


async function handleRemoveLeave() {
  const datesToProcess = selectedDates.value.length > 1 
    ? selectedDates.value 
    : [selectedDate.value]
  
  try {
    for (const date of datesToProcess) {
      await removeLeaveForDate(date)
    }
    closeModal()
  } catch (error) {
    handleError(error, {
      context: 'LeaveModal.handleRemoveLeave',
      showToast: true
    })
  }
}

function closeModal() {
  uiStore.closeModal()
  uiStore.setSelectedDate(null)
  uiStore.clearSelectedDates()
  uiStore.setMultiSelectMode(false)
}

const showSelectionList = ref(false)

function openSelectionModal() {
  showSelectionList.value = !showSelectionList.value
}



// Ajuster la période selon le congé existant
watch(leaveInfo, (newInfo) => {
  if (newInfo && selectedDate.value) {
    if (newInfo.morning && !newInfo.afternoon) {
      uiStore.setSelectedPeriod('morning')
    } else if (newInfo.afternoon && !newInfo.morning) {
      uiStore.setSelectedPeriod('afternoon')
    } else if (newInfo.full) {
      uiStore.setSelectedPeriod('full')
    }
  }
}, { immediate: true })

</script>

<style scoped>
.modal-content {
  padding: 20px;
  max-height: 80vh;
  overflow-y: auto;
}

.selected-date-info {
  margin-bottom: 20px;
  text-align: center;
}

.date-display {
  font-size: 1.2em;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 10px;
}

.selection-info {
  margin-top: 10px;
}

.selected-dates-list {
  margin-top: 10px;
  padding: 10px;
  background: var(--card-bg, white);
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
}

.selected-dates-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 8px;
}

.selected-dates-list li {
  padding: 6px 10px;
  background: var(--bg-color, #f5f5f5);
  border-radius: 4px;
  font-size: 0.9em;
}

.period-selection {
  margin-bottom: 20px;
}

.period-selection h4 {
  margin-bottom: 10px;
  font-size: 1em;
  color: var(--text-color);
}

.leave-types-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.leave-types-section {
  flex: 1;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 1em;
  color: var(--text-color);
  font-weight: 600;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--border-color);
}

.section-icon {
  font-size: 1.2em;
}

.period-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.period-btn {
  flex: 1;
  min-width: 120px;
  padding: 10px;
  border: 2px solid var(--border-color);
  border-radius: 4px;
  background: var(--card-bg);
  color: var(--text-color);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9em;
}

.period-btn:hover {
  border-color: var(--primary-color);
  background: var(--hover-color);
}

.period-btn.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.working-days-info {
  margin-bottom: 20px;
  padding: 10px;
  background: var(--bg-color);
  border-radius: 4px;
  text-align: center;
}

.leave-buttons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
}

.leave-btn {
  padding: 10px 12px;
  border: 2px solid;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9em;
  text-align: center;
  font-weight: 500;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 2px;
}

.event-btn {
  opacity: 0.9;
}

.leave-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.leave-btn.active {
  font-weight: 600;
}

.type-label {
  font-size: 0.85em;
  opacity: 0.8;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}

.btn-secondary,
.btn-danger {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  transition: all 0.2s ease;
}

.btn-secondary {
  background: var(--primary-color);
  color: white;
}

.btn-secondary:hover {
  background: #357abd;
}

.btn-danger {
  background: var(--danger-color);
  color: white;
}

.btn-danger:hover {
  background: #c0392b;
}

.date-picker-section {
  margin-top: 15px;
}

.date-picker-container {
  margin-top: 15px;
  padding: 15px;
  background: var(--bg-color, #f5f5f5);
  border-radius: 8px;
  border: 1px solid var(--border-color, #e0e0e0);
}

.date-picker-container :deep(.dp__main) {
  font-family: inherit;
}

.date-picker-container :deep(.dp__input_wrap) {
  width: 100%;
}

.event-info {
  margin-top: 10px;
  padding: 10px;
  background: var(--bg-color, #f5f5f5);
  border-radius: 4px;
  text-align: center;
}

.event-hint {
  margin: 0;
  font-size: 0.85em;
  color: var(--text-color);
  opacity: 0.7;
}
</style>

