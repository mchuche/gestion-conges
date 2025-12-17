<template>
  <Dialog
    :open="modelValue"
    @close="handleClose"
    class="modal-dialog"
    :static="!closeOnBackdrop"
  >
    <div class="modal-backdrop" aria-hidden="true" />
    
    <div class="modal-container">
      <DialogPanel class="modal-content" :class="contentClass">
        <div class="modal-header" v-if="title || $slots.header">
          <DialogTitle v-if="title" class="modal-title">{{ title }}</DialogTitle>
          <slot name="header"></slot>
          <button
            v-if="closable"
            class="close"
            @click="handleClose"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
        <div class="modal-body">
          <slot name="body">
            <slot></slot>
          </slot>
        </div>
        <div class="modal-footer" v-if="$slots.footer">
          <slot name="footer"></slot>
        </div>
      </DialogPanel>
    </div>
  </Dialog>
</template>

<script setup>
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  closable: {
    type: Boolean,
    default: true
  },
  closeOnBackdrop: {
    type: Boolean,
    default: true
  },
  closeOnEscape: {
    type: Boolean,
    default: true
  },
  contentClass: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'close'])

function handleClose() {
  if (props.closeOnBackdrop || props.closable) {
    emit('update:modelValue', false)
    emit('close')
  }
}

function handleBackdropClick() {
  if (props.closeOnBackdrop) {
    handleClose()
  }
}
</script>

<style scoped>
.modal-dialog {
  position: fixed;
  inset: 0;
  z-index: 9999; /* Augmenté pour être au-dessus de tous les éléments sticky */
  overflow-y: auto;
  overflow-x: hidden;
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
  z-index: 9999; /* Assure que le conteneur est au-dessus de tout */
}

.modal-content {
  position: relative;
  background: var(--card-bg, white);
  border-radius: 8px;
  padding: 20px;
  max-width: 700px;
  width: 90%;
  max-height: calc(100vh - 32px);
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  pointer-events: auto;
  transform: scale(0.95);
  opacity: 0;
  transition: transform 0.3s ease, opacity 0.3s ease;
  z-index: 10000; /* Assure que le contenu de la modale est au-dessus de tout */
}

.modal-dialog[data-headlessui-state~="open"] .modal-content {
  transform: scale(1);
  opacity: 1;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
}

.modal-title {
  margin: 0;
  color: var(--text-color, #2c3e50);
  font-size: 1.25rem;
  font-weight: 600;
}

.modal-header .close {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: var(--text-color, #666);
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s;
}

.modal-header .close:hover {
  background: var(--hover-bg, #f0f0f0);
}

.modal-header .close:focus {
  outline: 2px solid var(--primary-color, #4a90e2);
  outline-offset: 2px;
}

.modal-body {
  color: var(--text-color, #2c3e50);
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
  min-height: 0;
}

.modal-footer {
  margin-top: 20px;
  padding-top: 15px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>

