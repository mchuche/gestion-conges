<template>
  <div class="view-format-selector">
    <label for="yearViewFormatSelect" class="format-label">Format de vue :</label>
    <select
      id="yearViewFormatSelect"
      v-model="selectedFormat"
      @change="handleFormatChange"
      class="format-select"
    >
      <option value="semester">Vue Annuelle</option>
      <option value="columns">Vue Annuelle (Colonnes)</option>
      <option value="presence">Matrice de Présence (Horizontale)</option>
      <option value="presence-vertical">Matrice de Présence (Verticale)</option>
    </select>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useUIStore } from '../../stores/ui'

const uiStore = useUIStore()

const selectedFormat = computed({
  get: () => uiStore.yearViewFormat,
  set: (value) => uiStore.setYearViewFormat(value)
})

function handleFormatChange(event) {
  uiStore.setYearViewFormat(event.target.value)
}
</script>

<style scoped>
.view-format-selector {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0;
  background: transparent;
  border: none;
}

.format-label {
  font-weight: 500;
  color: var(--text-color, #2c3e50);
  font-size: 0.95em;
  white-space: nowrap;
}

.format-select {
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

.format-select:hover {
  border-color: var(--primary-color, #4a90e2);
  box-shadow: 0 0 0 1px rgba(74, 144, 226, 0.1);
}

.format-select:focus {
  outline: none;
  border-color: var(--primary-color, #4a90e2);
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
}

@media (max-width: 768px) {
  .view-format-selector {
    flex-direction: column;
    align-items: stretch;
  }

  .format-select {
    max-width: 100%;
  }
}
</style>

