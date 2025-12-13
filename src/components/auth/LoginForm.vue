<template>
  <div class="auth-form">
    <h3>🔒 Connexion</h3>
    <div v-if="error" class="error-message">{{ error }}</div>
    
    <div class="auth-input-group">
      <label for="loginEmail">Email :</label>
      <input 
        type="email" 
        id="loginEmail" 
        v-model="email"
        class="auth-input" 
        placeholder="votre@email.com" 
        required
      >
    </div>
    
    <div class="auth-input-group">
      <label for="loginPassword">Mot de passe :</label>
      <input 
        type="password" 
        id="loginPassword" 
        v-model="password"
        class="auth-input" 
        placeholder="••••••••" 
        required
      >
    </div>
    
    <button 
      @click="handleLogin" 
      :disabled="loading"
      class="save-btn"
    >
      {{ loading ? 'Connexion...' : 'Se connecter' }}
    </button>
    
    <p class="auth-switch">
      Pas encore de compte ? 
      <a href="javascript:void(0)" @click="$emit('switch-to-signup')">S'inscrire</a>
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../../stores/auth'

const emit = defineEmits(['switch-to-signup'])

const authStore = useAuthStore()
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref(null)

async function handleLogin() {
  if (!email.value || !password.value) {
    error.value = 'Veuillez remplir tous les champs'
    return
  }
  
  loading.value = true
  error.value = null
  
  try {
    console.log('Tentative de connexion...')
    const result = await authStore.signIn(email.value, password.value)
    console.log('Résultat connexion:', result)
    
    if (!result.success) {
      error.value = result.error || 'Erreur lors de la connexion'
      alert('Erreur de connexion: ' + (result.error || 'Email ou mot de passe incorrect'))
      loading.value = false
    } else {
      console.log('Connexion réussie, utilisateur:', authStore.user)
      // La réactivité devrait mettre à jour l'interface automatiquement
      // Attendre un peu pour laisser le temps à Vue de mettre à jour
      setTimeout(() => {
        console.log('État authentifié après connexion:', authStore.isAuthenticated)
      }, 100)
    }
  } catch (err) {
    error.value = 'Une erreur est survenue'
    console.error('Erreur connexion:', err)
    alert('Erreur: ' + (err.message || err))
    loading.value = false
  }
}
</script>

<style scoped>
.auth-form {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
}

.auth-input-group {
  margin-bottom: 15px;
}

.auth-input-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.auth-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.error-message {
  color: #e74c3c;
  margin-bottom: 15px;
  padding: 10px;
  background: #ffeaea;
  border-radius: 4px;
}

.auth-switch {
  margin-top: 15px;
  text-align: center;
}

.auth-switch a {
  color: #4a90e2;
  text-decoration: none;
}

.auth-switch a:hover {
  text-decoration: underline;
}
</style>
