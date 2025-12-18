// Logger simple (avec option pour activer/désactiver les logs debug via localStorage)
const DEFAULT_IS_DEV = import.meta.env.DEV
const KEY_CONSOLE_DEBUG = 'gc.consoleDebugLogs'

// Tri-state:
// - "true"  => force ON
// - "false" => force OFF (même en dev)
// - null    => défaut = import.meta.env.DEV
export function getConsoleDebugLogsEnabled() {
  try {
    if (typeof localStorage === 'undefined') return DEFAULT_IS_DEV
    const v = localStorage.getItem(KEY_CONSOLE_DEBUG)
    if (v === 'true') return true
    if (v === 'false') return false
  } catch {
    // ignorer
  }
  return DEFAULT_IS_DEV
}

export function setConsoleDebugLogsEnabled(enabled) {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(KEY_CONSOLE_DEBUG, enabled ? 'true' : 'false')
  } catch {
    // ignorer
  }
}

export const logger = {
  log: (...args) => {
    if (getConsoleDebugLogsEnabled()) console.log('[LOG]', ...args)
  },
  debug: (...args) => {
    if (getConsoleDebugLogsEnabled()) console.debug('[DEBUG]', ...args)
  },
  warn: (...args) => {
    console.warn('[WARN]', ...args)
  },
  error: (...args) => {
    console.error('[ERROR]', ...args)
  }
}

export default logger

