/**
 * Catégories du référentiel GlobalLeaveType.
 * - absence : la personne n'est pas comptée présente (ETP, quotas possibles)
 * - event : présence conservée (télétravail, formation, etc.)
 */
export const LEAVE_TYPE_CATEGORY = {
  ABSENCE: 'absence',
  EVENT: 'event',
} as const;

export type LeaveTypeCategory =
  (typeof LEAVE_TYPE_CATEGORY)[keyof typeof LEAVE_TYPE_CATEGORY];

export const DEFAULT_LEAVE_TYPE_CATEGORY = LEAVE_TYPE_CATEGORY.ABSENCE;

export const LEAVE_TYPE_CATEGORY_VALUES: LeaveTypeCategory[] = [
  LEAVE_TYPE_CATEGORY.ABSENCE,
  LEAVE_TYPE_CATEGORY.EVENT,
];
