<template>
  <div class="auth-form">
    <h3>🔒 Connexion</h3>
    <div v-if="authError" class="error-message">{{ authError }}</div>
    
    <Form @submit="onSubmit" v-slot="{ meta, values }" :initial-values="{ email: '', password: '', rememberMe: true }">
      <div class="auth-input-group">
        <label for="loginEmail">Email :</label>
        <Field
          id="loginEmail"
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
        <label for="loginPassword">Mot de passe :</label>
        <Field
          id="loginPassword"
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
        </Field>
      </div>
      
      <div class="auth-remember-me">
        <label class="remember-me-label">
          <Field name="rememberMe" type="checkbox" v-slot="{ field }">
            <input
              v-bind="field"
              type="checkbox"
              id="rememberMe"
              class="remember-me-checkbox"
            />
          </Field>
          <span>Rester connecté</span>
        </label>
      </div>
      
      <div class="auth-actions">
        <button 
          type="submit"
          :disabled="loading || !meta.valid"
          class="save-btn"
        >
          {{ loading ? 'Connexion...' : 'Se connecter' }}
        </button>
        <button 
          type="button"
          @click="clearAllCookies"
          class="clear-cookies-btn"
          title="Nettoyer les cookies et sessions"
        >
          🗑️ Nettoyer les cookies
        </button>
      </div>
    </Form>
    
    <p class="auth-switch">
      Pas encore de compte ? 
      <a href="javascript:void(0)" @click="$emit('switch-to-signup')">S'inscrire</a>
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Form, Field, ErrorMessage } from 'vee-validate'
import { useAuthStore } from '../../stores/auth'
import { useToast } from '../../composables/useToast'
import logger from '../../services/logger'

const emit = defineEmits(['switch-to-signup'])

const authStore = useAuthStore()
const { error: showErrorToast, success: showSuccessToast } = useToast()
const loading = ref(false)
const authError = ref(null)

// Fonction pour nettoyer tous les cookies et données de session
async function clearAllCookies() {
  try {
    // D'abord, utiliser signOut() de Supabase qui gère correctement les cookies HttpOnly
    // (cela évite les problèmes CORS avec fetch direct)
    try {
      await authStore.signOut()
      logger.log('signOut() Supabase appelé pour nettoyer les cookies HttpOnly')
    } catch (signOutError) {
      // Même si signOut échoue, continuer le nettoyage
      logger.debug('Erreur lors de signOut (non bloquant):', signOutError)
    }
    
    // Nettoyer localStorage
    const supabaseKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')
    )
    supabaseKeys.forEach(key => localStorage.removeItem(key))
    logger.log(`Nettoyé ${supabaseKeys.length} clés localStorage`)
    
    // Nettoyer sessionStorage
    const supabaseSessionKeys = Object.keys(sessionStorage).filter(key => 
      key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')
    )
    supabaseSessionKeys.forEach(key => sessionStorage.removeItem(key))
    logger.log(`Nettoyé ${supabaseSessionKeys.length} clés sessionStorage`)
    
    // Nettoyer tous les cookies accessibles (non-HttpOnly)
    const allCookies = document.cookie.split(';').map(c => c.trim()).filter(c => c)
    allCookies.forEach(cookie => {
      const cookieName = cookie.split('=')[0].trim()
      // Supprimer avec toutes les variations
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None; Secure;`
    })
    logger.log(`Nettoyé ${allCookies.length} cookies accessibles`)
    
    showSuccessToast('Cookies et sessions nettoyés. Les cookies HttpOnly doivent être supprimés manuellement dans les outils de développement (F12 > Application > Cookies) s\'ils persistent.')
    logger.log('Nettoyage manuel effectué')
  } catch (err) {
    logger.error('Erreur lors du nettoyage manuel:', err)
    showErrorToast('Erreur lors du nettoyage')
  }
}

// Handler de soumission avec validation VeeValidate
async function onSubmit(values) {
  authError.value = null
  loading.value = true
  
  try {
    const result = await authStore.signIn(
      values.email || '', 
      values.password || '', 
      values.rememberMe !== undefined ? values.rememberMe : true
    )
    
    if (!result.success) {
      authError.value = result.error || 'Erreur lors de la connexion'
      showErrorToast('Erreur de connexion: ' + (result.error || 'Email ou mot de passe incorrect'))
      loading.value = false
    }
    // Connexion réussie - la réactivité met à jour automatiquement l'interface
  } catch (err) {
    authError.value = 'Une erreur est survenue'
    logger.error('Erreur connexion:', err)
    showErrorToast('Erreur: ' + (err.message || err))
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

.auth-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
}

.clear-cookies-btn {
  background: #95a5a6;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  transition: background 0.2s;
  white-space: nowrap;
}

.clear-cookies-btn:hover {
  background: #7f8c8d;
}

.clear-cookies-btn:active {
  transform: scale(0.98);
}

.auth-remember-me {
  margin-bottom: 15px;
}

.remember-me-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  font-size: 0.95em;
  color: var(--text-color, #2c3e50);
}

.remember-me-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--primary-color, #4a90e2);
}

.remember-me-label:hover {
  color: var(--primary-color, #4a90e2);
}
</style>
