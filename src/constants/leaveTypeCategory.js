/**
 * Catégories du référentiel GlobalLeaveType (alignées sur l'API).
 * - absence : retire l'ETP matrice, quotas possibles (CP, RTT, maladie, grève…)
 * - event : présence conservée (télétravail, formation…)
 */
export const LEAVE_TYPE_CATEGORY = {
  ABSENCE: 'absence',
  EVENT: 'event',
}

export const DEFAULT_LEAVE_TYPE_CATEGORY = LEAVE_TYPE_CATEGORY.ABSENCE

/** Libellé français pour l'UI (admin, config). */
export function leaveTypeCategoryLabel(category) {
  if (category === LEAVE_TYPE_CATEGORY.EVENT) return 'Événement'
  if (category === LEAVE_TYPE_CATEGORY.ABSENCE) return 'Absence'
  return 'Absence'
}
