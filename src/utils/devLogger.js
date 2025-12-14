/**
 * Logger de développement - Affiche les logs uniquement en mode développement
 * Les erreurs sont toujours loggées via le logger principal
 */

const isDev = import.meta.env.DEV
import logger from '../services/logger'

export const devLogger = {
  /**
   * Log en mode développement uniquement
   */
  log: (...args) => {
    if (isDev) {
      console.log('[DEV]', ...args)
    }
  },

  /**
   * Error - log toujours (via logger principal) + console en dev
   */
  error: (...args) => {
    // Toujours logger les erreurs en production
    logger.error(...args)
    // Aussi dans la console en dev
    if (isDev) {
      console.error('[DEV ERROR]', ...args)
    }
  },

  /**
   * Warning en mode développement uniquement
   */
  warn: (...args) => {
    if (isDev) {
      console.warn('[DEV WARN]', ...args)
    }
  },

  /**
   * Debug - log en mode développement uniquement
   */
  debug: (...args) => {
    if (isDev) {
      console.debug('[DEV DEBUG]', ...args)
    }
  }
}

export default devLogger

