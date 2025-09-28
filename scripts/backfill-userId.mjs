// scripts/backfill-userId.mjs
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 1) pastikan ada user "legacy" (dummy)
  const username = 'legacy';
  const passwordHash = await bcrypt.hash('Legacy#123', 10);

  let user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: 'Legacy Owner',
        username,
        email: 'legacy@example.com',
        phone: null,
        birthPlace: 'N/A',
        dateOfBirth: null,
        gender: 'N/A',
        institution: 'Legacy',
        hashedPassword: passwordHash,
      },
    });
    console.log('Created legacy user:', user.id);
  } else {
    console.log('Legacy user exists:', user.id);
  }

  // 2) isi userId untuk baris yang masih null
  const res = await prisma.patientRecord.updateMany({
    where: { userId: null },
    data: { userId: user.id },
  });
  console.log('Backfilled rows:', res.count);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
