/**
 * Store d'authentification — API NestJS + JWT (access) + refresh opaque
 *
 * Remplace l'ancienne intégration PocketBase : les jetons sont dans localStorage
 * (`gc_access_token`, `gc_refresh_token`) et le client HTTP est `src/services/api.js`.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  apiFetch,
  apiJson,
  clearStoredTokens,
  getStoredTokens,
  readApiErrorMessage,
  setStoredTokens,
} from '../services/api'
import logger from '../services/logger'
import { handleError } from '../services/errorHandler'

export const useAuthStore = defineStore('auth', () => {
  // ============================================
  // STATE
  // ============================================

  /**
   * Utilisateur connecté (profil métier, pas le JWT brut)
   * Structure : { id, email, name, is_admin, is_super_admin }
   */
  const user = ref(null)

  const loading = ref(false)
  const error = ref(null)

  /** Évite les courses entre checkSession et signIn */
  const isSigningIn = ref(false)

  // ============================================
  // GETTERS
  // ============================================

  const isAuthenticated = computed(() => user.value !== null)
  const isAdmin = computed(() => user.value?.is_admin === true)
  const isSuperAdmin = computed(() => user.value?.is_super_admin === true)

  // ============================================
  // ACTIONS
  // ============================================

  /**
   * Au démarrage : si des jetons existent, on valide avec GET /auth/me
   * (le client tente un refresh automatique sur 401).
   */
  async function checkSession() {
    try {
      if (isSigningIn.value) {
        logger.debug('checkSession ignoré: connexion en cours')
        return
      }

      loading.value = true
      const { access } = getStoredTokens()
      if (!access) {
        user.value = null
        return
      }

      await loadUserProfile()
    } catch (err) {
      logger.error('Erreur lors de la vérification de session:', err)
      error.value = err.message
      user.value = null
      clearStoredTokens()
    } finally {
      loading.value = false
    }
  }

  /**
   * Recharge le profil depuis le serveur (droits admin inclus).
   * Peut être appelé sans argument après login : l’API identifie l’utilisateur via le Bearer.
   */
  async function loadUserProfile(_userId) {
    try {
      const data = await apiJson('/auth/me', { method: 'GET' })
      user.value = {
        id: data.id,
        email: data.email,
        name: data.name || data.email?.split('@')[0] || 'Utilisateur',
        is_admin: data.is_admin === true,
        is_super_admin: data.is_super_admin === true,
      }
      logger.log('Profil utilisateur chargé:', user.value)
    } catch (err) {
      logger.error('Erreur lors du chargement du profil:', err)
      throw err
    }
  }

  /**
   * Connexion email / mot de passe
   */
  async function signIn(email, password, _rememberMe = true) {
    try {
      isSigningIn.value = true
      loading.value = true
      error.value = null

      logger.log('Tentative de connexion pour:', email)

      const res = await apiFetch(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
          }),
        },
        { skipAuth: true, retryOn401: false },
      )

      if (!res.ok) {
        const msg = await readApiErrorMessage(res)
        throw new Error(msg)
      }

      const data = await res.json()
      setStoredTokens(data.accessToken, data.refreshToken)

      user.value = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name || data.user.email?.split('@')[0] || 'Utilisateur',
        is_admin: data.user.is_admin === true,
        is_super_admin: data.user.is_super_admin === true,
      }

      setTimeout(() => {
        isSigningIn.value = false
      }, 500)

      return { success: true }
    } catch (err) {
      const errorMessage = err.message || 'Erreur lors de la connexion'
      error.value = errorMessage
      logger.error('Erreur lors de la connexion:', err)
      isSigningIn.value = false
      return { success: false, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  /**
   * Inscription — l’API renvoie directement les jetons (auto-login).
   */
  async function signUp(email, password, name) {
    try {
      loading.value = true
      error.value = null

      if (!email || !email.trim()) {
        throw new Error("L'email est requis")
      }
      // Aligné sur RegisterDto côté Nest (min 8 caractères)
      if (!password || password.length < 8) {
        throw new Error('Le mot de passe doit contenir au moins 8 caractères')
      }
      if (!name || !name.trim()) {
        throw new Error('Le nom est requis')
      }

      const res = await apiFetch(
        '/auth/register',
        {
          method: 'POST',
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
            name: name.trim(),
          }),
        },
        { skipAuth: true, retryOn401: false },
      )

      if (!res.ok) {
        const msg = await readApiErrorMessage(res)
        throw new Error(msg)
      }

      const data = await res.json()
      setStoredTokens(data.accessToken, data.refreshToken)

      user.value = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name || name.trim(),
        is_admin: data.user.is_admin === true,
        is_super_admin: data.user.is_super_admin === true,
      }

      return { success: true, needsConfirmation: false }
    } catch (err) {
      const errorMessage = handleError(err, {
        context: 'AuthStore.signUp',
        showToast: false,
      })
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  /**
   * Déconnexion : révoque le refresh côté serveur puis efface le stockage local.
   */
  async function signOut() {
    try {
      loading.value = true
      const { refresh } = getStoredTokens()
      if (refresh) {
        await apiFetch(
          '/auth/logout',
          {
            method: 'POST',
            body: JSON.stringify({ refreshToken: refresh }),
          },
          { retryOn401: false },
        ).catch(() => {
          /* on force le nettoyage local même si le serveur est down */
        })
      }
      clearStoredTokens()
      user.value = null
      logger.log('Utilisateur déconnecté')
      return { success: true }
    } catch (err) {
      error.value = err.message
      logger.error('Erreur lors de la déconnexion:', err)
      clearStoredTokens()
      user.value = null
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Suppression définitive du compte : DELETE /users/me (cascade côté PostgreSQL).
   * Réinitialise aussi les stores congés / types en mémoire (import dynamique pour éviter une dépendance circulaire auth ↔ leaves).
   */
  async function deleteAccount() {
    try {
      loading.value = true
      error.value = null

      await apiJson('/users/me', { method: 'DELETE' })

      clearStoredTokens()
      user.value = null

      const { useLeavesStore } = await import('./leaves')
      const { useLeaveTypesStore } = await import('./leaveTypes')
      const { useTeamsStore } = await import('./teams')
      const { useNotificationsStore } = await import('./notifications')
      const { useUIStore } = await import('./ui')
      const { useQuotasStore } = await import('./quotas')
      const { useRecurringEventsStore } = await import('./recurringEvents')
      useLeavesStore().reset()
      useLeaveTypesStore().reset()
      useTeamsStore().reset()
      useNotificationsStore().resetNotifications()
      useUIStore().resetPreferencesCache()
      useQuotasStore().reset()
      useRecurringEventsStore().reset()

      logger.log('Compte supprimé côté API, état local nettoyé')
      return { success: true }
    } catch (err) {
      const errorMessage =
        err?.message || 'Erreur lors de la suppression du compte'
      error.value = errorMessage
      logger.error('deleteAccount:', err)
      return { success: false, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    isSuperAdmin,
    checkSession,
    signIn,
    signUp,
    signOut,
    deleteAccount,
  }
})
