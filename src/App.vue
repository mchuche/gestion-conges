<template>
  <div id="app">
    <!-- Modal d'authentification -->
    <AuthModal v-if="!isAuthenticated" />
    
    <!-- Application principale -->
    <div v-else class="main-container" id="mainContainer">
      <div :class="['container', { 'full-width': fullWidth }]">
        <Header />
        <Calendar />
        <LeaveModal />
        <ConfigModal />
        <HelpModal />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { useAuthStore } from './stores/auth'
import { useUIStore } from './stores/ui'
import AuthModal from './components/auth/AuthModal.vue'
import Header from './components/header/Header.vue'
import Calendar from './components/calendar/Calendar.vue'
import LeaveModal from './components/modals/LeaveModal.vue'
import ConfigModal from './components/modals/ConfigModal.vue'
import HelpModal from './components/modals/HelpModal.vue'

const authStore = useAuthStore()
const uiStore = useUIStore()

// Utiliser les computed du store pour la réactivité
const isAuthenticated = computed(() => authStore.isAuthenticated)
const fullWidth = computed(() => uiStore.fullWidth)

// Appliquer la classe full-width au body
watch(fullWidth, (value) => {
  if (value) {
    document.body.classList.add('full-width')
  } else {
    document.body.classList.remove('full-width')
  }
}, { immediate: true })

onMounted(async () => {
  console.log('App.vue monté, vérification de la session...')
  try {
    await authStore.checkSession()
    console.log('Session vérifiée:', authStore.user)
    // Charger le fullWidth au démarrage
    if (typeof uiStore.loadFullWidth === 'function') {
      uiStore.loadFullWidth()
      // Appliquer immédiatement
      if (uiStore.fullWidth) {
        document.body.classList.add('full-width')
      }
    }
    // Charger le minimizeHeader au démarrage
    if (typeof uiStore.loadMinimizeHeader === 'function') {
      uiStore.loadMinimizeHeader()
    }
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
