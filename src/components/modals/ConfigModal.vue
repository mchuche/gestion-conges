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

        <!-- Sélecteur de jour de début de semaine -->
        <div class="week-start-selector">
          <label for="weekStartDaySelect">Premier jour de la semaine :</label>
          <select 
            id="weekStartDaySelect" 
            v-model="weekStartDay"
            @change="handleWeekStartDayChange"
          >
            <option value="0">Dimanche</option>
            <option value="1">Lundi</option>
            <option value="2">Mardi</option>
            <option value="3">Mercredi</option>
            <option value="4">Jeudi</option>
            <option value="5">Vendredi</option>
            <option value="6">Samedi</option>
          </select>
        </div>

        <!-- Sélecteur d'opacité des événements -->
        <div class="event-opacity-selector">
          <label for="eventOpacityInput">Opacité des événements :</label>
          <div class="opacity-control">
            <input 
              id="eventOpacityInput"
              type="range" 
              min="0" 
              max="100" 
              step="5"
              v-model="eventOpacityPercent"
              @input="handleEventOpacityChange"
            />
            <span class="opacity-value">{{ eventOpacityPercent }}%</span>
          </div>
          <p class="opacity-hint">Règle la visibilité des événements (Maladie, Télétravail, etc.)</p>
        </div>

        <!-- Sélecteur d'intensité des jours fériés et weekends -->
        <div class="week-start-selector">
          <label for="holidayWeekendIntensitySelect">Intensité des jours fériés et weekends :</label>
          <select 
            id="holidayWeekendIntensitySelect"
            v-model="holidayWeekendIntensity"
            @change="handleHolidayWeekendIntensityChange"
          >
            <option value="light">Pâle</option>
            <option value="normal">Normal</option>
            <option value="strong">Foncé</option>
          </select>
          <p class="opacity-hint">Règle l'intensité des couleurs pour les jours fériés et weekends</p>
        </div>

        <!-- Liste des types de congés -->
        <div class="leave-types-config">
          <h4>Personnalisation des types de congés :</h4>
          <p class="config-hint">Les labels sont gérés par l'administrateur. Vous pouvez personnaliser les couleurs et les quotas.</p>
          <div 
            v-for="(type, index) in leaveTypes" 
            :key="type.id"
            class="leave-type-item"
          >
            <div class="leave-type-inputs">
              <div class="leave-type-info">
                <div class="leave-type-name-display">{{ type.name }}</div>
                <div class="leave-type-label-display">{{ type.label }}</div>
                <div class="leave-type-category-display">
                  {{ type.category === 'event' ? 'Événement' : 'Congé' }}
                </div>
              </div>
              <input
                v-model="type.color"
                type="color"
                class="leave-type-color"
                @change="handleTypeChange(index)"
                title="Couleur personnalisée"
              />
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
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="config-actions">
          <div class="reset-buttons">
            <button class="btn-danger" @click="handleResetLeavesForCurrentYear">
              Supprimer tous les congés ({{ currentYear }})
            </button>
            <button class="btn-danger" @click="handleResetEventsForCurrentYear">
              Supprimer tous les événements ({{ currentYear }})
            </button>
          </div>
          <button class="btn-primary" @click="handleSave">
            Enregistrer
          </button>
        </div>

        <!-- Section Compte -->
        <div class="account-section">
          <h4>Compte</h4>
          <div class="account-actions">
            <button class="btn-danger" @click="handleDeleteAccount">
              🗑️ Supprimer mon compte et toutes mes données
            </button>
            <p class="account-warning">
              ⚠️ <strong>Attention :</strong> Cette action est irréversible. Toutes vos données (congés, types de congés, quotas, équipes, etc.) seront définitivement supprimées.
            </p>
          </div>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useUIStore } from '../../stores/ui'
import { useLeaveTypesStore } from '../../stores/leaveTypes'
import { useQuotasStore } from '../../stores/quotas'
import { useLeavesStore } from '../../stores/leaves'
import { useAuthStore } from '../../stores/auth'
import { useLeaves } from '../../composables/useLeaves'
import { useToast } from '../../composables/useToast'
import Modal from '../common/Modal.vue'
import logger from '../../services/logger'
import devLogger from '../../utils/devLogger'
import Swal from 'sweetalert2'

const uiStore = useUIStore()
const leaveTypesStore = useLeaveTypesStore()
const { error: showErrorToast, success: showSuccessToast } = useToast()
const quotasStore = useQuotasStore()
const leavesStore = useLeavesStore()
const authStore = useAuthStore()
const { isLeaveTypeUsed, countLeaveTypeUsage } = useLeaves()

const showModal = computed(() => uiStore.showConfigModal)
const configYear = computed({
  get: () => uiStore.configYear,
  set: (value) => uiStore.setConfigYear(value)
})

const weekStartDay = ref('0')
const eventOpacityPercent = ref('15')
const holidayWeekendIntensity = ref('normal')

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
  console.log('[ConfigModal] showModal changé:', isOpen)
  if (isOpen) {
    try {
      devLogger.log('[ConfigModal] Modal ouverte, chargement des données...')
      // S'assurer que weekStartDay est chargé
      try {
        if (typeof uiStore.loadWeekStartDay === 'function') {
          await uiStore.loadWeekStartDay()
          // Synchroniser la valeur locale après le chargement
          await nextTick()
          const value = uiStore.weekStartDay
          if (value !== null && value !== undefined && !isNaN(value)) {
            weekStartDay.value = String(value)
          } else {
            weekStartDay.value = '0'
          }
        } else {
          // Si la fonction n'existe pas, utiliser la valeur par défaut du store
          const value = uiStore.weekStartDay ?? 0
          weekStartDay.value = String(value)
        }
      } catch (e) {
        logger.error('[ConfigModal] Erreur lors du chargement de weekStartDay:', e)
        weekStartDay.value = '0'
      }
      // Charger l'opacité des événements
      try {
        if (typeof uiStore.loadEventOpacity === 'function') {
          await uiStore.loadEventOpacity()
          await nextTick()
          const opacity = uiStore.eventOpacity ?? 0.15
          eventOpacityPercent.value = String(Math.round(opacity * 100))
        } else {
          const opacity = uiStore.eventOpacity ?? 0.15
          eventOpacityPercent.value = String(Math.round(opacity * 100))
        }
      } catch (e) {
        logger.error('[ConfigModal] Erreur lors du chargement de eventOpacity:', e)
        eventOpacityPercent.value = '15'
      }
      // Charger l'intensité des jours fériés/weekends
      try {
        if (typeof uiStore.loadHolidayWeekendIntensity === 'function') {
          await uiStore.loadHolidayWeekendIntensity()
          await nextTick()
          holidayWeekendIntensity.value = uiStore.holidayWeekendIntensity ?? 'normal'
        } else {
          holidayWeekendIntensity.value = uiStore.holidayWeekendIntensity ?? 'normal'
        }
      } catch (e) {
        logger.error('[ConfigModal] Erreur lors du chargement de holidayWeekendIntensity:', e)
        holidayWeekendIntensity.value = 'normal'
      }
      // S'assurer que les types de congés sont chargés
      if (leaveTypes.value.length === 0) {
        devLogger.log('[ConfigModal] Chargement des types de congés...')
        await leaveTypesStore.loadLeaveTypes()
      }
      devLogger.log('[ConfigModal] LeaveTypes chargés:', leaveTypes.value.length)
      await loadQuotas()
      devLogger.log('[ConfigModal] Quotas chargés:', quotas.value)
    } catch (error) {
      logger.error('[ConfigModal] Erreur lors du chargement des données:', error)
    }
  } else {
    // Réinitialiser à la valeur par défaut quand la modale se ferme
    weekStartDay.value = '0'
  }
}, { immediate: false })

onMounted(async () => {
  // Charger les types de congés au montage si nécessaire
  if (leaveTypes.value.length === 0) {
    devLogger.log('[ConfigModal] Composant monté, chargement des types de congés...')
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

function handleWeekStartDayChange() {
  try {
    const day = parseInt(weekStartDay.value, 10)
    if (!isNaN(day) && day >= 0 && day <= 6) {
      uiStore.setWeekStartDay(day)
    }
  } catch (e) {
    logger.error('[ConfigModal] Erreur lors de la modification de weekStartDay:', e)
  }
}

function handleEventOpacityChange() {
  try {
    const percent = parseFloat(eventOpacityPercent.value)
    if (!isNaN(percent) && percent >= 0 && percent <= 100) {
      const opacity = percent / 100
      uiStore.setEventOpacity(opacity)
    }
  } catch (e) {
    logger.error('[ConfigModal] Erreur lors de la modification de eventOpacity:', e)
  }
}

function handleHolidayWeekendIntensityChange() {
  try {
    if (['light', 'normal', 'strong'].includes(holidayWeekendIntensity.value)) {
      uiStore.setHolidayWeekendIntensity(holidayWeekendIntensity.value)
    }
  } catch (e) {
    logger.error('[ConfigModal] Erreur lors de la modification de holidayWeekendIntensity:', e)
  }
}

function handleTypeChange(index) {
  // Seule la couleur peut être modifiée par l'utilisateur
  // On sauvegarde automatiquement
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

// Les utilisateurs ne peuvent plus supprimer ou ajouter de types
// Ces fonctions sont désactivées car la gestion est faite par l'admin

async function handleResetLeavesForCurrentYear() {
  const currentYear = uiStore.currentYear
  // Fermer temporairement la modale pour que SweetAlert2 s'affiche correctement
  const wasModalOpen = uiStore.showConfigModal
  if (wasModalOpen) {
    uiStore.closeConfigModal()
    // Attendre que la modale se ferme
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  const result = await Swal.fire({
    title: '⚠️ ATTENTION',
    html: 'Cette action est <strong style="color: #e74c3c;">irréversible</strong> !<br><br>' +
          `Voulez-vous vraiment supprimer <strong>TOUS</strong> vos congés de l'année ${currentYear} ?<br><br>` +
          'Tous les congés (catégorie "congé") de cette année seront définitivement supprimés.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Oui, supprimer',
    cancelButtonText: 'Annuler',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    zIndex: 10001 // Au-dessus de la modale (z-index: 10000)
  })
  
  // Rouvrir la modale si elle était ouverte
  if (wasModalOpen && !result.isConfirmed) {
    uiStore.openConfigModal()
  }
  
  if (result.isConfirmed) {
    try {
      leavesStore.clearLeavesForYear(currentYear, leaveTypesStore)
      await leavesStore.saveLeaves()
      // Recharger les congés depuis la base pour rafraîchir l'affichage du calendrier
      await leavesStore.loadLeaves()
      logger.log(`Tous les congés de l'année ${currentYear} ont été supprimés`)
      showSuccessToast(`Tous les congés de l'année ${currentYear} ont été supprimés`)
      // Rouvrir la modale après la suppression
      if (wasModalOpen) {
        uiStore.openConfigModal()
      }
    } catch (error) {
      logger.error('Erreur lors de la suppression des congés:', error)
      showErrorToast('Erreur lors de la suppression des congés')
      // Rouvrir la modale en cas d'erreur
      if (wasModalOpen) {
        uiStore.openConfigModal()
      }
    }
  }
}

async function handleResetEventsForCurrentYear() {
  const currentYear = uiStore.currentYear
  // Fermer temporairement la modale pour que SweetAlert2 s'affiche correctement
  const wasModalOpen = uiStore.showConfigModal
  if (wasModalOpen) {
    uiStore.closeConfigModal()
    // Attendre que la modale se ferme
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  const result = await Swal.fire({
    title: '⚠️ ATTENTION',
    html: 'Cette action est <strong style="color: #e74c3c;">irréversible</strong> !<br><br>' +
          `Voulez-vous vraiment supprimer <strong>TOUS</strong> vos événements de l'année ${currentYear} ?<br><br>` +
          'Tous les événements (catégorie "événement") de cette année seront définitivement supprimés.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Oui, supprimer',
    cancelButtonText: 'Annuler',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    zIndex: 10001 // Au-dessus de la modale (z-index: 10000)
  })
  
  // Rouvrir la modale si elle était ouverte
  if (wasModalOpen && !result.isConfirmed) {
    uiStore.openConfigModal()
  }
  
  if (result.isConfirmed) {
    try {
      leavesStore.clearEventsForYear(currentYear, leaveTypesStore)
      await leavesStore.saveLeaves()
      // Recharger les congés depuis la base pour rafraîchir l'affichage du calendrier
      await leavesStore.loadLeaves()
      logger.log(`Tous les événements de l'année ${currentYear} ont été supprimés`)
      showSuccessToast(`Tous les événements de l'année ${currentYear} ont été supprimés`)
      // Rouvrir la modale après la suppression
      if (wasModalOpen) {
        uiStore.openConfigModal()
      }
    } catch (error) {
      logger.error('Erreur lors de la suppression des événements:', error)
      showErrorToast('Erreur lors de la suppression des événements')
      // Rouvrir la modale en cas d'erreur
      if (wasModalOpen) {
        uiStore.openConfigModal()
      }
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
    showErrorToast('Erreur lors de la sauvegarde de la configuration')
  }
}

async function handleDeleteAccount() {
  const result = await Swal.fire({
    title: '🗑️ Supprimer mon compte ?',
    html: 'Cette action est <strong style="color: #e74c3c;">irréversible</strong> !<br><br>' +
          'Toutes vos données seront définitivement supprimées :<br>' +
          '• Tous vos congés<br>' +
          '• Vos types de congés personnalisés<br>' +
          '• Vos quotas<br>' +
          '• Vos préférences<br>' +
          '• Votre participation aux équipes<br><br>' +
          'Si vous possédez des équipes, elles seront transférées au premier membre disponible ou supprimées.<br><br>' +
          'Le compte Supabase devra être supprimé depuis le dashboard Supabase.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Oui, supprimer mon compte',
    cancelButtonText: 'Annuler',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    zIndex: 10001, // Au-dessus de la modale (z-index: 10000)
    input: 'text',
    inputLabel: 'Tapez "SUPPRIMER" pour confirmer',
    inputPlaceholder: 'SUPPRIMER',
    inputValidator: (value) => {
      if (value !== 'SUPPRIMER') {
        return 'Vous devez taper "SUPPRIMER" pour confirmer'
      }
    }
  })
  
  if (result.isConfirmed) {
    try {
      devLogger.log('[ConfigModal] Suppression du compte demandée')
      const deleteResult = await authStore.deleteAccount()
      
      if (deleteResult.success) {
        showSuccessToast('Votre compte et toutes vos données ont été supprimés. Vous allez être déconnecté.')
        closeModal()
        // La déconnexion automatique devrait déjà avoir eu lieu dans deleteAccount
      } else {
        showErrorToast('Erreur lors de la suppression du compte: ' + (deleteResult.error || 'Erreur inconnue'))
      }
    } catch (error) {
      logger.error('[ConfigModal] Erreur lors de la suppression du compte:', error)
      showErrorToast('Erreur lors de la suppression du compte: ' + (error.message || error))
    }
  }
}

function closeModal() {
  uiStore.closeConfigModal()
}
</script>

<style scoped>
/* Le padding est déjà géré par le composant Modal */

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

.year-selector select,
.week-start-selector select {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--card-bg);
  color: var(--text-color);
  font-size: 1em;
  cursor: pointer;
}

.week-start-selector {
  margin-bottom: 30px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.week-start-selector label {
  font-weight: 600;
  color: var(--text-color);
}

.event-opacity-selector {
  margin-bottom: 30px;
}

.event-opacity-selector label {
  font-weight: 600;
  color: var(--text-color);
  display: block;
  margin-bottom: 10px;
}

.opacity-control {
  display: flex;
  align-items: center;
  gap: 15px;
}

.opacity-control input[type="range"] {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: var(--border-color);
  outline: none;
  -webkit-appearance: none;
}

.opacity-control input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--primary-color);
  cursor: pointer;
}

.opacity-control input[type="range"]::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--primary-color);
  cursor: pointer;
  border: none;
}

.opacity-value {
  min-width: 50px;
  text-align: right;
  font-weight: 600;
  color: var(--text-color);
}

.opacity-hint {
  margin-top: 5px;
  font-size: 0.85em;
  color: var(--text-color);
  opacity: 0.7;
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
  grid-template-columns: 2fr 60px 1fr;
  gap: 10px;
  align-items: center;
}

.leave-type-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.leave-type-name-display {
  font-weight: 600;
  color: var(--text-color);
  font-size: 1em;
}

.leave-type-label-display {
  font-size: 0.85em;
  color: var(--text-color);
  opacity: 0.7;
  font-style: italic;
}

.leave-type-category-display {
  font-size: 0.8em;
  color: var(--text-color);
  opacity: 0.6;
  padding: 2px 8px;
  background: var(--bg-color);
  border-radius: 4px;
  display: inline-block;
  width: fit-content;
}

.config-hint {
  font-size: 0.9em;
  color: var(--text-color);
  opacity: 0.7;
  font-style: italic;
  margin-bottom: 15px;
}

.leave-type-quota {
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--card-bg);
  color: var(--text-color);
  font-size: 0.9em;
}

.leave-type-color {
  width: 60px;
  height: 40px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
}


.leave-type-quota:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}


.reset-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 15px;
}

.config-actions {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
}

.account-section {
  margin-top: 40px;
  padding-top: 30px;
  border-top: 2px solid var(--border-color);
}

.account-section h4 {
  margin-bottom: 15px;
  color: var(--text-color);
  font-size: 1.1em;
}

.account-actions {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.account-warning {
  font-size: 0.9em;
  color: var(--danger-color, #e74c3c);
  margin: 0;
  padding: 10px;
  background: var(--danger-bg, #ffeaea);
  border-radius: 4px;
  border: 1px solid var(--danger-color, #e74c3c);
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
  
  .leave-type-info {
    order: 1;
  }
  
  .leave-type-color {
    order: 2;
  }
  
  .leave-type-quota {
    order: 3;
  }
  
  .config-actions {
    flex-direction: column;
  }
}
</style>

