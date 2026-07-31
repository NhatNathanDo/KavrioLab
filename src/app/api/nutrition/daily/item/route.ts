import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

async function ensureFoodItem(ing: any, userId: string): Promise<string> {
  const { foodItemId, foodItem } = ing;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(foodItemId);
  if (isUuid) {
    return foodItemId;
  }

  if (foodItem) {
    if (foodItem.barcode) {
      const existing = await prisma.foodItem.findUnique({
        where: { barcode: String(foodItem.barcode) },
      });
      if (existing) return existing.id;
    }

    const created = await prisma.foodItem.create({
      data: {
        name: foodItem.name,
        brand: foodItem.brand || null,
        servingSize: foodItem.servingSize || '100g',
        calories: Number(foodItem.calories),
        protein: Number(foodItem.protein),
        carbs: Number(foodItem.carbs),
        fat: Number(foodItem.fat),
        barcode: foodItem.barcode ? String(foodItem.barcode) : null,
        verified: !!foodItem.verified,
        isCustom: false,
      },
    });
    return created.id;
  }

  throw new Error(`Invalid foodItemId: ${foodItemId} and no foodItem data provided`);
}

const addItemSchema = z.object({
  dailyLogId: z.string().uuid(),
  mealName: z.string(), // Breakfast, Lunch, Dinner, Snacks
  foodItemId: z.string(), // Relaxed from uuid()
  servingQuantity: z.number().positive(),
  unit: z.string().optional().default('g'),
  foodItem: z.object({
    name: z.string(),
    brand: z.string().optional().nullable(),
    servingSize: z.string().optional().nullable(),
    calories: z.number(),
    protein: z.union([z.number(), z.string()]),
    carbs: z.union([z.number(), z.string()]),
    fat: z.union([z.number(), z.string()]),
    barcode: z.string().optional().nullable(),
    verified: z.boolean().optional(),
  }).optional(),
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

    const { dailyLogId, mealName, foodItemId, servingQuantity, unit, foodItem } = parsed.data;
    const userId = session.user.id;

    // Verify ownership of daily log
    const dailyLog = await prisma.dailyNutritionLog.findUnique({
      where: { id: dailyLogId },
    });

    if (!dailyLog || dailyLog.userId !== userId) {
      return NextResponse.json({ error: 'Log not found or unauthorized' }, { status: 404 });
    }

    // Resolve or import non-local search result food items
    const resolvedFoodItemId = await ensureFoodItem({ foodItemId, foodItem }, userId);

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
        foodItemId: resolvedFoodItemId,
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
