<template>
  <div id="app">
    <!-- Modal d'authentification -->
    <AuthModal v-if="!isAuthenticated" />
    
    <!-- Application principale -->
    <div v-else class="main-container" id="mainContainer">
      <div :class="['container', { 'full-width': fullWidth }]">
        <Header v-if="!isAdminPage" />
        
        <!-- Router view pour afficher les pages -->
        <router-view />
        
      <!-- Modales (toujours disponibles) -->
      <LeaveModal />
      <ConfigModal />
      <HelpModal />
      <TeamsModal />
      
      <!-- Système de toasts -->
      <ToastContainer />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useUIStore } from './stores/ui'
import AuthModal from './components/auth/AuthModal.vue'
import Header from './components/header/Header.vue'
import LeaveModal from './components/modals/LeaveModal.vue'
import ConfigModal from './components/modals/ConfigModal.vue'
import HelpModal from './components/modals/HelpModal.vue'
import TeamsModal from './components/modals/TeamsModal.vue'
import ToastContainer from './components/common/ToastContainer.vue'
import logger from './services/logger'

const route = useRoute()
const authStore = useAuthStore()
const uiStore = useUIStore()

// Utiliser les computed du store pour la réactivité
const isAuthenticated = computed(() => authStore.isAuthenticated)
const fullWidth = computed(() => uiStore.fullWidth)
const isAdminPage = computed(() => route.name === 'admin')

// Appliquer la classe full-width au body
watch(fullWidth, (value) => {
  if (value) {
    document.body.classList.add('full-width')
  } else {
    document.body.classList.remove('full-width')
  }
}, { immediate: true })

// Suivre l'état de la touche Ctrl/Cmd pour la sélection multiple
function setupCtrlTracking() {
  const handleKeyDown = (e) => {
    if (e.key === 'Control' || e.key === 'Meta' || e.ctrlKey || e.metaKey) {
      uiStore.setCtrlKeyPressed(true)
    }
  }

  const handleKeyUp = (e) => {
    if (e.key === 'Control' || e.key === 'Meta' || (!e.ctrlKey && !e.metaKey)) {
      uiStore.setCtrlKeyPressed(false)
    }
  }

  const handleBlur = () => {
    uiStore.setCtrlKeyPressed(false)
  }

  // Écouter sur document ET window pour être sûr de capturer les événements
  document.addEventListener('keydown', handleKeyDown, true)
  document.addEventListener('keyup', handleKeyUp, true)
  window.addEventListener('blur', handleBlur)
  
  // Aussi sur le body pour plus de fiabilité
  document.body?.addEventListener('keydown', handleKeyDown, true)
  document.body?.addEventListener('keyup', handleKeyUp, true)

  // Nettoyage au démontage
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown, true)
    document.removeEventListener('keyup', handleKeyUp, true)
    window.removeEventListener('blur', handleBlur)
    document.body?.removeEventListener('keydown', handleKeyDown, true)
    document.body?.removeEventListener('keyup', handleKeyUp, true)
  })
}

onMounted(async () => {
  // Configurer le suivi de Ctrl/Cmd
  setupCtrlTracking()
  
  // Charger le thème immédiatement (avant la session pour une application rapide)
  if (typeof uiStore.loadThemePreference === 'function') {
    await uiStore.loadThemePreference()
  } else if (typeof uiStore.loadTheme === 'function') {
    uiStore.loadTheme()
  }
  
  try {
    await authStore.checkSession()
    
    // Recharger le thème après la connexion pour synchroniser avec Supabase
    if (authStore.isAuthenticated && typeof uiStore.loadThemePreference === 'function') {
      await uiStore.loadThemePreference()
    }
    
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
    logger.error('Erreur lors de la vérification:', err)
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
