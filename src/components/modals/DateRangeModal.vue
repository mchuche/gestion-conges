<template>
  <Modal v-if="showModal" :model-value="true" @close="handleCancel">
    <template #header>
      <h3>Sélectionner une plage de dates</h3>
    </template>

    <template #body>
      <p class="intro">
        Choisissez un <strong>type</strong>, une <strong>période</strong>, puis les dates de début et de fin.
        {{ rangeIntroHint }}
      </p>

      <div v-if="anchorDateLabel" class="anchor-hint">
        Point de départ au calendrier : <strong>{{ anchorDateLabel }}</strong>
      </div>

      <!-- Type d’événement (même principe que la modale récurrente) -->
      <div v-if="eventTypesList.length > 0" class="type-selection">
        <h4>Sélectionner un type d'événement :</h4>
        <div class="type-buttons-grid">
          <button
            v-for="type in eventTypesList"
            :key="type.id"
            type="button"
            :class="['type-btn', { active: selectedTypeId === type.id }]"
            :style="getTypeButtonStyle(type)"
            @click="selectType(type.id)"
          >
            {{ type.name }}
          </button>
        </div>
      </div>

      <!-- Types de congé (quota) -->
      <div v-if="leaveTypesList.length > 0" class="type-selection">
        <h4>Sélectionner un type de congé :</h4>
        <div class="type-buttons-grid">
          <button
            v-for="type in leaveTypesList"
            :key="type.id"
            type="button"
            :class="['type-btn', { active: selectedTypeId === type.id }]"
            :style="getTypeButtonStyle(type)"
            @click="selectType(type.id)"
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

      <!-- Période (matin / après-midi / journée) -->
      <div class="period-selection">
        <h4>Période :</h4>
        <div class="period-buttons">
          <button
            type="button"
            :class="['period-btn', { active: selectedPeriod === 'full' }]"
            @click="setPeriod('full')"
          >
            Journée complète
          </button>
          <button
            type="button"
            :class="['period-btn', { active: selectedPeriod === 'morning' }]"
            @click="setPeriod('morning')"
          >
            Matin
          </button>
          <button
            type="button"
            :class="['period-btn', { active: selectedPeriod === 'afternoon' }]"
            @click="setPeriod('afternoon')"
          >
            Après-midi
          </button>
        </div>
      </div>

      <div class="date-range-section">
        <div class="date-field">
          <h4>Date de début</h4>
          <Datepicker
            v-model="startDate"
            :dark="isDarkTheme"
            :time-picker="false"
            :locale="fr"
            :formats="dateFormats"
            :teleport="false"
            auto-apply
            :max-date="endDate || undefined"
            placeholder="Choisir le premier jour"
          />
        </div>

        <div class="date-field">
          <h4>Date de fin</h4>
          <Datepicker
            v-model="endDate"
            :dark="isDarkTheme"
            :time-picker="false"
            :locale="fr"
            :formats="dateFormats"
            :teleport="false"
            auto-apply
            :min-date="startDate || undefined"
            placeholder="Choisir le dernier jour"
          />
        </div>
      </div>

      <p v-if="rangeSummary" class="range-summary">
        <strong>Période :</strong> {{ rangeSummary }}
      </p>

      <p v-if="rangeOrderWarning" class="range-warning">
        La date de fin est antérieure au début : les dates seront inversées à l’application.
      </p>

      <div v-if="previewCount > 0" class="preview-box">
        <p>
          <strong>{{ previewCount }}</strong>
          jour{{ previewCount > 1 ? 's' : '' }} ouvré{{ previewCount > 1 ? 's' : '' }}
          {{ previewCount > 1 ? 'seront posés' : 'sera posé' }}
          <template v-if="selectedType"> en « {{ selectedType.name }} »</template>.
        </p>
        <ul v-if="previewSample.length" class="preview-list">
          <li v-for="(label, index) in previewSample" :key="index">{{ label }}</li>
        </ul>
        <p v-if="previewCount > previewSample.length" class="preview-more">
          + {{ previewCount - previewSample.length }} autre{{ previewCount - previewSample.length > 1 ? 's' : '' }}…
        </p>
      </div>

      <p v-else-if="startDate && endDate" class="preview-empty">
        Aucun jour ouvré dans cette plage (uniquement week-ends ou jours fériés).
      </p>

      <p v-if="!selectedTypeId && previewCount > 0" class="hint-select-type">
        Sélectionnez un type de congé ou d’événement pour activer le bouton d’application.
      </p>
    </template>

    <template #footer>
      <div class="footer-actions">
        <button type="button" class="btn-secondary" :disabled="isApplying" @click="handleCancel">
          Annuler
        </button>
        <button
          type="button"
          class="btn-primary"
          :disabled="!canApply"
          @click="handleApply"
        >
          {{ applyButtonLabel }}
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { VueDatePicker as Datepicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { fr } from 'date-fns/locale/fr'
import { useUIStore } from '../../stores/ui'
import { useLeaveTypesStore } from '../../stores/leaveTypes'
import { useLeaves } from '../../composables/useLeaves'
import { useToast } from '../../composables/useToast'
import Modal from '../common/Modal.vue'
import { handleError } from '../../services/errorHandler'
import logger from '../../services/logger'

const uiStore = useUIStore()
const leaveTypesStore = useLeaveTypesStore()
const { isWeekendOrHoliday, setLeave } = useLeaves()
const { error: showErrorToast, success: showSuccessToast } = useToast()

const showModal = computed(() => uiStore.showDateRangeModal)
const rangeIntroHint = computed(() =>
  uiStore.allowWeekendHolidayLeave
    ? 'Tous les jours de la plage seront posés d’un coup (y compris week-ends et fériés).'
    : 'Seuls les jours ouvrés de la plage seront posés (week-ends et fériés exclus).',
)
const isDarkTheme = computed(() => uiStore.theme === 'dark')
const selectedPeriod = computed(() => uiStore.selectedPeriod)

const dateFormats = { input: 'dd/MM/yyyy', preview: 'dd/MM/yyyy' }

const startDate = ref(null)
const endDate = ref(null)
/** Type choisi (congé ou événement) — obligatoire pour appliquer. */
const selectedTypeId = ref(null)
const isApplying = ref(false)

const leaveTypesList = computed(() =>
  leaveTypesStore.leaveTypes.filter((type) => type.category !== 'event'),
)

const eventTypesList = computed(() =>
  leaveTypesStore.leaveTypes.filter((type) => type.category === 'event'),
)

const hasAnyLeaveType = computed(
  () => leaveTypesList.value.length > 0 || eventTypesList.value.length > 0,
)

const selectedType = computed(() => {
  if (!selectedTypeId.value) return null
  return leaveTypesStore.getLeaveType(selectedTypeId.value)
})

const anchorDateLabel = computed(() => {
  const d = uiStore.selectedDate
  if (!d) return ''
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
})

function normalizeDate(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function getOrderedRange() {
  if (!startDate.value || !endDate.value) return null
  const start = normalizeDate(startDate.value)
  const end = normalizeDate(endDate.value)
  if (start.getTime() <= end.getTime()) {
    return [start, end]
  }
  return [end, start]
}

const rangeSummary = computed(() => {
  const range = getOrderedRange()
  if (!range) return ''
  const [start, end] = range
  return `${start.toLocaleDateString('fr-FR')} – ${end.toLocaleDateString('fr-FR')}`
})

const rangeOrderWarning = computed(() => {
  if (!startDate.value || !endDate.value) return false
  return normalizeDate(endDate.value).getTime() < normalizeDate(startDate.value).getTime()
})

function buildWorkingDaysInRange(start, end) {
  const days = []
  const currentDate = new Date(start)
  currentDate.setHours(0, 0, 0, 0)
  const last = new Date(end)
  last.setHours(0, 0, 0, 0)

  while (currentDate <= last) {
    if (!isWeekendOrHoliday(currentDate)) {
      days.push(new Date(currentDate))
    }
    currentDate.setDate(currentDate.getDate() + 1)
  }
  return days
}

const workingDaysInRange = computed(() => {
  const range = getOrderedRange()
  if (!range) return []
  return buildWorkingDaysInRange(range[0], range[1])
})

const previewCount = computed(() => workingDaysInRange.value.length)

const previewSample = computed(() =>
  workingDaysInRange.value
    .slice(0, 8)
    .map((date) =>
      date.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }),
    ),
)

const canApply = computed(
  () =>
    !isApplying.value &&
    previewCount.value > 0 &&
    !!selectedTypeId.value,
)

const applyButtonLabel = computed(() => {
  if (isApplying.value) return 'Application…'
  if (!selectedTypeId.value) return 'Choisir un type'
  if (previewCount.value === 0) return 'Appliquer la plage'
  return `Appliquer sur ${previewCount.value} jour${previewCount.value > 1 ? 's' : ''}`
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

function selectType(typeId) {
  selectedTypeId.value = typeId
}

function setPeriod(period) {
  uiStore.setSelectedPeriod(period)
}

watch(showModal, (isOpen) => {
  if (!isOpen) {
    startDate.value = null
    endDate.value = null
    selectedTypeId.value = null
    isApplying.value = false
    return
  }

  selectedTypeId.value = null

  const dates = uiStore.selectedDates
  if (dates.length >= 2) {
    const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime())
    startDate.value = normalizeDate(sorted[0])
    endDate.value = normalizeDate(sorted[sorted.length - 1])
    return
  }

  if (uiStore.selectedDate) {
    const anchor = normalizeDate(uiStore.selectedDate)
    startDate.value = new Date(anchor)
    endDate.value = new Date(anchor)
  }
})

function handleCancel() {
  uiStore.closeDateRangeModal({ reopenLeave: true })
}

/**
 * Pose le type choisi sur chaque jour ouvré de la plage, puis ferme les modales.
 */
async function handleApply() {
  if (!selectedTypeId.value) {
    showErrorToast('Sélectionnez un type de congé ou d’événement.')
    return
  }

  const days = workingDaysInRange.value
  if (days.length === 0) {
    showErrorToast('Aucun jour ouvré dans cette plage.')
    return
  }

  const period = selectedPeriod.value || 'full'
  const typeId = selectedTypeId.value

  logger.log('[DateRangeModal] Application plage:', {
    typeId,
    period,
    days: days.length,
  })

  isApplying.value = true
  try {
    for (const date of days) {
      await setLeave(date, typeId, period)
    }

    const typeName = selectedType.value?.name || 'sélection'
    showSuccessToast(
      `${days.length} jour${days.length > 1 ? 's' : ''} posé${days.length > 1 ? 's' : ''} en « ${typeName} ».`,
    )

    uiStore.closeDateRangeModal({ reopenLeave: false })
    uiStore.closeModal()
  } catch (error) {
    if (error.code === 'WEEKEND_OR_HOLIDAY') {
      showErrorToast(error.message)
      return
    }
    handleError(error, {
      context: 'DateRangeModal.handleApply',
      showToast: true,
    })
  } finally {
    isApplying.value = false
  }
}
</script>

<style scoped>
.intro {
  margin: 0 0 16px;
  font-size: 0.95em;
  color: var(--text-color);
  line-height: 1.45;
}

.anchor-hint {
  margin: 0 0 16px;
  font-size: 0.9em;
  color: var(--text-color);
  opacity: 0.85;
}

/* Titres à gauche, boutons centrés */
.type-selection {
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
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

.type-btn {
  min-width: 140px;
  padding: 10px 14px;
  border: 2px solid;
  border-radius: 4px;
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

.selected-type-badge {
  margin: 0 0 16px;
  text-align: center;
}

.type-badge {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 4px;
  color: white;
  font-weight: 600;
}

.no-types-message,
.hint-select-type {
  margin: 0 0 12px;
  font-size: 0.9em;
  color: var(--text-color);
  opacity: 0.9;
}

.hint-select-type {
  color: var(--warning-color, #e67e22);
}

.period-selection {
  margin-bottom: 20px;
}

.period-selection h4 {
  margin: 0 0 10px;
  font-size: 1em;
  color: var(--text-color);
  font-weight: 600;
}

.period-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.period-btn {
  flex: 1;
  min-width: 110px;
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

.date-range-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 16px;
}

.date-field h4 {
  margin: 0 0 10px;
  font-size: 1em;
  color: var(--text-color);
  font-weight: 600;
}

.date-field :deep(.dp__main) {
  font-family: inherit;
}

.date-field :deep(.dp__input_wrap) {
  width: 100%;
}

.range-summary {
  margin: 0 0 12px;
  font-size: 0.95em;
  color: var(--text-color);
}

.range-warning {
  margin: 0 0 12px;
  font-size: 0.85em;
  color: var(--warning-color, #e67e22);
}

.preview-box {
  padding: 12px;
  background: var(--bg-color, #f5f5f5);
  border-radius: 6px;
  font-size: 0.9em;
  color: var(--text-color);
}

.preview-empty {
  margin: 0;
  font-size: 0.9em;
  color: var(--text-color);
  opacity: 0.85;
}

.preview-list {
  margin: 8px 0 0;
  padding-left: 1.2em;
}

.preview-more {
  margin: 8px 0 0;
  opacity: 0.75;
  font-size: 0.85em;
}

.footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-primary,
.btn-secondary {
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

.btn-primary:hover:not(:disabled) {
  background: #357abd;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--border-color, #ccc);
  color: var(--text-color);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--hover-color, #e0e0e0);
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
