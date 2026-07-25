import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const addItemSchema = z.object({
  dailyLogId: z.string().uuid(),
  mealName: z.string(), // Breakfast, Lunch, Dinner, Snacks
  foodItemId: z.string().uuid(),
  servingQuantity: z.number().positive(),
  unit: z.string().optional().default('g'),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = addItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
    }

    const { dailyLogId, mealName, foodItemId, servingQuantity, unit } = parsed.data;

    // Verify ownership of daily log
    const dailyLog = await prisma.dailyNutritionLog.findUnique({
      where: { id: dailyLogId },
    });

    if (!dailyLog || dailyLog.userId !== session.user.id) {
      return NextResponse.json({ error: 'Log not found or unauthorized' }, { status: 404 });
    }

    // Find or create the target MealLog
    let mealLog = await prisma.mealLog.findFirst({
      where: {
        dailyNutritionLogId: dailyLogId,
        name: mealName,
      },
    });

    if (!mealLog) {
      const orderMap: Record<string, number> = {
        Breakfast: 0,
        Lunch: 1,
        Dinner: 2,
        Snacks: 3,
      };
      mealLog = await prisma.mealLog.create({
        data: {
          dailyNutritionLogId: dailyLogId,
          name: mealName,
          orderIndex: orderMap[mealName] ?? 4,
        },
      });
    }

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

    return NextResponse.json(createdItem, { status: 201 });
  } catch (error) {
    console.error('Error adding meal item:', error);
    return NextResponse.json({ error: 'Failed to add item to meal' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('id');

    if (!itemId) {
      return NextResponse.json({ error: 'Missing item ID' }, { status: 400 });
    }

    const item = await prisma.mealFoodItem.findUnique({
      where: { id: itemId },
      include: {
        mealLog: {
          include: {
            dailyNutritionLog: true,
          },
        },
      },
    });

    if (!item || item.mealLog.dailyNutritionLog.userId !== session.user.id) {
      return NextResponse.json({ error: 'Item not found or unauthorized' }, { status: 404 });
    }

    await prisma.mealFoodItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ success: true, deletedId: itemId });
  } catch (error) {
    console.error('Error deleting meal item:', error);
    return NextResponse.json({ error: 'Failed to delete meal item' }, { status: 500 });
  }
}
