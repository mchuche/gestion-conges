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
              Voir la sélection
            </button>
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

        <div class="leave-types">
          <h4>Types de congé :</h4>
          <div class="leave-buttons-grid">
            <button
              v-for="type in leaveTypes"
              :key="type.id"
              :class="['leave-btn', { active: isSelectedType(type.id) }]"
              :style="getButtonStyle(type)"
              @click="selectLeaveType(type.id)"
              :title="getTypeTooltip(type)"
            >
              <span v-if="type.category === 'event'">📅</span>
              {{ type.name }}
              <span v-if="type.label !== type.name" class="type-label">
                ({{ type.label }})
              </span>
            </button>
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
import { computed, watch } from 'vue'
import { useUIStore } from '../../stores/ui'
import { useLeavesStore } from '../../stores/leaves'
import { useLeaveTypesStore } from '../../stores/leaveTypes'
import { useLeaves } from '../../composables/useLeaves'
import Modal from '../common/Modal.vue'
import { getDateKey } from '../../services/utils'
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
const { getLeaveForDate, getLeaveTypeConfig, setLeave, removeLeave: removeLeaveForDate } = useLeaves()

const showModal = computed(() => uiStore.showModal)
const selectedDate = computed(() => uiStore.selectedDate)
const selectedDates = computed(() => uiStore.selectedDates)
const selectedPeriod = computed(() => uiStore.selectedPeriod)
const leaveTypes = computed(() => leaveTypesStore.leaveTypes)

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
  // TODO: Calculer les jours ouvrés pour la sélection multiple
  return selectedDates.value.length
})

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
  const datesToProcess = selectedDates.value.length > 1 
    ? selectedDates.value 
    : [selectedDate.value]
  
  const period = selectedPeriod.value || 'full'
  
  try {
    for (const date of datesToProcess) {
      await setLeave(date, typeId, period)
    }
    closeModal()
  } catch (error) {
    console.error('Erreur lors de la sélection du type de congé:', error)
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
    console.error('Erreur lors de la suppression du congé:', error)
  }
}

function closeModal() {
  uiStore.closeModal()
  uiStore.setSelectedDate(null)
  uiStore.clearSelectedDates()
  uiStore.setMultiSelectMode(false)
}

function openSelectionModal() {
  // TODO: Implémenter la modale de sélection multiple
  console.log('Ouvrir modale de sélection multiple')
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

.period-selection {
  margin-bottom: 20px;
}

.period-selection h4,
.leave-types h4 {
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

.working-days-info {
  margin-bottom: 20px;
  padding: 10px;
  background: var(--bg-color);
  border-radius: 4px;
  text-align: center;
}

.leave-buttons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
  margin-bottom: 20px;
}

.leave-btn {
  padding: 12px;
  border: 2px solid;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9em;
  text-align: center;
  font-weight: 500;
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
</style>

