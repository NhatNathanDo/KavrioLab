import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const targetDate = new Date(dateStr);

    const userId = session.user.id;

    // Fetch user profile for targets
    let profile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      profile = await prisma.userProfile.create({
        data: {
          userId,
          targetCalories: 2200,
          targetProtein: 150.0,
          targetCarbs: 250.0,
          targetFat: 65.0,
        },
      });
    }

    // Find DailyNutritionLog for this date
    let dailyLog = await prisma.dailyNutritionLog.findFirst({
      where: {
        userId,
        date: targetDate,
      },
      include: {
        meals: {
          orderBy: { orderIndex: 'asc' },
          include: {
            items: {
              include: {
                foodItem: true,
              },
            },
          },
        },
      },
    });

    // If no log exists for this date, create one with default 4 meals (Breakfast, Lunch, Dinner, Snack)
    if (!dailyLog) {
      dailyLog = await prisma.dailyNutritionLog.create({
        data: {
          userId,
          date: targetDate,
          meals: {
            create: [
              { name: 'Breakfast', orderIndex: 0 },
              { name: 'Lunch', orderIndex: 1 },
              { name: 'Dinner', orderIndex: 2 },
              { name: 'Snacks', orderIndex: 3 },
            ],
          },
        },
        include: {
          meals: {
            orderBy: { orderIndex: 'asc' },
            include: {
              items: {
                include: {
                  foodItem: true,
                },
              },
            },
          },
        },
      });
    }

    // Calculate totals
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    const mealsWithTotals = dailyLog.meals.map((meal) => {
      let mealCalories = 0;
      let mealProtein = 0;
      let mealCarbs = 0;
      let mealFat = 0;

      const itemsWithTotals = meal.items.map((item) => {
        const qty = Number(item.servingQuantity);
        const cal = Math.round(item.foodItem.calories * qty);
        const pro = Number((Number(item.foodItem.protein) * qty).toFixed(1));
        const car = Number((Number(item.foodItem.carbs) * qty).toFixed(1));
        const fat = Number((Number(item.foodItem.fat) * qty).toFixed(1));

        mealCalories += cal;
        mealProtein += pro;
        mealCarbs += car;
        mealFat += fat;

        return {
          ...item,
          servingQuantity: qty,
          calculated: {
            calories: cal,
            protein: pro,
            carbs: car,
            fat: fat,
          },
        };
      });

      totalCalories += mealCalories;
      totalProtein += mealProtein;
      totalCarbs += mealCarbs;
      totalFat += mealFat;

      return {
        ...meal,
        items: itemsWithTotals,
        totals: {
          calories: mealCalories,
          protein: Number(mealProtein.toFixed(1)),
          carbs: Number(mealCarbs.toFixed(1)),
          fat: Number(mealFat.toFixed(1)),
        },
      };
    });

    return NextResponse.json({
      dailyLogId: dailyLog.id,
      date: dateStr,
      notes: dailyLog.notes,
      targets: {
        calories: profile.targetCalories,
        protein: Number(profile.targetProtein),
        carbs: Number(profile.targetCarbs),
        fat: Number(profile.targetFat),
      },
      consumed: {
        calories: totalCalories,
        protein: Number(totalProtein.toFixed(1)),
        carbs: Number(totalCarbs.toFixed(1)),
        fat: Number(totalFat.toFixed(1)),
      },
      meals: mealsWithTotals,
    });
  } catch (error) {
    console.error('Error fetching daily nutrition log:', error);
    return NextResponse.json({ error: 'Failed to fetch daily nutrition log' }, { status: 500 });
  }
}
