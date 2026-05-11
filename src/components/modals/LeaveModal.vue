<template>
  <Modal :model-value="showModal" @close="closeModal">
    <template #header>
      <h3>Sélectionner un type de congé</h3>
    </template>
    
    <template #body>
      <div v-if="selectedDate">
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

        <!-- Bouton pour créer un événement récurrent -->
        <div class="recurring-event-button-section">
          <button 
            class="btn-primary btn-recurring-event" 
            @click="openRecurringEventModal"
          >
            🔄 Créer un événement récurrent
          </button>
        </div>

        <div class="modal-actions">
          <button
            v-if="hasLeave"
            class="btn-danger"
            @click="handleRemoveLeave"
          >
            Supprimer
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
import { useAuthStore } from '../../stores/auth'
import { useLeavesStore } from '../../stores/leaves'
import { useLeaveTypesStore } from '../../stores/leaveTypes'
import { useLeaves } from '../../composables/useLeaves'
import { useToast } from '../../composables/useToast'
import Modal from '../common/Modal.vue'
import logger from '../../services/logger'
import { handleError } from '../../services/errorHandler'
import { getDateKey, calculateWorkingDaysFromDates } from '../../services/utils'
import { getPublicHolidays } from '../../services/holidays'
import { apiJson } from '../../services/api'
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
const authStore = useAuthStore()
const leavesStore = useLeavesStore()
const leaveTypesStore = useLeaveTypesStore()
const { getLeaveForDate, getLeaveTypeConfig, setLeave, removeLeave: removeLeaveForDate, isWeekendOrHoliday } = useLeaves()
const { error: showErrorToast, success: showSuccessToast } = useToast()

const showModal = computed(() => uiStore.showModal)
const selectedDate = computed(() => uiStore.selectedDate)
const selectedDates = computed(() => uiStore.selectedDates)
const selectedPeriod = computed(() => uiStore.selectedPeriod)
const leaveTypes = computed(() => leaveTypesStore.leaveTypes)
const targetUserId = computed(() => uiStore.selectedTargetUserId)

// Quand un propriétaire modifie un membre d'équipe, les leaves affichés dans la matrice
// viennent de user.leaves (pas de leavesStore.leaves). On recharge l’info via GET /leaves/team.
const targetLeaveInfo = ref(null) // { full, morning, afternoon }
const targetLeaveLoading = ref(false)

async function loadTargetLeaveInfoForDate(date) {
  if (!targetUserId.value || !date) {
    targetLeaveInfo.value = null
    return
  }

  const baseKey = getDateKey(date) // YYYY-MM-DD

  targetLeaveLoading.value = true
  try {
    const uid = encodeURIComponent(targetUserId.value)
    const data = await apiJson(`/leaves/team?userIds=${uid}`, { method: 'GET' })
    const map = (data.byUser && data.byUser[targetUserId.value]) || {}

    const info = { full: null, morning: null, afternoon: null }
    if (map[baseKey] != null) info.full = map[baseKey]
    if (map[`${baseKey}-morning`] != null) info.morning = map[`${baseKey}-morning`]
    if (map[`${baseKey}-afternoon`] != null) info.afternoon = map[`${baseKey}-afternoon`]

    targetLeaveInfo.value = info
  } catch (err) {
    logger.error('[LeaveModal] Erreur chargement leave du membre:', err)
    // Fallback safe: pas de leave
    targetLeaveInfo.value = { full: null, morning: null, afternoon: null }
  } finally {
    targetLeaveLoading.value = false
  }
}

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
  // Mode propriétaire: afficher l'info du membre ciblé
  if (targetUserId.value) {
    return targetLeaveInfo.value || { full: null, morning: null, afternoon: null }
  }
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
  // Comportement unifié pour les congés et événements : poser directement
  // Déterminer les dates à traiter
  let datesToProcess = []
  if (selectedDates.value.length > 1) {
    // Plusieurs dates sélectionnées
    datesToProcess = selectedDates.value
  } else if (selectedDates.value.length === 1) {
    // Une seule date dans selectedDates
    datesToProcess = selectedDates.value
  } else if (selectedDate.value) {
    // Une seule date via selectedDate
    datesToProcess = [selectedDate.value]
  } else {
    // Aucune date sélectionnée
    showErrorToast('Aucune date sélectionnée')
    return
  }
  
  // Filtrer les dates nulles/undefined
  datesToProcess = datesToProcess.filter(date => date != null)
  
  if (datesToProcess.length === 0) {
    showErrorToast('Aucune date valide sélectionnée')
    return
  }
  
  // Filtrer les weekends et jours fériés (pour congés et événements)
  const validDates = datesToProcess.filter(date => !isWeekendOrHoliday(date))
  
  if (validDates.length === 0) {
    showErrorToast('Aucune date valide sélectionnée. Les weekends et jours fériés ne peuvent pas avoir de congés ou événements.')
    return
  }
  
  if (validDates.length < datesToProcess.length) {
    const skippedCount = datesToProcess.length - validDates.length
    showErrorToast(`${skippedCount} date(s) ignorée(s) (weekends ou jours fériés).`)
  }
  
  const period = selectedPeriod.value || 'full'
  const targetUserId = uiStore.selectedTargetUserId
  
  logger.log('[LeaveModal] Sélection de congé:', {
    typeId,
    period,
    dates: validDates.length,
    targetUserId: targetUserId || 'utilisateur actuel'
  })
  
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
  // Déterminer les dates à traiter
  let datesToProcess = []
  if (selectedDates.value.length > 1) {
    datesToProcess = selectedDates.value
  } else if (selectedDates.value.length === 1) {
    datesToProcess = selectedDates.value
  } else if (selectedDate.value) {
    datesToProcess = [selectedDate.value]
  } else {
    showErrorToast('Aucune date sélectionnée')
    return
  }
  
  // Filtrer les dates nulles/undefined
  datesToProcess = datesToProcess.filter(date => date != null)
  
  if (datesToProcess.length === 0) {
    showErrorToast('Aucune date valide sélectionnée')
    return
  }
  
  try {
    const period = selectedPeriod.value || 'full'

    // Pour une seule date, supprimer uniquement ce qui existe réellement (évite les notifications "fantômes")
    // et garantit qu'on récupère le bon type lors de la suppression (pour les notifications).
    let periodsToRemove = []
    if (datesToProcess.length === 1 && leaveInfo.value) {
      if (period === 'full') {
        if (leaveInfo.value.full) {
          periodsToRemove = ['full']
        } else {
          if (leaveInfo.value.morning) periodsToRemove.push('morning')
          if (leaveInfo.value.afternoon) periodsToRemove.push('afternoon')
        }
      } else {
        if (leaveInfo.value[period]) {
          periodsToRemove = [period]
        } else if (leaveInfo.value.full) {
          periodsToRemove = ['full']
        } else {
          periodsToRemove = [period]
        }
      }
    } else {
      // Multi-date: fallback conservateur
      periodsToRemove = period === 'full' ? ['full', 'morning', 'afternoon'] : [period, 'full']
    }

    for (const date of datesToProcess) {
      for (const p of periodsToRemove) {
        await removeLeaveForDate(date, p)
      }
    }
    closeModal()
  } catch (error) {
    handleError(error, {
      context: 'LeaveModal.handleRemoveLeave',
      showToast: true
    })
  }
}

// Recharger l'info du membre ciblé à l'ouverture / changement de date / changement de cible
watch(
  [showModal, selectedDate, targetUserId],
  async ([isOpen, date, userId]) => {
    if (isOpen && date && userId) {
      await loadTargetLeaveInfoForDate(date)
    } else if (!userId) {
      targetLeaveInfo.value = null
    }
  },
  { immediate: true }
)

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

function openRecurringEventModal() {
  // IMPORTANT: closeModal() remet uiStore.selectedDate à null.
  // On préserve donc la date sélectionnée pour l'utiliser comme date proposée dans la modale de récurrence.
  const preservedDate = selectedDate.value ? new Date(selectedDate.value) : null
  const preservedPeriod = uiStore.selectedPeriod

  // Fermer d'abord la modale de sélection de congé
  closeModal()

  // Puis ouvrir la modale d'événements récurrents sans type d'événement pré-sélectionné
  // Utiliser un petit délai pour éviter les conflits de rendu
  setTimeout(() => {
    if (preservedDate) uiStore.setSelectedDate(preservedDate)
    if (preservedPeriod) uiStore.setSelectedPeriod(preservedPeriod)
    uiStore.openRecurringEventModal(null)
  }, 100)
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
/* Le padding est déjà géré par le composant Modal */

.selected-date-info {
  margin-bottom: 16px;
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
  margin-bottom: 16px;
}

.period-selection h4 {
  margin-bottom: 10px;
  font-size: 1em;
  color: var(--text-color);
}

.leave-types-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.leave-types-section {
  flex: 1;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  margin-top: 12px;
  font-size: 0.95em;
  color: var(--text-color);
  font-weight: 600;
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
  margin-bottom: 16px;
  text-align: center;
  font-size: 0.85em;
  color: var(--text-color);
  opacity: 0.7;
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

.btn-primary,
.btn-secondary,
.btn-danger {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  transition: all 0.2s ease;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background: #357abd;
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

.recurring-event-button-section {
  margin-top: 20px;
  padding-top: 15px;
}

.btn-recurring-event {
  width: 100%;
  padding: 12px 24px;
  font-size: 1em;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
</style>
