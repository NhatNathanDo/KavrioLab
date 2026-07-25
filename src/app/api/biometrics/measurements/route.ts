import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { CreateBodyMeasurementSchema } from '@/lib/validations/biometricSchemas';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const logs = await (prisma as any).bodyMeasurement.findMany({
      where: { userId },
      orderBy: { loggedAt: 'desc' },
    });

    const formattedLogs = logs.map((l: any) => ({
      id: l.id,
      chestCm: l.chestCm ? Number(l.chestCm) : null,
      waistCm: l.waistCm ? Number(l.waistCm) : null,
      hipsCm: l.hipsCm ? Number(l.hipsCm) : null,
      bicepsCm: l.bicepsCm ? Number(l.bicepsCm) : null,
      thighsCm: l.thighsCm ? Number(l.thighsCm) : null,
      calvesCm: l.calvesCm ? Number(l.calvesCm) : null,
      shouldersCm: l.shouldersCm ? Number(l.shouldersCm) : null,
      neckCm: l.neckCm ? Number(l.neckCm) : null,
      forearmsCm: l.forearmsCm ? Number(l.forearmsCm) : null,
      notes: l.notes,
      loggedAt: l.loggedAt.toISOString(),
    }));

    const latest = formattedLogs[0] || null;

    return NextResponse.json({
      latest,
      history: formattedLogs,
      totalCount: formattedLogs.length,
    });
  } catch (error) {
    console.error('Error fetching body measurements:', error);
    return NextResponse.json({ error: 'Failed to fetch body measurements' }, { status: 500 });
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

    const parsed = CreateBodyMeasurementSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid measurement payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const logDate = data.loggedAt ? new Date(data.loggedAt) : new Date();

    const created = await (prisma as any).bodyMeasurement.create({
      data: {
        userId,
        chestCm: data.chestCm,
        waistCm: data.waistCm,
        hipsCm: data.hipsCm,
        bicepsCm: data.bicepsCm,
        thighsCm: data.thighsCm,
        calvesCm: data.calvesCm,
        shouldersCm: data.shouldersCm,
        neckCm: data.neckCm,
        forearmsCm: data.forearmsCm,
        notes: data.notes,
        loggedAt: logDate,
      },
    });

    return NextResponse.json(
      {
        id: created.id,
        chestCm: created.chestCm ? Number(created.chestCm) : null,
        waistCm: created.waistCm ? Number(created.waistCm) : null,
        hipsCm: created.hipsCm ? Number(created.hipsCm) : null,
        bicepsCm: created.bicepsCm ? Number(created.bicepsCm) : null,
        thighsCm: created.thighsCm ? Number(created.thighsCm) : null,
        calvesCm: created.calvesCm ? Number(created.calvesCm) : null,
        shouldersCm: created.shouldersCm ? Number(created.shouldersCm) : null,
        neckCm: created.neckCm ? Number(created.neckCm) : null,
        forearmsCm: created.forearmsCm ? Number(created.forearmsCm) : null,
        notes: created.notes,
        loggedAt: created.loggedAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saving body measurement:', error);
    return NextResponse.json({ error: 'Failed to log body measurement' }, { status: 500 });
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
      return NextResponse.json({ error: 'Missing measurement ID' }, { status: 400 });
    }

    const existing = await (prisma as any).bodyMeasurement.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Measurement log not found or unauthorized' }, { status: 404 });
    }

    await (prisma as any).bodyMeasurement.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error('Error deleting body measurement:', error);
    return NextResponse.json({ error: 'Failed to delete body measurement' }, { status: 500 });
  }
}
