/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const { runBootstrapAdmin, runPromoteSuperAdmin } = require('./bootstrap-admin');

const prisma = new PrismaClient();

const GLOBAL_TYPES = [
  { id: 'congé-payé', name: 'Congé Payé', label: 'CP', category: 'leave', sortOrder: 0 },
  { id: 'rtt', name: 'RTT', label: 'RTT', category: 'leave', sortOrder: 1 },
  { id: 'jours-hiver', name: 'Jours Hiver', label: 'JH', category: 'leave', sortOrder: 2 },
  { id: 'maladie', name: 'Maladie', label: 'Mal', category: 'event', sortOrder: 3 },
  { id: 'télétravail', name: 'Télétravail', label: 'TT', category: 'event', sortOrder: 4 },
  { id: 'formation', name: 'Formation', label: 'Form', category: 'event', sortOrder: 5 },
  { id: 'grève', name: 'Grève', label: 'Grève', category: 'event', sortOrder: 6 },
];

async function main() {
  for (const t of GLOBAL_TYPES) {
    await prisma.globalLeaveType.upsert({
      where: { id: t.id },
      create: t,
      update: { name: t.name, label: t.label, category: t.category, sortOrder: t.sortOrder },
    });
  }
  console.log('Seed global_leave_types OK');

  // Compte déjà en base → super_admin si PROMOTE_SUPER_ADMIN_EMAIL est défini
  await runPromoteSuperAdmin(prisma);

  // Premier super-admin si BOOTSTRAP_ADMIN_* est défini (voir prisma/bootstrap-admin.js)
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
