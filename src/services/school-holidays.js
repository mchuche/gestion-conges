/**
 * Vacances scolaires France (zones A, B, C) — affichage essai : couleur du chiffre du jour.
 *
 * REVENIR EN ARRIÈRE (style calendrier d’origine) :
 * 1. Configuration → décocher « Afficher les vacances scolaires » (défaut = off).
 * 2. Ou supprimer ce fichier + school-holidays-fr.json + prefs Prisma (voir docs/notes/SCHOOL_HOLIDAYS_TRIAL.md).
 */

import raw from '../data/school-holidays-fr.json'
import { formatDateKey } from './dateUtils'

/** Cache : clé "zone|dateKey" → nom de la période */
const cacheByZone = new Map()

function buildCacheForZone(zone) {
  const upper = String(zone || '').toUpperCase()
  if (!['A', 'B', 'C'].includes(upper)) return new Map()

  const map = new Map()
  for (const period of raw.periods || []) {
    if (!period.zones?.includes(upper)) continue
    const start = new Date(period.start + 'T12:00:00')
    const end = new Date(period.end + 'T12:00:00')
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      map.set(formatDateKey(d), period.name)
    }
  }
  return map
}

function getZoneMap(zone) {
  const key = String(zone || '').toUpperCase()
  if (!cacheByZone.has(key)) {
    cacheByZone.set(key, buildCacheForZone(key))
  }
  return cacheByZone.get(key)
}

/**
 * @param {string} zone - A, B ou C
 * @param {string} dateKey - YYYY-MM-DD
 * @returns {{ name: string } | null}
 */
export function getSchoolHolidayForDate(zone, dateKey) {
  if (!zone || !dateKey) return null
  const name = getZoneMap(zone).get(dateKey)
  return name ? { name } : null
}

export const SCHOOL_HOLIDAY_ZONES = ['A', 'B', 'C']
