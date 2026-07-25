import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { generateCoachChatResponse } from '@/lib/ai/gemini';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid chat messages payload' }, { status: 400 });
    }

    // Fetch user context for RAG injection
    const [userProfile, latestWeight, recentWorkouts, todayNutrition] = await Promise.all([
      (prisma as any).userProfile.findUnique({ where: { userId } }).catch(() => null),
      (prisma as any).weightLog.findFirst({ where: { userId }, orderBy: { loggedAt: 'desc' } }).catch(() => null),
      (prisma as any).workoutLog.findMany({ where: { userId }, take: 3, orderBy: { startedAt: 'desc' } }).catch(() => []),
      (prisma as any).dailyNutritionLog.findFirst({ where: { userId }, orderBy: { date: 'desc' }, include: { meals: { include: { items: true } } } }).catch(() => null),
    ]);

    let todayCalories = 0;
    if (todayNutrition?.meals) {
      todayNutrition.meals.forEach((m: any) => {
        m.items?.forEach((i: any) => {
          todayCalories += Number(i.calories || 0);
        });
      });
    }

    const userContext = `
- Unit System: ${userProfile?.unitSystem || 'METRIC'}
- Height: ${userProfile?.heightCm ? `${userProfile.heightCm} cm` : 'Not set'}
- Target Weight: ${userProfile?.targetWeightKg ? `${userProfile.targetWeightKg} kg` : 'Not set'}
- Latest Logged Weight: ${latestWeight?.weightKg ? `${latestWeight.weightKg} kg on ${new Date(latestWeight.loggedAt).toLocaleDateString()}` : 'No weight log'}
- Today's Caloric Intake: ${todayCalories} kcal
- Recent Workouts Logged: ${recentWorkouts.length} sessions in past week
`.trim();

    const coachReply = await generateCoachChatResponse(messages, userContext);

    return NextResponse.json({
      role: 'model',
      content: coachReply,
    });
  } catch (error) {
    console.error('Error in AI Coach Chat API:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI Coach response', details: (error as Error).message },
      { status: 500 }
    );
  }
}
