<template>
  <Dialog :open="showModal" @close="closeModal" class="modal-dialog">
    <div class="modal-backdrop" aria-hidden="true" />
    <div class="modal-container">
      <DialogPanel class="modal-content leave-recap-modal">
        <div class="modal-header">
          <DialogTitle class="modal-title">📅 Récapitulatif des congés</DialogTitle>
          <button @click="closeModal" class="modal-close" title="Fermer">
            ✕
          </button>
        </div>

        <div class="modal-body">
          <LeaveRecap />
        </div>
      </DialogPanel>
    </div>
  </Dialog>
</template>

<script setup>
import { computed } from 'vue'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue'
import { useUIStore } from '../../stores/ui'
import LeaveRecap from '../menu/LeaveRecap.vue'

const uiStore = useUIStore()

const showModal = computed(() => uiStore.showLeaveRecapModal)

function closeModal() {
  uiStore.closeLeaveRecapModal()
}
</script>

<style scoped>
.modal-dialog {
  position: fixed;
  inset: 0;
  z-index: 9999;
  overflow-y: auto;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  transition: opacity 0.3s ease;
}

.modal-dialog[data-headlessui-state~="open"] .modal-backdrop {
  opacity: 1;
}

.modal-container {
  position: fixed;
  inset: 0;
  display: flex;
  min-height: 100%;
  align-items: center;
  justify-content: center;
  padding: 16px;
  pointer-events: none;
  z-index: 9999;
}

.modal-content {
  position: relative;
  background: var(--card-bg, white);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  pointer-events: auto;
  transform: scale(0.95);
  opacity: 0;
  transition: transform 0.3s ease, opacity 0.3s ease;
  z-index: 10000;
  max-width: 700px;
  width: 90%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-dialog[data-headlessui-state~="open"] .modal-content {
  transform: scale(1);
  opacity: 1;
}

.leave-recap-modal {
  max-width: 600px;
  width: 90vw;
  max-height: 80vh;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 2px solid var(--border-color, #e0e0e0);
  flex-shrink: 0;
}

.modal-title {
  margin: 0;
  font-size: 1.5em;
  font-weight: 600;
  color: var(--text-color);
}

.modal-close {
  background: transparent;
  border: none;
  font-size: 1.5em;
  color: var(--text-color);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  opacity: 0.6;
  line-height: 1;
}

.modal-close:hover {
  opacity: 1;
  background: var(--hover-color);
}

.modal-body {
  padding: 0;
  overflow-y: auto;
  max-height: calc(80vh - 80px);
  flex: 1;
}

/* Mode sombre */
[data-theme="dark"] .modal-header {
  border-bottom-color: var(--border-color, #404040);
}

[data-theme="dark"] .modal-content {
  background: var(--card-bg, #2d2d2d);
}
</style>

