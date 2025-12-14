<template>
  <div class="team-selector">
    <label for="teamSelect" class="team-select-label">Équipe :</label>
    <select
      id="teamSelect"
      v-model="selectedTeamId"
      @change="handleTeamChange"
      class="team-select"
    >
      <option :value="null">Mon calendrier</option>
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

const teamsStore = useTeamsStore()
const uiStore = useUIStore()

const hasTeams = computed(() => teamsStore.userTeams.length > 0)

const selectedTeamId = computed({
  get: () => teamsStore.currentTeamId,
  set: (value) => teamsStore.setCurrentTeam(value)
})

function handleTeamChange(event) {
  const teamId = event.target.value === 'null' || event.target.value === '' ? null : event.target.value
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

