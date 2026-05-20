/** Types proposés par défaut dans le bandeau « Jours restants » pour un nouveau compte. */
export const DEFAULT_MAIN_BALANCE_TYPE_IDS = [
  'congé-payé',
  'rtt',
  'jours-hiver',
] as const;

export function normalizeMainBalanceTypeIds(
  raw: unknown,
): string[] {
  if (!Array.isArray(raw)) return [...DEFAULT_MAIN_BALANCE_TYPE_IDS];
  const ids = raw.filter((x): x is string => typeof x === 'string' && x.length > 0);
  return ids.length > 0 ? ids : [...DEFAULT_MAIN_BALANCE_TYPE_IDS];
}
