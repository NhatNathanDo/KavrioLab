import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { CreateProgressPhotoSchema } from '@/lib/validations/biometricSchemas';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const angleFilter = searchParams.get('angle');

    const photos = await (prisma as any).progressPhoto.findMany({
      where: {
        userId,
        ...(angleFilter && ['FRONT', 'SIDE', 'BACK'].includes(angleFilter)
          ? { angle: angleFilter }
          : {}),
      },
      orderBy: { loggedAt: 'desc' },
    });

    const formattedPhotos = photos.map((p: any) => ({
      id: p.id,
      imageUrl: p.imageUrl,
      angle: p.angle,
      notes: p.notes,
      loggedAt: p.loggedAt.toISOString(),
      createdAt: p.createdAt.toISOString(),
    }));

    return NextResponse.json({
      photos: formattedPhotos,
      totalCount: formattedPhotos.length,
    });
  } catch (error) {
    console.error('Error fetching progress photos:', error);
    return NextResponse.json({ error: 'Failed to fetch progress photos' }, { status: 500 });
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

    const parsed = CreateProgressPhotoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid progress photo payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { imageUrl, angle, notes, loggedAt } = parsed.data;
    const logDate = loggedAt ? new Date(loggedAt) : new Date();

    const created = await (prisma as any).progressPhoto.create({
      data: {
        userId,
        imageUrl,
        angle: angle || 'FRONT',
        notes: notes || null,
        loggedAt: logDate,
      },
    });

    return NextResponse.json(
      {
        id: created.id,
        imageUrl: created.imageUrl,
        angle: created.angle,
        notes: created.notes,
        loggedAt: created.loggedAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saving progress photo:', error);
    return NextResponse.json({ error: 'Failed to log progress photo' }, { status: 500 });
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
      return NextResponse.json({ error: 'Missing photo ID' }, { status: 400 });
    }

    const existing = await (prisma as any).progressPhoto.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Photo not found or unauthorized' }, { status: 404 });
    }

    await (prisma as any).bodyMeasurement.delete({
      where: { id },
    }).catch(() => null);

    await (prisma as any).progressPhoto.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error('Error deleting progress photo:', error);
    return NextResponse.json({ error: 'Failed to delete progress photo' }, { status: 500 });
  }
}
