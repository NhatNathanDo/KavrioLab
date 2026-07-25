import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth/admin';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const actionFilter = searchParams.get('action') || '';

  const rawLogs = await prisma.auditLog.findMany({
    where: actionFilter ? { action: actionFilter } : undefined,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  // Extract target User IDs to fetch target user emails
  const targetUserIds = Array.from(
    new Set(
      rawLogs
        .filter((l: any) => l.targetType === 'User' && l.targetId)
        .map((l: any) => l.targetId!)
    )
  );

  const targetUsers = targetUserIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: targetUserIds } },
        select: { id: true, email: true, name: true },
      })
    : [];

  const targetUserMap = new Map(targetUsers.map((u: any) => [u.id, u.email]));

  const logs = rawLogs.map((log: any) => ({
    ...log,
    targetEmail: log.targetType === 'User' && log.targetId ? targetUserMap.get(log.targetId) || null : null,
  }));

  return NextResponse.json({ logs });
}
