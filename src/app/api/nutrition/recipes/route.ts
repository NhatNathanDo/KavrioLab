import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const recipeIngredientSchema = z.object({
  foodItemId: z.string().uuid(),
  servingQuantity: z.number().positive(),
  unit: z.string().optional().default('g'),
});

const createRecipeSchema = z.object({
  name: z.string().min(2, 'Recipe name must be at least 2 characters').max(120),
  description: z.string().optional().default(''),
  servings: z.number().int().min(1).default(1),
  prepTimeMin: z.number().int().min(0).optional(),
  ingredients: z.array(recipeIngredientSchema).min(1, 'At least 1 ingredient is required'),
});

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const recipes = await prisma.recipe.findMany({
      where: { userId: session.user.id },
      include: {
        ingredients: {
          include: {
            foodItem: true,
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

    const { name, description, servings, prepTimeMin, ingredients } = parsed.data;

    const newRecipe = await prisma.recipe.create({
      data: {
        userId: session.user.id,
        name,
        description,
        servings,
        prepTimeMin,
        ingredients: {
          create: ingredients.map((ing) => ({
            foodItemId: ing.foodItemId,
            servingQuantity: ing.servingQuantity,
            unit: ing.unit,
          })),
        },
      },
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
