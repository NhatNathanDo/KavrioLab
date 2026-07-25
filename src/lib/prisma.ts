import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prismaInstance: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  prismaInstance = new PrismaClient({ adapter });
} else {
  if (
    !globalForPrisma.prisma ||
    !(globalForPrisma.prisma as any).foodItem ||
    !(globalForPrisma.prisma as any).dailyNutritionLog ||
    !(globalForPrisma.prisma as any).mealLog ||
    !(globalForPrisma.prisma as any).workoutSchedule ||
    !(globalForPrisma.prisma as any).weightLog ||
    !(globalForPrisma.prisma as any).waterLog ||
    !(globalForPrisma.prisma as any).sleepLog ||
    !(globalForPrisma.prisma as any).waterLog?.fields?.loggedAt
  ) {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  prismaInstance = globalForPrisma.prisma;
}

export const prisma = prismaInstance;
