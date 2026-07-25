import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, createAuditLog } from '@/lib/auth/admin';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function GET(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';

  const users = await prisma.user.findMany({
    where: query
      ? {
          OR: [
            { email: { contains: query, mode: 'insensitive' } },
            { name: { contains: query, mode: 'insensitive' } },
          ],
        }
      : undefined,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isPro: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({ users });
}

export async function PATCH(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { userId, role, isPro, impersonate } = body;

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  if (impersonate) {
    await createAuditLog({
      userId: admin.id,
      action: 'IMPERSONATE_USER_START',
      targetType: 'User',
      targetId: userId,
      details: `Admin ${admin.email} initiated debug session for target user ${userId}`,
    });

    return NextResponse.json({ success: true, message: 'Impersonation logged' });
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(role ? { role: role as Role } : {}),
      ...(typeof isPro === 'boolean'
        ? {
            isPro,
            ...(isPro === false ? { stripeSubscriptionId: null, stripeCurrentPeriodEnd: null } : {}),
          }
        : {}),
    },
  });

  await createAuditLog({
    userId: admin.id,
    action: 'UPDATE_USER_ROLE',
    targetType: 'User',
    targetId: userId,
    details: `Role updated to ${updatedUser.role}, Pro status: ${updatedUser.isPro}`,
  });

  return NextResponse.json({ user: updatedUser });
}
