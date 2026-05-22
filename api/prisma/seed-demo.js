/**
 * Jeu de données fictif pour dev / préprod (utilisateurs, équipes, congés sur 2 ans).
 *
 * Sécurité : ne s'exécute que si ALLOW_DEMO_SEED=1 ou argument --force.
 * Les comptes ont un email en @demo.gestion-conges.test (réexécutable : efface puis recrée leurs données).
 *
 * Usage :
 *   cd api && set ALLOW_DEMO_SEED=1 && node prisma/seed-demo.js
 *   npm run prisma:seed-demo   (depuis la racine, après migrate + prisma:seed)
 *
 * Mot de passe commun (surchargeable) : DEMO_SEED_PASSWORD, défaut Demo2026!
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const DEMO_DOMAIN = '@demo.gestion-conges.test';
const DEMO_PASSWORD = process.env.DEMO_SEED_PASSWORD || 'Demo2026!';
const YEARS = [2025, 2026];

/** Profils métier pour des agendas crédibles (pas du hasard pur). */
const DEMO_USERS = [
  {
    email: `marie.dubois${DEMO_DOMAIN}`,
    name: 'Marie Dubois',
    role: 'lead',
    color: '#4a90e2',
  },
  {
    email: `lucas.martin${DEMO_DOMAIN}`,
    name: 'Lucas Martin',
    role: 'dev',
    color: '#50c878',
  },
  {
    email: `sophie.bernard${DEMO_DOMAIN}`,
    name: 'Sophie Bernard',
    role: 'dev',
    color: '#9b59b6',
  },
  {
    email: `thomas.leroy${DEMO_DOMAIN}`,
    name: 'Thomas Leroy',
    role: 'hybrid',
    color: '#f39c12',
  },
  {
    email: `emma.petit${DEMO_DOMAIN}`,
    name: 'Emma Petit',
    role: 'junior',
    color: '#e74c3c',
  },
];

const TEAMS = [
  {
    name: 'Équipe Produit',
    description: 'Planning congés — produit & design',
    ownerEmail: `marie.dubois${DEMO_DOMAIN}`,
    memberEmails: [
      `lucas.martin${DEMO_DOMAIN}`,
      `sophie.bernard${DEMO_DOMAIN}`,
      `thomas.leroy${DEMO_DOMAIN}`,
    ],
  },
  {
    name: 'Support & Ops',
    description: 'Astreintes et télétravail rotation',
    ownerEmail: `lucas.martin${DEMO_DOMAIN}`,
    memberEmails: [`emma.petit${DEMO_DOMAIN}`, `thomas.leroy${DEMO_DOMAIN}`],
  },
];

const QUOTAS_BY_YEAR = {
  'congé-payé': 25,
  rtt: 22,
  'jours-hiver': 2,
};

const TYPE_COLORS = {
  'congé-payé': '#4a90e2',
  rtt: '#50c878',
  'jours-hiver': '#95a5a6',
  maladie: '#e74c3c',
  télétravail: '#9b59b6',
  formation: '#f39c12',
};

function assertAllowed() {
  if (process.env.ALLOW_DEMO_SEED === '1' || process.argv.includes('--force')) return;
  console.error(
    'Refusé : définir ALLOW_DEMO_SEED=1 ou passer --force (évite un seed accidentel en prod).',
  );
  process.exit(1);
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function dateKey(y, m, d) {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

function parseDateKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/** Ajoute des jours ouvrés consécutifs (lun–ven). */
function addWorkdayBlock(startY, startM, startD, count, leaveTypeId, out) {
  let cur = new Date(startY, startM - 1, startD);
  let added = 0;
  while (added < count) {
    if (!isWeekend(cur)) {
      out.push({
        dateKey: dateKey(cur.getFullYear(), cur.getMonth() + 1, cur.getDate()),
        leaveTypeId,
      });
      added += 1;
    }
    cur.setDate(cur.getDate() + 1);
  }
}

/** Tous les mardi d'une année (télétravail régulier). */
function addEveryTuesday(year, leaveTypeId, out, skipMonths = []) {
  for (let m = 1; m <= 12; m += 1) {
    if (skipMonths.includes(m)) continue;
    for (let d = 1; d <= 31; d += 1) {
      const dt = new Date(year, m - 1, d);
      if (dt.getMonth() !== m - 1) break;
      if (dt.getDay() === 2 && !isWeekend(dt)) {
        out.push({
          dateKey: dateKey(year, m, d),
          leaveTypeId,
        });
      }
    }
  }
}

/** Congés par profil (scénarios lisibles dans le calendrier). */
function buildLeavesForUser(user, year) {
  const rows = [];
  const email = user.email;

  if (email.startsWith('marie.dubois')) {
    addWorkdayBlock(year, 8, 4, 14, 'congé-payé', rows);
    addWorkdayBlock(year, 12, 22, 5, 'congé-payé', rows);
    if (year === 2026) addWorkdayBlock(year, 4, 14, 3, 'formation', rows);
  }

  if (email.startsWith('lucas.martin')) {
    addWorkdayBlock(year, 7, 14, 5, 'rtt', rows);
    addWorkdayBlock(year, 12, 24, 4, 'congé-payé', rows);
    addWorkdayBlock(year, 3, 10, 2, 'formation', rows);
  }

  if (email.startsWith('sophie.bernard')) {
    addWorkdayBlock(year, 7, 21, 10, 'congé-payé', rows);
    addWorkdayBlock(year, 12, 20, 2, 'jours-hiver', rows);
    if (year % 2 === 0) addWorkdayBlock(year, 5, 2, 4, 'rtt', rows);
  }

  if (email.startsWith('thomas.leroy')) {
    addEveryTuesday(year, 'télétravail', rows, year === 2025 ? [8] : []);
    addWorkdayBlock(year, 6, 16, 3, 'rtt', rows);
    addWorkdayBlock(year, 11, 3, 2, 'formation', rows);
  }

  if (email.startsWith('emma.petit')) {
    addWorkdayBlock(year, 8, 18, 7, 'congé-payé', rows);
    if (year === 2025) addWorkdayBlock(year, 2, 10, 2, 'maladie', rows);
    rows.push({
      dateKey: `${year}-10-15-morning`,
      leaveTypeId: 'rtt',
    });
  }

  return rows;
}

async function wipeDemoUsersData(userIds) {
  if (userIds.length === 0) return;
  await prisma.dayNote.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.leave.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.leaveQuota.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.leaveTypeCustomization.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.userPreferences.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.teamMember.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.team.deleteMany({ where: { ownerId: { in: userIds } } });
}

async function upsertDemoUser(def, passwordHash) {
  return prisma.user.upsert({
    where: { email: def.email },
    create: {
      email: def.email,
      name: def.name,
      passwordHash,
    },
    update: {
      name: def.name,
      passwordHash,
    },
  });
}

async function ensureUserSetup(userId, profileColor) {
  for (const [globalTypeId, color] of Object.entries(TYPE_COLORS)) {
    await prisma.leaveTypeCustomization.upsert({
      where: { userId_globalTypeId: { userId, globalTypeId } },
      create: { userId, globalTypeId, color },
      update: { color },
    });
  }

  await prisma.userPreferences.upsert({
    where: { userId },
    create: {
      userId,
      mainBalanceTypeIds: ['congé-payé', 'rtt', 'jours-hiver'],
      schoolHolidayZone: 'B',
      showSchoolHolidays: true,
      grayPastLeaves: true,
    },
    update: {},
  });

  for (const year of YEARS) {
    for (const [leaveTypeId, quota] of Object.entries(QUOTAS_BY_YEAR)) {
      await prisma.leaveQuota.upsert({
        where: {
          userId_year_leaveTypeId: { userId, year, leaveTypeId },
        },
        create: { userId, year, leaveTypeId, quota },
        update: { quota },
      });
    }
  }
}

async function insertLeaves(userId, rows) {
  const unique = new Map();
  for (const r of rows) {
    unique.set(r.dateKey, r.leaveTypeId);
  }
  for (const [dk, leaveTypeId] of unique) {
    await prisma.leave.upsert({
      where: { userId_dateKey: { userId, dateKey: dk } },
      create: { userId, dateKey: dk, leaveTypeId },
      update: { leaveTypeId },
    });
  }
}

async function seedTeams(emailToUser) {
  for (const teamDef of TEAMS) {
    const owner = emailToUser.get(teamDef.ownerEmail);
    if (!owner) continue;

    const existing = await prisma.team.findFirst({
      where: { name: teamDef.name, ownerId: owner.id },
    });
    const team =
      existing ??
      (await prisma.team.create({
        data: {
          name: teamDef.name,
          description: teamDef.description,
          ownerId: owner.id,
          members: {
            create: {
              userId: owner.id,
              role: 'owner',
              invitedById: owner.id,
            },
          },
        },
      }));

    for (const memberEmail of teamDef.memberEmails) {
      const member = emailToUser.get(memberEmail);
      if (!member || member.id === owner.id) continue;
      await prisma.teamMember.upsert({
        where: { teamId_userId: { teamId: team.id, userId: member.id } },
        create: {
          teamId: team.id,
          userId: member.id,
          role: 'member',
          invitedById: owner.id,
        },
        update: {},
      });
    }
  }
}

async function seedDayNotes(user) {
  const samples = [
    { y: 2025, m: 8, d: 5, text: 'Revue roadmap avant congés' },
    { y: 2026, m: 1, d: 12, text: 'Atelier équipe produit' },
  ];
  for (const s of samples) {
    if (!user.email.startsWith('marie.dubois') && !user.email.startsWith('lucas.martin')) continue;
    const dk = dateKey(s.y, s.m, s.d);
    await prisma.dayNote.upsert({
      where: { userId_dateKey: { userId: user.id, dateKey: dk } },
      create: { userId: user.id, dateKey: dk, text: s.text },
      update: { text: s.text },
    });
  }
}

async function main() {
  assertAllowed();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const existingDemo = await prisma.user.findMany({
    where: { email: { endsWith: DEMO_DOMAIN } },
    select: { id: true },
  });
  await wipeDemoUsersData(existingDemo.map((u) => u.id));

  const emailToUser = new Map();
  for (const def of DEMO_USERS) {
    const user = await upsertDemoUser(def, passwordHash);
    emailToUser.set(def.email, user);
    await ensureUserSetup(user.id, def.color);
    const allLeaves = [];
    for (const year of YEARS) {
      allLeaves.push(...buildLeavesForUser(user, year));
    }
    await insertLeaves(user.id, allLeaves);
    await seedDayNotes(user);
    console.log(`  ✓ ${user.name} — ${allLeaves.length} entrées calendrier`);
  }

  await seedTeams(emailToUser);

  console.log('\nDemo seed terminé.');
  console.log(`Comptes : *${DEMO_DOMAIN}`);
  console.log(`Mot de passe : ${DEMO_PASSWORD}`);
  console.log(`Années : ${YEARS.join(', ')}`);
  console.log(`Équipes : ${TEAMS.map((t) => t.name).join(', ')}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
