<template>
  <Modal :model-value="showModal" @close="closeModal" title="Gestion des équipes" content-class="teams-modal">
    <div class="teams-modal-content">
      <!-- Section création d'équipe -->
      <div v-if="!selectedTeam" class="create-team-section">
        <h4>Créer une nouvelle équipe</h4>
        <div class="form-group">
          <label>Nom de l'équipe</label>
          <input v-model="newTeamName" type="text" placeholder="Ex: Équipe Marketing" />
        </div>
        <div class="form-group">
          <label>Description (optionnel)</label>
          <textarea v-model="newTeamDescription" placeholder="Description de l'équipe"></textarea>
        </div>
        <button @click="handleCreateTeam" class="btn-primary" :disabled="!newTeamName || creating">
          {{ creating ? 'Création...' : 'Créer l\'équipe' }}
        </button>
      </div>

      <!-- Liste des équipes -->
      <div v-if="!selectedTeam" class="teams-list-section">
        <h4>Mes équipes</h4>
        <div v-if="teamsStore.loading" class="loading">Chargement...</div>
        <div v-else-if="teamsStore.userTeams.length === 0" class="no-teams">
          <p>Aucune équipe. Créez-en une pour commencer !</p>
        </div>
        <div v-else class="teams-list">
          <div
            v-for="team in teamsStore.userTeams"
            :key="team.id"
            class="team-card"
          >
            <div class="team-card-header">
              <h5>{{ team.name }}</h5>
              <span class="team-role-badge">
                {{ getRoleLabel(team.role) }}
              </span>
            </div>
            <p v-if="team.description" class="team-description">{{ team.description }}</p>
            <button @click="showTeamDetails(team)" class="btn-secondary">
              Voir les membres
            </button>
          </div>
        </div>
      </div>

      <!-- Détails d'une équipe -->
      <div v-if="selectedTeam" class="team-details-section">
        <div class="team-details-header">
          <button @click="backToTeamsList" class="btn-back">← Retour</button>
          <h4>{{ selectedTeam.name }}</h4>
          <button
            v-if="canDeleteTeam"
            @click="handleDeleteTeam"
            class="btn-danger"
          >
            Supprimer l'équipe
          </button>
        </div>

        <div v-if="loadingMembers" class="loading">Chargement des membres...</div>
        <div v-else class="members-section">
          <div class="members-list">
            <div
              v-for="member in members"
              :key="member.userId"
              class="member-card"
            >
              <div class="member-info">
                <span class="member-email">{{ member.email }}</span>
                <span class="member-role">{{ getRoleLabel(member.role) }}</span>
              </div>
              <div class="member-actions">
                <button
                  v-if="canTransferOwnership(member)"
                  @click="handleTransferOwnership(member)"
                  class="btn-secondary"
                  title="Transférer la propriété"
                >
                  👑 Transférer
                </button>
                <button
                  v-if="canRemoveMember(member)"
                  @click="handleRemoveMember(member)"
                  class="btn-danger"
                >
                  Retirer
                </button>
              </div>
            </div>
          </div>

          <div v-if="pendingInvitations.length > 0" class="invitations-section">
            <h5>Invitations en attente</h5>
            <div
              v-for="invitation in pendingInvitations"
              :key="invitation.id"
              class="member-card invitation-card"
            >
              <div class="member-info">
                <span class="member-email">{{ invitation.email }}</span>
                <span class="member-role" style="opacity: 0.7;">⏳ En attente</span>
              </div>
              <button
                v-if="canDeleteInvitation"
                @click="handleDeleteInvitation(invitation)"
                class="btn-danger"
              >
                Annuler
              </button>
            </div>
          </div>

          <button
            v-if="canAddMember"
            @click="showAddMemberDialog"
            class="btn-primary"
          >
            + Ajouter un membre
          </button>
        </div>
      </div>

      <!-- Dialog d'ajout de membre -->
      <div v-if="showAddMember" class="add-member-dialog">
        <h5>Inviter un membre</h5>
        <div class="form-group">
          <label>Email</label>
          <input v-model="newMemberEmail" type="email" placeholder="email@example.com" />
        </div>
        <div class="dialog-actions">
          <button @click="hideAddMemberDialog" class="btn-secondary">Annuler</button>
          <button @click="handleInviteMember" class="btn-primary" :disabled="!newMemberEmail || inviting">
            {{ inviting ? 'Envoi...' : 'Inviter' }}
          </button>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useUIStore } from '../../stores/ui'
import { useTeamsStore } from '../../stores/teams'
import { useAuthStore } from '../../stores/auth'
import Modal from '../common/Modal.vue'
import * as teamsService from '../../services/teams'
import Swal from 'sweetalert2'
import logger from '../../services/logger'

const uiStore = useUIStore()
const teamsStore = useTeamsStore()
const authStore = useAuthStore()

const showModal = computed(() => uiStore.showTeamsModal)
const selectedTeam = ref(null)
const members = ref([])
const pendingInvitations = ref([])
const loadingMembers = ref(false)
const newTeamName = ref('')
const newTeamDescription = ref('')
const creating = ref(false)
const showAddMember = ref(false)
const newMemberEmail = ref('')
const inviting = ref(false)

const canDeleteTeam = computed(() => {
  return selectedTeam.value && selectedTeam.value.createdBy === authStore.user?.id
})

const canAddMember = computed(() => {
  if (!selectedTeam.value) return false
  const role = selectedTeam.value.role
  return role === 'owner' || role === 'admin'
})

const canDeleteInvitation = computed(() => {
  if (!selectedTeam.value) return false
  const role = selectedTeam.value.role
  return role === 'owner' || role === 'admin'
})

function closeModal() {
  uiStore.closeTeamsModal()
  selectedTeam.value = null
  newTeamName.value = ''
  newTeamDescription.value = ''
  showAddMember.value = false
  newMemberEmail.value = ''
}

function getRoleLabel(role) {
  const labels = {
    owner: '👑 Propriétaire',
    admin: '⚙ Admin',
    member: '👤 Membre'
  }
  return labels[role] || role
}

async function handleCreateTeam() {
  if (!newTeamName.value.trim()) return

  try {
    creating.value = true
    await teamsStore.createTeam(newTeamName.value, newTeamDescription.value)
    Swal.fire('Succès', 'Équipe créée avec succès', 'success')
    newTeamName.value = ''
    newTeamDescription.value = ''
  } catch (err) {
    Swal.fire('Erreur', err.message || 'Erreur lors de la création de l\'équipe', 'error')
  } finally {
    creating.value = false
  }
}

async function showTeamDetails(team) {
  selectedTeam.value = team
  loadingMembers.value = true
  
  try {
    members.value = await teamsService.loadTeamMembers(team.id)
    const invitations = await teamsService.loadTeamInvitations(team.id)
    pendingInvitations.value = invitations.filter(inv => inv.status === 'pending')
  } catch (err) {
    logger.error('[TeamsModal] Erreur lors du chargement des membres:', err)
    Swal.fire('Erreur', 'Impossible de charger les membres', 'error')
  } finally {
    loadingMembers.value = false
  }
}

function backToTeamsList() {
  selectedTeam.value = null
  members.value = []
  pendingInvitations.value = []
}

function canTransferOwnership(member) {
  if (!selectedTeam.value) return false
  const isCurrentUserOwner = selectedTeam.value.createdBy === authStore.user?.id && selectedTeam.value.role === 'owner'
  const isOwner = selectedTeam.value.createdBy === member.userId
  return isCurrentUserOwner && !isOwner
}

function canRemoveMember(member) {
  if (!selectedTeam.value) return false
  const role = selectedTeam.value.role
  const isOwner = selectedTeam.value.createdBy === member.userId
  return (role === 'owner' || role === 'admin') && !isOwner
}

async function handleTransferOwnership(member) {
  const result = await Swal.fire({
    title: 'Transférer la propriété ?',
    text: `Voulez-vous transférer la propriété de l'équipe à ${member.email} ?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Oui, transférer',
    cancelButtonText: 'Annuler'
  })

  if (result.isConfirmed) {
    try {
      await teamsService.transferTeamOwnership(selectedTeam.value.id, member.userId)
      Swal.fire('Succès', 'Propriété transférée avec succès', 'success')
      await showTeamDetails(selectedTeam.value)
      await teamsStore.loadUserTeams()
    } catch (err) {
      Swal.fire('Erreur', err.message || 'Erreur lors du transfert', 'error')
    }
  }
}

async function handleRemoveMember(member) {
  const result = await Swal.fire({
    title: 'Retirer le membre ?',
    text: `Voulez-vous retirer ${member.email} de l'équipe ?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Oui, retirer',
    cancelButtonText: 'Annuler'
  })

  if (result.isConfirmed) {
    try {
      await teamsService.removeTeamMember(selectedTeam.value.id, member.userId)
      Swal.fire('Succès', 'Membre retiré avec succès', 'success')
      await showTeamDetails(selectedTeam.value)
    } catch (err) {
      Swal.fire('Erreur', err.message || 'Erreur lors du retrait', 'error')
    }
  }
}

async function handleDeleteTeam() {
  const result = await Swal.fire({
    title: 'Supprimer l\'équipe ?',
    text: 'Cette action est irréversible. Tous les membres seront retirés.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Oui, supprimer',
    cancelButtonText: 'Annuler',
    confirmButtonColor: '#d33'
  })

  if (result.isConfirmed) {
    try {
      await teamsService.deleteTeam(selectedTeam.value.id)
      Swal.fire('Succès', 'Équipe supprimée avec succès', 'success')
      backToTeamsList()
      await teamsStore.loadUserTeams()
    } catch (err) {
      Swal.fire('Erreur', err.message || 'Erreur lors de la suppression', 'error')
    }
  }
}

function showAddMemberDialog() {
  showAddMember.value = true
  newMemberEmail.value = ''
}

function hideAddMemberDialog() {
  showAddMember.value = false
  newMemberEmail.value = ''
}

async function handleInviteMember() {
  if (!newMemberEmail.value.trim()) return

  try {
    inviting.value = true
    await teamsService.inviteTeamMember(
      selectedTeam.value.id,
      authStore.user.id,
      newMemberEmail.value
    )
    Swal.fire('Succès', 'Invitation envoyée', 'success')
    hideAddMemberDialog()
    await showTeamDetails(selectedTeam.value)
  } catch (err) {
    Swal.fire('Erreur', err.message || 'Erreur lors de l\'invitation', 'error')
  } finally {
    inviting.value = false
  }
}

async function handleDeleteInvitation(invitation) {
  try {
    await teamsService.deleteTeamInvitation(invitation.id)
    Swal.fire('Succès', 'Invitation annulée', 'success')
    await showTeamDetails(selectedTeam.value)
  } catch (err) {
    Swal.fire('Erreur', err.message || 'Erreur lors de l\'annulation', 'error')
  }
}

watch(showModal, async (isOpen) => {
  if (isOpen) {
    console.log('[TeamsModal] Modal ouverte, chargement des équipes...')
    if (!authStore.user?.id) {
      console.warn('[TeamsModal] Utilisateur non disponible')
      return
    }
    try {
      await teamsStore.loadUserTeams()
      console.log('[TeamsModal] Équipes chargées:', teamsStore.userTeams.length)
    } catch (err) {
      console.error('[TeamsModal] Erreur lors du chargement:', err)
    }
  }
})

onMounted(async () => {
  if (showModal.value && authStore.user?.id) {
    console.log('[TeamsModal] Composant monté, chargement des équipes...')
    try {
      await teamsStore.loadUserTeams()
      console.log('[TeamsModal] Équipes chargées:', teamsStore.userTeams.length)
    } catch (err) {
      console.error('[TeamsModal] Erreur lors du chargement:', err)
    }
  }
})
</script>

<style scoped>
.teams-modal-content {
  min-width: 600px;
  max-width: 900px;
}

.create-team-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-color);
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: var(--text-color);
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 2px solid var(--border-color);
  border-radius: 4px;
  font-size: 1em;
}

.form-group textarea {
  min-height: 80px;
  resize: vertical;
}

.teams-list-section h4,
.create-team-section h4 {
  margin-bottom: 15px;
  color: var(--primary-color);
}

.no-teams {
  text-align: center;
  padding: 40px;
  color: var(--text-color);
  opacity: 0.7;
}

.teams-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.team-card {
  background: var(--bg-color);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  padding: 15px;
}

.team-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.team-card-header h5 {
  margin: 0;
  color: var(--text-color);
}

.team-role-badge {
  font-size: 0.85em;
  padding: 4px 8px;
  background: var(--primary-color);
  color: white;
  border-radius: 4px;
}

.team-description {
  margin: 10px 0;
  color: var(--text-color);
  opacity: 0.8;
}

.team-details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.team-details-header h4 {
  margin: 0;
  flex: 1;
  text-align: center;
}

.btn-back {
  background: var(--secondary-color);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.members-section {
  margin-top: 20px;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.member-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
}

.member-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.member-email {
  font-weight: 500;
  color: var(--text-color);
}

.member-role {
  font-size: 0.85em;
  color: var(--text-color);
  opacity: 0.7;
}

.member-actions {
  display: flex;
  gap: 8px;
}

.invitations-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
}

.invitations-section h5 {
  margin-bottom: 10px;
  color: var(--text-color);
}

.invitation-card {
  opacity: 0.8;
}

.add-member-dialog {
  margin-top: 20px;
  padding: 20px;
  background: var(--bg-color);
  border: 2px solid var(--border-color);
  border-radius: 8px;
}

.add-member-dialog h5 {
  margin-bottom: 15px;
  color: var(--text-color);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 15px;
}

.btn-primary,
.btn-secondary,
.btn-danger {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
  transition: all 0.3s ease;
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
  background: var(--secondary-color);
  color: white;
}

.btn-danger {
  background: var(--danger-color, #e74c3c);
  color: white;
}

.btn-danger:hover {
  background: #c0392b;
}

.loading {
  text-align: center;
  padding: 20px;
  color: var(--text-color);
}
</style>

