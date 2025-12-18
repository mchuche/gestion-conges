/**
 * Logger de développement - Affiche les logs uniquement en mode développement
 * Les erreurs sont toujours loggées via le logger principal
 */

import logger, { getConsoleDebugLogsEnabled } from '../services/logger'

export const devLogger = {
  /**
   * Log en mode développement uniquement
   */
  log: (...args) => {
    if (getConsoleDebugLogsEnabled()) {
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
    if (getConsoleDebugLogsEnabled()) {
      console.error('[DEV ERROR]', ...args)
    }
  },

  /**
   * Warning en mode développement uniquement
   */
  warn: (...args) => {
    if (getConsoleDebugLogsEnabled()) {
      console.warn('[DEV WARN]', ...args)
    }
  },

  /**
   * Debug - log en mode développement uniquement
   */
  debug: (...args) => {
    if (getConsoleDebugLogsEnabled()) {
      console.debug('[DEV DEBUG]', ...args)
    }
  }
}

export default devLogger

