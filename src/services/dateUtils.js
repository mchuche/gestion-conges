// DateUtils - Fonctions de manipulation de dates
// Utilise date-fns (installé via npm) avec fallback sur JavaScript natif

import { 
  getYear as dateFnsGetYear,
  getMonth as dateFnsGetMonth,
  getDate as dateFnsGetDate,
  getDay as dateFnsGetDay,
  startOfMonth as dateFnsStartOfMonth,
  endOfMonth as dateFnsEndOfMonth,
  startOfYear as dateFnsStartOfYear,
  addDays as dateFnsAddDays,
  addMonths as dateFnsAddMonths,
  addYears as dateFnsAddYears,
  setYear as dateFnsSetYear,
  setMonth as dateFnsSetMonth,
  setDate as dateFnsSetDate,
  isSameDay as dateFnsIsSameDay,
  isBefore as dateFnsIsBefore,
  isAfter as dateFnsIsAfter,
  getDaysInMonth as dateFnsGetDaysInMonth,
  format as dateFnsFormat
} from 'date-fns'

// Obtenir l'année d'une date
export function getYear(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    console.error('[DateUtils] Date invalide dans getYear:', date)
    return new Date().getFullYear()
  }
  try {
    return dateFnsGetYear(date)
  } catch (e) {
    console.warn('[DateUtils] Erreur avec date-fns, utilisation native:', e)
    return date.getFullYear()
  }
}

// Obtenir le mois d'une date (0-11)
export function getMonth(date) {
  try {
    return dateFnsGetMonth(date)
  } catch (e) {
    return date.getMonth()
  }
}

// Obtenir le jour du mois (1-31)
export function getDate(date) {
  try {
    return dateFnsGetDate(date)
  } catch (e) {
    return date.getDate()
  }
}

// Obtenir le jour de la semaine (0 = Dimanche, 6 = Samedi)
export function getDay(date) {
  try {
    return dateFnsGetDay(date)
  } catch (e) {
    return date.getDay()
  }
}

/**
 * Ajuste le jour de la semaine selon le jour de début de semaine personnalisé
 * @param {number} dayOfWeek - Jour de la semaine (0 = Dimanche, 6 = Samedi)
 * @param {number} weekStartDay - Jour de début de semaine (0 = Dimanche, 1 = Lundi, etc.)
 * @returns {number} Jour ajusté (0 = premier jour de la semaine personnalisée)
 */
export function adjustDayOfWeek(dayOfWeek, weekStartDay = 0) {
  // Ajuster pour que weekStartDay devienne 0
  return (dayOfWeek - weekStartDay + 7) % 7
}

/**
 * Obtient les noms des jours de la semaine selon le jour de début
 * @param {number} weekStartDay - Jour de début de semaine (0 = Dimanche, 1 = Lundi, etc.)
 * @returns {string[]} Tableau des noms de jours réorganisés
 */
export function getDayNames(weekStartDay = 0) {
  const allDays = ['D', 'L', 'M', 'M', 'J', 'V', 'S']
  const result = []
  for (let i = 0; i < 7; i++) {
    result.push(allDays[(weekStartDay + i) % 7])
  }
  return result
}

// Créer une nouvelle date avec année, mois, jour
export function createDate(year, month, day) {
  const date = new Date(year, month, day)
  if (isNaN(date.getTime())) {
    console.error('[DateUtils] Date invalide créée:', year, month, day)
    return new Date()
  }
  return date
}

// Obtenir le premier jour du mois
export function startOfMonth(date) {
  try {
    return dateFnsStartOfMonth(date)
  } catch (e) {
    return new Date(date.getFullYear(), date.getMonth(), 1)
  }
}

// Obtenir le dernier jour du mois
export function endOfMonth(date) {
  try {
    return dateFnsEndOfMonth(date)
  } catch (e) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0)
  }
}

// Obtenir le premier jour de l'année
export function startOfYear(date) {
  try {
    return dateFnsStartOfYear(date)
  } catch (e) {
    return new Date(date.getFullYear(), 0, 1)
  }
}

// Ajouter des jours à une date
export function addDays(date, amount) {
  try {
    return dateFnsAddDays(date, amount)
  } catch (e) {
    const result = new Date(date)
    result.setDate(result.getDate() + amount)
    return result
  }
}

// Ajouter des mois à une date
export function addMonths(date, amount) {
  try {
    return dateFnsAddMonths(date, amount)
  } catch (e) {
    const result = new Date(date)
    result.setMonth(result.getMonth() + amount)
    return result
  }
}

// Ajouter des années à une date
export function addYears(date, amount) {
  try {
    return dateFnsAddYears(date, amount)
  } catch (e) {
    const result = new Date(date)
    result.setFullYear(result.getFullYear() + amount)
    return result
  }
}

// Définir l'année d'une date (retourne une nouvelle date)
export function setYear(date, year) {
  try {
    return dateFnsSetYear(date, year)
  } catch (e) {
    const result = new Date(date)
    result.setFullYear(year)
    return result
  }
}

// Définir le mois d'une date (retourne une nouvelle date)
export function setMonth(date, month) {
  try {
    return dateFnsSetMonth(date, month)
  } catch (e) {
    const result = new Date(date)
    result.setMonth(month)
    return result
  }
}

// Définir le jour d'une date (retourne une nouvelle date)
export function setDate(date, day) {
  try {
    return dateFnsSetDate(date, day)
  } catch (e) {
    const result = new Date(date)
    result.setDate(day)
    return result
  }
}

// Comparer si deux dates sont le même jour
export function isSameDay(dateLeft, dateRight) {
  try {
    return dateFnsIsSameDay(dateLeft, dateRight)
  } catch (e) {
    return dateLeft.getFullYear() === dateRight.getFullYear() &&
           dateLeft.getMonth() === dateRight.getMonth() &&
           dateLeft.getDate() === dateRight.getDate()
  }
}

// Vérifier si une date est avant une autre
export function isBefore(date, dateToCompare) {
  try {
    return dateFnsIsBefore(date, dateToCompare)
  } catch (e) {
    return date < dateToCompare
  }
}

// Vérifier si une date est après une autre
export function isAfter(date, dateToCompare) {
  try {
    return dateFnsIsAfter(date, dateToCompare)
  } catch (e) {
    return date > dateToCompare
  }
}

// Obtenir le nombre de jours dans un mois
export function getDaysInMonth(date) {
  try {
    return dateFnsGetDaysInMonth(date)
  } catch (e) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }
}

// Formater une date au format YYYY-MM-DD
export function formatDateKey(date) {
  try {
    return dateFnsFormat(date, 'yyyy-MM-dd')
  } catch (e) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
}

// Obtenir aujourd'hui (sans heures)
export function today() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

// Cloner une date
export function cloneDate(date) {
  return new Date(date.getTime())
}

