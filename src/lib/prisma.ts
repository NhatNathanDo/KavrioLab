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
    !(globalForPrisma.prisma as any)._v78_billingInvoices
  ) {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    const client = new PrismaClient({ adapter });
    (client as any)._v78_billingInvoices = true;
    globalForPrisma.prisma = client;
  }
  prismaInstance = globalForPrisma.prisma;
}

export const prisma = prismaInstance as PrismaClient & Record<string, any>;
