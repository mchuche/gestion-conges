import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import * as teamsService from '../services/teams'
import logger from '../services/logger'

export const useTeamsStore = defineStore('teams', () => {
  const authStore = useAuthStore()
  
  // State
  const userTeams = ref([])
  const currentTeamId = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const hasTeams = computed(() => userTeams.value.length > 0)
  const currentTeam = computed(() => {
    if (!currentTeamId.value) return null
    return userTeams.value.find(t => t.id === currentTeamId.value)
  })
  
  // Vérifier si l'utilisateur actuel est propriétaire de l'équipe courante
  const isCurrentTeamOwner = computed(() => {
    if (!currentTeam.value) {
      logger.debug('[TeamsStore] isCurrentTeamOwner: false (pas d\'équipe courante)')
      return false
    }
    const isOwner = currentTeam.value.role === 'owner'
    logger.debug(`[TeamsStore] isCurrentTeamOwner: ${isOwner} (role=${currentTeam.value.role}, team=${currentTeam.value.name})`)
    return isOwner
  })

  // Actions
  async function loadUserTeams() {
    if (!authStore.user?.id) {
      userTeams.value = []
      currentTeamId.value = null
      return
    }

    try {
      loading.value = true
      error.value = null
      const teams = await teamsService.loadUserTeams(authStore.user.id)
      userTeams.value = teams
      
      // Si aucune équipe n'est sélectionnée et qu'il y a des équipes, sélectionner la première
      if (!currentTeamId.value && teams.length > 0) {
        currentTeamId.value = teams[0].id
      }
      
      logger.debug('[TeamsStore] Équipes chargées:', teams.length)
    } catch (err) {
      logger.error('[TeamsStore] Erreur lors du chargement des équipes:', err)
      error.value = err.message
      userTeams.value = []
    } finally {
      loading.value = false
    }
  }

  async function createTeam(name, description = '') {
    if (!authStore.user?.id) {
      throw new Error('Utilisateur non connecté')
    }

    try {
      loading.value = true
      error.value = null
      const team = await teamsService.createTeam(authStore.user.id, name, description)
      await loadUserTeams()
      currentTeamId.value = team.id
      return team
    } catch (err) {
      logger.error('[TeamsStore] Erreur lors de la création de l\'équipe:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  function setCurrentTeam(teamId) {
    // Valider que teamId est soit null, soit un UUID valide
    if (teamId === null || teamId === undefined || teamId === '') {
      currentTeamId.value = null
    } else if (typeof teamId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(teamId)) {
      currentTeamId.value = teamId
    } else {
      logger.warn('[TeamsStore] setCurrentTeam: ID d\'équipe invalide:', teamId)
      currentTeamId.value = null
    }
  }

  return {
    // State
    userTeams,
    currentTeamId,
    loading,
    error,
    // Getters
    hasTeams,
    currentTeam,
    isCurrentTeamOwner,
    // Actions
    loadUserTeams,
    createTeam,
    setCurrentTeam
  }
})
