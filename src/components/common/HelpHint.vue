<template>
  <div
    v-if="isVisible"
    id="helpHint"
    :class="['help-hint', { 'mobile-active': isMobileActive }]"
  >
    <Icon name="info" :size="16" class="help-hint-icon" />
    <span v-html="message"></span>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useUIStore } from '../../stores/ui'
import Icon from './Icon.vue'

const uiStore = useUIStore()

const isMobile = computed(() => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
})

const isMultiSelectActive = computed(() => {
  return uiStore.multiSelectMode && uiStore.selectedDates.length > 0
})

const isVisible = computed(() => {
  return isMobile.value && isMultiSelectActive.value
})

const isMobileActive = computed(() => {
  return isVisible.value
})

const message = computed(() => {
  if (uiStore.selectedDates.length > 1) {
    return `Vous avez sélectionné <strong>${uiStore.selectedDates.length} jours</strong>. Cliquez sur un jour sélectionné pour appliquer un congé à tous.`
  }
  return 'Maintenez <strong>Ctrl</strong> (ou <strong>Cmd</strong> sur Mac) et cliquez sur plusieurs jours pour les sélectionner.'
})

// Détecter les changements de sélection
onMounted(() => {
  // Le computed se mettra à jour automatiquement
})

onUnmounted(() => {
  // Nettoyage si nécessaire
})
</script>

<style scoped>
.help-hint {
  background: #e3f2fd;
  border: 2px solid #2196f3;
  border-radius: 4px;
  padding: 12px 20px;
  margin-bottom: 20px;
  color: #1565c0;
  font-size: 0.9em;
  text-align: center;
  position: relative;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.help-hint.mobile-active {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--warning-color, #f39c12);
  color: white;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  max-width: 90%;
  animation: slideUp 0.3s ease-out;
  font-weight: 500;
  font-size: 14px;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.help-hint :deep(strong) {
  background: rgba(255, 255, 255, 0.3);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}

.help-hint-icon {
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .help-hint.mobile-active {
    font-size: 13px;
    padding: 10px 16px;
  }
}
</style>

