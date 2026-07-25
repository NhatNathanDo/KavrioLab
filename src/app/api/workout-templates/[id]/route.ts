import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { workoutTemplateSchema } from '@/lib/validations/workoutSchemas';
import { z } from 'zod';

const idSchema = z.string().uuid();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) {
    return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
  }

  const template = await prisma.workoutTemplate.findUnique({
    where: { id: parsedId.data },
    select: {
      id: true,
      userId: true,
      name: true,
      description: true,
      exercises: {
        orderBy: { orderIndex: 'asc' },
        select: {
          id: true,
          orderIndex: true,
          exercise: {
            select: { id: true, name: true, category: true },
          },
          sets: {
            orderBy: { orderIndex: 'asc' },
            select: {
              id: true,
              setType: true,
              targetWeightKg: true,
              targetReps: true,
              orderIndex: true,
            },
          },
        },
      },
    },
  });

  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  if (template.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ template });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) {
    return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
  }

  const existingTemplate = await prisma.workoutTemplate.findUnique({
    where: { id: parsedId.data },
    select: { userId: true },
  });

  if (!existingTemplate) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  if (existingTemplate.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body: unknown = await request.json();
  const parsedBody = workoutTemplateSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsedBody.error.flatten() },
      { status: 400 }
    );
  }

  const { name, description, exercises } = parsedBody.data;

  // Use a transaction to safely update the template
  const updatedTemplate = await prisma.$transaction(async (tx) => {
    // Delete existing template exercises (will cascade delete the sets)
    await tx.workoutTemplateExercise.deleteMany({
      where: { templateId: parsedId.data },
    });

    // Update basic template info and create new exercises/sets
    return tx.workoutTemplate.update({
      where: { id: parsedId.data },
      data: {
        name,
        description,
        exercises: {
          create: exercises.map((ex) => ({
            exerciseId: ex.exerciseId,
            orderIndex: ex.orderIndex,
            sets: {
              create: ex.sets.map((s) => ({
                setType: s.setType,
                targetWeightKg: s.targetWeightKg ?? null,
                targetReps: s.targetReps ?? null,
                orderIndex: s.orderIndex,
              })),
            },
          })),
        },
      },
      select: { id: true, name: true },
    });
  });

  return NextResponse.json({ template: updatedTemplate });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) {
    return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
  }

  const template = await prisma.workoutTemplate.findUnique({
    where: { id: parsedId.data },
    select: { userId: true },
  });

  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  if (template.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.workoutTemplate.delete({
    where: { id: parsedId.data },
  });

  return NextResponse.json({ success: true });
}
