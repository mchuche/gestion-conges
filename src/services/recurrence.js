// Service pour gérer la génération d'événements récurrents
import { addDays, addWeeks, addMonths, addYears, getDay, startOfMonth, endOfMonth, isSameDay } from 'date-fns'
import { getDateKey } from './utils'
import { getPublicHolidays } from './holidays'
import logger from './logger'

/**
 * Génère les occurrences d'un événement récurrent
 * @param {Object} recurringEvent - L'événement récurrent
 * @param {Date} targetStartDate - Date de début pour la génération
 * @param {Date} targetEndDate - Date de fin pour la génération
 * @param {string} country - Code pays pour les jours fériés
 * @returns {Array} Liste des occurrences générées
 */
export function generateRecurringOccurrences(recurringEvent, targetStartDate, targetEndDate, country = 'FR') {
  const occurrences = []
  
  // Récupérer les jours fériés pour toutes les années nécessaires
  const startYear = targetStartDate.getFullYear()
  const endYear = targetEndDate.getFullYear()
  const holidays = {}
  for (let year = startYear; year <= endYear; year++) {
    const yearHolidays = getPublicHolidays(country, year)
    Object.assign(holidays, yearHolidays)
  }
  
  let currentDate = new Date(recurringEvent.start_date)
  currentDate.setHours(0, 0, 0, 0)
  
  const endLimit = recurringEvent.end_date 
    ? new Date(recurringEvent.end_date)
    : targetEndDate || new Date(targetStartDate.getFullYear() + 1, 11, 31)
  endLimit.setHours(23, 59, 59, 999)
  
  // Ne pas générer avant la date cible de début
  if (currentDate < targetStartDate) {
    currentDate = new Date(targetStartDate)
    currentDate.setHours(0, 0, 0, 0)
  }
  
  // Ne pas générer après la date cible de fin ou la date de fin de l'événement
  const finalEndDate = endLimit < targetEndDate ? endLimit : targetEndDate
  
  let occurrenceCount = 0
  const maxOccurrences = recurringEvent.max_occurrences || Infinity
  const maxIterations = 10000 // Sécurité pour éviter les boucles infinies
  let iterations = 0
  
  // Pour les récurrences hebdomadaires, on doit toujours avancer jour par jour
  // car on peut avoir plusieurs jours sélectionnés (ex: lundi et mercredi)
  const useDayByDay = recurringEvent.recurrence_type === 'weekly'
  
  logger.debug('[Recurrence] Début de génération:', {
    startDate: currentDate.toISOString().split('T')[0],
    endDate: finalEndDate.toISOString().split('T')[0],
    pattern: recurringEvent.recurrence_pattern,
    type: recurringEvent.recurrence_type
  })
  
  while (currentDate <= finalEndDate && occurrenceCount < maxOccurrences && iterations < maxIterations) {
    iterations++
    
    // Vérifier si la date correspond au pattern
    if (matchesRecurrencePattern(currentDate, recurringEvent)) {
      // Vérifier les exclusions
      if (!isExcluded(currentDate, recurringEvent.excluded_dates || [])) {
        // Exclure les jours fériés
        const dateKey = getDateKey(currentDate)
        const isHoliday = holidays[dateKey] !== undefined
        
        if (!isHoliday) {
          occurrences.push({
            date: new Date(currentDate),
            period: recurringEvent.period || 'full',
            leaveTypeId: recurringEvent.leave_type_id
          })
          occurrenceCount++
          if (occurrenceCount <= 3) {
            logger.debug(`[Recurrence] Occurrence ${occurrenceCount} ajoutée:`, currentDate.toISOString().split('T')[0])
          }
        } else {
          logger.debug(`[Recurrence] Date ${currentDate.toISOString().split('T')[0]} exclue (jour férié)`)
        }
      }
    }
    
    // Avancer à la prochaine date selon le type
    if (useDayByDay) {
      // Pour les récurrences hebdomadaires avec plusieurs jours, avancer jour par jour
      currentDate = addDays(currentDate, 1)
    } else {
      // Pour les autres types, utiliser la logique spécifique
      const nextDate = getNextDate(currentDate, recurringEvent.recurrence_type, recurringEvent.recurrence_pattern)
      // Si on n'avance pas (cas d'erreur), avancer d'un jour pour éviter la boucle infinie
      if (nextDate.getTime() <= currentDate.getTime()) {
        currentDate = addDays(currentDate, 1)
      } else {
        currentDate = nextDate
      }
    }
  }
  
  logger.debug(`[Recurrence] Généré ${occurrences.length} occurrences sur ${iterations} itérations`)
  
  return occurrences
}

/**
 * Vérifie si une date correspond au pattern de récurrence
 */
function matchesRecurrencePattern(date, recurringEvent) {
  const pattern = recurringEvent.recurrence_pattern
  
  // Vérifier que le pattern existe
  if (!pattern) {
    logger.warn('[Recurrence] Pas de pattern défini pour l\'événement:', recurringEvent)
    return false
  }
  
  const dayOfWeek = getDay(date)
  
  switch (recurringEvent.recurrence_type) {
    case 'daily':
      if (pattern.weekdaysOnly) {
        // Seulement les jours ouvrables (lundi-vendredi)
        return dayOfWeek >= 1 && dayOfWeek <= 5
      }
      return true
      
    case 'weekly':
      // Vérifier que daysOfWeek existe et contient des valeurs
      if (!pattern.daysOfWeek || !Array.isArray(pattern.daysOfWeek) || pattern.daysOfWeek.length === 0) {
        logger.warn('[Recurrence] Pattern hebdomadaire invalide:', pattern)
        return false
      }
      // Convertir en nombres si nécessaire (au cas où ce sont des strings)
      const daysOfWeekNums = pattern.daysOfWeek.map(d => typeof d === 'string' ? parseInt(d, 10) : d)
      const matches = daysOfWeekNums.includes(dayOfWeek)
      if (!matches) {
        logger.debug(`[Recurrence] Date ${date.toISOString().split('T')[0]} (jour ${dayOfWeek}) ne correspond pas aux jours ${daysOfWeekNums.join(',')}`)
      }
      return matches
      
    case 'monthly':
      if (pattern.dayOfMonth !== undefined) {
        return date.getDate() === pattern.dayOfMonth
      } else if (pattern.dayOfWeek !== undefined) {
        // Premier/dernier jour de la semaine du mois
        return matchesWeekOfMonth(date, pattern)
      }
      logger.warn('[Recurrence] Pattern mensuel invalide:', pattern)
      return false
      
    case 'yearly':
      if (pattern.month !== undefined && pattern.day !== undefined) {
        return date.getMonth() === pattern.month && date.getDate() === pattern.day
      }
      logger.warn('[Recurrence] Pattern annuel invalide:', pattern)
      return false
      
    default:
      logger.warn('[Recurrence] Type de récurrence inconnu:', recurringEvent.recurrence_type)
      return false
  }
}

/**
 * Vérifie si une date correspond à un jour de semaine spécifique dans le mois
 */
function matchesWeekOfMonth(date, pattern) {
  const dayOfWeek = pattern.dayOfWeek
  const weekOfMonth = pattern.weekOfMonth // 1=premier, 2=deuxième, -1=dernier
  
  if (getDay(date) !== dayOfWeek) {
    return false
  }
  
  const monthStart = startOfMonth(date)
  const monthEnd = endOfMonth(date)
  const firstOccurrence = getFirstDayOfWeekInMonth(monthStart, dayOfWeek)
  const lastOccurrence = getLastDayOfWeekInMonth(monthEnd, dayOfWeek)
  
  if (weekOfMonth === 1) {
    return isSameDay(date, firstOccurrence)
  } else if (weekOfMonth === -1) {
    return isSameDay(date, lastOccurrence)
  } else {
    // Nième occurrence
    const nthOccurrence = addWeeks(firstOccurrence, weekOfMonth - 1)
    return isSameDay(date, nthOccurrence) && nthOccurrence <= monthEnd
  }
}

/**
 * Trouve le premier jour de la semaine dans un mois
 */
function getFirstDayOfWeekInMonth(monthStart, dayOfWeek) {
  const firstDayOfWeek = getDay(monthStart)
  let daysToAdd = dayOfWeek - firstDayOfWeek
  if (daysToAdd < 0) {
    daysToAdd += 7
  }
  return addDays(monthStart, daysToAdd)
}

/**
 * Trouve le dernier jour de la semaine dans un mois
 */
function getLastDayOfWeekInMonth(monthEnd, dayOfWeek) {
  const lastDayOfWeek = getDay(monthEnd)
  let daysToSubtract = lastDayOfWeek - dayOfWeek
  if (daysToSubtract < 0) {
    daysToSubtract += 7
  }
  return addDays(monthEnd, -daysToSubtract)
}

/**
 * Avance à la prochaine date selon le type de récurrence
 */
function getNextDate(currentDate, type, pattern) {
  const interval = pattern.interval || 1
  
  switch (type) {
    case 'daily':
      return addDays(currentDate, interval)
    case 'weekly':
      return addWeeks(currentDate, interval)
    case 'monthly':
      return addMonths(currentDate, interval)
    case 'yearly':
      return addYears(currentDate, interval)
    default:
      return addDays(currentDate, 1)
  }
}

/**
 * Vérifie si une date est exclue
 */
function isExcluded(date, excludedDates) {
  if (!excludedDates || excludedDates.length === 0) {
    return false
  }
  
  return excludedDates.some(excludedDate => {
    const excluded = excludedDate instanceof Date ? excludedDate : new Date(excludedDate)
    return isSameDay(date, excluded)
  })
}

/**
 * Formate un pattern de récurrence en texte lisible
 */
export function formatRecurrencePattern(recurringEvent) {
  const pattern = recurringEvent.recurrence_pattern
  const daysOfWeekNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  
  switch (recurringEvent.recurrence_type) {
    case 'daily':
      if (pattern.weekdaysOnly) {
        return 'Tous les jours ouvrables'
      }
      return `Tous les ${pattern.interval || 1} jour(s)`
      
    case 'weekly':
      if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
        const days = pattern.daysOfWeek.map(d => daysOfWeekNames[d]).join(', ')
        const interval = pattern.interval || 1
        if (interval === 1) {
          return `Chaque ${days}`
        }
        return `Tous les ${interval} semaines : ${days}`
      }
      return 'Hebdomadaire'
      
    case 'monthly':
      if (pattern.dayOfMonth) {
        return `Le ${pattern.dayOfMonth} de chaque mois`
      } else if (pattern.dayOfWeek !== undefined) {
        const dayName = daysOfWeekNames[pattern.dayOfWeek]
        const weekDesc = pattern.weekOfMonth === 1 ? 'premier' 
          : pattern.weekOfMonth === -1 ? 'dernier'
          : `${pattern.weekOfMonth}ème`
        return `Le ${weekDesc} ${dayName} de chaque mois`
      }
      return 'Mensuel'
      
    case 'yearly':
      if (pattern.month !== undefined && pattern.day !== undefined) {
        const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                           'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
        return `Le ${pattern.day} ${monthNames[pattern.month]} chaque année`
      }
      return 'Annuel'
      
    default:
      return 'Récurrent'
  }
}

