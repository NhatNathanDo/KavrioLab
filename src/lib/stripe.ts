import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion,
      appInfo: {
        name: 'KavrioLab',
        version: '1.0.0',
      },
    })
  : null;

export async function checkProStatus(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPro: true, stripeCurrentPeriodEnd: true },
  });

  if (!user) return false;

  if (user.isPro) {
    if (user.stripeCurrentPeriodEnd) {
      // Allow a 1-day grace period
      return user.stripeCurrentPeriodEnd.getTime() + 86400000 > Date.now();
    }
    return true;
  }

  return false;
}
