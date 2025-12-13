import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../services/supabase'
import logger from '../services/logger'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const isAuthenticated = computed(() => user.value !== null)
  const isAdmin = computed(() => user.value?.is_admin === true)
  const isSuperAdmin = computed(() => user.value?.is_super_admin === true)

  // Actions
  async function checkSession() {
    try {
      loading.value = true
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        logger.warn('Erreur session (non bloquant):', sessionError)
        await clearInvalidSession()
        user.value = null
        return
      }
      
      if (session?.user) {
        // Valider la session en testant une requête à la base de données
        const isValid = await validateSession(session)
        if (isValid) {
          await loadUserProfile(session.user.id)
        } else {
          // Session invalide, nettoyer
          logger.warn('Session invalide détectée, nettoyage...')
          await clearInvalidSession()
          user.value = null
        }
      } else {
        user.value = null
      }
    } catch (err) {
      logger.error('Erreur lors de la vérification de session:', err)
      error.value = err.message
      await clearInvalidSession()
      user.value = null
    } finally {
      loading.value = false
    }
  }

  // Valider qu'une session Supabase est vraiment fonctionnelle
  async function validateSession(session) {
    if (!session || !session.user) return false
    
    try {
      // Tester une requête simple pour vérifier que la session est valide
      const { error } = await supabase
        .from('leaves')
        .select('id')
        .limit(1)
        .maybeSingle()
      
      if (error) {
        const errorCode = error.code || ''
        const errorMessage = error.message || ''
        // Seulement considérer comme invalide si c'est vraiment une erreur d'auth
        if (errorCode === 'PGRST301' || 
            errorCode === '42501' || // Permission denied
            errorMessage.includes('JWT') || 
            errorMessage.includes('token') || 
            errorMessage.includes('session') ||
            errorMessage.includes('authentication')) {
          logger.warn('Session invalide détectée:', error)
          return false
        }
        // Pour les autres erreurs (réseau, table inexistante, etc.), 
        // considérer la session comme valide car l'erreur n'est pas liée à l'auth
        logger.debug('Erreur lors de la validation de session (non bloquante):', error)
        return true
      }
      return true
    } catch (error) {
      // En cas d'exception, ne pas bloquer la connexion
      // La session pourrait être valide malgré l'erreur
      logger.warn('Exception lors de la validation de session (non bloquante):', error)
      return true // Donner le bénéfice du doute
    }
  }

  // Nettoyer une session invalide ou expirée
  async function clearInvalidSession() {
    try {
      // Déconnecter proprement de Supabase
      await supabase.auth.signOut()
    } catch (error) {
      // Ignorer les erreurs de déconnexion (peut échouer si pas de session)
      logger.warn('Erreur lors du nettoyage de session:', error)
    }
    
    // Nettoyer le localStorage de Supabase
    try {
      const supabaseKeys = Object.keys(localStorage).filter(key => key.startsWith('sb-'))
      supabaseKeys.forEach(key => localStorage.removeItem(key))
      logger.log('LocalStorage Supabase nettoyé')
    } catch (e) {
      logger.warn('Impossible de nettoyer le localStorage:', e)
    }
  }

  async function loadUserProfile(userId) {
    try {
      // Les utilisateurs sont dans auth.users (géré par Supabase Auth)
      // On récupère les infos depuis la session, pas depuis une table public.users
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        throw new Error('Session utilisateur introuvable')
      }

      // Vérifier si l'utilisateur est admin via app_admins
      let isAdmin = false
      let isSuperAdmin = false
      
      try {
        const { data: adminData } = await supabase
          .from('app_admins')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle()
        
        if (adminData) {
          isAdmin = true
          isSuperAdmin = adminData.role === 'super_admin'
        }
      } catch (adminError) {
        // Si la table n'existe pas encore ou erreur, on continue sans admin
        logger.debug('Erreur lors de la vérification admin (non bloquant):', adminError)
      }

      // Récupérer le nom depuis les metadata de l'utilisateur
      const name = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Utilisateur'

      user.value = {
        id: session.user.id,
        email: session.user.email,
        name: name,
        is_admin: isAdmin,
        is_super_admin: isSuperAdmin
      }

      logger.log('Profil utilisateur chargé:', user.value)
    } catch (err) {
      logger.error('Erreur lors du chargement du profil:', err)
      throw err
    }
  }

  async function signIn(email, password) {
    try {
      loading.value = true
      error.value = null

      logger.log('Tentative de connexion pour:', email)
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) {
        logger.error('Erreur Supabase signIn:', signInError)
        throw signInError
      }

      if (data?.user) {
        logger.log('Utilisateur connecté, chargement du profil...')
        await loadUserProfile(data.user.id)
        logger.log('Profil chargé, utilisateur:', user.value)
      } else {
        logger.warn('Pas de données utilisateur dans la réponse')
        throw new Error('Aucune donnée utilisateur reçue')
      }

      return { success: true }
    } catch (err) {
      error.value = err.message
      logger.error('Erreur lors de la connexion:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  async function signUp(email, password, name) {
    try {
      loading.value = true
      error.value = null

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          }
        }
      })

      if (signUpError) throw signUpError

      // Si l'email confirmation est désactivée, charger le profil directement
      if (data?.user && !data.user.email_confirmed_at) {
        // Attendre un peu pour que le trigger crée le profil
        setTimeout(async () => {
          await loadUserProfile(data.user.id)
        }, 1000)
      }

      return { success: true, needsConfirmation: !data.user.email_confirmed_at }
    } catch (err) {
      error.value = err.message
      logger.error('Erreur lors de l\'inscription:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  async function signOut() {
    try {
      loading.value = true
      const { error: signOutError } = await supabase.auth.signOut()
      
      if (signOutError) throw signOutError
      
      user.value = null
      return { success: true }
    } catch (err) {
      error.value = err.message
      logger.error('Erreur lors de la déconnexion:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Écouter les changements d'authentification
  // Note: Ce listener est appelé automatiquement par Supabase
  // Il peut être appelé plusieurs fois, donc on vérifie l'état actuel
  supabase.auth.onAuthStateChange(async (event, session) => {
    logger.debug('Changement d\'état auth:', event, session?.user?.id)
    
    // Ignorer l'événement INITIAL_SESSION si on a déjà un utilisateur
    // pour éviter les conflits avec checkSession()
    if (event === 'INITIAL_SESSION' && user.value) {
      logger.debug('INITIAL_SESSION ignoré, utilisateur déjà chargé')
      return
    }
    
    if (event === 'SIGNED_IN' && session?.user) {
      // Valider la session avant de charger le profil
      const isValid = await validateSession(session)
      if (isValid) {
        // Ne charger que si l'utilisateur n'est pas déjà chargé
        if (!user.value || user.value.id !== session.user.id) {
          await loadUserProfile(session.user.id)
        }
      } else {
        logger.warn('Session invalide lors de SIGNED_IN, nettoyage...')
        await clearInvalidSession()
        user.value = null
      }
    } else if (event === 'SIGNED_OUT') {
      user.value = null
    } else if (event === 'TOKEN_REFRESHED' && !session) {
      // Token refresh a échoué, nettoyer
      logger.warn('Token refresh échoué, nettoyage...')
      await clearInvalidSession()
      user.value = null
    }
  })

  return {
    // State
    user,
    loading,
    error,
    // Getters
    isAuthenticated,
    isAdmin,
    isSuperAdmin,
    // Actions
    checkSession,
    signIn,
    signUp,
    signOut
  }
})

