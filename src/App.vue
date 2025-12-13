<template>
  <div id="app">
    <!-- Modal d'authentification -->
    <AuthModal v-if="!isAuthenticated" />
    
    <!-- Application principale -->
    <div v-else class="main-container" id="mainContainer">
      <div class="container">
        <Calendar />
        <LeaveModal />
        <ConfigModal />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import AuthModal from './components/auth/AuthModal.vue'
import Calendar from './components/calendar/Calendar.vue'
import LeaveModal from './components/modals/LeaveModal.vue'
import ConfigModal from './components/modals/ConfigModal.vue'

const authStore = useAuthStore()

// Utiliser les computed du store pour la réactivité
const isAuthenticated = computed(() => authStore.isAuthenticated)

onMounted(async () => {
  console.log('App.vue monté, vérification de la session...')
  try {
    await authStore.checkSession()
    console.log('Session vérifiée:', authStore.user)
  } catch (err) {
    console.error('Erreur lors de la vérification:', err)
  }
})
</script>

<style>
#app {
  width: 100%;
  min-height: 100vh;
  background: var(--bg-color, #f5f5f5);
}

.main-container {
  width: 100%;
  min-height: 100vh;
  padding: 0;
}

.main-container .container {
  max-width: 1200px;
  margin: 0 auto;
  background: var(--card-bg, white);
  border-radius: 4px;
  box-shadow: 0 20px 60px var(--shadow-color, rgba(0, 0, 0, 0.3));
  padding: 30px;
  animation: fadeIn 0.5s ease-in;
  transition: background 0.3s ease, box-shadow 0.3s ease, max-width 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
