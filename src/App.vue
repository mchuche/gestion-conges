<template>
  <div id="app">
    <div class="test-container">
      <h1>🚀 Migration Vue.js - Test</h1>
      <p v-if="loading">Chargement...</p>
      <div v-else>
        <p><strong>État:</strong> {{ isAuthenticated ? 'Connecté' : 'Non connecté' }}</p>
        <p v-if="error" style="color: red;"><strong>Erreur:</strong> {{ error }}</p>
        <p v-if="user"><strong>Utilisateur:</strong> {{ user.name || user.email }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useAuthStore } from './stores/auth'

const authStore = useAuthStore()

// Utiliser les computed et refs du store pour la réactivité
const isAuthenticated = computed(() => authStore.isAuthenticated)
const loading = computed(() => authStore.loading)
const error = computed(() => authStore.error)
const user = computed(() => authStore.user)

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
  display: flex;
  align-items: center;
  justify-content: center;
}

.test-container {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  max-width: 600px;
}

.test-container h1 {
  margin-bottom: 20px;
  color: #4a90e2;
}

.test-container p {
  margin: 10px 0;
  font-size: 16px;
}
</style>
