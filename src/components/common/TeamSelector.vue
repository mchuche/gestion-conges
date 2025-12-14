<template>
  <div class="team-selector">
    <label for="teamSelect" class="team-select-label">Équipe :</label>
    <select
      id="teamSelect"
      v-model="selectedTeamId"
      @change="handleTeamChange"
      class="team-select"
    >
      <option value="">Mon calendrier</option>
      <option
        v-for="team in teamsStore.userTeams"
        :key="team.id"
        :value="team.id"
      >
        {{ team.name }}
      </option>
    </select>
  </div>
</template>

<script setup>
import { computed, watch, onMounted } from 'vue'
import { useTeamsStore } from '../../stores/teams'
import { useUIStore } from '../../stores/ui'
import logger from '../../services/logger'

const teamsStore = useTeamsStore()
const uiStore = useUIStore()

const hasTeams = computed(() => teamsStore.userTeams.length > 0)

const selectedTeamId = computed({
  get: () => teamsStore.currentTeamId,
  set: (value) => teamsStore.setCurrentTeam(value)
})

function handleTeamChange(event) {
  const value = event.target.value
  // Vérifier si c'est null, vide, ou "Mon calendrier" (texte de l'option)
  const teamId = (value === 'null' || value === '' || value === null || value === undefined || value === 'Mon calendrier') ? null : value
  // Valider que c'est un UUID valide si ce n'est pas null
  if (teamId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(teamId)) {
    logger.warn('[TeamSelector] ID d\'équipe invalide:', teamId)
    teamsStore.setCurrentTeam(null)
    return
  }
  teamsStore.setCurrentTeam(teamId)
}

// Charger les équipes au montage
onMounted(async () => {
  if (!hasTeams.value) {
    await teamsStore.loadUserTeams()
  }
})
</script>

<style scoped>
.team-selector {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0;
  background: transparent;
  border: none;
}

.team-select-label {
  font-weight: 500;
  color: var(--text-color, #2c3e50);
  font-size: 0.95em;
  white-space: nowrap;
}

.team-select {
  min-width: 200px;
  padding: 8px 12px;
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 4px;
  background-color: var(--card-bg, white);
  color: var(--text-color, #2c3e50);
  font-size: 0.95em;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.team-select:hover {
  border-color: var(--primary-color, #4a90e2);
  box-shadow: 0 0 0 1px rgba(74, 144, 226, 0.1);
}

.team-select:focus {
  outline: none;
  border-color: var(--primary-color, #4a90e2);
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
}

@media (max-width: 768px) {
  .team-selector {
    flex-direction: column;
    align-items: stretch;
  }

  .team-select {
    max-width: 100%;
  }
}
</style>

