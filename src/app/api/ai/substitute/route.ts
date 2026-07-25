import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { suggestExerciseSubstitute } from '@/lib/ai/gemini';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { exerciseName, targetMuscles, equipment } = await req.json();
    if (!exerciseName) {
      return NextResponse.json({ error: 'Missing exerciseName parameter' }, { status: 400 });
    }

    const suggestions = await suggestExerciseSubstitute(
      exerciseName,
      targetMuscles || 'Chest / Pectoralis Major',
      equipment || 'Barbell'
    );

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error suggesting exercise substitute:', error);
    return NextResponse.json(
      { error: 'Failed to suggest exercise substitute', details: (error as Error).message },
      { status: 500 }
    );
  }
}
