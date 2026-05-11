/**
 * Client HTTP pour l’API NestJS (remplace PocketBase côté transport).
 *
 * - URL de base : `import.meta.env.VITE_API_URL` (ex. http://localhost:3000)
 * - Access JWT : header Authorization ; refresh opaque : localStorage
 * - En 401 : une tentative de POST /auth/refresh puis retry de la requête initiale
 */

const STORAGE_ACCESS = 'gc_access_token'
const STORAGE_REFRESH = 'gc_refresh_token'

/** Base URL sans slash final */
function baseUrl() {
  const raw = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  return String(raw).replace(/\/$/, '')
}

export function getStoredTokens() {
  return {
    access: localStorage.getItem(STORAGE_ACCESS),
    refresh: localStorage.getItem(STORAGE_REFRESH),
  }
}

/** Persiste les jetons après login / refresh. */
export function setStoredTokens(access, refresh) {
  if (access != null) localStorage.setItem(STORAGE_ACCESS, access)
  if (refresh != null) localStorage.setItem(STORAGE_REFRESH, refresh)
}

export function clearStoredTokens() {
  localStorage.removeItem(STORAGE_ACCESS)
  localStorage.removeItem(STORAGE_REFRESH)
}

/** Évite plusieurs refresh concurrents (rafales de 401). */
let refreshInFlight = null

async function refreshSession() {
  const { refresh } = getStoredTokens()
  if (!refresh) return false

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const res = await fetch(`${baseUrl()}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refresh }),
      })
      if (!res.ok) {
        clearStoredTokens()
        return false
      }
      const data = await res.json()
      setStoredTokens(data.accessToken, data.refreshToken)
      return true
    })().finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}

/**
 * Extrait un message lisible depuis une réponse d’erreur Nest (body JSON).
 */
export async function readApiErrorMessage(res) {
  let body = {}
  try {
    body = await res.json()
  } catch {
    /* ignore */
  }
  const m = body.message
  if (Array.isArray(m)) return m[0] || res.statusText
  if (typeof m === 'string') return m
  return res.statusText || 'Erreur réseau'
}

/**
 * Requête JSON authentifiée (Bearer si présent).
 *
 * @param {string} path - ex. "/auth/me"
 * @param {RequestInit} [init]
 * @param {{ skipAuth?: boolean, retryOn401?: boolean }} [opts]
 */
export async function apiFetch(path, init = {}, opts = {}) {
  const { skipAuth = false, retryOn401 = true } = opts
  const url = path.startsWith('http') ? path : `${baseUrl()}${path.startsWith('/') ? '' : '/'}${path}`

  const headers = new Headers(init.headers || {})
  if (!headers.has('Content-Type') && init.body && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json')
  }
  if (!skipAuth) {
    const { access } = getStoredTokens()
    if (access) headers.set('Authorization', `Bearer ${access}`)
  }

  let res
  try {
    res = await fetch(url, { ...init, headers })
  } catch (e) {
    const base = baseUrl()
    const hint =
      `Impossible de contacter l’API (${base}). ` +
      `Lancez PostgreSQL (ex. docker compose up -d à la racine du projet), puis dans api/ : npm run start:dev`
    throw new Error(e?.message === 'Failed to fetch' ? hint : e?.message || hint)
  }

  if (res.status === 401 && !skipAuth && retryOn401) {
    const ok = await refreshSession()
    if (ok) {
      const h2 = new Headers(init.headers || {})
      if (!h2.has('Content-Type') && init.body && typeof init.body === 'string') {
        h2.set('Content-Type', 'application/json')
      }
      const { access } = getStoredTokens()
      if (access) h2.set('Authorization', `Bearer ${access}`)
      try {
        res = await fetch(url, { ...init, headers: h2 })
      } catch (e) {
        const base = baseUrl()
        throw new Error(
          e?.message === 'Failed to fetch'
            ? `Impossible de contacter l’API (${base}). Démarrez l’API Nest (npm run start:dev dans api/).`
            : e?.message || 'Erreur réseau',
        )
      }
    }
  }

  return res
}

/** GET JSON typé ; lance Error si !res.ok */
export async function apiJson(path, init = {}) {
  const res = await apiFetch(path, init)
  if (!res.ok) {
    const msg = await readApiErrorMessage(res)
    const err = new Error(msg)
    err.status = res.status
    throw err
  }
  if (res.status === 204) return null
  return res.json()
}
