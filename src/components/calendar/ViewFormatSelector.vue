<template>
  <div class="view-format-selector">
    <label for="yearViewFormatSelect" class="format-label">Format de vue :</label>
    <select
      id="yearViewFormatSelect"
      v-model="selectedFormat"
      @change="handleFormatChange"
      class="format-select"
    >
      <option value="semester">Vue Semestrielle</option>
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
  margin-bottom: 20px;
  padding: 10px;
  background: var(--card-bg, white);
  border-radius: 4px;
  border: 1px solid var(--border-color, #e0e0e0);
}

.format-label {
  font-weight: 500;
  color: var(--text-color, #2c3e50);
  font-size: 0.95em;
}

.format-select {
  flex: 1;
  max-width: 300px;
  padding: 8px 12px;
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 4px;
  background-color: var(--bg-color, #f5f5f5);
  color: var(--text-color, #2c3e50);
  font-size: 0.95em;
  cursor: pointer;
  transition: all 0.2s ease;
}

.format-select:hover {
  border-color: var(--primary-color, #4a90e2);
  background-color: var(--card-bg, white);
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

