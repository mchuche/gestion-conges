/**
 * Handler d'erreurs global pour standardiser la gestion des erreurs dans l'application
 */

import logger from './logger'
import { useToast } from '../composables/useToast'

/**
 * Types d'erreurs reconnus
 */
export const ErrorType = {
  NETWORK: 'network',
  VALIDATION: 'validation',
  AUTH: 'auth',
  DATABASE: 'database',
  UNKNOWN: 'unknown'
}

/**
 * Messages d'erreur traduits pour l'utilisateur
 */
const ERROR_MESSAGES = {
  // Erreurs réseau
  network: {
    timeout: 'La connexion a expiré. Veuillez réessayer.',
    offline: 'Vous êtes hors ligne. Vérifiez votre connexion internet.',
    failed: 'Erreur de connexion. Veuillez réessayer.',
    default: 'Une erreur réseau est survenue. Veuillez réessayer.'
  },
  // Erreurs d'authentification
  auth: {
    invalid_credentials: 'Email ou mot de passe incorrect.',
    email_not_confirmed: 'Votre email n\'est pas encore confirmé. Vérifiez votre boîte mail.',
    email_already_exists: 'Cette adresse email est déjà utilisée.',
    email_invalid: 'Cette adresse email est invalide.',
    password_weak: 'Le mot de passe ne respecte pas les critères requis.',
    session_expired: 'Votre session a expiré. Veuillez vous reconnecter.',
    unauthorized: 'Vous n\'êtes pas autorisé à effectuer cette action.',
    default: 'Une erreur d\'authentification est survenue.'
  },
  // Erreurs de base de données
  database: {
    not_found: 'Les données demandées n\'ont pas été trouvées.',
    constraint_violation: 'Cette action viole une contrainte de la base de données.',
    connection_failed: 'Impossible de se connecter à la base de données.',
    default: 'Une erreur de base de données est survenue.'
  },
  // Erreurs de validation
  validation: {
    required: 'Ce champ est requis.',
    invalid_format: 'Le format est invalide.',
    out_of_range: 'La valeur est hors limites.',
    default: 'Les données fournies sont invalides.'
  },
  // Erreur générique
  unknown: 'Une erreur inattendue est survenue. Veuillez réessayer.'
}

/**
 * Détecte le type d'erreur à partir de l'objet d'erreur
 */
function detectErrorType(error) {
  if (!error) return ErrorType.UNKNOWN

  // Erreurs réseau
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return ErrorType.NETWORK
  }
  if (error.message?.toLowerCase().includes('network') || 
      error.message?.toLowerCase().includes('timeout') ||
      error.message?.toLowerCase().includes('offline')) {
    return ErrorType.NETWORK
  }

  // Erreurs Supabase Auth
  if (error.code?.startsWith('auth/') || error.status === 401 || error.status === 403) {
    return ErrorType.AUTH
  }

  // Erreurs Supabase Database
  if (error.code?.startsWith('PGRST') || error.code?.startsWith('235') || error.status === 404 || error.status === 409) {
    return ErrorType.DATABASE
  }

  // Erreurs de validation (VeeValidate, etc.)
  if (error.name === 'ValidationError' || error.field) {
    return ErrorType.VALIDATION
  }

  return ErrorType.UNKNOWN
}

/**
 * Extrait un message d'erreur lisible depuis l'erreur
 */
function extractErrorMessage(error, errorType) {
  if (!error) return ERROR_MESSAGES.unknown

  const message = error.message || error.toString() || ''

  // Messages spécifiques par type
  if (errorType === ErrorType.AUTH) {
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('invalid login') || lowerMessage.includes('invalid credentials')) {
      return ERROR_MESSAGES.auth.invalid_credentials
    }
    if (lowerMessage.includes('email not confirmed') || lowerMessage.includes('not confirmed')) {
      return ERROR_MESSAGES.auth.email_not_confirmed
    }
    if (lowerMessage.includes('already registered') || lowerMessage.includes('already exists') || lowerMessage.includes('already in use')) {
      return ERROR_MESSAGES.auth.email_already_exists
    }
    if (lowerMessage.includes('email') && (lowerMessage.includes('invalid') || lowerMessage.includes('malformed'))) {
      return ERROR_MESSAGES.auth.email_invalid
    }
    if (lowerMessage.includes('password') && (lowerMessage.includes('weak') || lowerMessage.includes('too short'))) {
      return ERROR_MESSAGES.auth.password_weak
    }
    if (lowerMessage.includes('session') || lowerMessage.includes('token')) {
      return ERROR_MESSAGES.auth.session_expired
    }
    
    return ERROR_MESSAGES.auth.default
  }

  if (errorType === ErrorType.NETWORK) {
    if (message.toLowerCase().includes('timeout')) {
      return ERROR_MESSAGES.network.timeout
    }
    if (message.toLowerCase().includes('offline') || navigator.onLine === false) {
      return ERROR_MESSAGES.network.offline
    }
    return ERROR_MESSAGES.network.default
  }

  if (errorType === ErrorType.DATABASE) {
    if (error.status === 404) {
      return ERROR_MESSAGES.database.not_found
    }
    if (error.code?.startsWith('235')) {
      return ERROR_MESSAGES.database.constraint_violation
    }
    return ERROR_MESSAGES.database.default
  }

  if (errorType === ErrorType.VALIDATION) {
    return ERROR_MESSAGES.validation.default
  }

  // Si le message est déjà lisible, l'utiliser
  if (message && message.length < 200 && !message.includes('Error:') && !message.includes('[object')) {
    return message
  }

  // Sinon, message générique par type
  return ERROR_MESSAGES[errorType]?.default || ERROR_MESSAGES.unknown
}

/**
 * Handler d'erreurs principal
 * @param {Error} error - L'erreur à gérer
 * @param {Object} options - Options de gestion
 * @param {boolean} options.showToast - Afficher un toast à l'utilisateur (défaut: true)
 * @param {boolean} options.logError - Logger l'erreur (défaut: true)
 * @param {string} options.context - Contexte de l'erreur (pour les logs)
 * @param {Function} options.onError - Callback personnalisé pour gérer l'erreur
 * @returns {string} Message d'erreur formaté
 */
export function handleError(error, options = {}) {
  const {
    showToast = true,
    logError = true,
    context = '',
    onError = null
  } = options

  // Si un handler personnalisé est fourni, l'utiliser
  if (onError && typeof onError === 'function') {
    try {
      const result = onError(error)
      if (result !== undefined) {
        return result
      }
    } catch (e) {
      logger.error('[handleError] Erreur dans le handler personnalisé:', e)
    }
  }

  // Détecter le type d'erreur
  const errorType = detectErrorType(error)
  
  // Extraire le message utilisateur
  const userMessage = extractErrorMessage(error, errorType)

  // Logger l'erreur si demandé
  if (logError) {
    const logContext = context ? `[${context}] ` : ''
    logger.error(`${logContext}Erreur ${errorType}:`, error)
    
    // Logger aussi le message utilisateur en debug
    logger.debug(`${logContext}Message utilisateur:`, userMessage)
  }

  // Afficher un toast si demandé
  if (showToast) {
    const { error: showErrorToast } = useToast()
    showErrorToast(userMessage)
  }

  return userMessage
}

/**
 * Wrapper pour gérer les erreurs dans les fonctions async
 * Utilisation: await handleAsyncError(asyncFunction(), context)
 */
export async function handleAsyncError(promise, context = '', options = {}) {
  try {
    return await promise
  } catch (error) {
    handleError(error, { context, ...options })
    throw error // Re-lancer l'erreur pour que l'appelant puisse la gérer si nécessaire
  }
}

/**
 * Handler spécifique pour les erreurs Supabase
 */
export function handleSupabaseError(error, context = '') {
  if (!error) return null

  // Les erreurs Supabase ont souvent un format spécifique
  const supabaseError = error.error || error
  const message = supabaseError.message || error.message || ''

  return handleError(error, {
    context: context || 'Supabase',
    showToast: true,
    logError: true
  })
}

/**
 * Handler pour les erreurs de validation (VeeValidate, etc.)
 */
export function handleValidationError(error, context = '') {
  return handleError(error, {
    context: context || 'Validation',
    showToast: true,
    logError: false // Les erreurs de validation sont souvent nombreuses, ne pas toutes logger
  })
}

export default {
  handleError,
  handleAsyncError,
  handleSupabaseError,
  handleValidationError,
  ErrorType
}

