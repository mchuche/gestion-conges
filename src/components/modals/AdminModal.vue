<template>
  <Modal :model-value="showModal" @close="closeModal" title="Administration" content-class="admin-modal">
    <div v-if="!authStore.isAdmin" class="admin-error">
      <p>Vous n'avez pas les droits d'administrateur pour accéder à cette page.</p>
      <p style="margin-top: 10px; font-size: 0.9em; opacity: 0.7;">
        Debug: isAdmin = {{ authStore.isAdmin }}, user = {{ authStore.user ? 'connecté' : 'non connecté' }}
      </p>
    </div>
    
    <div v-else class="admin-content">
      <!-- Onglets -->
      <div class="admin-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['admin-tab', { active: activeTab === tab.id }]"
          @click="switchTab(tab.id)"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Contenu des onglets -->
      <div class="admin-tab-content">
        <!-- Onglet Utilisateurs -->
        <div v-if="activeTab === 'users'" class="admin-tab-panel">
          <div class="admin-search">
            <input
              v-model="userSearch"
              type="text"
              placeholder="Rechercher par email..."
              @input="loadUsers"
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
        </div>

        <!-- Onglet Équipes -->
        <div v-if="activeTab === 'teams'" class="admin-tab-panel">
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
        </div>

        <!-- Onglet Statistiques -->
        <div v-if="activeTab === 'stats'" class="admin-tab-panel">
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
          </div>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useUIStore } from '../../stores/ui'
import { useAuthStore } from '../../stores/auth'
import { supabase } from '../../services/supabase'
import Modal from '../common/Modal.vue'
import Swal from 'sweetalert2'
import logger from '../../services/logger'

const uiStore = useUIStore()
const authStore = useAuthStore()

const showModal = computed(() => uiStore.showAdminModal)
const activeTab = ref('users')
const tabs = [
  { id: 'users', label: 'Utilisateurs' },
  { id: 'teams', label: 'Équipes' },
  { id: 'stats', label: 'Statistiques' }
]

const users = ref([])
const teams = ref([])
const loadingUsers = ref(false)
const loadingTeams = ref(false)
const userSearch = ref('')
const stats = ref({
  totalUsers: 0,
  totalTeams: 0,
  totalLeaves: 0
})

function closeModal() {
  uiStore.closeAdminModal()
  activeTab.value = 'users'
  userSearch.value = ''
}

function switchTab(tabId) {
  activeTab.value = tabId
  if (tabId === 'users') {
    loadUsers()
  } else if (tabId === 'teams') {
    loadTeams()
  } else if (tabId === 'stats') {
    loadStats()
  }
}

async function loadUsers() {
  if (!authStore.isAdmin) return

  try {
    loadingUsers.value = true
    const searchTerm = userSearch.value.trim()
    
    // Utiliser user_emails (table qui existe dans le schéma)
    let query = supabase
      .from('user_emails')
      .select('user_id, email, created_at')
      .order('created_at', { ascending: false })

    if (searchTerm) {
      query = query.ilike('email', `%${searchTerm}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('[AdminModal] Erreur Supabase:', error)
      throw error
    }

    console.log('[AdminModal] Utilisateurs trouvés:', data?.length || 0)

    // Enrichir avec des statistiques
    users.value = await Promise.all((data || []).map(async (user) => {
      const [leavesCount, teamsCount] = await Promise.all([
        supabase.from('leaves').select('id', { count: 'exact', head: true }).eq('user_id', user.user_id),
        supabase.from('team_members').select('id', { count: 'exact', head: true }).eq('user_id', user.user_id)
      ])

      return {
        id: user.user_id,
        email: user.email,
        createdAt: user.created_at,
        leavesCount: leavesCount.count || 0,
        teamsCount: teamsCount.count || 0
      }
    }))
  } catch (err) {
    logger.error('[AdminModal] Erreur lors du chargement des utilisateurs:', err)
    Swal.fire('Erreur', 'Impossible de charger les utilisateurs', 'error')
  } finally {
    loadingUsers.value = false
  }
}

async function loadTeams() {
  if (!authStore.isAdmin) return

  try {
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
    
    console.log('[AdminModal] Équipes chargées:', teams.value.length)
  } catch (err) {
    logger.error('[AdminModal] Erreur lors du chargement des équipes:', err)
    Swal.fire('Erreur', 'Impossible de charger les équipes', 'error')
  } finally {
    loadingTeams.value = false
  }
}

async function loadStats() {
  if (!authStore.isAdmin) return

  try {
    console.log('[AdminModal] Chargement des statistiques...')
    const [usersCount, teamsCount, leavesCount] = await Promise.all([
      supabase.from('user_emails').select('id', { count: 'exact', head: true }),
      supabase.from('teams').select('id', { count: 'exact', head: true }),
      supabase.from('leaves').select('id', { count: 'exact', head: true })
    ])

    stats.value = {
      totalUsers: usersCount.count || 0,
      totalTeams: teamsCount.count || 0,
      totalLeaves: leavesCount.count || 0
    }
    console.log('[AdminModal] Statistiques chargées:', stats.value)
  } catch (err) {
    logger.error('[AdminModal] Erreur lors du chargement des statistiques:', err)
    console.error('[AdminModal] Erreur lors du chargement des statistiques:', err)
  }
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
      // Note: La suppression dans auth.users nécessite l'Admin API
      // Ici on supprime juste les données associées
      Swal.fire('Info', 'La suppression du compte doit être faite depuis le dashboard Supabase.', 'info')
      await loadUsers()
    } catch (err) {
      Swal.fire('Erreur', err.message || 'Erreur lors de la suppression', 'error')
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

      Swal.fire('Succès', 'Équipe supprimée avec succès', 'success')
      await loadTeams()
    } catch (err) {
      Swal.fire('Erreur', err.message || 'Erreur lors de la suppression', 'error')
    }
  }
}

function formatDate(dateString) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('fr-FR')
}

watch(showModal, (isOpen) => {
  if (isOpen) {
    console.log('[AdminModal] Modal ouverte')
    console.log('[AdminModal] isAdmin:', authStore.isAdmin)
    console.log('[AdminModal] user:', authStore.user)
    console.log('[AdminModal] isAuthenticated:', authStore.isAuthenticated)
    if (authStore.isAdmin) {
      console.log('[AdminModal] Chargement des données pour l\'onglet:', activeTab.value)
      switchTab(activeTab.value)
    } else {
      console.warn('[AdminModal] Utilisateur non admin - accès refusé')
    }
  }
})

onMounted(() => {
  if (showModal.value) {
    console.log('[AdminModal] Composant monté, isAdmin:', authStore.isAdmin)
    if (authStore.isAdmin) {
      switchTab(activeTab.value)
    }
  }
})
</script>

<style scoped>
.admin-modal {
  min-width: 800px;
  max-width: 1100px;
}

.admin-error {
  text-align: center;
  padding: 40px;
  color: var(--danger-color, #e74c3c);
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
}

.admin-tab:hover {
  color: var(--primary-color);
}

.admin-tab.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
  font-weight: 600;
}

.admin-tab-content {
  min-height: 400px;
}

.admin-tab-panel {
  padding: 20px 0;
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
}

.btn-danger:hover {
  background: #c0392b;
}

.admin-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.stat-item {
  text-align: center;
  padding: 20px;
  background: var(--bg-color);
  border: 2px solid var(--border-color);
  border-radius: 8px;
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
</style>

