<template>
  <div class="admin-view">
    <div class="admin-header">
      <button @click="goBack" class="back-btn">
        ← Retour au calendrier
      </button>
      <h1>Administration</h1>
    </div>


    <div v-if="!authStore.isAdmin" class="admin-error">
      <p>Vous n'avez pas les droits d'administrateur pour accéder à cette page.</p>
      <button @click="goBack" class="btn-primary">Retour</button>
    </div>
    
    <div v-else class="admin-content">
      <TabGroup as="div" :selectedIndex="selectedTabIndex" @change="handleTabChange">
        <!-- Onglets -->
        <TabList class="admin-tabs">
          <Tab
            v-for="tab in tabs"
            :key="tab.id"
            as="button"
            :class="['admin-tab']"
          >
            {{ tab.label }}
          </Tab>
        </TabList>

        <!-- Contenu des onglets -->
        <TabPanels class="admin-tab-content">
          <!-- Onglet Utilisateurs -->
          <TabPanel class="admin-tab-panel">
          <div class="admin-search">
            <input
              v-model="userSearch"
              type="text"
              placeholder="Rechercher par email..."
              @input="debouncedLoadUsers"
            />
          </div>
          
          <div v-if="loadingUsers" class="loading">Chargement...</div>
          <div v-else-if="users.length === 0" class="no-data">Aucun utilisateur trouvé</div>
          <div v-else class="admin-list">
            <div
              v-for="user in users"
              :key="user.id"
              class="admin-item-card"
            >
              <div class="admin-item-info">
                <div class="admin-item-email">{{ user.email }}</div>
                <div class="admin-item-meta">
                  <span>Inscrit le: {{ formatDate(user.createdAt) }}</span>
                  <span>• {{ user.leavesCount || 0 }} congés</span>
                  <span>• {{ user.teamsCount || 0 }} équipes</span>
                </div>
              </div>
              <div class="admin-item-actions">
                <button
                  v-if="authStore.isSuperAdmin"
                  @click="handleDeleteUser(user)"
                  class="btn-danger"
                  title="Supprimer l'utilisateur"
                >
                  ⌧
                </button>
              </div>
            </div>
          </div>
          </TabPanel>

          <!-- Onglet Équipes -->
          <TabPanel class="admin-tab-panel">
          <div v-if="loadingTeams" class="loading">Chargement...</div>
          <div v-else-if="teams.length === 0" class="no-data">Aucune équipe trouvée</div>
          <div v-else class="admin-list">
            <div
              v-for="team in teams"
              :key="team.id"
              class="admin-item-card"
            >
              <div class="admin-item-info">
                <div class="admin-item-email">{{ team.name }}</div>
                <div class="admin-item-meta">
                  <span>Créée le: {{ formatDate(team.createdAt) }}</span>
                  <span>• {{ team.membersCount || 0 }} membres</span>
                </div>
              </div>
              <div class="admin-item-actions">
                <button
                  @click="handleDeleteTeam(team)"
                  class="btn-danger"
                  title="Supprimer l'équipe"
                >
                  ⌧
                </button>
              </div>
            </div>
          </div>
          </TabPanel>

          <!-- Onglet Types de congés -->
          <TabPanel class="admin-tab-panel">
          <div v-if="loadingLeaveTypes" class="loading">Chargement...</div>
          <div v-else class="admin-leave-types">
            <div class="admin-leave-types-header">
              <p class="admin-hint">Gérez les labels (noms et abréviations) des types de congés et événements. Les utilisateurs peuvent personnaliser les couleurs.</p>
              <button class="btn-primary" @click="handleAddGlobalLeaveType">
                + Ajouter un type
              </button>
            </div>
            
            <div v-if="globalLeaveTypes.length === 0" class="no-data">Aucun type de congé défini</div>
            <div v-else class="admin-leave-types-list">
              <div
                v-for="type in globalLeaveTypes"
                :key="type.id"
                class="admin-leave-type-card"
              >
                <div class="admin-leave-type-info">
                  <div class="admin-leave-type-name">{{ type.name }}</div>
                  <div class="admin-leave-type-meta">
                    <span>Label: <strong>{{ type.label }}</strong></span>
                    <span>•</span>
                    <span>Catégorie: <strong>{{ type.category === 'leave' ? 'Congé' : 'Événement' }}</strong></span>
                  </div>
                </div>
                <div class="admin-leave-type-actions">
                  <button
                    @click="handleEditGlobalLeaveType(type)"
                    class="btn-secondary"
                    title="Modifier"
                  >
                    ✏️
                  </button>
                  <button
                    @click="handleDeleteGlobalLeaveType(type)"
                    class="btn-danger"
                    title="Supprimer"
                  >
                    ⌧
                  </button>
                </div>
              </div>
            </div>
          </div>
          </TabPanel>

          <!-- Onglet Paramètres -->
          <TabPanel class="admin-tab-panel">
          <div v-if="loadingSettings" class="loading">Chargement...</div>
          <div v-else class="admin-settings">
            <Form @submit="onSaveSettingsSubmit" v-slot="{ meta, values, setFieldValue }" :initial-values="{ defaultLeaveTypes: defaultLeaveTypes, defaultQuotas: defaultQuotas }">
              <div class="admin-settings-section">
                <h3>Types de congés par défaut</h3>
                <p class="admin-hint">Configuration des types de congés utilisés pour les nouveaux utilisateurs. Format JSON.</p>
                <Field
                  name="defaultLeaveTypes"
                  rules="required|json"
                  v-slot="{ field, errors }"
                >
                  <textarea
                    :value="field.value || defaultLeaveTypes"
                    @input="(e) => { setFieldValue('defaultLeaveTypes', e.target.value); defaultLeaveTypes = e.target.value }"
                    class="admin-settings-textarea"
                    :class="{ 'admin-settings-textarea-error': errors.length > 0 }"
                    rows="15"
                    placeholder='[{"id": "congé-payé", "name": "Congé Payé", "label": "CP", "color": "#4a90e2", "category": "leave"}, ...]'
                  ></textarea>
                  <ErrorMessage name="defaultLeaveTypes" class="field-error" />
                </Field>
              </div>
              
              <div class="admin-settings-section">
                <h3>Quotas par défaut</h3>
                <p class="admin-hint">Quotas de congés par défaut pour les nouveaux utilisateurs. Format JSON.</p>
                <Field
                  name="defaultQuotas"
                  rules="required|json"
                  v-slot="{ field, errors }"
                >
                  <textarea
                    :value="field.value || defaultQuotas"
                    @input="(e) => { setFieldValue('defaultQuotas', e.target.value); defaultQuotas = e.target.value }"
                    class="admin-settings-textarea"
                    :class="{ 'admin-settings-textarea-error': errors.length > 0 }"
                    rows="8"
                    placeholder='{"congé-payé": 25, "rtt": 22, "jours-hiver": 2}'
                  ></textarea>
                  <ErrorMessage name="defaultQuotas" class="field-error" />
                </Field>
              </div>

              <div class="admin-settings-section">
                <h3>Débogage</h3>
                <label style="display:flex; align-items:center; gap:10px;">
                  <input
                    type="checkbox"
                    v-model="consoleDebugLogsEnabled"
                    @change="applyConsoleDebugLogs"
                  />
                  Activer les logs debug dans la console (log/debug)
                </label>
                <p class="admin-hint">
                  Ce réglage est local à ce navigateur (localStorage). Les warn/error restent affichés.
                </p>
              </div>
              
              <div class="admin-settings-actions">
                <button type="submit" class="btn-primary" :disabled="!meta.valid">
                  Sauvegarder les paramètres
                </button>
              </div>
            </Form>
          </div>
          </TabPanel>

          <!-- Onglet Statistiques -->
          <TabPanel class="admin-tab-panel">
          <div class="admin-stats">
            <div class="stat-item">
              <div class="stat-label">Total utilisateurs</div>
              <div class="stat-value">{{ stats.totalUsers || 0 }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Total équipes</div>
              <div class="stat-value">{{ stats.totalTeams || 0 }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Total congés</div>
              <div class="stat-value">{{ stats.totalLeaves || 0 }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Invitations en attente</div>
              <div class="stat-value">{{ stats.pendingInvitations || 0 }}</div>
            </div>
          </div>
          </TabPanel>

          <!-- Onglet Logs d'audit -->
          <TabPanel class="admin-tab-panel">
            <div v-if="loadingAudit" class="loading">Chargement...</div>
            <div v-else-if="auditLogs.length === 0" class="no-data">Aucun log disponible</div>
            <div v-else class="admin-audit-container">
              <div class="admin-logs-list">
                <div
                  v-for="log in auditLogs"
                  :key="log.id"
                  class="admin-log-card"
                >
                  <div class="admin-log-header">
                    <span 
                      class="admin-log-icon" 
                      :style="{ color: getActionInfo(log.action).color }"
                    >
                      {{ getActionInfo(log.action).icon }}
                    </span>
                    <div class="admin-log-info">
                      <div class="admin-log-action">{{ getActionInfo(log.action).label }}</div>
                      <div class="admin-log-meta">
                        <span>Par: {{ log.userEmail }}</span>
                        <span>•</span>
                        <span>{{ formatDateTime(log.createdAt) }}</span>
                        <span v-if="log.entityType">•</span>
                        <span v-if="log.entityType">Type: {{ log.entityType }}</span>
                      </div>
                    </div>
                  </div>
                  <div v-if="log.details && Object.keys(log.details).length > 0" class="admin-log-details">
                    <span
                      v-for="(value, key) in log.details"
                      :key="key"
                      class="admin-log-detail-item"
                    >
                      <strong>{{ key }}:</strong> {{ value }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/vue'
import { Form, Field, ErrorMessage } from 'vee-validate'
import { useAuthStore } from '../../stores/auth'
import { supabase } from '../../services/supabase'
import Swal from 'sweetalert2'
import logger, { getConsoleDebugLogsEnabled, setConsoleDebugLogsEnabled } from '../../services/logger'
import { useToast } from '../../composables/useToast'
import devLogger from '../../utils/devLogger'

devLogger.log('[AdminView] Script setup - Composant en cours de chargement')

const router = useRouter()
const authStore = useAuthStore()
const { success, error: showErrorToast, info } = useToast()

devLogger.log('[AdminView] AuthStore:', authStore)
devLogger.log('[AdminView] isAdmin:', authStore.isAdmin)
devLogger.log('[AdminView] user:', authStore.user)

const consoleDebugLogsEnabled = ref(getConsoleDebugLogsEnabled())

function applyConsoleDebugLogs() {
  setConsoleDebugLogsEnabled(consoleDebugLogsEnabled.value)
  success(`Logs console debug: ${consoleDebugLogsEnabled.value ? 'activés' : 'désactivés'}`)
}

const activeTab = ref('users')
const tabs = [
  { id: 'users', label: 'Utilisateurs' },
  { id: 'teams', label: 'Équipes' },
  { id: 'leave-types', label: 'Types de congés' },
  { id: 'settings', label: 'Paramètres' },
  { id: 'stats', label: 'Statistiques' },
  { id: 'audit', label: 'Logs d\'audit' }
]

const selectedTabIndex = ref(0)

watch(() => activeTab.value, (newTab) => {
  const index = tabs.findIndex(tab => tab.id === newTab)
  if (index !== -1) {
    selectedTabIndex.value = index
  }
}, { immediate: true })

function handleTabChange(index) {
  const tabId = tabs[index]?.id
  if (tabId) {
    switchTab(tabId)
  }
}

const users = ref([])
const teams = ref([])
const globalLeaveTypes = ref([])
const loadingUsers = ref(false)
const loadingTeams = ref(false)
const loadingLeaveTypes = ref(false)
const loadingSettings = ref(false)
const loadingAudit = ref(false)
const userSearch = ref('')
const defaultLeaveTypes = ref('')
const defaultQuotas = ref('')
const auditLogs = ref([])
const stats = ref({
  totalUsers: 0,
  totalTeams: 0,
  totalLeaves: 0,
  pendingInvitations: 0
})

// Debounce pour la recherche
let searchTimeout = null
function debouncedLoadUsers() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadUsers()
  }, 300)
}

function goBack() {
  router.push('/')
}

function switchTab(tabId) {
  devLogger.log('[AdminView] switchTab appelé avec:', tabId)
  activeTab.value = tabId
  if (tabId === 'users') {
    devLogger.log('[AdminView] Chargement des utilisateurs...')
    loadUsers()
  } else if (tabId === 'teams') {
    devLogger.log('[AdminView] Chargement des équipes...')
    loadTeams()
  } else if (tabId === 'leave-types') {
    devLogger.log('[AdminView] Chargement des types de congés...')
    loadGlobalLeaveTypes()
  } else if (tabId === 'settings') {
    devLogger.log('[AdminView] Chargement des paramètres...')
    loadSettings()
  } else if (tabId === 'stats') {
    devLogger.log('[AdminView] Chargement des statistiques...')
    loadStats()
  } else if (tabId === 'audit') {
    devLogger.log('[AdminView] Chargement des logs d\'audit...')
    loadAuditLogs()
  }
}

async function loadUsers() {
  if (!authStore.isAdmin) {
    devLogger.warn('[AdminView] loadUsers: Utilisateur n\'est pas admin')
    return
  }

  try {
    devLogger.log('[AdminView] Chargement des utilisateurs...')
    loadingUsers.value = true
    const searchTerm = userSearch.value.trim()
    
    let query = supabase
      .from('user_emails')
      .select('user_id, email, created_at')
      .order('created_at', { ascending: false })

    if (searchTerm) {
      query = query.ilike('email', `%${searchTerm}%`)
    }

    const { data, error } = await query

    if (error) throw error

    // Enrichir avec des statistiques
    devLogger.log('[AdminView] Utilisateurs bruts reçus:', data?.length || 0)
    users.value = await Promise.all((data || []).map(async (user) => {
      const [leavesResult, teamsResult] = await Promise.all([
        supabase.from('leaves').select('id', { count: 'exact', head: true }).eq('user_id', user.user_id),
        supabase.from('team_members').select('id', { count: 'exact', head: true }).eq('user_id', user.user_id)
      ])

      return {
        id: user.user_id,
        email: user.email,
        createdAt: user.created_at,
        leavesCount: leavesResult.count || 0,
        teamsCount: teamsResult.count || 0
      }
    }))
    devLogger.log('[AdminView] Utilisateurs chargés:', users.value.length)
  } catch (err) {
    logger.error('[AdminView] Erreur lors du chargement des utilisateurs:', err)
    showErrorToast('Impossible de charger les utilisateurs: ' + (err.message || err))
  } finally {
    loadingUsers.value = false
  }
}

async function loadTeams() {
  if (!authStore.isAdmin) {
    devLogger.warn('[AdminView] loadTeams: Utilisateur n\'est pas admin')
    return
  }

  try {
    devLogger.log('[AdminView] Chargement des équipes...')
    loadingTeams.value = true
    const { data, error } = await supabase
      .from('teams')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })

    if (error) throw error

    teams.value = await Promise.all((data || []).map(async (team) => {
      const { count } = await supabase
        .from('team_members')
        .select('id', { count: 'exact', head: true })
        .eq('team_id', team.id)

      return {
        id: team.id,
        name: team.name,
        createdAt: team.created_at,
        membersCount: count || 0
      }
    }))
    devLogger.log('[AdminView] Équipes chargées:', teams.value.length)
  } catch (err) {
    logger.error('[AdminView] Erreur lors du chargement des équipes:', err)
    showErrorToast('Impossible de charger les équipes: ' + (err.message || err))
  } finally {
    loadingTeams.value = false
  }
}

async function loadStats() {
  if (!authStore.isAdmin) {
    devLogger.warn('[AdminView] loadStats: Utilisateur n\'est pas admin')
    return
  }

  try {
    devLogger.log('[AdminView] Chargement des statistiques...')
    const [usersResult, teamsResult, leavesResult, invitationsResult] = await Promise.all([
      supabase.from('user_emails').select('user_id', { count: 'exact', head: true }),
      supabase.from('teams').select('id', { count: 'exact', head: true }),
      supabase.from('leaves').select('id', { count: 'exact', head: true }),
      supabase.from('team_invitations').select('id', { count: 'exact', head: true }).eq('status', 'pending')
    ])

    devLogger.log('[AdminView] Statistiques reçues:', {
      users: usersResult.count,
      teams: teamsResult.count,
      leaves: leavesResult.count,
      invitations: invitationsResult.count
    })

    stats.value = {
      totalUsers: usersResult.count || 0,
      totalTeams: teamsResult.count || 0,
      totalLeaves: leavesResult.count || 0,
      pendingInvitations: invitationsResult.count || 0
    }
    
    devLogger.log('[AdminView] stats.value mis à jour:', stats.value)
  } catch (err) {
    logger.error('[AdminView] Erreur lors du chargement des statistiques:', err)
    logger.error('[AdminView] Erreur lors du chargement des statistiques:', err)
  }
}

async function loadSettings() {
  if (!authStore.isAdmin) {
    devLogger.warn('[AdminView] loadSettings: Utilisateur n\'est pas admin')
    return
  }

  try {
    loadingSettings.value = true
    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value, description')

    if (error) throw error

    const settings = {}
    ;(data || []).forEach(setting => {
      settings[setting.key] = {
        value: setting.value,
        description: setting.description
      }
    })

    // Charger les types de congés par défaut
    if (settings.default_leave_types) {
      let leaveTypes = Array.isArray(settings.default_leave_types.value)
        ? settings.default_leave_types.value
        : []
      
      // S'assurer que tous les types ont une catégorie
      leaveTypes = leaveTypes.map(type => {
        if (!type.category) {
          const eventTypes = ['télétravail', 'formation', 'grève', 'maladie']
          type.category = eventTypes.includes(type.id) ? 'event' : 'leave'
        }
        return type
      })
      
      defaultLeaveTypes.value = JSON.stringify(leaveTypes, null, 2)
    } else {
      // Utiliser les types par défaut
      const { getDefaultLeaveTypes } = await import('../../services/utils')
      defaultLeaveTypes.value = JSON.stringify(getDefaultLeaveTypes(), null, 2)
    }

    // Charger les quotas par défaut
    if (settings.default_quotas) {
      defaultQuotas.value = JSON.stringify(settings.default_quotas.value, null, 2)
    } else {
      defaultQuotas.value = JSON.stringify({
        'congé-payé': 25,
        'rtt': 22,
        'jours-hiver': 2
      }, null, 2)
    }
  } catch (err) {
    logger.error('[AdminView] Erreur lors du chargement des paramètres:', err)
    showErrorToast('Impossible de charger les paramètres: ' + (err.message || err))
  } finally {
    loadingSettings.value = false
  }
}

async function onSaveSettingsSubmit(values) {
  if (!authStore.isAdmin) {
    devLogger.warn('[AdminView] saveSettings: Utilisateur n\'est pas admin')
    return
  }

  try {
    // Les valeurs JSON sont déjà validées par VeeValidate
    const leaveTypes = JSON.parse(values.defaultLeaveTypes || defaultLeaveTypes.value)
    const quotas = JSON.parse(values.defaultQuotas || defaultQuotas.value)

    // Valider que chaque type a une catégorie valide
    const validCategories = ['leave', 'event']
    for (const type of leaveTypes) {
      if (!type.category) {
        type.category = 'leave'
      } else if (!validCategories.includes(type.category)) {
        throw new Error(`Catégorie invalide pour "${type.name}": "${type.category}". Doit être "leave" ou "event".`)
      }
    }

    const settings = {
      default_leave_types: leaveTypes,
      default_quotas: quotas
    }

    // Sauvegarder dans app_settings
    const updates = Object.keys(settings).map(key => ({
      key,
      value: settings[key],
      updated_by: authStore.user?.id,
      updated_at: new Date().toISOString()
    }))

    for (const update of updates) {
      const { error } = await supabase
        .from('app_settings')
        .upsert(update, {
          onConflict: 'key'
        })

      if (error) throw error
    }

    success('Paramètres sauvegardés avec succès')
  } catch (err) {
    logger.error('[AdminView] Erreur lors de la sauvegarde des paramètres:', err)
    if (err instanceof SyntaxError) {
      showErrorToast('Le JSON est invalide. Vérifiez la syntaxe (virgules, guillemets, accolades, etc.).')
    } else {
      showErrorToast('Erreur lors de la sauvegarde: ' + (err.message || err))
    }
  }
}

async function loadGlobalLeaveTypes() {
  if (!authStore.isAdmin) {
    devLogger.warn('[AdminView] loadGlobalLeaveTypes: Utilisateur n\'est pas admin')
    return
  }

  try {
    loadingLeaveTypes.value = true
    const { data, error } = await supabase
      .from('global_leave_types')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) throw error

    globalLeaveTypes.value = (data || []).map(t => ({
      id: t.id,
      name: t.name,
      label: t.label,
      category: t.category || 'leave'
    }))
    
    devLogger.log('[AdminView] Types de congés globaux chargés:', globalLeaveTypes.value.length)
  } catch (err) {
    logger.error('[AdminView] Erreur lors du chargement des types de congés globaux:', err)
    showErrorToast('Impossible de charger les types de congés: ' + (err.message || err))
  } finally {
    loadingLeaveTypes.value = false
  }
}

async function handleAddGlobalLeaveType() {
  const { value: formValues } = await Swal.fire({
    title: 'Ajouter un type de congé',
    html: `
      <input id="swal-name" class="swal2-input" placeholder="Nom (ex: Congé Payé)" required>
      <input id="swal-label" class="swal2-input" placeholder="Label (ex: CP)" maxlength="10" required>
      <select id="swal-category" class="swal2-select">
        <option value="leave">Congé</option>
        <option value="event">Événement</option>
      </select>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Ajouter',
    cancelButtonText: 'Annuler',
    preConfirm: () => {
      const name = document.getElementById('swal-name').value
      const label = document.getElementById('swal-label').value
      const category = document.getElementById('swal-category').value
      
      if (!name || !label) {
        Swal.showValidationMessage('Le nom et le label sont requis')
        return false
      }
      
      return { name, label, category }
    }
  })

  if (formValues) {
    try {
      // Générer un ID unique basé sur le nom
      const id = formValues.name.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

      const { error } = await supabase
        .from('global_leave_types')
        .insert({
          id: id,
          name: formValues.name,
          label: formValues.label,
          category: formValues.category || 'leave'
        })

      if (error) throw error

      success('Type de congé ajouté avec succès')
      await loadGlobalLeaveTypes()
    } catch (err) {
      logger.error('[AdminView] Erreur lors de l\'ajout du type:', err)
      showErrorToast('Erreur lors de l\'ajout: ' + (err.message || err))
    }
  }
}

async function handleEditGlobalLeaveType(type) {
  const { value: formValues } = await Swal.fire({
    title: 'Modifier le type de congé',
    html: `
      <input id="swal-name" class="swal2-input" value="${type.name}" placeholder="Nom" required>
      <input id="swal-label" class="swal2-input" value="${type.label}" placeholder="Label" maxlength="10" required>
      <select id="swal-category" class="swal2-select">
        <option value="leave" ${type.category === 'leave' ? 'selected' : ''}>Congé</option>
        <option value="event" ${type.category === 'event' ? 'selected' : ''}>Événement</option>
      </select>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Modifier',
    cancelButtonText: 'Annuler',
    preConfirm: () => {
      const name = document.getElementById('swal-name').value
      const label = document.getElementById('swal-label').value
      const category = document.getElementById('swal-category').value
      
      if (!name || !label) {
        Swal.showValidationMessage('Le nom et le label sont requis')
        return false
      }
      
      return { name, label, category }
    }
  })

  if (formValues) {
    try {
      const { error } = await supabase
        .from('global_leave_types')
        .update({
          name: formValues.name,
          label: formValues.label,
          category: formValues.category || 'leave',
          updated_at: new Date().toISOString()
        })
        .eq('id', type.id)

      if (error) throw error

      success('Type de congé modifié avec succès')
      await loadGlobalLeaveTypes()
    } catch (err) {
      logger.error('[AdminView] Erreur lors de la modification du type:', err)
      showErrorToast('Erreur lors de la modification: ' + (err.message || err))
    }
  }
}

async function handleDeleteGlobalLeaveType(type) {
  // Vérifier si le type est utilisé
  const { count } = await supabase
    .from('leaves')
    .select('id', { count: 'exact', head: true })
    .eq('leave_type_id', type.id)
    .limit(1)

  let confirmMessage = `Êtes-vous sûr de vouloir supprimer le type "<strong>${type.name}</strong>" ?`
  if (count > 0) {
    confirmMessage += `<br><br>⚠️ <strong>Attention</strong> : Ce type est utilisé dans ${count} jour(s) de congé. Ces congés seront également supprimés.`
  }

  const result = await Swal.fire({
    title: 'Supprimer le type de congé ?',
    html: confirmMessage,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Oui, supprimer',
    cancelButtonText: 'Annuler',
    confirmButtonColor: '#d33'
  })

  if (result.isConfirmed) {
    try {
      const { error } = await supabase
        .from('global_leave_types')
        .delete()
        .eq('id', type.id)

      if (error) throw error

      success('Type de congé supprimé avec succès')
      await loadGlobalLeaveTypes()
    } catch (err) {
      logger.error('[AdminView] Erreur lors de la suppression du type:', err)
      showErrorToast('Erreur lors de la suppression: ' + (err.message || err))
    }
  }
}

async function loadAuditLogs() {
  if (!authStore.isAdmin) {
    devLogger.warn('[AdminView] loadAuditLogs: Utilisateur n\'est pas admin')
    return
  }

  try {
    loadingAudit.value = true
    const { data, error } = await supabase
      .from('audit_logs')
      .select(`
        id,
        user_id,
        action,
        entity_type,
        entity_id,
        details,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) throw error

    // Récupérer les emails des utilisateurs
    const userIds = [...new Set((data || []).map(log => log.user_id).filter(Boolean))]
    const userEmailsMap = {}
    
    if (userIds.length > 0) {
      const { data: emailsData } = await supabase
        .from('user_emails')
        .select('user_id, email')
        .in('user_id', userIds)
      
      ;(emailsData || []).forEach(user => {
        userEmailsMap[user.user_id] = user.email
      })
    }

    // Formater les logs avec les emails
    auditLogs.value = (data || []).map(log => ({
      id: log.id,
      userId: log.user_id,
      userEmail: log.user_id ? (userEmailsMap[log.user_id] || 'Utilisateur inconnu') : 'Système',
      action: log.action,
      entityType: log.entity_type,
      entityId: log.entity_id,
      details: log.details,
      createdAt: log.created_at
    }))
  } catch (err) {
    logger.error('[AdminView] Erreur lors du chargement des logs d\'audit:', err)
    showErrorToast('Impossible de charger les logs d\'audit: ' + (err.message || err))
  } finally {
    loadingAudit.value = false
  }
}

function formatDateTime(dateString) {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getActionInfo(action) {
  const actionMap = {
    'user_deleted': { icon: '⌧', color: '#e74c3c', label: 'Utilisateur supprimé' },
    'team_deleted': { icon: '⌧', color: '#e74c3c', label: 'Groupe supprimé' },
    'team_ownership_transferred': { icon: '👑', color: '#f39c12', label: 'Propriété transférée' },
    'settings_updated': { icon: '⚙', color: '#3498db', label: 'Paramètres modifiés' },
    'team_created': { icon: '➕', color: '#2ecc71', label: 'Groupe créé' },
    'user_created': { icon: '➕', color: '#2ecc71', label: 'Utilisateur créé' },
    'admin_action': { icon: '🔒', color: '#9b59b6', label: 'Action admin' }
  }
  
  return actionMap[action] || { icon: '📝', color: '#666', label: action }
}

async function handleDeleteUser(user) {
  const result = await Swal.fire({
    title: 'Supprimer l\'utilisateur ?',
    html: `Êtes-vous sûr de vouloir supprimer <strong>${user.email}</strong> ?<br><br>
           Cette action est <strong style="color: #e74c3c;">irréversible</strong> et supprimera toutes ses données.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Oui, supprimer',
    cancelButtonText: 'Annuler',
    confirmButtonColor: '#d33'
  })

  if (result.isConfirmed) {
    try {
      info('La suppression du compte doit être faite depuis le dashboard Supabase.')
      await loadUsers()
    } catch (err) {
      showErrorToast(err.message || 'Erreur lors de la suppression')
    }
  }
}

async function handleDeleteTeam(team) {
  const result = await Swal.fire({
    title: 'Supprimer l\'équipe ?',
    text: `Voulez-vous supprimer l'équipe "${team.name}" ?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Oui, supprimer',
    cancelButtonText: 'Annuler',
    confirmButtonColor: '#d33'
  })

  if (result.isConfirmed) {
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', team.id)

      if (error) throw error

      success('Équipe supprimée avec succès')
      await loadTeams()
    } catch (err) {
      showErrorToast(err.message || 'Erreur lors de la suppression')
    }
  }
}

function formatDate(dateString) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('fr-FR')
}

// Charger les données au montage ou quand l'admin est disponible
function initializeData() {
  devLogger.log('[AdminView] initializeData - isAdmin:', authStore.isAdmin, 'activeTab:', activeTab.value)
  if (authStore.isAdmin) {
    devLogger.log('[AdminView] Appel de switchTab pour charger les données')
    switchTab(activeTab.value)
  } else {
    devLogger.warn('[AdminView] Utilisateur n\'est pas admin')
  }
}

// Watcher pour attendre que isAdmin soit disponible
watch(() => authStore.isAdmin, (isAdmin) => {
  devLogger.log('[AdminView] watch isAdmin changé:', isAdmin)
  if (isAdmin) {
    initializeData()
  }
}, { immediate: true })

onMounted(() => {
  devLogger.log('[AdminView] onMounted appelé')
  // Attendre un peu pour s'assurer que le store est prêt
  setTimeout(() => {
    devLogger.log('[AdminView] setTimeout - Appel initializeData')
    initializeData()
  }, 100)
})
</script>

<style scoped>
.admin-view {
  width: 100%;
}

.admin-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid var(--border-color);
}

.back-btn {
  background: var(--primary-color, #4a90e2);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
  transition: background 0.2s ease;
}

.back-btn:hover {
  background: #357abd;
}

.admin-header h1 {
  margin: 0;
  color: var(--text-color, #2c3e50);
  font-size: 2em;
}

.admin-error {
  text-align: center;
  padding: 40px;
  color: var(--danger-color, #e74c3c);
}

.btn-primary {
  background: var(--primary-color, #4a90e2);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
  margin-top: 20px;
  transition: background 0.2s ease;
}

.btn-primary:hover {
  background: #357abd;
}

.admin-content {
  margin-top: 20px;
}

.admin-tabs {
  display: flex;
  gap: 10px;
  border-bottom: 2px solid var(--border-color);
  margin-bottom: 20px;
}

.admin-tab {
  padding: 10px 20px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  font-size: 1em;
  color: var(--text-color);
  transition: all 0.3s ease;
  margin-bottom: -2px;
  outline: none;
}

.admin-tab:hover {
  color: var(--primary-color);
}

.admin-tab[data-headlessui-state~="selected"] {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
  font-weight: 600;
}

.admin-tab:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
  border-radius: 4px;
}

.admin-tab-content {
  min-height: 400px;
  padding: 20px 0;
}

.admin-tab-panel {
  display: block;
}

.admin-search {
  margin-bottom: 20px;
}

.admin-search input {
  width: 100%;
  padding: 10px;
  border: 2px solid var(--border-color);
  border-radius: 4px;
  font-size: 1em;
  background: var(--card-bg);
  color: var(--text-color);
}

.admin-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.admin-item-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  transition: all 0.2s ease;
}

.admin-item-card:hover {
  background: var(--hover-bg, rgba(0, 0, 0, 0.02));
  border-color: var(--primary-color);
}

.admin-item-info {
  flex: 1;
}

.admin-item-email {
  font-weight: 500;
  color: var(--text-color);
  margin-bottom: 5px;
}

.admin-item-meta {
  font-size: 0.85em;
  color: var(--text-color);
  opacity: 0.7;
  display: flex;
  gap: 10px;
}

.admin-item-actions {
  display: flex;
  gap: 8px;
}

.btn-danger {
  background: var(--danger-color, #e74c3c);
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.2em;
  transition: background 0.2s ease;
}

.btn-danger:hover {
  background: #c0392b;
}

.btn-secondary {
  background: var(--primary-color, #4a90e2);
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.2em;
  transition: background 0.2s ease;
  margin-right: 8px;
}

.btn-secondary:hover {
  background: #357abd;
}

/* Styles pour l'onglet Types de congés */
.admin-leave-types {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.admin-leave-types-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 20px;
}

.admin-leave-types-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.admin-leave-type-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  transition: all 0.2s ease;
}

.admin-leave-type-card:hover {
  background: var(--hover-bg, rgba(0, 0, 0, 0.02));
  border-color: var(--primary-color);
}

.admin-leave-type-info {
  flex: 1;
}

.admin-leave-type-name {
  font-weight: 500;
  color: var(--text-color);
  margin-bottom: 5px;
  font-size: 1.1em;
}

.admin-leave-type-meta {
  font-size: 0.85em;
  color: var(--text-color);
  opacity: 0.7;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.admin-leave-type-actions {
  display: flex;
  gap: 8px;
}

.admin-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-item {
  text-align: center;
  padding: 20px;
  background: var(--bg-color);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  transition: transform 0.2s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-label {
  font-size: 0.9em;
  color: var(--text-color);
  opacity: 0.7;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 2em;
  font-weight: bold;
  color: var(--primary-color);
}

.loading,
.no-data {
  text-align: center;
  padding: 40px;
  color: var(--text-color);
  opacity: 0.7;
}

/* Styles pour l'onglet Paramètres */
.admin-settings {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.admin-settings-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.admin-settings-section h3 {
  margin: 0;
  color: var(--text-color);
  font-size: 1.2em;
}

.admin-hint {
  font-size: 0.9em;
  color: var(--text-color);
  opacity: 0.7;
  font-style: italic;
  margin: 0;
}

.admin-settings-textarea {
  width: 100%;
  padding: 15px;
  border: 2px solid var(--border-color);
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
  background: var(--card-bg);
  color: var(--text-color);
  resize: vertical;
  min-height: 200px;
}

.admin-settings-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.1);
}

.admin-settings-textarea-error {
  border-color: #e74c3c;
}

.field-error {
  display: block;
  color: #e74c3c;
  font-size: 0.9em;
  margin-top: 5px;
  font-family: inherit;
}

.admin-settings-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 10px;
  border-top: 2px solid var(--border-color);
}

.btn-primary {
  background: var(--primary-color, #4a90e2);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
  transition: background 0.2s ease;
}

.btn-primary:hover {
  background: #357abd;
}

/* Styles pour l'onglet Logs d'audit */
.admin-audit-container {
  max-height: 600px;
  overflow-y: auto;
}

.admin-logs-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.admin-log-card {
  padding: 15px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  border-left: 4px solid var(--primary-color);
  transition: all 0.2s ease;
}

.admin-log-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateX(2px);
}

.admin-log-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.admin-log-icon {
  font-size: 1.5em;
  flex-shrink: 0;
}

.admin-log-info {
  flex: 1;
}

.admin-log-action {
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 5px;
  font-size: 1em;
}

.admin-log-meta {
  font-size: 0.85em;
  color: var(--text-color);
  opacity: 0.7;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.admin-log-details {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.admin-log-detail-item {
  font-size: 0.85em;
  color: var(--text-color);
  opacity: 0.8;
  padding: 4px 8px;
  background: var(--bg-color);
  border-radius: 4px;
}

.admin-log-detail-item strong {
  color: var(--text-color);
  margin-right: 5px;
}

@media (max-width: 768px) {
  .admin-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .admin-header h1 {
    font-size: 1.5em;
  }

  .admin-stats {
    grid-template-columns: 1fr;
  }
}
</style>

