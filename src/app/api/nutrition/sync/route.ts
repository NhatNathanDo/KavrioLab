import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const syncItemSchema = z.object({
  type: z.literal('LOG_MEAL_ITEM'),
  payload: z.object({
    date: z.string(), // ISO string YYYY-MM-DD
    mealName: z.string(), // Breakfast, Lunch, Dinner, Snack
    foodItemId: z.string().uuid(),
    servingQuantity: z.number().positive(),
    unit: z.string().optional().default('g'),
  }),
});

const syncRequestSchema = z.object({
  mutations: z.array(syncItemSchema),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = syncRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid sync payload', details: parsed.error.format() }, { status: 400 });
    }

    const userId = session.user.id;
    const results = [];

    // Process all mutations in sequence inside transaction or safely individual
    for (const mutation of parsed.data.mutations) {
      if (mutation.type === 'LOG_MEAL_ITEM') {
        const { date, mealName, foodItemId, servingQuantity, unit } = mutation.payload;
        const logDate = new Date(date);

        // 1. Find or create DailyNutritionLog
        let dailyLog = await prisma.dailyNutritionLog.findFirst({
          where: {
            userId,
            date: logDate,
          },
        });

        if (!dailyLog) {
          dailyLog = await prisma.dailyNutritionLog.create({
            data: {
              userId,
              date: logDate,
            },
          });
        }

        // 2. Find or create MealLog inside DailyNutritionLog
        let mealLog = await prisma.mealLog.findFirst({
          where: {
            dailyNutritionLogId: dailyLog.id,
            name: mealName,
          },
        });

        if (!mealLog) {
          const orderIndexMap: Record<string, number> = {
            Breakfast: 0,
            Lunch: 1,
            Dinner: 2,
            Snack: 3,
            Snacks: 3,
          };
          mealLog = await prisma.mealLog.create({
            data: {
              dailyNutritionLogId: dailyLog.id,
              name: mealName,
              orderIndex: orderIndexMap[mealName] ?? 4,
            },
          });
        }

        // 3. Create MealFoodItem
        const createdItem = await prisma.mealFoodItem.create({
          data: {
            mealLogId: mealLog.id,
            foodItemId,
            servingQuantity,
            unit,
          },
          include: {
            foodItem: true,
          },
        });

        results.push({ status: 'success', itemId: createdItem.id });
      }
    }

    return NextResponse.json({ syncedCount: results.length, results });
  } catch (error) {
    console.error('Offline sync error:', error);
    return NextResponse.json({ error: 'Failed to sync offline nutrition data' }, { status: 500 });
  }
}
