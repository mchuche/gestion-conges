<template>
  <div
    :class="cellClasses"
    :data-date-key="dateKey"
    @click="handleClick"
    @mousedown="handleMouseDown"
    :title="cellTitle"
    :style="cellStyle"
  >
    <!-- Demi-journées : division diagonale (barre oblique) -->
    <div
      v-if="hasSplit"
      class="presence-cell-half presence-cell-morning"
      :class="{ 'is-event': morningIsKnownEvent }"
      :style="{ 
        backgroundColor: morningIsKnownEvent ? '#4caf50' : (leaveInfo.morning ? null : '#4caf50')
      }"
    >
      <span 
        v-if="leaveInfo && leaveInfo.morning && morningIsKnownEvent" 
        class="presence-cell-letter presence-cell-letter-morning"
      >
        {{ getFirstLetter(leaveInfo.morning) }}
      </span>
    </div>
    <div
      v-if="hasSplit"
      class="presence-cell-half presence-cell-afternoon"
      :class="{ 'is-event': afternoonIsKnownEvent }"
      :style="{ 
        backgroundColor: afternoonIsKnownEvent ? '#4caf50' : (leaveInfo.afternoon ? null : '#4caf50')
      }"
    >
      <span 
        v-if="leaveInfo && leaveInfo.afternoon && afternoonIsKnownEvent" 
        class="presence-cell-letter presence-cell-letter-afternoon"
      >
        {{ getFirstLetter(leaveInfo.afternoon) }}
      </span>
    </div>
    <!-- Lettre pour les événements journée complète -->
    <span 
      v-if="hasLeave && !hasSplit && leaveInfo && leaveInfo.full && checkIsEvent(leaveInfo.full)" 
      class="presence-cell-letter"
    >
      {{ getFirstLetter(leaveInfo.full) }}
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useLeavesStore } from '../../stores/leaves'
import { useLeaveTypesStore } from '../../stores/leaveTypes'
import { useUIStore } from '../../stores/ui'
import { useTeamsStore } from '../../stores/teams'
import { useLeaves } from '../../composables/useLeaves'
import { useAuthStore } from '../../stores/auth'
import { today, isSameDay, isBefore, getDay, getYear } from '../../services/dateUtils'
import { getDateKey } from '../../services/utils'
import { getPublicHolidays } from '../../services/holidays'
import logger from '../../services/logger'

const props = defineProps({
  date: {
    type: Date,
    required: true
  },
  user: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['click', 'mousedown'])

const leavesStore = useLeavesStore()
const leaveTypesStore = useLeaveTypesStore()
const uiStore = useUIStore()
const teamsStore = useTeamsStore()
const authStore = useAuthStore()
const { getLeaveForDate, getLeaveTypeConfig } = useLeaves()

const dateKey = computed(() => getDateKey(props.date))

// Pour l'utilisateur actuel, utiliser les leaves du store
// Pour d'autres utilisateurs, utiliser user.leaves (pour gestion d'équipe future)
const userLeaves = computed(() => {
  if (props.user && props.user.id !== authStore.user?.id) {
    return props.user.leaves || {}
  }
  return leavesStore.leaves
})

const leaveInfo = computed(() => {
  if (props.user && props.user.id !== authStore.user?.id) {
    const keys = {
      full: dateKey.value,
      morning: `${dateKey.value}-morning`,
      afternoon: `${dateKey.value}-afternoon`
    }
    return {
      full: userLeaves.value?.[keys.full] || null,
      morning: userLeaves.value?.[keys.morning] || null,
      afternoon: userLeaves.value?.[keys.afternoon] || null
    }
  }
  try {
    return getLeaveForDate(props.date) || { full: null, morning: null, afternoon: null }
  } catch (e) {
    return { full: null, morning: null, afternoon: null }
  }
})

const hasLeave = computed(() => {
  return leaveInfo.value.full || leaveInfo.value.morning || leaveInfo.value.afternoon
})

const hasSplit = computed(() => {
  // Afficher la division en deux barres dès qu'il y a une demi-journée (matin OU après-midi)
  return (leaveInfo.value.morning && !leaveInfo.value.full) || 
         (leaveInfo.value.afternoon && !leaveInfo.value.full)
})

const morningColor = computed(() => {
  if (leaveInfo.value.morning) {
    const config = getLeaveTypeConfig(leaveInfo.value.morning)
    return config?.color || '#cccccc'
  }
  return null
})

const afternoonColor = computed(() => {
  if (leaveInfo.value.afternoon) {
    const config = getLeaveTypeConfig(leaveInfo.value.afternoon)
    return config?.color || '#cccccc'
  }
  return null
})

const fullColor = computed(() => {
  if (leaveInfo.value.full) {
    const config = getLeaveTypeConfig(leaveInfo.value.full)
    return config?.color || '#cccccc'
  }
  return null
})

const isEvent = computed(() => {
  if (!hasLeave.value || !leaveInfo.value) return false
  const leaveType = leaveInfo.value.full || leaveInfo.value.morning || leaveInfo.value.afternoon
  if (!leaveType) return false
  return checkIsEvent(leaveType)
})

const isMorningEvent = computed(() => {
  if (!leaveInfo.value || !leaveInfo.value.morning) return false
  const config = getLeaveTypeConfig(leaveInfo.value.morning)
  // Si la config n'est pas trouvée, utiliser le fallback pour les types connus
  if (!config) {
    return isKnownEventType(leaveInfo.value.morning)
  }
  return config.category === 'event'
})

const isAfternoonEvent = computed(() => {
  if (!leaveInfo.value || !leaveInfo.value.afternoon) return false
  const config = getLeaveTypeConfig(leaveInfo.value.afternoon)
  // Si la config n'est pas trouvée, utiliser le fallback pour les types connus
  if (!config) {
    return isKnownEventType(leaveInfo.value.afternoon)
  }
  return config.category === 'event'
})

const isFullEvent = computed(() => {
  if (!leaveInfo.value || !leaveInfo.value.full) return false
  return checkIsEvent(leaveInfo.value.full)
})

const isToday = computed(() => isSameDay(props.date, today()))
const isPast = computed(() => isBefore(props.date, today()))
const isWeekend = computed(() => {
  const dayOfWeek = getDay(props.date)
  return dayOfWeek === 0 || dayOfWeek === 6
})

const isHoliday = computed(() => {
  const year = getYear(props.date)
  const holidays = getPublicHolidays(uiStore.selectedCountry, year)
  return holidays[dateKey.value] !== undefined
})

const isInMultiSelect = computed(() => {
  if (!uiStore.selectedDates || uiStore.selectedDates.length === 0) {
    return false
  }
  const currentKey = dateKey.value
  const isSelected = uiStore.selectedDates.some(d => {
    try {
      return getDateKey(d) === currentKey
    } catch (e) {
      return false
    }
  })
  return isSelected
})

// Computed properties pour obtenir les couleurs selon l'intensité (vue présence)
const weekendOpacity = computed(() => {
  const intensity = uiStore.holidayWeekendIntensity || 'normal'
  const opacities = {
    light: 0.4,
    normal: 0.6,
    strong: 0.8
  }
  return opacities[intensity] || opacities.normal
})

// Utiliser la même opacité que les weekends pour les jours fériés (plus discret)
const holidayOpacity = computed(() => {
  return weekendOpacity.value
})

const cellClasses = computed(() => {
  const classes = ['year-presence-day-cell']
  
  if (isToday.value) classes.push('today')
  if (isPast.value) classes.push('past-day')
  if (isWeekend.value) classes.push('weekend')
  if (isHoliday.value) classes.push('public-holiday')
  if (hasLeave.value) classes.push('has-leave')
  if (hasSplit.value) classes.push('has-split')
  if (!hasLeave.value && !isWeekend.value && !isHoliday.value) classes.push('present')
  if (isInMultiSelect.value) classes.push('multi-selected')
  if (isEvent.value) classes.push('is-event')
  
  return classes
})

const cellTitle = computed(() => {
  const userName = props.user?.name || authStore.user?.name || 'Moi'
  
  if (hasSplit.value) {
    const morningConfig = getLeaveTypeConfig(leaveInfo.value.morning)
    const afternoonConfig = getLeaveTypeConfig(leaveInfo.value.afternoon)
    return `${userName} - Matin: ${morningConfig?.name || ''}, Après-midi: ${afternoonConfig?.name || ''}`
  } else if (hasLeave.value) {
    const leaveType = leaveInfo.value.full || leaveInfo.value.morning || leaveInfo.value.afternoon
    const config = getLeaveTypeConfig(leaveType)
    return `${userName} - ${config?.name || ''}`
  } else {
    return `${userName} - Présent`
  }
})

// Fonction pour convertir une couleur hex en rgba avec opacité
function colorWithOpacity(color, opacity = 0.3) {
  if (!color) return color
  if (color.startsWith('#')) {
    const hex = color.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  } else if (color.startsWith('rgba')) {
    return color.replace(/[\d.]+\)$/g, `${opacity})`)
  } else if (color.startsWith('rgb')) {
    return color.replace('rgb(', 'rgba(').replace(')', `, ${opacity})`)
  }
  return color
}

// Liste des types d'événements connus (fallback si le type n'est pas trouvé dans la config)
// Ces types sont définis comme événements dans global_leave_types avec category='event'
const KNOWN_EVENT_TYPES = ['permanence', 'télétravail', 'maladie', 'formation', 'grève']

// Fonction helper pour vérifier si un type est un événement connu
function isKnownEventType(leaveTypeId) {
  if (!leaveTypeId || typeof leaveTypeId !== 'string') {
    return false
  }
  return KNOWN_EVENT_TYPES.includes(leaveTypeId)
}

// Fonction pour vérifier si un type est un événement (avec fallback)
function checkIsEvent(leaveTypeId) {
  if (!leaveTypeId) return false
  
  // D'abord, essayer de trouver la config
  const config = getLeaveTypeConfig(leaveTypeId)
  if (config) {
    const isEvent = config.category === 'event'
    logger.debug(`[PresenceDayCell] checkIsEvent: type=${leaveTypeId}, config trouvée, category=${config.category}, isEvent=${isEvent}`)
    return isEvent
  }
  
  // Si la config n'est pas trouvée, utiliser le fallback
  const isKnown = isKnownEventType(leaveTypeId)
  logger.debug(`[PresenceDayCell] checkIsEvent: type=${leaveTypeId}, config non trouvée, isKnownEvent=${isKnown}, KNOWN_EVENT_TYPES=${KNOWN_EVENT_TYPES.join(', ')}`)
  return isKnown
}

// Computed properties pour vérifier si les demi-journées sont des événements
const morningIsKnownEvent = computed(() => {
  if (!leaveInfo.value || !leaveInfo.value.morning) return false
  return checkIsEvent(leaveInfo.value.morning)
})

const afternoonIsKnownEvent = computed(() => {
  if (!leaveInfo.value || !leaveInfo.value.afternoon) return false
  return checkIsEvent(leaveInfo.value.afternoon)
})

// Computed property pour vérifier si on doit afficher la lettre (pour les événements uniquement)
const shouldShowLetter = computed(() => {
  if (!hasLeave.value || !leaveInfo.value) {
    return false
  }
  
  // Pour les cellules avec split, vérifier chaque demi-journée
  if (hasSplit.value) {
    const morningType = leaveInfo.value.morning
    const afternoonType = leaveInfo.value.afternoon
    const morningIsEvent = morningType ? checkIsEvent(morningType) : false
    const afternoonIsEvent = afternoonType ? checkIsEvent(afternoonType) : false
    return morningIsEvent || afternoonIsEvent
  }
  
  // Pour les cellules complètes, vérifier directement avec checkIsEvent
  const leaveType = leaveInfo.value.full || leaveInfo.value.morning || leaveInfo.value.afternoon
  if (!leaveType) return false
  
  const result = checkIsEvent(leaveType)
  logger.debug(`[PresenceDayCell] shouldShowLetter: type=${leaveType}, result=${result}, user=${props.user?.name || 'moi'}, dateKey=${dateKey.value}`)
  return result
})

// Afficher la lettre pour tous les événements (utilisateur actuel et membres de l'équipe)
const showLetter = computed(() => {
  return shouldShowLetter.value
})

// Fonction pour obtenir la première lettre du type de congé/événement
function getFirstLetter(leaveTypeId) {
  if (!leaveTypeId) return ''
  // Retourner la première lettre en majuscule
  return leaveTypeId.charAt(0).toUpperCase()
}

// Vérifier si c'est un événement (avec fallback pour les types connus)
function isEventType(leaveTypeId) {
  if (!leaveTypeId) return false
  const config = getLeaveTypeConfig(leaveTypeId)
  if (config) {
    return config.category === 'event'
  }
  // Fallback : vérifier si c'est un type d'événement connu
  return isKnownEventType(leaveTypeId)
}

const cellStyle = computed(() => {
  const style = {}
  
  if (hasSplit.value) {
    style.position = 'relative'
    style.overflow = 'hidden'
    style.background = 'transparent'
  } else {
    if (!leaveInfo.value) {
      // Si leaveInfo n'est pas encore chargé, retourner un style vide
      return style
    }
    
    const leaveType = leaveInfo.value.full || leaveInfo.value.morning || leaveInfo.value.afternoon
    const isEvent = checkIsEvent(leaveType)
    
    if (isEvent && leaveInfo.value.full) {
      // Pour les événements complets : couleur verte comme les jours de présence
      style.backgroundColor = '#4caf50'
      style.borderColor = '#4caf50'
      style.color = 'white'
    } else if (isEvent && leaveInfo.value.morning && !leaveInfo.value.afternoon) {
      // Pour les événements matin : couleur verte comme les jours de présence
      style.backgroundColor = '#4caf50'
      style.borderColor = '#4caf50'
      style.color = 'white'
      style.borderTopWidth = '3px'
      style.borderTopColor = 'white'
    } else if (isEvent && leaveInfo.value.afternoon && !leaveInfo.value.morning) {
      // Pour les événements après-midi : couleur verte comme les jours de présence
      style.backgroundColor = '#4caf50'
      style.borderColor = '#4caf50'
      style.color = 'white'
      style.borderBottomWidth = '3px'
      style.borderBottomColor = 'white'
    } else if (!hasLeave.value && !isWeekend.value && !isHoliday.value) {
      // Pour les jours de présence normale : couleur verte
      style.backgroundColor = '#4caf50'
      style.borderColor = '#4caf50'
    }
    // Pour les congés : pas de couleur de fond, juste la bordure (has-leave)
  }
  
  return style
})

// Vérifier si l'utilisateur peut modifier cette cellule
const canEditCell = computed(() => {
  // Si c'est la cellule de l'utilisateur actuel, on peut toujours modifier
  if (!props.user || props.user.id === authStore.user?.id) {
    return true
  }
  
  // Si l'utilisateur actuel est propriétaire de l'équipe
  const isOwner = teamsStore.isCurrentTeamOwner
  if (!isOwner) {
    return false
  }
  
  // Le propriétaire peut uniquement modifier les ÉVÉNEMENTS, pas les congés
  // Si la cellule contient déjà un congé (non-événement), bloquer la modification
  if (hasLeave.value && !isEvent.value) {
    logger.debug(`[PresenceDayCell] Modification bloquée: la cellule contient un congé (non-événement) pour user=${props.user?.name}`)
    return false
  }
  
  logger.debug(`[PresenceDayCell] canEditCell: user=${props.user?.name}, isOwner=${isOwner}, hasLeave=${hasLeave.value}, isEvent=${isEvent.value}`)
  return true
})

function handleClick(event) {
  // Vérifier si l'utilisateur peut modifier cette cellule
  logger.debug(`[PresenceDayCell] handleClick: canEditCell=${canEditCell.value}, user=${props.user?.name}, date=${dateKey.value}`)
  if (!canEditCell.value) {
    logger.warn(`[PresenceDayCell] Modification non autorisée pour user=${props.user?.name}`)
    return
  }
  // Émettre l'événement avec l'userId cible (pour les modifications de membres d'équipe)
  const targetUserId = props.user?.id || authStore.user?.id
  logger.log(`[PresenceDayCell] Émission clic pour targetUserId=${targetUserId}`)
  emit('click', props.date, event, targetUserId)
}

function handleMouseDown(event) {
  // Vérifier si l'utilisateur peut modifier cette cellule
  if (!canEditCell.value) {
    return
  }
  const targetUserId = props.user?.id || authStore.user?.id
  emit('mousedown', props.date, event, targetUserId)
}
</script>

<style scoped>
.year-presence-day-cell {
  aspect-ratio: 1;
  min-width: 20px;
  min-height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-color);
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--bg-color);
  position: relative;
}

.year-presence-day-cell:hover {
  transform: scale(1.2);
  z-index: 5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.year-presence-day-cell.today {
  border: 2px solid var(--primary-color);
  background: rgba(74, 144, 226, 0.08);
}

.year-presence-day-cell.past-day {
  opacity: 0.7;
}

/* Weekends - Vue présence */
.year-presence-day-cell.weekend {
  background: var(--bg-color);
  opacity: v-bind('weekendOpacity');
}

/* Jours fériés - Vue présence (plus discrets, comme les weekends) */
.year-presence-day-cell.public-holiday {
  background: var(--bg-color);
  opacity: v-bind('holidayOpacity');
}

.year-presence-day-cell.present {
  background: #4caf50;
  border-color: #4caf50;
}

.year-presence-day-cell.has-leave {
  border-width: 2px;
}

.year-presence-day-cell.has-split {
  background: transparent !important;
  display: block;
  padding: 0 !important;
  overflow: hidden;
}

.presence-cell-half {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  /* Empêcher les sous-div de capturer le click (le parent gère l'interaction) */
  pointer-events: none;
}

.presence-cell-morning {
  /* Triangle haut-gauche */
  -webkit-clip-path: polygon(0 0, 100% 0, 0 100%);
  clip-path: polygon(0 0, 100% 0, 0 100%);
}

.presence-cell-afternoon {
  /* Triangle bas-droite */
  -webkit-clip-path: polygon(100% 0, 100% 100%, 0 100%);
  clip-path: polygon(100% 0, 100% 100%, 0 100%);
}

/* Barre oblique de séparation entre matin/après-midi */
.year-presence-day-cell.has-split::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;
  background: linear-gradient(
    135deg,
    transparent 49.25%,
    rgba(0, 0, 0, 0.16) 50%,
    transparent 50.75%
  );
}

.year-presence-day-cell.multi-selected {
  border: 3px solid var(--primary-color, #4a90e2) !important;
  box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.3) !important;
  z-index: 10 !important;
  position: relative;
  background: rgba(74, 144, 226, 0.2) !important;
}

/* Assurer que la sélection multiple reste visible même avec des couleurs de congé */
.year-presence-day-cell.multi-selected .presence-cell-half {
  opacity: 0.6 !important;
  mix-blend-mode: multiply;
}

/* Assurer que la sélection est visible même sur les cellules avec présence */
.year-presence-day-cell.multi-selected.present {
  background: rgba(74, 144, 226, 0.3) !important;
  border-color: var(--primary-color, #4a90e2) !important;
}

/* Liseré pour différencier les événements des congés - plus discret */
.year-presence-day-cell.is-event {
  border: 1px solid rgba(0, 0, 0, 0.2);
  box-shadow: inset 0 0 0 0.5px rgba(255, 255, 255, 0.3);
}

/* L'opacité des couleurs d'événements dans les demi-journées est gérée par le style inline */

/* Lettre affichée dans les cellules pour les événements */
.presence-cell-letter {
  font-size: 10px;
  font-weight: 700;
  color: white !important;
  z-index: 20 !important;
  pointer-events: none;
  line-height: 1;
}

.presence-cell-letter-morning {
  font-size: 8px;
  position: absolute;
  top: 2px;
  left: 2px;
}

.presence-cell-letter-afternoon {
  font-size: 8px;
  position: absolute;
  right: 2px;
  bottom: 2px;
}
</style>
