<template>
  <div id="app">
    <!-- Modal d'authentification -->
    <AuthModal v-if="!isAuthenticated" />
    
    <!-- Application principale -->
    <div v-else class="main-container" id="mainContainer">
      <Calendar />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import AuthModal from './components/auth/AuthModal.vue'
import Calendar from './components/calendar/Calendar.vue'

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
  padding: 20px;
  background: var(--bg-color, #f5f7fa);
}

/* S'assurer que le body a le bon style */
:global(body) {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: linear-gradient(135deg, var(--gradient-start, #667eea) 0%, var(--gradient-end, #764ba2) 100%);
  min-height: 100vh;
  padding: 20px;
  color: var(--text-color, #2c3e50);
  transition: background 0.3s ease, color 0.3s ease;
  margin: 0;
}
</style>
