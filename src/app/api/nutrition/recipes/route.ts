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

const recipeIngredientSchema = z.object({
  foodItemId: z.string(),
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

const createRecipeSchema = z.object({
  name: z.string().min(2, 'Recipe name must be at least 2 characters').max(120),
  description: z.string().optional().default(''),
  servings: z.number().int().min(1).default(1),
  prepTimeMin: z.number().int().min(0).optional(),
  isPublic: z.boolean().optional().default(false),
  ingredients: z.array(recipeIngredientSchema).min(1, 'At least 1 ingredient is required'),
});

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const community = searchParams.get('community') === 'true';

    const whereClause = community
      ? { isPublic: true }
      : { userId: session.user.id };

    const recipes = await prisma.recipe.findMany({
      where: whereClause,
      include: {
        ingredients: {
          include: {
            foodItem: true,
          },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const recipesWithTotals = recipes.map((recipe) => {
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;

      for (const ing of recipe.ingredients) {
        const qty = Number(ing.servingQuantity);
        totalCalories += Math.round(ing.foodItem.calories * qty);
        totalProtein += Number(ing.foodItem.protein) * qty;
        totalCarbs += Number(ing.foodItem.carbs) * qty;
        totalFat += Number(ing.foodItem.fat) * qty;
      }

      const servings = Math.max(1, recipe.servings);
      return {
        ...recipe,
        totals: {
          calories: totalCalories,
          protein: Number(totalProtein.toFixed(1)),
          carbs: Number(totalCarbs.toFixed(1)),
          fat: Number(totalFat.toFixed(1)),
        },
        perServing: {
          calories: Math.round(totalCalories / servings),
          protein: Number((totalProtein / servings).toFixed(1)),
          carbs: Number((totalCarbs / servings).toFixed(1)),
          fat: Number((totalFat / servings).toFixed(1)),
        },
      };
    });

    return NextResponse.json(recipesWithTotals);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createRecipeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid recipe data', details: parsed.error.format() }, { status: 400 });
    }

    const { name, description, servings, prepTimeMin, isPublic, ingredients } = parsed.data;

    const userId = session.user.id;
    const resolvedIngredients = [];
    for (const ing of ingredients) {
      const resolvedId = await ensureFoodItem(ing, userId);
      resolvedIngredients.push({
        foodItemId: resolvedId,
        servingQuantity: ing.servingQuantity,
        unit: ing.unit,
      });
    }

    const newRecipe = await prisma.recipe.create({
      data: {
        userId: session.user.id,
        name,
        description,
        servings,
        prepTimeMin,
        isPublic: !!isPublic,
        ingredients: {
          create: resolvedIngredients.map((ing) => ({
            foodItemId: ing.foodItemId,
            servingQuantity: ing.servingQuantity,
            unit: ing.unit,
          })),
        },
      } as any,
      include: {
        ingredients: {
          include: {
            foodItem: true,
          },
        },
      },
    });

    return NextResponse.json(newRecipe, { status: 201 });
  } catch (error) {
    console.error('Error creating recipe:', error);
    return NextResponse.json({ error: 'Failed to create recipe' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, description, servings, prepTimeMin, isPublic, ingredients } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing recipe ID' }, { status: 400 });
    }

    const existingRecipe = await prisma.recipe.findUnique({
      where: { id },
    });

    if (!existingRecipe || existingRecipe.userId !== session.user.id) {
      return NextResponse.json({ error: 'Recipe not found or unauthorized' }, { status: 404 });
    }

    const userId = session.user.id;

    const updatedRecipe = await prisma.$transaction(async (tx) => {
      await tx.recipeIngredient.deleteMany({
        where: { recipeId: id },
      });

      const resolvedIngredients = [];
      for (const ing of ingredients) {
        const resolvedId = await ensureFoodItem(ing, userId);
        resolvedIngredients.push({
          foodItemId: resolvedId,
          servingQuantity: ing.servingQuantity,
          unit: ing.unit || 'g',
        });
      }

      return tx.recipe.update({
        where: { id },
        data: {
          name,
          description: description || null,
          servings: servings || 1,
          prepTimeMin: prepTimeMin || null,
          isPublic: !!isPublic,
          ingredients: {
            create: resolvedIngredients.map((ing: any) => ({
              foodItemId: ing.foodItemId,
              servingQuantity: ing.servingQuantity,
              unit: ing.unit || 'g',
            })),
          },
        } as any,
        include: {
          ingredients: {
            include: {
              foodItem: true,
            },
          },
        },
      });
    });

    return NextResponse.json(updatedRecipe);
  } catch (error) {
    console.error('Error updating recipe:', error);
    return NextResponse.json({ error: 'Failed to update recipe' }, { status: 500 });
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
      return NextResponse.json({ error: 'Missing recipe ID' }, { status: 400 });
    }

    const recipe = await prisma.recipe.findUnique({
      where: { id },
    });

    if (!recipe || recipe.userId !== session.user.id) {
      return NextResponse.json({ error: 'Recipe not found or unauthorized' }, { status: 404 });
    }

    await prisma.recipe.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    return NextResponse.json({ error: 'Failed to delete recipe' }, { status: 500 });
  }
}
