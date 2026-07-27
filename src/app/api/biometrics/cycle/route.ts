import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { calculateCycleOverview } from '@/lib/calculations/cycle';
import { logPeriodSchema } from '@/lib/validations/cycleSchemas';
import { differenceInCalendarDays } from '@/lib/utils/dateUtils';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch all menstrual cycles for the user
    const cycles = await (prisma as any).menstrualCycle.findMany({
      where: { userId },
      orderBy: { startDate: 'asc' },
    });

    const formattedCycles = cycles.map((c: any) => ({
      id: c.id,
      startDate: c.startDate.toISOString(),
      endDate: c.endDate ? c.endDate.toISOString() : null,
      cycleLengthDays: c.cycleLengthDays,
      periodLengthDays: c.periodLengthDays,
      notes: c.notes,
    }));

    // Fetch recent daily symptom logs (last 60 days)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const symptomLogs = await (prisma as any).cycleSymptomLog.findMany({
      where: {
        userId,
        date: { gte: sixtyDaysAgo },
      },
      orderBy: { date: 'desc' },
    });

    const formattedSymptoms = symptomLogs.map((s: any) => ({
      id: s.id,
      date: s.date.toISOString(),
      flowLevel: s.flowLevel,
      symptoms: s.symptoms || [],
      mood: s.mood,
      basalBodyTemp: s.basalBodyTemp ? Number(s.basalBodyTemp) : null,
      ovulationTestResult: s.ovulationTestResult,
      notes: s.notes,
    }));

    const overview = calculateCycleOverview(formattedCycles);

    return NextResponse.json({
      overview,
      cycles: formattedCycles.reverse(), // most recent first for list view
      symptoms: formattedSymptoms,
    });
  } catch (error) {
    console.error('Error fetching cycle data:', error);
    return NextResponse.json({ error: 'Failed to fetch cycle data' }, { status: 500 });
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
    const parsed = logPeriodSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.format() }, { status: 400 });
    }

    const { startDate, endDate, notes } = parsed.data;
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;

    let periodLengthDays: number | null = null;
    if (end) {
      periodLengthDays = Math.max(1, differenceInCalendarDays(end, start) + 1);
    }

    const newCycle = await (prisma as any).menstrualCycle.create({
      data: {
        userId,
        startDate: start,
        endDate: end,
        periodLengthDays,
        notes: notes || null,
      },
    });

    // Recalculate cycle lengths for all user cycles
    const allCycles = await (prisma as any).menstrualCycle.findMany({
      where: { userId },
      orderBy: { startDate: 'asc' },
    });

    for (let i = 1; i < allCycles.length; i++) {
      const prev = allCycles[i - 1];
      const curr = allCycles[i];
      const diff = differenceInCalendarDays(new Date(curr.startDate), new Date(prev.startDate));
      await (prisma as any).menstrualCycle.update({
        where: { id: prev.id },
        data: { cycleLengthDays: diff },
      });
    }

    return NextResponse.json({
      message: 'Period logged successfully',
      cycle: {
        id: newCycle.id,
        startDate: newCycle.startDate.toISOString(),
        endDate: newCycle.endDate ? newCycle.endDate.toISOString() : null,
        periodLengthDays: newCycle.periodLengthDays,
        notes: newCycle.notes,
      },
    });
  } catch (error) {
    console.error('Error logging period:', error);
    return NextResponse.json({ error: 'Failed to log period' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Cycle ID is required' }, { status: 400 });
    }

    await (prisma as any).menstrualCycle.deleteMany({
      where: { id, userId },
    });

    return NextResponse.json({ message: 'Cycle deleted successfully' });
  } catch (error) {
    console.error('Error deleting cycle:', error);
    return NextResponse.json({ error: 'Failed to delete cycle' }, { status: 500 });
  }
}
