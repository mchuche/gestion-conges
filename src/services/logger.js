// Logger simple pour le développement
const isDev = import.meta.env.DEV

export const logger = {
  log: (...args) => {
    if (isDev) console.log('[LOG]', ...args)
  },
  debug: (...args) => {
    if (isDev) console.debug('[DEBUG]', ...args)
  },
  warn: (...args) => {
    console.warn('[WARN]', ...args)
  },
  error: (...args) => {
    console.error('[ERROR]', ...args)
  }
}

export default logger

