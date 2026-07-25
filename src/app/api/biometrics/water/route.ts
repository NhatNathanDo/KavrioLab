import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { CreateWaterLogSchema } from '@/lib/validations/biometricSchemas';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Fetch today's water logs
    const todayLogs = await (prisma as any).waterLog.findMany({
      where: {
        userId,
        loggedAt: { gte: startOfToday },
      },
      orderBy: { loggedAt: 'desc' },
    });

    const todayTotalMl = todayLogs.reduce(
      (sum: number, l: any) => sum + (l.amountMl ? Number(l.amountMl) : 0),
      0
    );

    const targetMl = 2500; // Baseline daily target
    const currentHour = now.getHours();
    const isDehydrated = currentHour >= 15 && todayTotalMl < targetMl * 0.5;

    // Fetch 7-day history for chart
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const historyLogs = await (prisma as any).waterLog.findMany({
      where: {
        userId,
        loggedAt: { gte: sevenDaysAgo },
      },
      orderBy: { loggedAt: 'asc' },
    });

    // Group logs by day
    const dayMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      dayMap[dateStr] = 0;
    }

    historyLogs.forEach((l: any) => {
      const dateStr = new Date(l.loggedAt).toISOString().split('T')[0];
      if (dayMap[dateStr] !== undefined) {
        dayMap[dateStr] += Number(l.amountMl || 0);
      }
    });

    const weeklyHistory = Object.entries(dayMap).map(([date, totalMl]) => ({
      date,
      totalMl,
      percentage: Math.min(Math.round((totalMl / targetMl) * 100), 100),
    }));

    return NextResponse.json({
      todayTotalMl,
      targetMl,
      targetPercentage: Math.min(Math.round((todayTotalMl / targetMl) * 100), 100),
      isDehydrated,
      todayLogs: todayLogs.map((l: any) => ({
        id: l.id,
        amountMl: Number(l.amountMl),
        loggedAt: l.loggedAt.toISOString(),
      })),
      weeklyHistory,
    });
  } catch (error) {
    console.error('Error fetching water logs:', error);
    return NextResponse.json({ error: 'Failed to fetch water logs' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();

    const parsed = CreateWaterLogSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid water log payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { amountMl, loggedAt } = parsed.data;
    const logDate = loggedAt ? new Date(loggedAt) : new Date();

    const created = await (prisma as any).waterLog.create({
      data: {
        userId,
        amountMl,
        loggedAt: logDate,
      },
    });

    return NextResponse.json(
      {
        id: created.id,
        amountMl: Number(created.amountMl),
        loggedAt: created.loggedAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saving water log:', error);
    return NextResponse.json({ error: 'Failed to log water intake' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing water log ID' }, { status: 400 });
    }

    const existing = await (prisma as any).waterLog.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Water log not found or unauthorized' }, { status: 404 });
    }

    await (prisma as any).waterLog.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error('Error deleting water log:', error);
    return NextResponse.json({ error: 'Failed to delete water log' }, { status: 500 });
  }
}
