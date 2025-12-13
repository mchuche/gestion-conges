<template>
  <div id="app">
    <!-- Modal d'authentification -->
    <AuthModal v-if="!isAuthenticated" />
    
    <!-- Application principale -->
    <div v-else class="main-container">
      <div class="test-container">
        <h1>🚀 Migration Vue.js - Test</h1>
        <p><strong>État:</strong> Connecté ✅</p>
        <p v-if="user"><strong>Utilisateur:</strong> {{ user.name || user.email }}</p>
        <p v-if="user && user.is_admin"><strong>Rôle:</strong> Administrateur</p>
        <button @click="handleLogout" class="save-btn" style="margin-top: 20px;">
          Se déconnecter
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import AuthModal from './components/auth/AuthModal.vue'
import { swalSuccess } from './services/swalHelper'

const authStore = useAuthStore()

// Utiliser les computed du store pour la réactivité
const isAuthenticated = computed(() => authStore.isAuthenticated)
const user = computed(() => authStore.user)

async function handleLogout() {
  await authStore.signOut()
  await swalSuccess('Déconnexion', 'Vous avez été déconnecté avec succès')
}

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
}

.main-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
}

.test-container {
  text-align: center;
  padding: 40px;
  background: var(--card-bg, white);
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
