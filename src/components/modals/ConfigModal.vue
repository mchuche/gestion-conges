<template>
  <Modal :model-value="showModal" @close="closeModal" title="Configuration">
    <template #body>
      <div class="config-modal-content">
        <!-- Sélecteur d'année pour les quotas -->
        <div class="year-selector">
          <label for="configYearSelect">Année de configuration :</label>
          <select 
            id="configYearSelect" 
            v-model="configYear"
            @change="handleYearChange"
          >
            <option 
              v-for="year in availableYears" 
              :key="year" 
              :value="year"
            >
              {{ year }}
            </option>
          </select>
        </div>

        <!-- Liste des types de congés -->
        <div class="leave-types-config">
          <h4>Types de congés :</h4>
          <div 
            v-for="(type, index) in leaveTypes" 
            :key="type.id"
            class="leave-type-item"
          >
            <div class="leave-type-inputs">
              <input
                v-model="type.name"
                type="text"
                class="leave-type-name"
                placeholder="Nom du type"
                @input="handleTypeChange(index)"
              />
              <input
                v-model="type.label"
                type="text"
                class="leave-type-label"
                placeholder="Label (ex: P)"
                maxlength="10"
                @input="handleTypeChange(index)"
              />
              <input
                v-model="type.color"
                type="color"
                class="leave-type-color"
                @change="handleTypeChange(index)"
              />
              <select
                v-model="type.category"
                class="leave-type-category"
                @change="handleCategoryChange(index)"
                :title="type.category === 'event' ? 'Événement (sans quota)' : 'Congé (avec quota)'"
              >
                <option value="leave">Congé</option>
                <option value="event">Événement</option>
              </select>
              <input
                v-model.number="quotas[type.id]"
                type="number"
                class="leave-type-quota"
                placeholder="Quota (vide = illimité)"
                min="0"
                :disabled="type.category === 'event'"
                :title="type.category === 'event' ? 'Les événements n\'ont pas de quota' : 'Quota pour ce congé'"
                @input="handleQuotaChange(type.id)"
              />
              <button
                class="delete-type-btn"
                @click="handleDeleteType(index)"
                title="Supprimer ce type"
                aria-label="Supprimer"
              >
                ⌧
              </button>
            </div>
          </div>

          <!-- Bouton pour ajouter un type -->
          <button class="add-type-btn" @click="handleAddType">
            + Ajouter un type
          </button>
        </div>

        <!-- Actions -->
        <div class="config-actions">
          <button class="btn-danger" @click="handleResetAllLeaves">
            Réinitialiser tous les congés
          </button>
          <button class="btn-primary" @click="handleSave">
            Enregistrer
          </button>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useUIStore } from '../../stores/ui'
import { useLeaveTypesStore } from '../../stores/leaveTypes'
import { useQuotasStore } from '../../stores/quotas'
import { useLeavesStore } from '../../stores/leaves'
import { useLeaves } from '../../composables/useLeaves'
import Modal from '../common/Modal.vue'
import logger from '../../services/logger'

const uiStore = useUIStore()
const leaveTypesStore = useLeaveTypesStore()
const quotasStore = useQuotasStore()
const leavesStore = useLeavesStore()
const { isLeaveTypeUsed, countLeaveTypeUsage } = useLeaves()

const showModal = computed(() => uiStore.showConfigModal)
const configYear = computed({
  get: () => uiStore.configYear,
  set: (value) => uiStore.setConfigYear(value)
})

const currentYear = computed(() => {
  const date = uiStore.currentDate
  return date.getFullYear()
})

const availableYears = computed(() => {
  const years = []
  for (let year = currentYear.value - 2; year <= currentYear.value + 5; year++) {
    years.push(year)
  }
  return years
})

const leaveTypes = computed(() => leaveTypesStore.leaveTypes)

const quotas = ref({})

// Charger les quotas pour l'année sélectionnée
watch([configYear, leaveTypes], async () => {
  if (showModal.value) {
    await loadQuotas()
  }
}, { immediate: true })

// Charger les données quand la modale s'ouvre
watch(showModal, async (isOpen) => {
  if (isOpen) {
    console.log('[ConfigModal] Modal ouverte, chargement des données...')
    // S'assurer que les types de congés sont chargés
    if (leaveTypes.value.length === 0) {
      console.log('[ConfigModal] Chargement des types de congés...')
      await leaveTypesStore.loadLeaveTypes()
    }
    console.log('[ConfigModal] LeaveTypes chargés:', leaveTypes.value.length)
    await loadQuotas()
    console.log('[ConfigModal] Quotas chargés:', quotas.value)
  }
})

onMounted(async () => {
  // Charger les types de congés au montage si nécessaire
  if (leaveTypes.value.length === 0) {
    console.log('[ConfigModal] Composant monté, chargement des types de congés...')
    await leaveTypesStore.loadLeaveTypes()
  }
})

async function loadQuotas() {
  quotas.value = {}
  for (const type of leaveTypes.value) {
    if (type.category === 'leave') {
      const quota = quotasStore.getQuota(configYear.value, type.id)
      quotas.value[type.id] = quota !== null && quota !== undefined ? quota : ''
    }
  }
}

function handleYearChange() {
  loadQuotas()
}

function handleTypeChange(index) {
  // Les changements sont réactifs grâce à v-model
  // On sauvegarde automatiquement
  saveLeaveTypes()
}

function handleCategoryChange(index) {
  const type = leaveTypes.value[index]
  if (type.category === 'event') {
    // Désactiver le quota pour les événements
    quotas.value[type.id] = ''
    // Supprimer le quota de la base de données
    quotasStore.removeQuota(configYear.value, type.id)
  }
  saveLeaveTypes()
}

function handleQuotaChange(typeId) {
  const quota = quotas.value[typeId]
  if (quota === '' || quota === null || quota === undefined) {
    quotasStore.removeQuota(configYear.value, typeId)
  } else {
    quotasStore.setQuota(configYear.value, typeId, quota)
  }
}

async function handleDeleteType(index) {
  const typeToDelete = leaveTypes.value[index]
  
  // Vérifier si ce type est utilisé
  const isUsed = isLeaveTypeUsed(typeToDelete.id)
  
  let confirmMessage = `Êtes-vous sûr de vouloir supprimer le type "${typeToDelete.name}" ?`
  if (isUsed) {
    const usageCount = countLeaveTypeUsage(typeToDelete.id)
    confirmMessage += `\n\n⚠️ Attention : Ce type est utilisé dans ${usageCount} jour(s) de congé. Ces congés seront également supprimés.`
  }
  if (leaveTypes.value.length === 1) {
    confirmMessage += `\n\n⚠️ Attention : C'est le dernier type de congé. Vous devrez en créer un nouveau.`
  }
  
  // TODO: Utiliser SweetAlert2 ou un composant de confirmation
  const confirmed = window.confirm(confirmMessage)
  
  if (confirmed) {
    // Supprimer les congés de ce type si nécessaire
    if (isUsed) {
      await leavesStore.removeLeavesByType(typeToDelete.id)
      await leavesStore.saveLeaves()
    }
    
    // Supprimer le type
    leaveTypesStore.removeLeaveType(typeToDelete.id)
    await leaveTypesStore.saveLeaveTypes()
    
    // Si c'était le dernier type, en créer un par défaut
    if (leaveTypes.value.length === 0) {
      leaveTypesStore.addLeaveType({
        id: `type-${Date.now()}`,
        name: 'Congé',
        label: 'C',
        color: '#4a90e2',
        category: 'leave'
      })
      await leaveTypesStore.saveLeaveTypes()
    }
    
    await loadQuotas()
  }
}

async function handleAddType() {
  const newType = {
    id: `type-${Date.now()}`,
    name: 'Nouveau type',
    label: 'N',
    color: '#4a90e2',
    category: 'leave'
  }
  
  leaveTypesStore.addLeaveType(newType)
  await leaveTypesStore.saveLeaveTypes()
  await loadQuotas()
}

async function handleResetAllLeaves() {
  const confirmed = window.confirm(
    '⚠️ ATTENTION : Cette action est irréversible !\n\n' +
    'Voulez-vous vraiment supprimer TOUS vos jours de congé ?\n\n' +
    'Tous les congés enregistrés seront définitivement supprimés.'
  )
  
  if (confirmed) {
    try {
      leavesStore.clearAllLeaves()
      await leavesStore.saveLeaves()
      logger.log('Tous les congés ont été réinitialisés')
      // TODO: Rafraîchir l'affichage du calendrier
    } catch (error) {
      logger.error('Erreur lors de la réinitialisation:', error)
      alert('Erreur lors de la réinitialisation des congés')
    }
  }
}

async function handleSave() {
  try {
    // Sauvegarder les types (les changements sont déjà dans le store via v-model)
    await leaveTypesStore.saveLeaveTypes()
    // Sauvegarder les quotas
    await quotasStore.saveQuotas()
    closeModal()
  } catch (error) {
    logger.error('Erreur lors de la sauvegarde:', error)
    alert('Erreur lors de la sauvegarde de la configuration')
  }
}

function closeModal() {
  uiStore.closeConfigModal()
}
</script>

<style scoped>
.config-modal-content {
  padding: 20px;
  max-width: 100%;
}

.year-selector {
  margin-bottom: 30px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.year-selector label {
  font-weight: 600;
  color: var(--text-color);
}

.year-selector select {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--card-bg);
  color: var(--text-color);
  font-size: 1em;
  cursor: pointer;
}

.leave-types-config {
  margin-bottom: 30px;
}

.leave-types-config h4 {
  margin-bottom: 15px;
  color: var(--text-color);
}

.leave-type-item {
  margin-bottom: 15px;
  padding: 15px;
  background: var(--bg-color);
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.leave-type-inputs {
  display: grid;
  grid-template-columns: 2fr 1fr 60px 1fr 1fr auto;
  gap: 10px;
  align-items: center;
}

.leave-type-name,
.leave-type-label,
.leave-type-quota {
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--card-bg);
  color: var(--text-color);
  font-size: 0.9em;
}

.leave-type-label {
  max-width: 80px;
}

.leave-type-color {
  width: 60px;
  height: 40px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
}

.leave-type-category {
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--card-bg);
  color: var(--text-color);
  font-size: 0.9em;
  cursor: pointer;
}

.leave-type-quota:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.delete-type-btn {
  padding: 8px 12px;
  background: var(--danger-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.2em;
  transition: background 0.2s;
}

.delete-type-btn:hover {
  background: #c0392b;
}

.add-type-btn {
  width: 100%;
  padding: 12px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
  font-weight: 600;
  transition: background 0.2s;
}

.add-type-btn:hover {
  background: #357abd;
}

.config-actions {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
}

.btn-primary,
.btn-danger {
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background: #357abd;
}

.btn-danger {
  background: var(--danger-color);
  color: white;
}

.btn-danger:hover {
  background: #c0392b;
}

@media (max-width: 768px) {
  .leave-type-inputs {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .config-actions {
    flex-direction: column;
  }
}
</style>

