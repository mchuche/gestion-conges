/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const { runBootstrapAdmin, runPromoteSuperAdmin } = require('./bootstrap-admin');

const prisma = new PrismaClient();

/** Catégories : absence (ETP −) | event (ETP inchangé). */
const CATEGORY_ABSENCE = 'absence';
const CATEGORY_EVENT = 'event';

const GLOBAL_TYPES = [
  { id: 'congé-payé', name: 'Congé Payé', label: 'CP', category: CATEGORY_ABSENCE, sortOrder: 0, eligibleForMainBalance: true },
  { id: 'rtt', name: 'RTT', label: 'RTT', category: CATEGORY_ABSENCE, sortOrder: 1, eligibleForMainBalance: true },
  { id: 'jours-hiver', name: 'Jours Hiver', label: 'JH', category: CATEGORY_ABSENCE, sortOrder: 2, eligibleForMainBalance: true },
  { id: 'maladie', name: 'Maladie', label: 'Mal', category: CATEGORY_ABSENCE, sortOrder: 3, eligibleForMainBalance: false },
  { id: 'télétravail', name: 'Télétravail', label: 'TT', category: CATEGORY_EVENT, sortOrder: 4, eligibleForMainBalance: false },
  { id: 'formation', name: 'Formation', label: 'Form', category: CATEGORY_EVENT, sortOrder: 5, eligibleForMainBalance: false },
  { id: 'grève', name: 'Grève', label: 'Grève', category: CATEGORY_ABSENCE, sortOrder: 6, eligibleForMainBalance: false },
];

/** Met à jour default_leave_types dans AppSetting si l'ancienne catégorie « leave » est encore présente. */
async function migrateDefaultLeaveTypesInSettings() {
  const row = await prisma.appSetting.findUnique({
    where: { key: 'default_leave_types' },
  });
  if (!row?.value || !Array.isArray(row.value)) return;

  let changed = false;
  const next = row.value.map((type) => {
    if (!type || typeof type !== 'object') return type;
    const copy = { ...type };
    if (copy.category === 'leave') {
      copy.category = CATEGORY_ABSENCE;
      changed = true;
    }
    if (['maladie', 'grève'].includes(copy.id) && copy.category === CATEGORY_EVENT) {
      copy.category = CATEGORY_ABSENCE;
      changed = true;
    }
    return copy;
  });

  if (changed) {
    await prisma.appSetting.update({
      where: { key: 'default_leave_types' },
      data: { value: next },
    });
    console.log('Seed: default_leave_types migré (leave → absence, maladie/grève → absence)');
  }
}

async function main() {
  for (const t of GLOBAL_TYPES) {
    await prisma.globalLeaveType.upsert({
      where: { id: t.id },
      create: t,
      update: {
        name: t.name,
        label: t.label,
        category: t.category,
        sortOrder: t.sortOrder,
        eligibleForMainBalance: t.eligibleForMainBalance,
      },
    });
  }
  console.log('Seed global_leave_types OK');

  await migrateDefaultLeaveTypesInSettings();

  await runPromoteSuperAdmin(prisma);
  await runBootstrapAdmin(prisma);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
