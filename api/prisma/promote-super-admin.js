/**
 * CLI : promouvoir un utilisateur existant en super_admin via PROMOTE_SUPER_ADMIN_EMAIL.
 * Usage : npm run promote-super-admin
 */

const { PrismaClient } = require('@prisma/client');
const { runPromoteSuperAdmin } = require('./bootstrap-admin');

async function main() {
  const prisma = new PrismaClient();
  try {
    await runPromoteSuperAdmin(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
