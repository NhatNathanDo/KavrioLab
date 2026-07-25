import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { workoutTemplateSchema } from '@/lib/validations/workoutSchemas';

// GET /api/workout-templates — list user templates
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const templates = await prisma.workoutTemplate.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      description: true,
      updatedAt: true,
      exercises: {
        orderBy: { orderIndex: 'asc' },
        select: {
          id: true,
          orderIndex: true,
          exercise: { select: { id: true, name: true, category: true } },
          sets: {
            select: { id: true, setType: true, targetWeightKg: true, targetReps: true, orderIndex: true },
          },
        },
      },
    },
  });

  return NextResponse.json({ templates });
}

// POST /api/workout-templates — create a template
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body: unknown = await request.json();
  const parsed = workoutTemplateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, description, exercises } = parsed.data;

  const template = await prisma.workoutTemplate.create({
    data: {
      userId: session.user.id,
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

  return NextResponse.json({ template }, { status: 201 });
}
