import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../services/supabase'
import logger from '../services/logger'
import { handleError } from '../services/errorHandler'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const isSigningIn = ref(false) // Flag pour éviter les conflits pendant la connexion

  // Getters
  const isAuthenticated = computed(() => user.value !== null)
  const isAdmin = computed(() => user.value?.is_admin === true)
  const isSuperAdmin = computed(() => user.value?.is_super_admin === true)

  // Actions
  async function checkSession() {
    try {
      // Ne pas vérifier la session si on est en train de se connecter
      if (isSigningIn.value) {
        logger.debug('checkSession ignoré: connexion en cours')
        return
      }
      
      loading.value = true
      
      // Vérifier et nettoyer les sessions temporaires avant de vérifier la session
      await checkAndCleanupTemporarySession()
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        logger.warn('Erreur session (non bloquant):', sessionError)
        // Ne pas nettoyer complètement si c'est juste une erreur de récupération
        // Seulement nettoyer si c'est vraiment une erreur d'authentification
        if (sessionError.message?.includes('JWT') || sessionError.message?.includes('token')) {
          await clearInvalidSession()
        }
        user.value = null
        return
      }
      
      if (session?.user) {
        // Valider la session en testant une requête à la base de données
        const isValid = await validateSession(session)
        if (isValid) {
          await loadUserProfile(session.user.id)
          
          // Vérifier rememberMe et configurer le nettoyage si nécessaire
          const rememberMe = localStorage.getItem('supabase.auth.rememberMe')
          if (rememberMe === 'false') {
            setupSessionCleanupOnClose()
          } else {
            removeSessionCleanupOnClose()
          }
        } else {
          // Session invalide, nettoyer
          logger.warn('Session invalide détectée, nettoyage...')
          await clearInvalidSession()
          user.value = null
        }
      } else {
        user.value = null
        // Ne pas nettoyer les flags si on n'a juste pas de session
        // Ils seront nettoyés au prochain checkAndCleanupTemporarySession si nécessaire
      }
    } catch (err) {
      logger.error('Erreur lors de la vérification de session:', err)
      error.value = err.message
      // Ne nettoyer que si c'est vraiment nécessaire
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

  // Fonction utilitaire pour nettoyer manuellement tous les cookies (utilisée après erreur de connexion)
  async function clearAllCookiesManually() {
    try {
      logger.log('=== Début nettoyage manuel des cookies ===')
      
      // D'abord, essayer de supprimer les cookies HttpOnly via signOut() de Supabase
      // (évite les problèmes CORS avec fetch direct)
      try {
        await supabase.auth.signOut()
        logger.debug('signOut() Supabase appelé pour supprimer les cookies HttpOnly')
      } catch (signOutError) {
        // Ignorer les erreurs (peut échouer si pas de session valide)
        logger.debug('Erreur lors de signOut (non bloquant):', signOutError)
      }
      
      const allCookies = document.cookie.split(';').map(c => c.trim()).filter(c => c)
      logger.log('Cookies à nettoyer:', allCookies)
      
      const currentHost = window.location.hostname
      const currentPath = window.location.pathname
      
      allCookies.forEach(cookie => {
        const cookieName = cookie.split('=')[0].trim()
        const lowerName = cookieName.toLowerCase()
        
        // Nettoyer TOUS les cookies liés à l'auth, session, supabase, token
        if (lowerName.includes('auth') || 
            lowerName.includes('session') ||
            lowerName.includes('token') ||
            lowerName.includes('supabase') ||
            lowerName.startsWith('sb-')) {
          
          logger.log(`Tentative suppression cookie: ${cookieName}`)
          
          // Essayer toutes les combinaisons possibles
          const combinations = [
            `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`,
            `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${currentPath}`,
            `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${currentHost}`,
            `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${currentHost}`,
            `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None; Secure`,
            `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`,
            `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`,
          ]
          
          // Ajouter les domaines racine si applicable
          const hostParts = currentHost.split('.')
          if (hostParts.length > 1) {
            const rootDomain = '.' + hostParts.slice(-2).join('.')
            combinations.push(
              `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${rootDomain}`,
              `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${rootDomain}; SameSite=None; Secure`
            )
          }
          
          // Appliquer toutes les combinaisons
          combinations.forEach(cookieStr => {
            try {
              document.cookie = cookieStr
            } catch (e) {
              // Ignorer les erreurs de domaine invalide
            }
          })
        }
      })
      
      // Nettoyer aussi localStorage et sessionStorage
      const supabaseLocalKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')
      )
      supabaseLocalKeys.forEach(key => localStorage.removeItem(key))
      
      const supabaseSessionKeys = Object.keys(sessionStorage).filter(key => 
        key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')
      )
      supabaseSessionKeys.forEach(key => sessionStorage.removeItem(key))
      
      // Attendre un peu puis vérifier
      await new Promise(resolve => setTimeout(resolve, 200))
      const remainingCookies = document.cookie.split(';').map(c => c.trim()).filter(c => c)
      logger.log('Cookies restants après nettoyage manuel:', remainingCookies)
      logger.log('=== Fin nettoyage manuel des cookies ===')
    } catch (e) {
      logger.error('Erreur lors du nettoyage manuel des cookies:', e)
    }
  }

  // Nettoyer une session invalide ou expirée
  async function clearInvalidSession() {
    try {
      // Déconnecter proprement de Supabase (cela devrait supprimer les cookies HttpOnly)
      // signOut() de Supabase gère correctement la suppression des cookies sans problème CORS
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
    
    // Nettoyer les cookies Supabase
    try {
      // Récupérer l'URL de Supabase pour connaître le domaine des cookies
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      if (supabaseUrl) {
        const url = new URL(supabaseUrl)
        const domain = url.hostname
        
        // Fonction pour supprimer un cookie avec toutes les variations possibles
        const deleteCookie = (name) => {
          const currentHost = window.location.hostname
          const currentHostParts = currentHost.split('.')
          
          // Liste de toutes les combinaisons possibles
          const combinations = [
            // Sans domaine spécifique
            { path: '/', sameSite: '', secure: '' },
            { path: '/', sameSite: 'SameSite=None', secure: 'Secure' },
            { path: '/', sameSite: 'SameSite=Lax', secure: '' },
            { path: '/', sameSite: 'SameSite=Strict', secure: '' },
            // Avec domaine actuel
            { path: '/', domain: currentHost, sameSite: '', secure: '' },
            { path: '/', domain: `.${currentHost}`, sameSite: '', secure: '' },
            // Avec domaine Supabase
            { path: '/', domain: domain, sameSite: '', secure: '' },
            { path: '/', domain: `.${domain}`, sameSite: '', secure: '' },
            // Avec domaine racine
            ...(currentHostParts.length > 1 ? [
              { path: '/', domain: `.${currentHostParts.slice(-2).join('.')}`, sameSite: '', secure: '' }
            ] : []),
            // Différents chemins
            { path: '/', sameSite: '', secure: '' },
            { path: window.location.pathname, sameSite: '', secure: '' },
          ]
          
          combinations.forEach(combo => {
            let cookieStr = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC`
            if (combo.path) cookieStr += `; path=${combo.path}`
            if (combo.domain) cookieStr += `; domain=${combo.domain}`
            if (combo.sameSite) cookieStr += `; ${combo.sameSite}`
            if (combo.secure) cookieStr += `; ${combo.secure}`
            document.cookie = cookieStr
          })
        }
        
        // Identifier et supprimer tous les cookies Supabase
        // Supabase utilise généralement des cookies comme: sb-{project-ref}-auth-token
        const projectRef = domain.split('.')[0] // Premier segment du domaine (ex: xyz.supabase.co -> xyz)
        const cookieNames = [
          `sb-${projectRef}-auth-token`,
          `sb-${projectRef}-auth-token-code-verifier`,
          'sb-access-token',
          'sb-refresh-token',
          'sb-auth-token'
        ]
        
        // Supprimer les cookies connus
        cookieNames.forEach(cookieName => deleteCookie(cookieName))
        
        // Lister TOUS les cookies avant nettoyage
        const allCookies = document.cookie.split(';').map(c => c.trim()).filter(c => c)
        logger.log('Tous les cookies détectés:', allCookies)
        
        // Nettoyer aussi TOUS les cookies qui commencent par 'sb-' ou contiennent 'auth', 'session', 'token', 'supabase'
        allCookies.forEach(cookie => {
          const cookieName = cookie.split('=')[0].trim()
          const lowerName = cookieName.toLowerCase()
          if (cookieName.startsWith('sb-') || 
              lowerName.includes('auth') || 
              lowerName.includes('session') ||
              lowerName.includes('token') ||
              lowerName.includes('supabase')) {
            logger.log(`Tentative de suppression du cookie: ${cookieName}`)
            deleteCookie(cookieName)
          }
        })
        
        // Attendre un peu puis vérifier
        await new Promise(resolve => setTimeout(resolve, 100))
        const remainingCookies = document.cookie.split(';').map(c => c.trim()).filter(c => c)
        logger.log('Cookies restants après nettoyage:', remainingCookies)
        logger.log('Cookies Supabase nettoyés')
      }
    } catch (e) {
      logger.warn('Impossible de nettoyer les cookies:', e)
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

  async function signIn(email, password, rememberMe = true) {
    try {
      isSigningIn.value = true // Marquer qu'on est en train de se connecter
      loading.value = true
      error.value = null

      logger.log('=== DÉBUT TENTATIVE CONNEXION ===')
      logger.log('Tentative de connexion pour:', email, 'rememberMe:', rememberMe)
      
      // Logger tous les cookies présents AVANT nettoyage
      logger.log('=== DÉBUT TENTATIVE CONNEXION ===')
      logger.log('Cookies AVANT nettoyage:', document.cookie)
      
      // Nettoyer complètement toutes les données de session avant la connexion
      // pour éviter les conflits avec d'anciennes sessions corrompues
      sessionStorage.removeItem('supabase.auth.cleanupOnStart')
      sessionStorage.removeItem('supabase.auth.sessionTemporary')
      
      // Nettoyer complètement la session existante (y compris les cookies)
      await clearInvalidSession()
      
      // Nettoyage manuel supplémentaire pour être sûr
      await clearAllCookiesManually()
      
      // Attendre un peu pour que le nettoyage soit effectif
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Logger tous les cookies présents APRÈS nettoyage
      logger.log('Cookies APRÈS nettoyage:', document.cookie)
      
      // Stocker la préférence rememberMe AVANT la connexion
      if (rememberMe) {
        localStorage.setItem('supabase.auth.rememberMe', 'true')
      } else {
        localStorage.setItem('supabase.auth.rememberMe', 'false')
      }
      
      // Logger les cookies juste AVANT la tentative Supabase
      logger.log('Cookies JUSTE AVANT signInWithPassword:', document.cookie)
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      // Logger les cookies juste APRÈS la tentative Supabase (même si réussie ou échouée)
      logger.log('Cookies JUSTE APRÈS signInWithPassword:', document.cookie)
      
      // Si la connexion échoue, essayer de nettoyer les cookies via signOut()
      if (signInError) {
        logger.log('Erreur de connexion détectée, tentative de nettoyage des cookies HttpOnly...')
        try {
          // Utiliser signOut() au lieu de fetch direct pour éviter les problèmes CORS
          await supabase.auth.signOut()
          logger.log('signOut() appelé après erreur de connexion')
        } catch (signOutError) {
          logger.debug('Erreur lors de signOut après erreur de connexion (non bloquant):', signOutError)
        }
      }

      if (signInError) {
        logger.error('Erreur Supabase signIn:', signInError)
        logger.log('Code d\'erreur:', signInError.status, 'Message:', signInError.message)
        
        // Si la connexion échoue, nettoyer TOUS les cookies créés pendant la tentative
        // car Supabase peut avoir créé des cookies corrompus
        logger.log('Connexion échouée, nettoyage des cookies créés...')
        await clearAllCookiesManually()
        
        // Attendre un peu puis vérifier
        await new Promise(resolve => setTimeout(resolve, 100))
        logger.log('Cookies après nettoyage suite à erreur:', document.cookie)
        
        isSigningIn.value = false
        throw signInError
      }

      if (data?.user) {
        logger.log('Utilisateur connecté, chargement du profil...')
        await loadUserProfile(data.user.id)
        logger.log('Profil chargé, utilisateur:', user.value)
        
        // Si rememberMe est false, configurer le nettoyage à la fermeture
        if (!rememberMe) {
          setupSessionCleanupOnClose()
        } else {
          removeSessionCleanupOnClose()
        }
      } else {
        logger.warn('Pas de données utilisateur dans la réponse')
        isSigningIn.value = false
        throw new Error('Aucune donnée utilisateur reçue')
      }

      // Attendre un peu avant de réinitialiser le flag pour que onAuthStateChange puisse terminer
      setTimeout(() => {
        isSigningIn.value = false
      }, 1000)

      return { success: true }
    } catch (err) {
      error.value = err.message
      logger.error('Erreur lors de la connexion:', err)
      isSigningIn.value = false
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }
  
  // Configurer le nettoyage de session à la fermeture du navigateur si rememberMe est false
  function setupSessionCleanupOnClose() {
    // Retirer l'ancien handler s'il existe
    removeSessionCleanupOnClose()
    
    // Utiliser sessionStorage pour marquer qu'on ne doit pas persister
    // Cela permet de nettoyer au prochain démarrage si la session n'est pas persistante
    sessionStorage.setItem('supabase.auth.sessionTemporary', 'true')
    
    // Enregistrer un listener pour nettoyer à la fermeture (synchrone uniquement)
    const cleanupHandler = () => {
      // Marquer pour nettoyage au prochain démarrage
      sessionStorage.setItem('supabase.auth.cleanupOnStart', 'true')
      // Nettoyer les clés Supabase du localStorage (opération synchrone)
      try {
        const supabaseKeys = Object.keys(localStorage).filter(key => key.startsWith('sb-'))
        supabaseKeys.forEach(key => localStorage.removeItem(key))
      } catch (e) {
        // Ignorer les erreurs lors du nettoyage à la fermeture
      }
    }
    
    // Stocker le handler pour pouvoir le retirer plus tard
    window._sessionCleanupHandler = cleanupHandler
    window.addEventListener('beforeunload', cleanupHandler)
    logger.log('Nettoyage de session configuré pour la fermeture')
  }
  
  // Retirer le listener de nettoyage
  function removeSessionCleanupOnClose() {
    if (window._sessionCleanupHandler) {
      window.removeEventListener('beforeunload', window._sessionCleanupHandler)
      window._sessionCleanupHandler = null
    }
    sessionStorage.removeItem('supabase.auth.sessionTemporary')
    sessionStorage.removeItem('supabase.auth.cleanupOnStart')
    logger.debug('Nettoyage de session désactivé')
  }
  
  // Vérifier et nettoyer la session si nécessaire au démarrage
  async function checkAndCleanupTemporarySession() {
    // Ne pas nettoyer si on est en train de se connecter
    if (isSigningIn.value) {
      logger.debug('checkAndCleanupTemporarySession ignoré: connexion en cours')
      return
    }
    
    const rememberMe = localStorage.getItem('supabase.auth.rememberMe')
    
    // Si rememberMe est true, nettoyer les flags de session temporaire et ne rien faire
    if (rememberMe === 'true') {
      sessionStorage.removeItem('supabase.auth.cleanupOnStart')
      sessionStorage.removeItem('supabase.auth.sessionTemporary')
      logger.debug('Flags de session temporaire nettoyés (rememberMe=true)')
      return // Ne pas nettoyer si rememberMe est true
    }
    
    // Si rememberMe est false ou non défini, vérifier si on doit nettoyer
    const cleanupOnStart = sessionStorage.getItem('supabase.auth.cleanupOnStart')
    const sessionTemporary = sessionStorage.getItem('supabase.auth.sessionTemporary')
    
    // Nettoyer seulement si rememberMe est explicitement false ET qu'on doit nettoyer
    if ((cleanupOnStart === 'true' || sessionTemporary === 'true') && rememberMe === 'false') {
      // Vérifier d'abord si on a une session valide
      const { data: { session } } = await supabase.auth.getSession()
      // Si pas de session, nettoyer
      if (!session?.user) {
        logger.log('Nettoyage de session temporaire au démarrage (pas de session valide)')
        await clearInvalidSession()
      }
      // Toujours nettoyer les flags
      sessionStorage.removeItem('supabase.auth.cleanupOnStart')
      sessionStorage.removeItem('supabase.auth.sessionTemporary')
    } else if (!rememberMe || rememberMe === 'null') {
      // Si rememberMe n'est pas défini, nettoyer les flags pour éviter les conflits
      sessionStorage.removeItem('supabase.auth.cleanupOnStart')
      sessionStorage.removeItem('supabase.auth.sessionTemporary')
      logger.debug('Flags de session temporaire nettoyés (rememberMe non défini)')
    }
  }
  

  async function signUp(email, password, name) {
    try {
      loading.value = true
      error.value = null

      // Valider que les valeurs ne sont pas vides
      if (!email || !email.trim()) {
        throw new Error('L\'email est requis')
      }
      if (!password || password.length < 6) {
        throw new Error('Le mot de passe doit contenir au moins 6 caractères')
      }
      if (!name || !name.trim()) {
        throw new Error('Le nom est requis')
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            name: name.trim()
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
      const errorMessage = handleError(err, {
        context: 'AuthStore.signUp',
        showToast: false // Laisser le composant afficher le toast avec le message approprié
      })
      error.value = errorMessage
      
      return { success: false, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  async function signOut() {
    try {
      loading.value = true
      
      // Retirer le listener de nettoyage
      removeSessionCleanupOnClose()
      
      // Nettoyer le flag rememberMe
      localStorage.removeItem('supabase.auth.rememberMe')
      
      const { error: signOutError } = await supabase.auth.signOut()
      
      if (signOutError) throw signOutError
      
      // Nettoyer aussi les cookies et localStorage après la déconnexion
      // (ne pas appeler clearInvalidSession car il appelle signOut, ce qui créerait une boucle)
      // Nettoyer manuellement localStorage et cookies
      try {
        const supabaseKeys = Object.keys(localStorage).filter(key => key.startsWith('sb-'))
        supabaseKeys.forEach(key => localStorage.removeItem(key))
        logger.log('LocalStorage Supabase nettoyé après déconnexion')
      } catch (e) {
        logger.warn('Impossible de nettoyer le localStorage:', e)
      }
      
      // Nettoyer les cookies (utiliser la même logique que clearInvalidSession mais sans appeler signOut)
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        if (supabaseUrl) {
          const url = new URL(supabaseUrl)
          const domain = url.hostname
          
          const deleteCookie = (name) => {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None; Secure;`
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax;`
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain};`
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${domain};`
            const domainParts = domain.split('.')
            if (domainParts.length > 1) {
              const rootDomain = '.' + domainParts.slice(-2).join('.')
              document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${rootDomain};`
            }
          }
          
          const projectRef = domain.split('.')[0]
          const cookieNames = [
            `sb-${projectRef}-auth-token`,
            `sb-${projectRef}-auth-token-code-verifier`,
            'sb-access-token',
            'sb-refresh-token',
            'sb-auth-token'
          ]
          
          cookieNames.forEach(cookieName => deleteCookie(cookieName))
          
          const allCookies = document.cookie.split(';')
          allCookies.forEach(cookie => {
            const cookieName = cookie.split('=')[0].trim()
            if (cookieName.startsWith('sb-')) {
              deleteCookie(cookieName)
            }
          })
          
          logger.log('Cookies Supabase nettoyés après déconnexion')
        }
      } catch (e) {
        logger.warn('Impossible de nettoyer les cookies:', e)
      }
      
      user.value = null
      return { success: true }
    } catch (err) {
      error.value = err.message
      logger.error('Erreur lors de la déconnexion:', err)
      // Même en cas d'erreur, nettoyer les données locales
      try {
        const supabaseKeys = Object.keys(localStorage).filter(key => key.startsWith('sb-'))
        supabaseKeys.forEach(key => localStorage.removeItem(key))
      } catch (cleanupErr) {
        logger.warn('Erreur lors du nettoyage après déconnexion:', cleanupErr)
      }
       return { success: false, error: err.message }
     } finally {
       loading.value = false
     }
   }

   // Supprimer toutes les données de l'utilisateur et son compte
   async function deleteAccount() {
     try {
       loading.value = true
       error.value = null

       if (!user.value?.id) {
         throw new Error('Utilisateur non connecté')
       }

       const userId = user.value.id
       logger.log('=== DÉBUT SUPPRESSION DU COMPTE ===')
       logger.log('Utilisateur ID:', userId)

       // 1. Gérer les équipes dont l'utilisateur est propriétaire
       // Récupérer toutes les équipes dont l'utilisateur est propriétaire
       const { data: ownedTeams, error: teamsError } = await supabase
         .from('teams')
         .select('id')
         .eq('created_by', userId)

       if (teamsError) {
         logger.warn('Erreur lors de la récupération des équipes (non bloquant):', teamsError)
       } else if (ownedTeams && ownedTeams.length > 0) {
         // Pour chaque équipe possédée, essayer de transférer la propriété au premier membre admin, sinon premier membre
         for (const team of ownedTeams) {
           const { data: members } = await supabase
             .from('team_members')
             .select('user_id, role')
             .eq('team_id', team.id)
             .neq('user_id', userId)
             .order('role', { ascending: true }) // admin avant member

           if (members && members.length > 0) {
             // Transférer au premier membre disponible
             const newOwnerId = members[0].user_id
             await supabase
               .from('teams')
               .update({ created_by: newOwnerId })
               .eq('id', team.id)
             
             await supabase
               .from('team_members')
               .update({ role: 'owner' })
               .eq('team_id', team.id)
               .eq('user_id', newOwnerId)
             
             logger.log(`Propriété de l'équipe ${team.id} transférée à ${newOwnerId}`)
           } else {
             // Aucun autre membre, supprimer l'équipe
             await supabase
               .from('teams')
               .delete()
               .eq('id', team.id)
             logger.log(`Équipe ${team.id} supprimée (aucun autre membre)`)
           }
         }
       }

       // 2. Supprimer l'utilisateur des équipes (team_members)
       const { error: removeMembersError } = await supabase
         .from('team_members')
         .delete()
         .eq('user_id', userId)

       if (removeMembersError) {
         logger.warn('Erreur lors de la suppression des membres d\'équipe (non bloquant):', removeMembersError)
       }

       // 3. Supprimer les invitations d'équipe liées à l'email de l'utilisateur
       if (user.value.email) {
         const { error: removeInvitationsError } = await supabase
           .from('team_invitations')
           .delete()
           .eq('email', user.value.email.toLowerCase())

         if (removeInvitationsError) {
           logger.warn('Erreur lors de la suppression des invitations (non bloquant):', removeInvitationsError)
         }
       }

       // 4. Supprimer les données utilisateur (les autres seront supprimées par CASCADE)
       // Note: Les tables avec ON DELETE CASCADE seront supprimées automatiquement si on supprime auth.users
       // Mais comme on ne peut pas supprimer auth.users depuis le client, on supprime manuellement

       const { error: removeLeavesError } = await supabase
         .from('leaves')
         .delete()
         .eq('user_id', userId)

       if (removeLeavesError) {
         logger.warn('Erreur lors de la suppression des congés (non bloquant):', removeLeavesError)
       }

       const { error: removeLeaveTypesError } = await supabase
         .from('leave_types')
         .delete()
         .eq('user_id', userId)

       if (removeLeaveTypesError) {
         logger.warn('Erreur lors de la suppression des types de congés (non bloquant):', removeLeaveTypesError)
       }

       const { error: removeQuotasError } = await supabase
         .from('leave_quotas')
         .delete()
         .eq('user_id', userId)

       if (removeQuotasError) {
         logger.warn('Erreur lors de la suppression des quotas (non bloquant):', removeQuotasError)
       }

       const { error: removePreferencesError } = await supabase
         .from('user_preferences')
         .delete()
         .eq('user_id', userId)

       if (removePreferencesError) {
         logger.warn('Erreur lors de la suppression des préférences (non bloquant):', removePreferencesError)
       }

       // Note: user_emails sera supprimé automatiquement par CASCADE
       // Note: app_admins sera supprimé automatiquement par CASCADE

       logger.log('=== DONNÉES UTILISATEUR SUPPRIMÉES ===')
       logger.log('Le compte Supabase doit être supprimé depuis le dashboard Supabase')
       logger.log('ou via une Edge Function avec les droits admin')

       // Déconnecter l'utilisateur
       await signOut()

       return { success: true }
     } catch (err) {
       error.value = err.message
       logger.error('Erreur lors de la suppression du compte:', err)
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
          // Reconfigurer le nettoyage selon rememberMe
          const rememberMe = localStorage.getItem('supabase.auth.rememberMe')
          if (rememberMe === 'false') {
            setupSessionCleanupOnClose()
          } else {
            removeSessionCleanupOnClose()
          }
        }
      } else {
        logger.warn('Session invalide lors de SIGNED_IN, nettoyage...')
        await clearInvalidSession()
        user.value = null
      }
    } else if (event === 'SIGNED_OUT') {
      user.value = null
      removeSessionCleanupOnClose()
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
    signOut,
    deleteAccount
  }
})

