/**
 * Couleur de fond des badges congé (alignée sur CalendarDay.getLeaveColor).
 * Utilisé par la vue Notes uniquement — ne pas changer CalendarDay sans tests.
 */

import { LEAVE_TYPE_CATEGORY } from '../constants/leaveTypeCategory'

export function colorWithOpacity(color, opacity = 0.3) {
  if (!color) return color
  if (color.startsWith('#')) {
    let hex = color.replace('#', '')
    if (hex.length === 3) {
      hex = hex.split('').map((c) => c + c).join('')
    }
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }
  if (color.startsWith('rgba')) {
    return color.replace(/[\d.]+\)$/g, `${opacity})`)
  }
  if (color.startsWith('rgb')) {
    return color.replace('rgb(', 'rgba(').replace(')', `, ${opacity})`)
  }
  return color
}

/**
 * @param {string} leaveTypeId
 * @param {{ getLeaveType: (id: string) => object|null, eventOpacity?: number }} ctx
 * @returns {string|null} backgroundColor CSS ou null
 */
export function getLeaveBadgeBackground(leaveTypeId, { getLeaveType, eventOpacity = 0.15 }) {
  const config = getLeaveType(leaveTypeId)
  if (!config) return null

  const color = config.color || '#cccccc'
  if (config.category === LEAVE_TYPE_CATEGORY.EVENT) {
    return colorWithOpacity(color, eventOpacity)
  }
  return color
}
