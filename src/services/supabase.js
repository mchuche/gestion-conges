import { createClient } from '@supabase/supabase-js'

// Les variables d'environnement seront injectées par Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes')
  console.error('Vérifiez que VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont définies dans .env')
}

// Créer un storage personnalisé qui utilise localStorage uniquement (pas de cookies)
const customStorage = typeof window !== 'undefined' ? {
  getItem: (key) => {
    try {
      return window.localStorage.getItem(key)
    } catch (e) {
      return null
    }
  },
  setItem: (key, value) => {
    try {
      window.localStorage.setItem(key, value)
    } catch (e) {
      // Ignorer les erreurs de quota
    }
  },
  removeItem: (key) => {
    try {
      window.localStorage.removeItem(key)
    } catch (e) {
      // Ignorer les erreurs
    }
  }
} : undefined

// Créer le client Supabase avec configuration pour utiliser localStorage uniquement
// Note: Supabase peut toujours créer des cookies HttpOnly côté serveur sur son domaine
// Ces cookies ne peuvent pas être supprimés par JavaScript, mais ils ne devraient pas
// affecter le fonctionnement de l'application si le storage personnalisé est utilisé
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    // Utiliser notre storage personnalisé pour éviter les cookies
    storage: customStorage,
    storageKey: 'sb-auth-token',
    flowType: 'pkce'
  }
})

// Export pour compatibilité avec l'ancien code
export default supabase

