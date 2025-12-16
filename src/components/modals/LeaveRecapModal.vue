<template>
  <Modal :model-value="showModal" @close="closeModal" content-class="leave-recap-modal">
    <template #header>
      <h3>📅 Récapitulatif des congés</h3>
    </template>
    
    <template #body>
      <div class="leave-recap-content">
        <LeaveRecap />
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { computed } from 'vue'
import { useUIStore } from '../../stores/ui'
import Modal from '../common/Modal.vue'
import LeaveRecap from '../menu/LeaveRecap.vue'

const uiStore = useUIStore()

const showModal = computed(() => uiStore.showLeaveRecapModal)

function closeModal() {
  uiStore.closeLeaveRecapModal()
}
</script>

<style scoped>
.leave-recap-modal {
  max-width: 600px;
}

.leave-recap-content {
  /* Styles spécifiques au contenu si nécessaire */
}
</style>

