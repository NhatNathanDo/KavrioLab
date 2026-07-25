import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding initial development profiles...');

  const passwordHash = await bcrypt.hash('AdminPassword123!', 10);

  // Create default developer user
  const developer = await prisma.user.upsert({
    where: { email: 'developer@kavriolab.com' },
    update: {
      passwordHash,
    },
    create: {
      email: 'developer@kavriolab.com',
      name: 'Developer Account',
      role: 'ADMIN',
      passwordHash,
      profile: {
        create: {
          gender: 'MALE',
          birthDate: new Date('1995-01-01'),
          heightCm: 178.00,
          targetWeightKg: 75.00,
          activityTier: 'MODERATELY_ACTIVE',
          unitSystem: 'METRIC',
        },
      },
    },
  });

  console.log(`Developer account created with ID: ${developer.id}`);
  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Error during database seed execution:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
