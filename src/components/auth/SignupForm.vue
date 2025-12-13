<template>
  <div class="auth-form">
    <h3>👤 Inscription</h3>
    <div v-if="error" class="error-message">{{ error }}</div>
    
    <div class="auth-input-group">
      <label for="signupEmail">Email :</label>
      <input 
        type="email" 
        id="signupEmail" 
        v-model="email"
        class="auth-input" 
        placeholder="votre@email.com" 
        required
      >
    </div>
    
    <div class="auth-input-group">
      <label for="signupPassword">Mot de passe :</label>
      <input 
        type="password" 
        id="signupPassword" 
        v-model="password"
        class="auth-input" 
        placeholder="••••••••" 
        required
      >
      <small class="auth-hint">Minimum 6 caractères</small>
    </div>
    
    <div class="auth-input-group">
      <label for="signupName">Nom :</label>
      <input 
        type="text" 
        id="signupName" 
        v-model="name"
        class="auth-input" 
        placeholder="Votre nom" 
        required
      >
    </div>
    
    <button 
      @click="handleSignup" 
      :disabled="loading"
      class="save-btn"
    >
      {{ loading ? 'Inscription...' : 'S'inscrire' }}
    </button>
    
    <p class="auth-switch">
      Déjà un compte ? 
      <a href="#" @click.prevent="$emit('switch-to-login')">Se connecter</a>
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../../stores/auth'

const emit = defineEmits(['switch-to-login'])

const authStore = useAuthStore()
const email = ref('')
const password = ref('')
const name = ref('')
const loading = ref(false)
const error = ref(null)

async function handleSignup() {
  if (!email.value || !password.value || !name.value) {
    error.value = 'Veuillez remplir tous les champs'
    return
  }
  
  if (password.value.length < 6) {
    error.value = 'Le mot de passe doit contenir au moins 6 caractères'
    return
  }
  
  loading.value = true
  error.value = null
  
  try {
    const result = await authStore.signUp(email.value, password.value, name.value)
    
    if (!result.success) {
      error.value = result.error || 'Erreur lors de l\'inscription'
      alert('Erreur d\'inscription: ' + (result.error || 'Une erreur est survenue'))
    } else {
      if (result.needsConfirmation) {
        alert('Inscription réussie ! Vérifiez votre email pour confirmer votre compte.')
      } else {
        alert('Inscription réussie ! Vous êtes maintenant connecté.')
      }
    }
  } catch (err) {
    error.value = 'Une erreur est survenue'
    console.error('Erreur inscription:', err)
    alert('Erreur: ' + err.message)
  } finally {
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

.auth-hint {
  display: block;
  margin-top: 5px;
  font-size: 12px;
  color: #666;
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
