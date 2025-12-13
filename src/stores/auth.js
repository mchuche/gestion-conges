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
      
      if (sessionError) throw sessionError
      
      if (session?.user) {
        await loadUserProfile(session.user.id)
      } else {
        user.value = null
      }
    } catch (err) {
      logger.error('Erreur lors de la vérification de session:', err)
      error.value = err.message
      user.value = null
    } finally {
      loading.value = false
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

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) throw signInError

      if (data?.user) {
        await loadUserProfile(data.user.id)
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
  supabase.auth.onAuthStateChange(async (event, session) => {
    logger.debug('Changement d\'état auth:', event, session?.user?.id)
    
    if (event === 'SIGNED_IN' && session?.user) {
      await loadUserProfile(session.user.id)
    } else if (event === 'SIGNED_OUT') {
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

