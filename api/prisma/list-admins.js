/**
 * Liste les comptes AppAdmin (admin / super_admin) — diagnostic préprod.
 * Usage : npm run list-admins
 * Docker : docker compose exec api npm run list-admins
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const admins = await prisma.appAdmin.findMany({
      include: { user: { select: { email: true, name: true } } },
      orderBy: { role: 'asc' },
    });
    if (admins.length === 0) {
      console.log('Aucun AppAdmin en base.');
      return;
    }
    console.log('Comptes administrateurs :');
    for (const a of admins) {
      console.log(`  - ${a.user.email} (${a.user.name}) → rôle « ${a.role} »`);
    }

    const demoUsers = await prisma.user.findMany({
      where: { email: { endsWith: '@demo.gestion-conges.test' } },
      select: { email: true, name: true },
    });
    console.log(`\nComptes démo (*@demo.gestion-conges.test) : ${demoUsers.length}`);
    for (const u of demoUsers) {
      console.log(`  - ${u.email}`);
    }
    if (demoUsers.length === 0) {
      console.log('  (aucun — lancer ALLOW_DEMO_SEED=1 npm run prisma:seed-demo)');
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
