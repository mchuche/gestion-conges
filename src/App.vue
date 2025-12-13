<template>
  <div id="app">
    <div v-if="!isAuthenticated" class="auth-container">
      <!-- Composant d'authentification sera ajouté ici -->
      <p>Chargement de l'authentification...</p>
    </div>
    <div v-else class="main-container">
      <!-- Application principale sera ajoutée ici -->
      <p>Application en cours de migration...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from './stores/auth'

const authStore = useAuthStore()
const isAuthenticated = ref(false)

onMounted(async () => {
  // Vérifier l'authentification au chargement
  await authStore.checkSession()
  isAuthenticated.value = authStore.user !== null
})
</script>

<style>
#app {
  width: 100%;
  min-height: 100vh;
}
</style>

