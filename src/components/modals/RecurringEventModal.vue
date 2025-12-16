<template>
  <Modal :model-value="showModal" @close="closeModal">
    <template #header>
      <h3>Créer un événement récurrent</h3>
    </template>
    
    <template #body>
      <div>
        <div v-if="selectedDate" class="selected-date-info">
          <p class="date-display">{{ formattedDate }}</p>
          <div v-if="recurringDateRange" class="date-range-info">
            <p class="range-display">
              <strong>Période :</strong> {{ formatDateRange(recurringDateRange) }}
            </p>
          </div>
        </div>

        <!-- Sélection du type d'événement -->
        <div v-if="!selectedEventTypeId && eventTypesList.length > 0" class="event-type-selection">
          <h4>Sélectionner un type d'événement :</h4>
          <div class="event-types-grid">
            <button
              v-for="type in eventTypesList"
              :key="type.id"
              :class="['event-type-btn', { active: selectedEventTypeId === type.id }]"
              :style="{ borderColor: type.color, backgroundColor: selectedEventTypeId === type.id ? type.color : 'transparent' }"
              @click="selectedEventTypeId = type.id"
            >
              <span :style="{ color: selectedEventTypeId === type.id ? 'white' : type.color }">
                {{ type.name }}
              </span>
            </button>
          </div>
        </div>
        
        <!-- Message si aucun type d'événement disponible -->
        <div v-if="!selectedEventTypeId && eventTypesList.length === 0" class="no-events-message">
          <p>Aucun type d'événement disponible. Veuillez d'abord créer un type d'événement dans les paramètres.</p>
        </div>

        <div v-if="selectedEventType" class="selected-event-type">
          <span class="event-type-badge" :style="{ backgroundColor: selectedEventType.color }">
            {{ selectedEventType.name }}
          </span>
        </div>

        <!-- Sélection de la date de début si pas de date sélectionnée -->
        <div v-if="!selectedDate" class="date-selection">
          <h4>Date de début :</h4>
          <Datepicker
            v-model="startDatePicker"
            :enable-time-picker="false"
            :locale="fr"
            @update:model-value="handleStartDateChange"
            placeholder="Sélectionner une date de début"
          />
        </div>

        <div v-if="selectedDate" class="period-selection">
          <h4>Période :</h4>
          <div class="period-buttons">
            <button
              :class="['period-btn', { active: selectedPeriod === 'full' }]"
              @click="selectedPeriod = 'full'"
            >
              Journée complète
            </button>
            <button
              :class="['period-btn', { active: selectedPeriod === 'morning' }]"
              @click="selectedPeriod = 'morning'"
            >
              Matin
            </button>
            <button
              :class="['period-btn', { active: selectedPeriod === 'afternoon' }]"
              @click="selectedPeriod = 'afternoon'"
            >
              Après-midi
            </button>
          </div>
        </div>

        <!-- Section Récurrence -->
        <div class="recurrence-section">
          <div class="recurrence-type-selector">
            <label>Type de récurrence :</label>
            <select v-model="recurrenceType" @change="handleRecurrenceTypeChange">
              <option value="weekly">Hebdomadaire</option>
              <option value="monthly">Mensuel</option>
              <option value="yearly">Annuel</option>
            </select>
          </div>
          
          <!-- Options hebdomadaires -->
          <div v-if="recurrenceType === 'weekly'" class="recurrence-weekly-options">
            <label>Répéter chaque :</label>
            <div class="recurrence-interval">
              <input 
                type="number" 
                v-model.number="recurrenceInterval" 
                min="1" 
                max="52"
                class="interval-input"
              />
              <span>semaine(s)</span>
            </div>
            
            <div class="days-of-week">
              <label 
                v-for="day in daysOfWeek" 
                :key="day.value"
                class="day-checkbox"
                :class="{ active: selectedDays.includes(day.value) }"
              >
                <input 
                  type="checkbox" 
                  :value="day.value"
                  v-model="selectedDays"
                />
                {{ day.label }}
              </label>
            </div>
          </div>
          
          <!-- Options mensuelles -->
          <div v-if="recurrenceType === 'monthly'" class="recurrence-monthly-options">
            <label>Répéter :</label>
            <select v-model="monthlyRecurrenceMode">
              <option value="dayOfMonth">Le même jour chaque mois</option>
              <option value="dayOfWeek">Le même jour de semaine</option>
            </select>
            
            <div v-if="monthlyRecurrenceMode === 'dayOfWeek'" class="monthly-day-of-week">
              <select v-model="monthlyWeekOfMonth">
                <option :value="1">Premier</option>
                <option :value="2">Deuxième</option>
                <option :value="3">Troisième</option>
                <option :value="4">Quatrième</option>
                <option :value="-1">Dernier</option>
              </select>
              <select v-model="monthlyDayOfWeek">
                <option v-for="day in daysOfWeek" :key="day.value" :value="day.value">
                  {{ day.label }}
                </option>
              </select>
            </div>
          </div>
          
          <!-- Options annuelles -->
          <div v-if="recurrenceType === 'yearly'" class="recurrence-yearly-options">
            <p v-if="selectedDate">Répéter chaque année le même jour ({{ formatDate(selectedDate) }})</p>
            <p v-else>Répéter chaque année le même jour</p>
          </div>
          
          <!-- Date de fin -->
          <div class="recurrence-end-date">
            <div v-if="recurringDateRange" class="date-range-note">
              <p>La récurrence sera limitée à la période sélectionnée : {{ formatDateRange(recurringDateRange) }}</p>
            </div>
            <div v-else class="end-date-picker">
              <div style="display: flex; align-items: center; gap: 10px;">
                <label>Date de fin :</label>
                <Datepicker 
                  v-model="recurrenceEndDate"
                  :min-date="selectedDate"
                  :max-date="selectedDate ? getEndOfYear(selectedDate) : null"
                  :locale="fr"
                  placeholder="Sélectionner une date de fin"
                />
              </div>
              <span class="date-hint" v-if="selectedDate">
                (fin de l'année : {{ getEndOfYear(selectedDate).toLocaleDateString('fr-FR') }})
              </span>
            </div>
          </div>
          
          <!-- Prévisualisation -->
          <div v-if="recurrencePreview.length > 0" class="recurrence-preview">
            <p><strong>Prévisualisation ({{ recurrencePreview.length }} occurrences) :</strong></p>
            <div class="preview-dates">
              <span 
                v-for="(date, index) in recurrencePreview.slice(0, 10)" 
                :key="index"
                class="preview-date"
              >
                {{ formatDateShort(date) }}
              </span>
              <span v-if="recurrencePreview.length > 10" class="preview-more">
                + {{ recurrencePreview.length - 10 }} autres...
              </span>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-secondary" @click="closeModal">
            Annuler
          </button>
          <button 
            v-if="selectedEventTypeId && selectedDate"
            class="btn-primary" 
            @click="createRecurringEvent"
            :disabled="recurrencePreview.length === 0"
          >
            Créer en récurrent ({{ recurrencePreview.length }} occurrences)
          </button>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { computed, watch, ref, onMounted } from 'vue'
import { VueDatePicker as Datepicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { fr } from 'date-fns/locale/fr'
import { useUIStore } from '../../stores/ui'
import { useRecurringEventsStore } from '../../stores/recurringEvents'
import { useLeaveTypesStore } from '../../stores/leaveTypes'
import { useToast } from '../../composables/useToast'
import { generateRecurringOccurrences } from '../../services/recurrence'
import Modal from '../common/Modal.vue'
import logger from '../../services/logger'
import { handleError } from '../../services/errorHandler'

const uiStore = useUIStore()
const recurringEventsStore = useRecurringEventsStore()
const leaveTypesStore = useLeaveTypesStore()
const { error: showErrorToast, success: showSuccessToast } = useToast()

const showModal = computed(() => uiStore.showRecurringEventModal)
const recurringDateRange = computed(() => uiStore.recurringEventDateRange)

// Date sélectionnée : priorité à la plage de dates, puis date du picker, puis date du store
const startDatePicker = ref(null)
const selectedDate = computed(() => {
  // Si une plage de dates est fournie, utiliser la date de début
  if (recurringDateRange.value && Array.isArray(recurringDateRange.value) && recurringDateRange.value.length === 2) {
    return recurringDateRange.value[0]
  }
  // Utiliser la date du picker si définie
  if (startDatePicker.value) {
    return startDatePicker.value
  }
  // Sinon utiliser la date sélectionnée dans le store ou la date du jour
  return uiStore.selectedDate || new Date()
})

// Synchroniser selectedEventTypeId avec le store
const selectedEventTypeId = ref(uiStore.selectedEventTypeId || null)

// Surveiller les changements de selectedEventTypeId dans le store
watch(() => uiStore.selectedEventTypeId, (newId) => {
  selectedEventTypeId.value = newId || null
}, { immediate: true })

// Liste des types d'événements
const eventTypesList = computed(() => {
  return leaveTypesStore.leaveTypes.filter(type => type.category === 'event')
})

const selectedEventType = computed(() => {
  if (!selectedEventTypeId.value) return null
  return leaveTypesStore.getLeaveType(selectedEventTypeId.value)
})

// Synchroniser selectedPeriod avec le store
const selectedPeriod = ref(uiStore.selectedPeriod || 'full')

// Surveiller les changements de selectedPeriod dans le store
watch(() => uiStore.selectedPeriod, (newPeriod) => {
  if (newPeriod) {
    selectedPeriod.value = newPeriod
  }
}, { immediate: true })

const recurrenceType = ref('weekly')
const recurrenceInterval = ref(1)
const selectedDays = ref([])
const recurrenceEndDate = ref(null)
const monthlyRecurrenceMode = ref('dayOfMonth')
const monthlyWeekOfMonth = ref(1)
const monthlyDayOfWeek = ref(1)
const recurrencePreview = ref([])

const daysOfWeek = [
  { value: 0, label: 'Dim' },
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mer' },
  { value: 4, label: 'Jeu' },
  { value: 5, label: 'Ven' },
  { value: 6, label: 'Sam' }
]

function formatDate(date, options = {}) {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  })
}

function formatDateShort(date) {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  })
}

const formattedDate = computed(() => {
  if (!selectedDate.value) return ''
  return formatDate(selectedDate.value)
})

function formatDateRange(range) {
  if (!range || !Array.isArray(range) || range.length !== 2) return ''
  return `${range[0].toLocaleDateString('fr-FR')} - ${range[1].toLocaleDateString('fr-FR')}`
}

function handleStartDateChange(date) {
  if (date) {
    startDatePicker.value = date
    // Initialiser avec le jour de la semaine si récurrence hebdomadaire et aucun jour sélectionné
    if (recurrenceType.value === 'weekly' && selectedDays.value.length === 0) {
      selectedDays.value = [date.getDay()]
    }
    // Mettre à jour la prévisualisation si un type d'événement est sélectionné
    if (selectedEventTypeId.value) {
      updateRecurrencePreview()
    }
  }
}

function handleRecurrenceTypeChange() {
  if (selectedDate.value) {
    const dayOfWeek = selectedDate.value.getDay()
    if (recurrenceType.value === 'weekly' && selectedDays.value.length === 0) {
      selectedDays.value = [dayOfWeek]
    }
    updateRecurrencePreview()
  }
}

// Surveiller les changements pour mettre à jour la prévisualisation
watch([selectedDays, recurrenceInterval, recurrenceType, recurrenceEndDate, monthlyRecurrenceMode, monthlyWeekOfMonth, monthlyDayOfWeek, selectedDate, selectedPeriod, recurringDateRange, selectedEventTypeId], () => {
  if (selectedDate.value && selectedEventTypeId.value) {
    updateRecurrencePreview()
  }
}, { deep: true })

// Fonction pour obtenir la fin de l'année d'une date
function getEndOfYear(date) {
  const endOfYear = new Date(date)
  endOfYear.setMonth(11, 31)
  endOfYear.setHours(23, 59, 59, 999)
  return endOfYear
}

// Surveiller l'ouverture de la modale pour initialiser/réinitialiser certaines valeurs
watch(showModal, (isOpen) => {
  if (isOpen) {
    // Si un eventTypeId est passé depuis le store, l'utiliser, sinon réinitialiser à null
    // Cela permet d'afficher la sélection de type si aucun type n'est pré-sélectionné
    if (uiStore.selectedEventTypeId) {
      selectedEventTypeId.value = uiStore.selectedEventTypeId
    } else {
      selectedEventTypeId.value = null
    }
    
    // Initialiser startDatePicker si une date est sélectionnée dans le store et qu'aucune plage de dates n'est définie
    if (uiStore.selectedDate && !recurringDateRange.value) {
      startDatePicker.value = uiStore.selectedDate
    }
    
    // Initialiser la date de fin par défaut (fin de l'année) si pas déjà définie
    if (!recurrenceEndDate.value && selectedDate.value) {
      recurrenceEndDate.value = getEndOfYear(selectedDate.value)
    }
    
    // Initialiser les jours sélectionnés si récurrence hebdomadaire et qu'aucun jour n'est sélectionné
    if (selectedDate.value && recurrenceType.value === 'weekly' && selectedDays.value.length === 0) {
      selectedDays.value = [selectedDate.value.getDay()]
    }
    
    // Réinitialiser la prévisualisation (sera recalculée par les autres watches)
    recurrencePreview.value = []
  }
}, { immediate: true })

// Mettre à jour la date de fin quand la date de début change
watch(selectedDate, (newDate) => {
  if (newDate && showModal.value) {
    // Si la date de fin actuelle est après la fin de l'année de la nouvelle date de début, la réinitialiser
    if (!recurrenceEndDate.value || recurrenceEndDate.value > getEndOfYear(newDate)) {
      recurrenceEndDate.value = getEndOfYear(newDate)
    }
  }
})

// Initialiser avec le jour de la semaine sélectionné quand la date change
watch(selectedDate, (newDate) => {
  if (newDate && showModal.value) {
    // Si récurrence hebdomadaire et aucun jour sélectionné, initialiser avec le jour de la date
    if (recurrenceType.value === 'weekly' && selectedDays.value.length === 0) {
      selectedDays.value = [newDate.getDay()]
    }
    // Mettre à jour la prévisualisation si un type d'événement est sélectionné
    if (selectedEventTypeId.value) {
      updateRecurrencePreview()
    }
  }
})

function updateRecurrencePreview() {
  if (!selectedDate.value || !selectedEventTypeId.value) {
    recurrencePreview.value = []
    return
  }
  
  const eventType = selectedEventType.value
  if (!eventType) {
    recurrencePreview.value = []
    return
  }

  const startDate = selectedDate.value
  // Si une plage de dates est fournie, l'utiliser comme période de validité
  let endDate
  
  if (recurringDateRange.value && Array.isArray(recurringDateRange.value) && recurringDateRange.value.length === 2) {
    endDate = new Date(recurringDateRange.value[1])
  } else if (recurrenceEndDate.value) {
    endDate = recurrenceEndDate.value
  } else {
    // Par défaut, utiliser la fin de l'année
    endDate = getEndOfYear(startDate)
  }

  const pattern = buildRecurrencePattern()
  if (!pattern) {
    recurrencePreview.value = []
    return
  }

  const recurringEvent = {
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate ? endDate.toISOString().split('T')[0] : null,
    recurrence_type: recurrenceType.value,
    recurrence_pattern: pattern,
    period: selectedPeriod.value || 'full',
    leave_type_id: selectedEventTypeId.value,
    max_occurrences: null
  }

  try {
    const occurrences = generateRecurringOccurrences(
      recurringEvent,
      startDate,
      endDate,
      uiStore.selectedCountry
    )
    
    recurrencePreview.value = occurrences.map(occ => occ.date)
  } catch (error) {
    logger.error('Erreur lors de la génération de la prévisualisation:', error)
    recurrencePreview.value = []
  }
}

function buildRecurrencePattern() {
  if (!selectedDate.value) {
    return null
  }
  
  switch (recurrenceType.value) {
    case 'weekly':
      if (selectedDays.value.length === 0) {
        return null
      }
      return {
        type: 'weekly',
        daysOfWeek: selectedDays.value,
        interval: recurrenceInterval.value
      }
    case 'monthly':
      if (monthlyRecurrenceMode.value === 'dayOfMonth') {
        return {
          type: 'monthly',
          dayOfMonth: selectedDate.value.getDate(),
          interval: 1
        }
      } else {
        return {
          type: 'monthly',
          dayOfWeek: monthlyDayOfWeek.value,
          weekOfMonth: monthlyWeekOfMonth.value,
          interval: 1
        }
      }
    case 'yearly':
      return {
        type: 'yearly',
        month: selectedDate.value.getMonth(),
        day: selectedDate.value.getDate(),
        interval: 1
      }
    default:
      return null
  }
}

async function createRecurringEvent() {
  if (!selectedEventTypeId.value || !selectedDate.value) {
    showErrorToast('Configuration incomplète')
    return
  }

  const pattern = buildRecurrencePattern()
  if (!pattern) {
    showErrorToast('Configuration de récurrence invalide')
    return
  }

  try {
    const startDate = selectedDate.value
    // Si une plage de dates est fournie, l'utiliser comme période de validité
    let endDate = null
    
    if (recurringDateRange.value && Array.isArray(recurringDateRange.value) && recurringDateRange.value.length === 2) {
      endDate = recurringDateRange.value[1]
    } else if (recurrenceEndDate.value) {
      endDate = recurrenceEndDate.value
    } else {
      // Par défaut, utiliser la fin de l'année
      endDate = getEndOfYear(startDate)
    }

    await recurringEventsStore.createRecurringEvent({
      leave_type_id: selectedEventTypeId.value,
      period: selectedPeriod.value || 'full',
      recurrence_type: recurrenceType.value,
      recurrence_pattern: pattern,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate ? endDate.toISOString().split('T')[0] : null,
      max_occurrences: null,
      excluded_dates: [],
      name: null,
      is_active: true
    })

    showSuccessToast(`Événement récurrent créé avec ${recurrencePreview.value.length} occurrence(s)`)
    closeModal()
  } catch (error) {
    handleError(error, {
      context: 'RecurringEventModal.createRecurringEvent',
      showToast: true
    })
  }
}

function closeModal() {
  // Réinitialiser les valeurs locales
  selectedEventTypeId.value = null
  selectedPeriod.value = 'full'
  recurrenceType.value = 'weekly'
  recurrenceInterval.value = 1
  selectedDays.value = []
  recurrenceEndDate.value = null
  monthlyRecurrenceMode.value = 'dayOfMonth'
  monthlyWeekOfMonth.value = 1
  monthlyDayOfWeek.value = 1
  recurrencePreview.value = []
  startDatePicker.value = null
  
  // Fermer la modale (cela réinitialisera aussi selectedEventTypeId dans le store)
  uiStore.closeRecurringEventModal()
}
</script>

<style scoped>
/* Le padding est déjà géré par le composant Modal */

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

.selected-event-type {
  margin-top: 10px;
}

.date-range-info {
  margin-top: 10px;
  padding: 8px;
  background: var(--card-bg);
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.range-display {
  margin: 0;
  font-size: 0.9em;
  color: var(--text-color);
}

.date-range-note {
  margin-top: 10px;
  padding: 10px;
  background: var(--bg-color, #f5f5f5);
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.date-range-note p {
  margin: 0;
  font-size: 0.9em;
  color: var(--text-color);
  font-style: italic;
}

.event-type-selection {
  margin-bottom: 20px;
}

.event-type-selection h4 {
  margin-bottom: 15px;
  font-size: 1em;
  color: var(--text-color);
}

.event-types-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
}

.event-type-btn {
  padding: 10px 16px;
  border: 2px solid;
  border-radius: 4px;
  background: var(--card-bg);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9em;
  font-weight: 500;
}

.event-type-btn:hover {
  opacity: 0.8;
  transform: translateY(-2px);
}

.event-type-btn.active {
  color: white;
}

.selected-event-type {
  margin: 15px 0;
  text-align: center;
}

.date-selection {
  margin-bottom: 20px;
}

.date-selection h4 {
  margin-bottom: 10px;
  font-size: 1em;
  color: var(--text-color);
}

.event-type-badge {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 4px;
  color: white;
  font-weight: 600;
}

.period-selection {
  margin-bottom: 20px;
}

.period-selection h4 {
  margin-bottom: 10px;
  font-size: 1em;
  color: var(--text-color);
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

.recurrence-section {
  margin-bottom: 20px;
  padding: 15px;
  background: var(--bg-color, #f5f5f5);
  border-radius: 8px;
  border: 1px solid var(--border-color, #e0e0e0);
}

.recurrence-type-selector {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.recurrence-type-selector label {
  font-weight: 500;
  min-width: 150px;
}

.recurrence-type-selector select {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--card-bg);
  color: var(--text-color);
}

.recurrence-weekly-options,
.recurrence-monthly-options,
.recurrence-yearly-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 15px;
}

.recurrence-interval {
  display: flex;
  align-items: center;
  gap: 10px;
}

.interval-input {
  width: 60px;
  padding: 6px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  text-align: center;
}

.days-of-week {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.day-checkbox {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border: 2px solid var(--border-color);
  border-radius: 4px;
  background: var(--card-bg);
  cursor: pointer;
  transition: all 0.2s;
}

.day-checkbox:hover {
  border-color: var(--primary-color);
}

.day-checkbox.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.day-checkbox input[type="checkbox"] {
  margin-right: 6px;
  cursor: pointer;
}

.monthly-day-of-week {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.monthly-day-of-week select {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--card-bg);
  color: var(--text-color);
}

.recurrence-end-date {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 15px;
}

.recurrence-end-date label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.end-date-picker {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.end-date-picker > label {
  min-width: 120px;
  font-weight: 500;
}

.date-hint {
  font-size: 0.85em;
  color: var(--text-color);
  opacity: 0.7;
  font-style: italic;
  margin-left: 10px;
}

.recurrence-preview {
  margin-top: 15px;
  padding: 12px;
  background: var(--card-bg);
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.recurrence-preview p {
  margin: 0 0 8px 0;
  font-size: 0.9em;
}

.preview-dates {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.preview-date {
  padding: 4px 8px;
  background: var(--bg-color);
  border-radius: 4px;
  font-size: 0.85em;
  color: var(--text-color);
}

.preview-more {
  padding: 4px 8px;
  font-size: 0.85em;
  color: var(--text-color);
  opacity: 0.7;
  font-style: italic;
}

.modal-actions {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 20px;
}

.btn-primary,
.btn-secondary {
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #357abd;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--border-color);
  color: var(--text-color);
}

.btn-secondary:hover {
  background: #d0d0d0;
}

/* Mode sombre */
[data-theme="dark"] .recurrence-section {
  background: var(--card-bg, #2d2d2d);
  border-color: var(--border-color, #404040);
}

[data-theme="dark"] .day-checkbox {
  background: var(--card-bg, #2d2d2d);
  border-color: var(--border-color, #404040);
}

.no-events-message {
  padding: 20px;
  text-align: center;
  color: var(--text-color);
  background: var(--bg-color, #f5f5f5);
  border-radius: 4px;
  margin: 20px 0;
}

.no-events-message p {
  margin: 0;
  font-size: 0.9em;
}
</style>

