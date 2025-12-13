// Jours fériés - Calcul des jours fériés par pays et année

import { formatDateKey } from './dateUtils'

// Obtenir les jours fériés pour un pays et une année
export function getPublicHolidays(country, year) {
  const holidays = {}
  
  // Fonction pour calculer Pâques (algorithme de Meeus)
  const getEaster = (year) => {
    const a = year % 19
    const b = Math.floor(year / 100)
    const c = year % 100
    const d = Math.floor(b / 4)
    const e = b % 4
    const f = Math.floor((b + 8) / 25)
    const g = Math.floor((b - f + 1) / 3)
    const h = (19 * a + b - d - g + 15) % 30
    const i = Math.floor(c / 4)
    const k = c % 4
    const l = (32 + 2 * e + 2 * i - h - k) % 7
    const m = Math.floor((a + 11 * h + 22 * l) / 451)
    const month = Math.floor((h + l - 7 * m + 114) / 31)
    const day = ((h + l - 7 * m + 114) % 31) + 1
    return new Date(year, month - 1, day)
  }

  const easter = getEaster(year)
  const easterMonday = new Date(easter)
  easterMonday.setDate(easterMonday.getDate() + 1)
  const ascension = new Date(easter)
  ascension.setDate(ascension.getDate() + 39)
  const whitMonday = new Date(easter)
  whitMonday.setDate(whitMonday.getDate() + 50)

  // Jours fériés fixes et variables selon le pays
  if (country === 'FR') {
    // Jours fériés fixes
    holidays[formatDateKey(new Date(year, 0, 1))] = 'Jour de l\'An'
    holidays[formatDateKey(new Date(year, 4, 1))] = 'Fête du Travail'
    holidays[formatDateKey(new Date(year, 4, 8))] = 'Victoire 1945'
    holidays[formatDateKey(new Date(year, 6, 14))] = 'Fête Nationale'
    holidays[formatDateKey(new Date(year, 7, 15))] = 'Assomption'
    holidays[formatDateKey(new Date(year, 10, 1))] = 'Toussaint'
    holidays[formatDateKey(new Date(year, 10, 11))] = 'Armistice 1918'
    holidays[formatDateKey(new Date(year, 11, 25))] = 'Noël'
    
    // Jours fériés variables (basés sur Pâques)
    holidays[formatDateKey(easter)] = 'Pâques'
    holidays[formatDateKey(easterMonday)] = 'Lundi de Pâques'
    holidays[formatDateKey(ascension)] = 'Ascension'
    holidays[formatDateKey(whitMonday)] = 'Lundi de Pentecôte'
  }
  
  return holidays
}
