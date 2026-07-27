import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logCycleSymptomSchema } from '@/lib/validations/cycleSchemas';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date');

    if (!dateStr) {
      return NextResponse.json({ error: 'Date query param is required' }, { status: 400 });
    }

    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);

    const log = await (prisma as any).cycleSymptomLog.findFirst({
      where: {
        userId,
        date: targetDate,
      },
    });

    if (!log) {
      return NextResponse.json({ symptomLog: null });
    }

    return NextResponse.json({
      symptomLog: {
        id: log.id,
        date: log.date.toISOString(),
        flowLevel: log.flowLevel,
        symptoms: log.symptoms || [],
        mood: log.mood,
        basalBodyTemp: log.basalBodyTemp ? Number(log.basalBodyTemp) : null,
        ovulationTestResult: log.ovulationTestResult,
        notes: log.notes,
      },
    });
  } catch (error) {
    console.error('Error fetching symptom log:', error);
    return NextResponse.json({ error: 'Failed to fetch symptom log' }, { status: 500 });
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
    const parsed = logCycleSymptomSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.format() }, { status: 400 });
    }

    const { date, flowLevel, symptoms, mood, basalBodyTemp, ovulationTestResult, notes } = parsed.data;
    const logDate = new Date(date);
    logDate.setHours(0, 0, 0, 0);

    const symptomLog = await (prisma as any).cycleSymptomLog.upsert({
      where: {
        userId_date: {
          userId,
          date: logDate,
        },
      },
      update: {
        flowLevel: flowLevel || null,
        symptoms: symptoms || [],
        mood: mood || null,
        basalBodyTemp: basalBodyTemp ?? null,
        ovulationTestResult: ovulationTestResult || 'NOT_TESTED',
        notes: notes || null,
      },
      create: {
        userId,
        date: logDate,
        flowLevel: flowLevel || null,
        symptoms: symptoms || [],
        mood: mood || null,
        basalBodyTemp: basalBodyTemp ?? null,
        ovulationTestResult: ovulationTestResult || 'NOT_TESTED',
        notes: notes || null,
      },
    });

    return NextResponse.json({
      message: 'Symptom log saved',
      symptomLog: {
        id: symptomLog.id,
        date: symptomLog.date.toISOString(),
        flowLevel: symptomLog.flowLevel,
        symptoms: symptomLog.symptoms,
        mood: symptomLog.mood,
        basalBodyTemp: symptomLog.basalBodyTemp ? Number(symptomLog.basalBodyTemp) : null,
        ovulationTestResult: symptomLog.ovulationTestResult,
        notes: symptomLog.notes,
      },
    });
  } catch (error) {
    console.error('Error saving symptom log:', error);
    return NextResponse.json({ error: 'Failed to save symptom log' }, { status: 500 });
  }
}
