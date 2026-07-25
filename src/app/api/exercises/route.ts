import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') ?? '';
  const category = searchParams.get('category') ?? '';

  const exercises = await prisma.exercise.findMany({
    where: {
      ...(query ? { name: { contains: query, mode: 'insensitive' } } : {}),
      ...(category ? { category: category as never } : {}),
    },
    orderBy: { name: 'asc' },
    take: 200,
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      primaryMuscle: true,
      equipment: true,
    },
  });

  return NextResponse.json({ exercises });
}
