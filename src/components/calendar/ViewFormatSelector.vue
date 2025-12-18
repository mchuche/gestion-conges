<template>
  <div class="view-format-selector">
    <label for="yearViewFormatSelect" class="format-label">Format de vue :</label>

    <!-- Desktop: switch segmenté -->
    <div class="format-segmented" role="tablist" aria-label="Format de vue">
      <button
        type="button"
        class="format-segment"
        :class="{ active: selectedFormat === 'columns' }"
        role="tab"
        :aria-selected="selectedFormat === 'columns'"
        @click="setFormat('columns')"
      >
        Vue Annuelle
      </button>
      <button
        type="button"
        class="format-segment"
        :class="{ active: selectedFormat === 'presence-vertical' }"
        role="tab"
        :aria-selected="selectedFormat === 'presence-vertical'"
        @click="setFormat('presence-vertical')"
      >
        Matrice de Présence
      </button>
    </div>

    <!-- Mobile: dropdown -->
    <select
      id="yearViewFormatSelect"
      v-model="selectedFormat"
      @change="handleFormatChange"
      class="format-select"
    >
      <option value="columns">Vue Annuelle</option>
      <option value="presence-vertical">Matrice de Présence</option>
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

function setFormat(format) {
  uiStore.setYearViewFormat(format)
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

/* Switch segmenté (desktop) */
.format-segmented {
  display: inline-flex;
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 999px;
  overflow: hidden;
  background: var(--card-bg, white);
}

.format-segment {
  border: none;
  background: transparent;
  color: var(--text-color, #2c3e50);
  padding: 8px 12px;
  font-size: 0.95em;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
  white-space: nowrap;
}

.format-segment + .format-segment {
  border-left: 1px solid var(--border-color, #e0e0e0);
}

.format-segment:hover {
  background: rgba(74, 144, 226, 0.08);
}

.format-segment.active {
  background: var(--primary-color, #4a90e2);
  color: white;
}

.format-segment:focus {
  outline: none;
}

.format-segment:focus-visible {
  box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.8), 0 0 0 2px rgba(74, 144, 226, 0.35);
}

@media (max-width: 768px) {
  .view-format-selector {
    flex-direction: column;
    align-items: stretch;
  }

  .format-select {
    max-width: 100%;
  }

  /* Mobile: dropdown uniquement */
  .format-segmented {
    display: none;
  }
}

/* Desktop: segmenté uniquement */
@media (min-width: 769px) {
  .format-select {
    display: none;
  }
}
</style>

