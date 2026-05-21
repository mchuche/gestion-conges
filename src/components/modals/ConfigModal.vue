<template>
  <Modal :model-value="showModal" @close="closeModal" title="Configuration">
    <template #body>
      <div class="config-modal-content">
        <!-- Navigation par onglets (évite le scroll interminable) -->
        <nav class="config-tabs" role="tablist" aria-label="Sections de configuration">
          <button
            v-for="tab in configTabs"
            :key="tab.id"
            type="button"
            role="tab"
            class="config-tab"
            :class="{ active: activeTab === tab.id }"
            :aria-selected="activeTab === tab.id"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </nav>

        <!-- ——— Affichage ——— -->
        <section v-show="activeTab === 'display'" class="config-panel" role="tabpanel">
          <h4 class="config-panel-title">Affichage du calendrier</h4>

          <div class="config-field">
            <label for="weekStartDaySelect">Premier jour de la semaine</label>
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

          <div class="config-field">
            <label for="eventOpacityInput">Opacité des événements</label>
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
            <p class="config-hint">Maladie, télétravail, etc. — enregistré immédiatement.</p>
          </div>

          <div class="config-field">
            <label for="holidayWeekendIntensitySelect">Intensité week-ends et fériés</label>
            <select
              id="holidayWeekendIntensitySelect"
              v-model="holidayWeekendIntensity"
              @change="handleHolidayWeekendIntensityChange"
            >
              <option value="light">Pâle</option>
              <option value="normal">Normal</option>
              <option value="strong">Foncé</option>
            </select>
          </div>

          <div class="config-field config-field--checkbox">
            <label class="main-balance-option">
              <input
                type="checkbox"
                :checked="uiStore.grayPastLeaves"
                @change="handleGrayPastLeavesChange($event.target.checked)"
              />
              <span>Griser les congés et événements passés</span>
            </label>
            <p class="config-hint">
              Désactivé : les jours passés gardent la même intensité que les jours à venir (toutes les vues).
            </p>
          </div>
        </section>

        <!-- ——— Congés (quotas, couleurs, bandeau) ——— -->
        <section v-show="activeTab === 'leaves'" class="config-panel" role="tabpanel">
          <h4 class="config-panel-title">Mes congés</h4>

          <div class="config-field config-field--inline">
            <label for="configYearSelect">Année des quotas</label>
            <select id="configYearSelect" v-model="configYear" @change="handleYearChange">
              <option v-for="year in availableYears" :key="year" :value="year">
                {{ year }}
              </option>
            </select>
          </div>

          <div class="config-subsection">
            <h5>Bandeau « Jours restants »</h5>
            <p class="config-hint">
              Types comptés dans le résumé en haut du calendrier (à enregistrer avec le bouton en bas).
            </p>
            <div v-if="mainBalanceEligibleTypes.length === 0" class="config-hint">
              Aucun type éligible pour le moment.
            </div>
            <label
              v-for="type in mainBalanceEligibleTypes"
              :key="`mb-${type.id}`"
              class="main-balance-option"
            >
              <input
                type="checkbox"
                :checked="uiStore.isTypeInMainBalance(type.id)"
                @change="toggleMainBalanceType(type.id, $event.target.checked)"
              />
              <span>{{ type.name }} <span class="type-label-hint">({{ type.label }})</span></span>
            </label>
          </div>

          <div class="config-subsection">
            <h5>Couleurs et quotas</h5>
            <p class="config-hint">
              Labels gérés par l’administrateur. Couleurs enregistrées à la modification ; quotas via « Enregistrer ».
            </p>
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
                    {{ type.category === 'event' ? 'Événement' : 'Absence' }}
                  </div>
                </div>
                <input
                  v-model="type.color"
                  type="color"
                  class="leave-type-color"
                  title="Couleur personnalisée"
                  @change="handleTypeChange(index)"
                />
                <input
                  v-model.number="quotas[type.id]"
                  type="number"
                  class="leave-type-quota"
                  placeholder="Quota (vide = illimité)"
                  min="0"
                  :disabled="type.category === 'event'"
                  :title="type.category === 'event' ? 'Pas de quota pour les événements' : 'Quota absence'"
                  @input="handleQuotaChange(type.id)"
                />
              </div>
            </div>
          </div>
        </section>

        <!-- ——— Calendrier (règles de pose) ——— -->
        <section v-show="activeTab === 'calendar'" class="config-panel" role="tabpanel">
          <h4 class="config-panel-title">Règles du calendrier</h4>

          <div class="config-subsection">
            <h5>Jours ouvrés</h5>
            <label class="main-balance-option">
              <input
                type="checkbox"
                :checked="uiStore.allowWeekendHolidayLeave"
                @change="handleAllowWeekendHolidayLeaveChange($event.target.checked)"
              />
              <span>Poser des absences / événements le week-end et les jours fériés</span>
            </label>
            <p class="config-hint">Décoché par défaut (jours ouvrés uniquement).</p>
          </div>

          <div class="config-subsection">
            <h5>Vacances scolaires (essai)</h5>
            <p class="config-hint">
              Colore le chiffre du jour (orange / jaune). Les badges congé ne changent pas.
            </p>
            <div class="config-field">
              <label for="schoolHolidayZoneSelect">Zone académique</label>
              <select
                id="schoolHolidayZoneSelect"
                v-model="schoolHolidayZoneLocal"
                @change="handleSchoolHolidayZoneChange"
              >
                <option value="">— Choisir une zone —</option>
                <option value="A">Zone A</option>
                <option value="B">Zone B</option>
                <option value="C">Zone C</option>
              </select>
            </div>
            <label class="main-balance-option">
              <input
                type="checkbox"
                :checked="uiStore.showSchoolHolidays"
                :disabled="!schoolHolidayZoneLocal"
                @change="handleShowSchoolHolidaysChange($event.target.checked)"
              />
              <span>Afficher les vacances scolaires</span>
            </label>
          </div>

          <div class="config-subsection config-subsection--danger">
            <h5>Suppression en masse ({{ currentYear }})</h5>
            <p class="config-hint">Actions irréversibles sur l’année affichée dans le calendrier.</p>
            <div class="reset-buttons">
              <button type="button" class="btn-danger" @click="handleResetLeavesForCurrentYear">
                Supprimer tous les congés (absences)
              </button>
              <button type="button" class="btn-danger" @click="handleResetEventsForCurrentYear">
                Supprimer tous les événements
              </button>
            </div>
          </div>
        </section>

        <!-- ——— Compte ——— -->
        <section v-show="activeTab === 'account'" class="config-panel" role="tabpanel">
          <h4 class="config-panel-title">Compte</h4>
          <button type="button" class="btn-danger" @click="handleDeleteAccount">
            Supprimer mon compte et toutes mes données
          </button>
          <p class="account-warning">
            Action irréversible : congés, personnalisations, sessions, etc.
          </p>
        </section>

        <!-- Pied : enregistre bandeau + week-end/férié + quotas -->
        <footer class="config-footer">
          <p class="config-footer-hint">
            Les réglages de l’onglet <strong>Affichage</strong> sont enregistrés tout de suite.
            Les autres choix de cet onglet ou des onglets Congés / Calendrier : bouton ci-dessous.
          </p>
          <button type="button" class="btn-primary" @click="handleSave">
            Enregistrer
          </button>
        </footer>
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

/** Onglet actif : display | leaves | calendar | account */
const activeTab = ref('display')
const configTabs = [
  { id: 'display', label: 'Affichage' },
  { id: 'leaves', label: 'Congés' },
  { id: 'calendar', label: 'Calendrier' },
  { id: 'account', label: 'Compte' },
]

const weekStartDay = ref('0')
const eventOpacityPercent = ref('15')
const holidayWeekendIntensity = ref('normal')
const schoolHolidayZoneLocal = ref('')

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

/** Types que l'utilisateur peut cocher pour le bandeau (catalogue admin). */
const mainBalanceEligibleTypes = computed(() =>
  leaveTypes.value.filter(
    (t) => t.category === 'absence' && t.eligible_for_main_balance !== false,
  ),
)

function toggleMainBalanceType(typeId, checked) {
  const current = [...uiStore.mainBalanceTypeIds]
  if (checked) {
    if (!current.includes(typeId)) current.push(typeId)
  } else {
    const next = current.filter((id) => id !== typeId)
    if (next.length === 0) {
      showErrorToast('Gardez au moins un type dans votre résumé congés.')
      return
    }
    uiStore.mainBalanceTypeIds = next
    return
  }
  uiStore.mainBalanceTypeIds = current
}

const quotas = ref({})

// Charger les quotas pour l'année sélectionnée
watch([configYear, leaveTypes], async () => {
  if (showModal.value) {
    await loadQuotas()
  }
}, { immediate: true })

// Charger les données quand la modale s'ouvre
watch(showModal, async (isOpen) => {
  devLogger.log('[ConfigModal] showModal changé:', isOpen)
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
      if (typeof uiStore.loadAllowWeekendHolidayLeave === 'function') {
        await uiStore.loadAllowWeekendHolidayLeave()
      }
      if (typeof uiStore.loadGrayPastLeaves === 'function') {
        await uiStore.loadGrayPastLeaves()
      }
      schoolHolidayZoneLocal.value = uiStore.schoolHolidayZone || ''

      // S'assurer que les types de congés sont chargés
      if (leaveTypes.value.length === 0) {
        devLogger.log('[ConfigModal] Chargement des types de congés...')
        await leaveTypesStore.loadLeaveTypes()
      }
      await uiStore.loadMainBalanceTypeIds()
      await uiStore.loadAllowWeekendHolidayLeave()
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
    if (type.category === 'absence') {
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

async function handleSchoolHolidayZoneChange() {
  const zone = schoolHolidayZoneLocal.value || null
  if (!zone) {
    if (uiStore.showSchoolHolidays) {
      await uiStore.saveSchoolHolidaysPrefs({ show: false, zone: null })
    }
    return
  }
  await uiStore.saveSchoolHolidaysPrefs({ zone, show: uiStore.showSchoolHolidays })
}

async function handleShowSchoolHolidaysChange(checked) {
  if (!schoolHolidayZoneLocal.value) return
  await uiStore.saveSchoolHolidaysPrefs({
    show: checked,
    zone: schoolHolidayZoneLocal.value,
  })
}

function handleAllowWeekendHolidayLeaveChange(checked) {
  uiStore.allowWeekendHolidayLeave = Boolean(checked)
}

/** Grisage du passé : enregistrement immédiat côté API. */
async function handleGrayPastLeavesChange(checked) {
  try {
    await uiStore.saveGrayPastLeaves(checked)
  } catch (e) {
    logger.error('[ConfigModal] Erreur grisage passé:', e)
    showErrorToast('Impossible d’enregistrer cette préférence')
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
          'Toutes les absences (catégorie absence) de cette année seront définitivement supprimées.',
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
    await uiStore.saveMainBalanceTypeIds([...uiStore.mainBalanceTypeIds])
    await uiStore.saveAllowWeekendHolidayLeave(uiStore.allowWeekendHolidayLeave)
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
          'Côté serveur Nest, seront supprimés : congés, personnalisations de couleurs, sessions, droits admin éventuels.<br><br>' +
          'Données encore gérées par d’autres services (équipes PocketBase, quotas, préférences locales, etc.) peuvent nécessiter un nettoyage séparé tant que la migration n’est pas complète.',
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
/* —— Structure modale (onglets) —— */
.config-modal-content {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: 320px;
}

.config-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.config-tab {
  padding: 8px 14px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-color);
  color: var(--text-color);
  font-size: 0.9em;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.config-tab:hover {
  border-color: var(--primary-color);
}

.config-tab.active {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

.config-panel {
  flex: 1;
  overflow-y: auto;
  max-height: min(55vh, 480px);
  padding-right: 4px;
}

.config-panel-title {
  margin: 0 0 14px;
  font-size: 1.05em;
  color: var(--text-color);
}

.config-subsection {
  margin-bottom: 20px;
  padding: 12px;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 6px;
}

.config-subsection h5 {
  margin: 0 0 8px;
  font-size: 0.95em;
  color: var(--text-color);
}

.config-subsection--danger {
  border-color: var(--danger-color, #e74c3c);
}

.config-field {
  margin-bottom: 18px;
}

.config-field label {
  display: block;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 6px;
}

.config-field--inline {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.config-field--inline label {
  margin-bottom: 0;
}

.config-field select {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--card-bg);
  color: var(--text-color);
  font-size: 1em;
  cursor: pointer;
  min-width: 160px;
}

.config-field--checkbox {
  padding: 12px;
  background: var(--bg-color);
  border-radius: 6px;
  border: 1px solid var(--border-color);
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

.main-balance-option {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 8px 0;
  cursor: pointer;
  color: var(--text-color);
}

.type-label-hint {
  opacity: 0.75;
  font-size: 0.9em;
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

.config-footer {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;
}

.config-footer-hint {
  margin: 0;
  font-size: 0.85em;
  color: var(--text-color);
  opacity: 0.75;
}

.config-footer .btn-primary {
  align-self: flex-end;
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
  
  .config-footer .btn-primary {
    align-self: stretch;
  }
}
</style>

