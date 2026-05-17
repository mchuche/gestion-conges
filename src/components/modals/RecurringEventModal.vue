<template>
  <Modal v-if="showModal" :model-value="true" elevated @close="closeModal">
    <template #header>
      <h3>Créer un événement récurrent</h3>
    </template>
    
    <template #body>
      <p class="intro">
        Choisissez un <strong>type</strong>, une <strong>période</strong>, la date de début et les règles de récurrence.
        Un aperçu des occurrences s'affiche avant validation.
      </p>

      <div v-if="selectedDate" class="selected-date-info">
          <p class="date-display">{{ formattedDate }}</p>
          <div v-if="recurringDateRange" class="date-range-info">
            <p class="range-display">
              <strong>Période :</strong> {{ formatDateRange(recurringDateRange) }}
            </p>
          </div>
        </div>

        <!-- Types : grilles toujours visibles -->
        <div v-if="eventTypesList.length > 0" class="type-selection">
          <h4>Sélectionner un type d'événement :</h4>
          <div class="type-buttons-grid">
            <button
              v-for="type in eventTypesList"
              :key="type.id"
              type="button"
              :class="['type-btn', { active: selectedTypeId === type.id }]"
              :style="getTypeButtonStyle(type)"
              @click.stop="selectType(type.id)"
            >
              {{ type.name }}
            </button>
          </div>
        </div>

        <div v-if="leaveTypesList.length > 0" class="type-selection">
          <h4>Sélectionner un type de congé :</h4>
          <div class="type-buttons-grid">
            <button
              v-for="type in leaveTypesList"
              :key="type.id"
              type="button"
              :class="['type-btn', { active: selectedTypeId === type.id }]"
              :style="getTypeButtonStyle(type)"
              @click.stop="selectType(type.id)"
            >
              {{ type.name }}
            </button>
          </div>
        </div>

        <p v-if="!hasAnyLeaveType" class="no-types-message">
          Aucun type disponible. Créez des types dans les paramètres.
        </p>

        <div v-if="selectedType" class="selected-type-badge">
          <span class="type-badge" :style="{ backgroundColor: selectedType.color }">
            {{ selectedType.name }}
          </span>
        </div>

        <!-- Sélection de la date de début si pas de date sélectionnée -->
        <div v-if="!selectedDate" class="date-selection">
          <h4>Date de début :</h4>
          <Datepicker
            v-model="startDatePicker"
            :dark="isDarkTheme"
            :time-picker="false"
            :locale="fr"
            :formats="dateFormats"
            :teleport="false"
            auto-apply
            @update:model-value="handleStartDateChange"
            placeholder="Choisir le premier jour"
          />
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
                  :dark="isDarkTheme"
                  :time-picker="false"
                  :locale="fr"
                  :formats="dateFormats"
                  :teleport="false"
                  auto-apply
                  :min-date="selectedDate"
                  :max-date="selectedDate ? getEndOfYear(selectedDate) : null"
                  placeholder="Choisir le dernier jour"
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

      <p v-if="!selectedTypeId && selectedDate" class="hint-select-type">
        Sélectionnez un type de congé ou d'événement pour activer la création.
      </p>
      <p v-if="selectedTypeId && selectedDate && recurrencePreview.length === 0" class="hint-select-type">
        Complétez la configuration de récurrence (jours, date de fin…) pour générer un aperçu.
      </p>
    </template>

    <template #footer>
      <div class="footer-actions">
        <button type="button" class="btn-secondary" :disabled="isCreating" @click="closeModal">
          Annuler
        </button>
        <button
          type="button"
          class="btn-primary"
          :disabled="!canCreate"
          @click="createRecurringEvent"
        >
          {{ createButtonLabel }}
        </button>
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
  // Sinon utiliser la date sélectionnée dans le store (sinon null => on affiche le Datepicker)
  return uiStore.selectedDate || null
})

// Type choisi (congé ou événement) — état local uniquement (comme DateRangeModal)
const selectedTypeId = ref(null)

/** Sélection du type : pas d’écriture dans le store (évite les watchers qui réinitialisent). */
function selectType(typeId) {
  selectedTypeId.value = typeId
}

// Liste des types d'événements
const eventTypesList = computed(() => {
  return leaveTypesStore.leaveTypes.filter(type => type.category === 'event')
})

const selectedType = computed(() => {
  if (!selectedTypeId.value) return null
  return leaveTypesStore.getLeaveType(selectedTypeId.value)
})

const leaveTypesList = computed(() =>
  leaveTypesStore.leaveTypes.filter((type) => type.category !== 'event'),
)

const hasAnyLeaveType = computed(
  () => leaveTypesList.value.length > 0 || eventTypesList.value.length > 0,
)

const isDarkTheme = computed(() => uiStore.theme === 'dark')
const dateFormats = { input: 'dd/MM/yyyy', preview: 'dd/MM/yyyy' }
const isCreating = ref(false)

const canCreate = computed(
  () =>
    !isCreating.value &&
    !!selectedTypeId.value &&
    !!selectedDate.value &&
    recurrencePreview.value.length > 0,
)

const createButtonLabel = computed(() => {
  if (isCreating.value) return 'Création…'
  if (!selectedTypeId.value) return 'Choisir un type'
  if (!selectedDate.value) return 'Choisir une date de début'
  if (recurrencePreview.value.length === 0) return 'Configurer la récurrence'
  const n = recurrencePreview.value.length
  return `Créer en récurrent (${n} occurrence${n > 1 ? 's' : ''})`
})

function getTypeButtonStyle(type) {
  const isSelected = selectedTypeId.value === type.id
  const isDark = isDarkTheme.value
  const defaultBg = isDark ? 'var(--card-bg)' : 'transparent'
  return {
    borderColor: type.color,
    backgroundColor: isSelected ? type.color : defaultBg,
    color: isSelected ? 'white' : type.color,
  }
}

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
    if (selectedTypeId.value) {
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
watch([selectedDays, recurrenceInterval, recurrenceType, recurrenceEndDate, monthlyRecurrenceMode, monthlyWeekOfMonth, monthlyDayOfWeek, selectedDate, selectedPeriod, recurringDateRange, selectedTypeId], () => {
  if (selectedDate.value && selectedTypeId.value) {
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

// À l’ouverture uniquement (pas à chaque re-render)
watch(showModal, (isOpen, wasOpen) => {
  if (!isOpen || wasOpen) return

  // Nettoyer d’éventuels calendriers téléportés restés dans le DOM (bloquaient les clics)
  document.querySelectorAll('.dp--menu-wrapper').forEach((el) => el.remove())

  selectedTypeId.value = uiStore.selectedEventTypeId || null // type pré-sélectionné à l’ouverture si fourni

  // Initialiser startDatePicker si une date est sélectionnée dans le store
  if (uiStore.selectedDate && !recurringDateRange.value) {
    startDatePicker.value = new Date(uiStore.selectedDate)
  }

  if (!recurrenceEndDate.value && selectedDate.value) {
    recurrenceEndDate.value = getEndOfYear(selectedDate.value)
  }

  if (selectedDate.value && recurrenceType.value === 'weekly' && selectedDays.value.length === 0) {
    selectedDays.value = [selectedDate.value.getDay()]
  }

  recurrencePreview.value = []
})

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
    if (selectedTypeId.value) {
      updateRecurrencePreview()
    }
  }
})

function updateRecurrencePreview() {
  if (!selectedDate.value || !selectedTypeId.value) {
    recurrencePreview.value = []
    return
  }
  
  // Type choisi (congé ou événement) — selectedType, pas selectedEventType (ref inexistante)
  const eventType = selectedType.value
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
    leave_type_id: selectedTypeId.value,
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
  if (!canCreate.value) {
      if (!selectedTypeId.value) showErrorToast("Sélectionnez un type de congé ou d'événement.")
    else if (!selectedDate.value) showErrorToast('Sélectionnez une date de début.')
    else showErrorToast('Configuration de récurrence invalide ou sans occurrence.')
    return
  }

  const pattern = buildRecurrencePattern()
  if (!pattern) {
    showErrorToast('Configuration de récurrence invalide')
    return
  }

  isCreating.value = true
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
      leave_type_id: selectedTypeId.value,
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
  } finally {
    isCreating.value = false
  }
}

function closeModal() {
  // Réinitialiser les valeurs locales
  selectedTypeId.value = null
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
  isCreating.value = false

  // Fermer la modale (cela réinitialisera aussi selectedEventTypeId dans le store)
  uiStore.closeRecurringEventModal()
}
</script>

<style scoped>
/* Le padding est déjà géré par le composant Modal */

.intro {
  margin: 0 0 16px;
  font-size: 0.95em;
  color: var(--text-color);
  line-height: 1.45;
}

.hint-select-type {
  margin: 0 0 12px;
  font-size: 0.9em;
  color: var(--warning-color, #e67e22);
}

.footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
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

.selected-type-badge {
  margin: 0 0 16px;
  text-align: center;
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

/* Titres à gauche, boutons centrés (z-index > menus datepicker) */
.type-selection {
  position: relative;
  z-index: 10;
  margin-bottom: 18px;
}

.type-selection h4 {
  margin: 0 0 10px;
  padding-left: 8px;
  font-size: 1em;
  color: var(--text-color);
  font-weight: 600;
  text-align: left;
}

.type-buttons-grid {
  position: relative;
  z-index: 10;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

.type-btn {
  position: relative;
  z-index: 10;
  min-width: 140px;
  padding: 10px 14px;
  border: 2px solid;
  border-radius: 4px;
  background: var(--card-bg);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9em;
  font-weight: 500;
  text-align: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.type-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.type-btn.active {
  color: white;
}

.selected-event-type {
  margin: 15px 0;
  text-align: center;
}

/* Menus datepicker : ne pas recouvrir la grille de types (téléport désactivé) */
:deep(.dp--menu-wrapper) {
  z-index: 1 !important;
}

.date-selection {
  margin-bottom: 20px;
  position: relative;
  z-index: 1;
}

.date-selection h4 {
  margin-bottom: 10px;
  font-size: 1em;
  color: var(--text-color);
}

.type-badge {
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
  padding: 8px 0;
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

.btn-secondary:hover:not(:disabled) {
  background: #d0d0d0;
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Mode sombre - styles supprimés pour simplifier */

[data-theme="dark"] .day-checkbox {
  background: var(--card-bg, #2d2d2d);
  border-color: var(--border-color, #404040);
}

.no-types-message {
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
