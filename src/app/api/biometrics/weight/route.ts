import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { CreateWeightLogSchema } from '@/lib/validations/biometricSchemas';
import { calculateWeightEMA } from '@/lib/calculations';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '30d';

    let startDate: Date | undefined;
    const now = new Date();

    if (range === '7d') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === '30d') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (range === '90d') {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (range === '1y') {
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    }

    const logs = await (prisma as any).weightLog.findMany({
      where: {
        userId,
        ...(startDate ? { loggedAt: { gte: startDate } } : {}),
      },
      orderBy: { loggedAt: 'asc' },
    });

    const formattedLogs = logs.map((l: { id: string; weightKg: any; loggedAt: Date; notes?: string | null }) => ({
      id: l.id,
      weightKg: Number(l.weightKg),
      loggedAt: l.loggedAt.toISOString(),
      notes: l.notes,
    }));

    const emaData = calculateWeightEMA(formattedLogs);

    return NextResponse.json({
      range,
      stats: {
        latestWeight: emaData.latestWeight,
        latestEMA: emaData.latestEMA,
        weeklyTrendDeltaKg: emaData.weeklyTrendDeltaKg,
        totalChangeKg: emaData.totalChangeKg,
        totalCount: logs.length,
      },
      entries: emaData.entries,
    });
  } catch (error) {
    console.error('Error fetching weight logs:', error);
    return NextResponse.json({ error: 'Failed to fetch weight logs' }, { status: 500 });
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

    const parsed = CreateWeightLogSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid weight payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { weightKg, notes, loggedAt } = parsed.data;
    const logDate = loggedAt ? new Date(loggedAt) : new Date();

    const created = await (prisma as any).weightLog.create({
      data: {
        userId,
        weightKg,
        notes,
        loggedAt: logDate,
      },
    });

    return NextResponse.json(
      {
        id: created.id,
        weightKg: Number(created.weightKg),
        notes: created.notes,
        loggedAt: created.loggedAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saving weight log:', error);
    return NextResponse.json({ error: 'Failed to log weight' }, { status: 500 });
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
      return NextResponse.json({ error: 'Missing weight log ID' }, { status: 400 });
    }

    const existing = await (prisma as any).weightLog.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Weight log not found or unauthorized' }, { status: 404 });
    }

    await (prisma as any).weightLog.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error('Error deleting weight log:', error);
    return NextResponse.json({ error: 'Failed to delete weight log' }, { status: 500 });
  }
}
