/**
 * Scripts de gestion des admins pour le seed / CLI.
 *
 * --- Premier déploiement : `runBootstrapAdmin` ---
 * Variables (toutes requises pour activer le bootstrap) :
 *   BOOTSTRAP_ADMIN_EMAIL
 *   BOOTSTRAP_ADMIN_PASSWORD
 * Optionnel :
 *   BOOTSTRAP_ADMIN_NAME  (défaut : « Administrateur »)
 *
 * Comportement bootstrap :
 * - Si un super_admin existe déjà → rien n’est fait (idempotent, safe en prod).
 * - Sinon : crée l’utilisateur s’il n’existe pas, puis upsert AppAdmin (super_admin).
 * - Utilisateur déjà présent → liaison admin uniquement (mot de passe inchangé).
 *
 * --- Compte déjà en base : `runPromoteSuperAdmin` ---
 * Variable :
 *   PROMOTE_SUPER_ADMIN_EMAIL  (exister dans User ; monte en super_admin même si d’autres admins existent)
 */

const bcrypt = require('bcrypt');

/**
 * Passe un utilisateur existant en super_admin (par email).
 * Ne crée pas de compte ; échoue si l’email est inconnu.
 *
 * @param {import('@prisma/client').PrismaClient} prisma
 */
async function runPromoteSuperAdmin(prisma) {
  const emailRaw = process.env.PROMOTE_SUPER_ADMIN_EMAIL;
  if (!emailRaw) {
    console.log(
      '[promote-super-admin] PROMOTE_SUPER_ADMIN_EMAIL absent — étape ignorée.',
    );
    return;
  }

  const email = String(emailRaw).toLowerCase().trim();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error(
      `[promote-super-admin] Aucun utilisateur avec l’email « ${email} ».`,
    );
  }

  await prisma.appAdmin.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      role: 'super_admin',
    },
    update: {
      role: 'super_admin',
    },
  });

  console.log(
    `[promote-super-admin] « ${email} » est maintenant super_admin — se reconnecter pour rafraîchir le JWT.`,
  );
}

/**
 * @param {import('@prisma/client').PrismaClient} prisma
 */
async function runBootstrapAdmin(prisma) {
  const emailRaw = process.env.BOOTSTRAP_ADMIN_EMAIL;
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const name =
    (process.env.BOOTSTRAP_ADMIN_NAME || 'Administrateur').trim() ||
    'Administrateur';

  if (!emailRaw || !password) {
    console.log(
      '[bootstrap-admin] BOOTSTRAP_ADMIN_EMAIL / BOOTSTRAP_ADMIN_PASSWORD absents — étape ignorée.',
    );
    return;
  }

  const email = String(emailRaw).toLowerCase().trim();

  const existingSuper = await prisma.appAdmin.findFirst({
    where: { role: 'super_admin' },
    include: { user: { select: { email: true } } },
  });
  if (existingSuper) {
    const who = existingSuper.user?.email ?? existingSuper.userId;
    console.log(
      `[bootstrap-admin] Un super_admin existe déjà (${who}) — bootstrap ignoré.`,
    );
    console.log(
      '[bootstrap-admin] Pour VOTRE compte : npm run promote-super-admin avec PROMOTE_SUPER_ADMIN_EMAIL.',
    );
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
      },
    });
    console.log(`[bootstrap-admin] Utilisateur créé : ${email}`);
  } else {
    console.log(
      `[bootstrap-admin] Utilisateur déjà présent : ${email} — liaison admin uniquement (mot de passe inchangé).`,
    );
  }

  await prisma.appAdmin.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      role: 'super_admin',
    },
    update: {
      role: 'super_admin',
    },
  });

  console.log('[bootstrap-admin] Rôle super_admin attribué — vous pouvez vous connecter.');
}

module.exports = { runBootstrapAdmin, runPromoteSuperAdmin };

/** Exécution directe : npm run bootstrap-admin */
async function main() {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  try {
    await runBootstrapAdmin(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
