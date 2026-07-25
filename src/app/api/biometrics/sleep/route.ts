import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { CreateSleepLogSchema } from '@/lib/validations/biometricSchemas';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const logs = await (prisma as any).sleepLog.findMany({
      where: { userId },
      orderBy: { loggedAt: 'desc' },
    });

    const formattedLogs = logs.map((l: any) => ({
      id: l.id,
      durationHours: Number(l.durationHours),
      qualityScore: l.qualityScore,
      bedtime: l.bedtime,
      wakeTime: l.wakeTime,
      notes: l.notes,
      loggedAt: l.loggedAt.toISOString(),
    }));

    // Calculate 7-day averages
    const last7Logs = formattedLogs.slice(0, 7);
    const avgDurationHours =
      last7Logs.length > 0
        ? Number(
            (
              last7Logs.reduce((sum: number, l: any) => sum + l.durationHours, 0) /
              last7Logs.length
            ).toFixed(1)
          )
        : 0;

    const avgQualityScore =
      last7Logs.length > 0
        ? Math.round(
            last7Logs.reduce((sum: number, l: any) => sum + l.qualityScore, 0) /
              last7Logs.length
          )
        : 0;

    // Recovery score formula: 60% duration ratio (vs 8h) + 40% quality score
    const durationRatio = Math.min(avgDurationHours / 8.0, 1.0);
    const recoveryScore = Math.round(durationRatio * 60 + (avgQualityScore / 100) * 40);

    return NextResponse.json({
      latest: formattedLogs[0] || null,
      history: formattedLogs,
      avgDurationHours,
      avgQualityScore,
      recoveryScore,
      totalCount: formattedLogs.length,
    });
  } catch (error) {
    console.error('Error fetching sleep logs:', error);
    return NextResponse.json({ error: 'Failed to fetch sleep logs' }, { status: 500 });
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

    const parsed = CreateSleepLogSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid sleep log payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const logDate = data.loggedAt ? new Date(data.loggedAt) : new Date();

    const created = await (prisma as any).sleepLog.create({
      data: {
        userId,
        durationHours: data.durationHours,
        qualityScore: data.qualityScore,
        bedtime: data.bedtime || null,
        wakeTime: data.wakeTime || null,
        notes: data.notes || null,
        loggedAt: logDate,
      },
    });

    return NextResponse.json(
      {
        id: created.id,
        durationHours: Number(created.durationHours),
        qualityScore: created.qualityScore,
        bedtime: created.bedtime,
        wakeTime: created.wakeTime,
        notes: created.notes,
        loggedAt: created.loggedAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saving sleep log:', error);
    return NextResponse.json({ error: 'Failed to log sleep session' }, { status: 500 });
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
      return NextResponse.json({ error: 'Missing sleep log ID' }, { status: 400 });
    }

    const existing = await (prisma as any).sleepLog.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Sleep log not found or unauthorized' }, { status: 404 });
    }

    await (prisma as any).sleepLog.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error('Error deleting sleep log:', error);
    return NextResponse.json({ error: 'Failed to delete sleep log' }, { status: 500 });
  }
}
