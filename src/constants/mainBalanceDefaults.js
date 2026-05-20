/** Aligné sur api/src/preferences/main-balance-defaults.ts */
export const DEFAULT_MAIN_BALANCE_TYPE_IDS = ['congé-payé', 'rtt', 'jours-hiver']

export function normalizeMainBalanceTypeIds(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return [...DEFAULT_MAIN_BALANCE_TYPE_IDS]
  return raw.filter((x) => typeof x === 'string' && x.length > 0)
}
