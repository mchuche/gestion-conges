<template>
  <Modal :model-value="showModal" @close="closeModal">
    <template #header>
      <h3>Créer un événement récurrent</h3>
    </template>
    
    <template #body>
      <div v-if="selectedDate && selectedEventType" class="modal-content">
        <div class="selected-date-info">
          <p class="date-display">{{ formattedDate }}</p>
          <div class="selected-event-type">
            <span class="event-type-badge" :style="{ backgroundColor: selectedEventType.color }">
              {{ selectedEventType.name }}
            </span>
          </div>
        </div>

        <div class="period-selection">
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
            <p>Répéter chaque année le même jour ({{ formatDate(selectedDate) }})</p>
          </div>
          
          <!-- Date de fin -->
          <div class="recurrence-end-date">
            <label>
              <input type="checkbox" v-model="noEndDate" />
              Sans fin
            </label>
            <div v-if="!noEndDate" class="end-date-picker">
              <label>Jusqu'à :</label>
              <Datepicker 
                v-model="recurrenceEndDate"
                :min-date="selectedDate"
                :locale="fr"
              />
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
const selectedDate = computed(() => uiStore.selectedDate)
const selectedEventTypeId = computed(() => uiStore.selectedEventTypeId)

const selectedEventType = computed(() => {
  if (!selectedEventTypeId.value) return null
  return leaveTypesStore.getLeaveType(selectedEventTypeId.value)
})

const selectedPeriod = ref('full')
const recurrenceType = ref('weekly')
const recurrenceInterval = ref(1)
const selectedDays = ref([])
const noEndDate = ref(true)
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
watch([selectedDays, recurrenceInterval, recurrenceType, recurrenceEndDate, noEndDate, monthlyRecurrenceMode, monthlyWeekOfMonth, monthlyDayOfWeek, selectedDate, selectedPeriod], () => {
  if (selectedDate.value) {
    updateRecurrencePreview()
  }
}, { deep: true })

// Initialiser avec le jour de la semaine sélectionné
watch(selectedDate, (newDate) => {
  if (newDate && recurrenceType.value === 'weekly' && selectedDays.value.length === 0) {
    selectedDays.value = [newDate.getDay()]
  }
  updateRecurrencePreview()
}, { immediate: true })

function updateRecurrencePreview() {
  if (!selectedDate.value || !selectedEventType.value) {
    recurrencePreview.value = []
    return
  }

  const startDate = selectedDate.value
  const endDate = noEndDate.value 
    ? new Date(startDate.getFullYear() + 1, 11, 31)
    : recurrenceEndDate.value || new Date(startDate.getFullYear() + 1, 11, 31)

  const pattern = buildRecurrencePattern()
  if (!pattern) {
    recurrencePreview.value = []
    return
  }

  const recurringEvent = {
    start_date: startDate.toISOString().split('T')[0],
    end_date: noEndDate.value ? null : endDate.toISOString().split('T')[0],
    recurrence_type: recurrenceType.value,
    recurrence_pattern: pattern,
    period: selectedPeriod.value || 'full',
    leave_type_id: selectedEventTypeId.value
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
    const endDate = noEndDate.value ? null : recurrenceEndDate.value

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
  uiStore.closeRecurringEventModal()
  // Réinitialiser les valeurs
  selectedPeriod.value = 'full'
  recurrenceType.value = 'weekly'
  recurrenceInterval.value = 1
  selectedDays.value = []
  noEndDate.value = true
  recurrenceEndDate.value = null
  monthlyRecurrenceMode.value = 'dayOfMonth'
  monthlyWeekOfMonth.value = 1
  monthlyDayOfWeek.value = 1
  recurrencePreview.value = []
}
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

.selected-event-type {
  margin-top: 10px;
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
  align-items: center;
  gap: 10px;
}

.end-date-picker label {
  min-width: 80px;
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
</style>

