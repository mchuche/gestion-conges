<template>
  <div class="modal active">
    <div class="modal-content auth-modal-content">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3 style="margin: 0;">Authentification</h3>
      </div>
      
      <LoginForm v-if="showLogin" @switch-to-signup="showLogin = false" />
      <SignupForm v-else @switch-to-login="showLogin = true" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { createIcons } from 'lucide-vue-next'
import LoginForm from './LoginForm.vue'
import SignupForm from './SignupForm.vue'

const showLogin = ref(true)

onMounted(() => {
  // Initialiser les icônes Lucide
  createIcons()
})
</script>

<style scoped>
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 30px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.auth-modal-content {
  background: var(--card-bg, #ffffff);
  color: var(--text-color, #2c3e50);
}
</style>

