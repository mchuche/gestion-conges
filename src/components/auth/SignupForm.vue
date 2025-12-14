<template>
  <div class="auth-form">
    <h3>👤 Inscription</h3>
    <div v-if="authError" class="error-message">{{ authError }}</div>
    
    <Form @submit="onSubmit" v-slot="{ meta }" :initial-values="{ email: '', password: '', name: '' }">
      <div class="auth-input-group">
        <label for="signupEmail">Email :</label>
        <Field
          id="signupEmail"
          name="email"
          type="email"
          rules="required|email"
          v-slot="{ field, errors }"
        >
          <input
            v-bind="field"
            type="email"
            class="auth-input"
            :class="{ 'auth-input-error': errors.length > 0 }"
            placeholder="votre@email.com"
          />
          <ErrorMessage name="email" class="field-error" />
        </Field>
      </div>
      
      <div class="auth-input-group">
        <label for="signupPassword">Mot de passe :</label>
        <Field
          id="signupPassword"
          name="password"
          type="password"
          rules="required|min:6"
          v-slot="{ field, errors }"
        >
          <input
            v-bind="field"
            type="password"
            class="auth-input"
            :class="{ 'auth-input-error': errors.length > 0 }"
            placeholder="••••••••"
          />
          <ErrorMessage name="password" class="field-error" />
          <small class="auth-hint">Minimum 6 caractères</small>
        </Field>
      </div>
      
      <div class="auth-input-group">
        <label for="signupName">Nom :</label>
        <Field
          id="signupName"
          name="name"
          type="text"
          rules="required|min:2"
          v-slot="{ field, errors }"
        >
          <input
            v-bind="field"
            type="text"
            class="auth-input"
            :class="{ 'auth-input-error': errors.length > 0 }"
            placeholder="Votre nom"
          />
          <ErrorMessage name="name" class="field-error" />
        </Field>
      </div>
      
      <button 
        type="submit"
        :disabled="loading || !meta.valid"
        class="save-btn"
      >
        {{ loading ? 'Inscription...' : "S'inscrire" }}
      </button>
    </Form>
    
    <p class="auth-switch">
      Déjà un compte ? 
      <a href="javascript:void(0)" @click="$emit('switch-to-login')">Se connecter</a>
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Form, Field, ErrorMessage } from 'vee-validate'
import { useAuthStore } from '../../stores/auth'
import { useToast } from '../../composables/useToast'
import logger from '../../services/logger'

const emit = defineEmits(['switch-to-login'])

const authStore = useAuthStore()
const { success, error: showErrorToast } = useToast()
const loading = ref(false)
const authError = ref(null)

// Handler de soumission avec validation VeeValidate
async function onSubmit(values) {
  authError.value = null
  loading.value = true
  
  // S'assurer que les valeurs sont bien définies
  const email = values.email?.trim() || ''
  const password = values.password || ''
  const name = values.name?.trim() || ''
  
  // Validation supplémentaire côté client
  if (!email || !password || !name) {
    authError.value = 'Veuillez remplir tous les champs'
    showErrorToast('Veuillez remplir tous les champs')
    loading.value = false
    return
  }
  
  try {
    const result = await authStore.signUp(email, password, name)
    
    if (!result.success) {
      authError.value = result.error || 'Erreur lors de l\'inscription'
      showErrorToast('Erreur d\'inscription: ' + (result.error || 'Une erreur est survenue'))
    } else {
      if (result.needsConfirmation) {
        success('Inscription réussie ! Vérifiez votre email pour confirmer votre compte.')
      } else {
        success('Inscription réussie ! Vous êtes maintenant connecté.')
      }
    }
  } catch (err) {
    authError.value = 'Une erreur est survenue'
    logger.error('Erreur inscription:', err)
    showErrorToast('Erreur: ' + (err.message || err))
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
  transition: border-color 0.2s ease;
}

.auth-input:focus {
  outline: none;
  border-color: var(--primary-color, #4a90e2);
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.1);
}

.auth-input-error {
  border-color: #e74c3c;
}

.field-error {
  display: block;
  color: #e74c3c;
  font-size: 0.85em;
  margin-top: 5px;
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
