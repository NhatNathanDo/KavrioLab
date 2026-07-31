import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { generateAIWeeklyStaples } from '@/lib/ai/gemini';

const addItemSchema = z.object({
  action: z.enum(['add_item', 'auto_generate']).default('add_item'),
  name: z.string().optional(),
  category: z.string().optional().default('General'),
  quantity: z.number().positive().optional().default(1),
  unit: z.string().optional().default('g'),
  foodItemId: z.string().uuid().optional(),
});

const updateItemSchema = z.object({
  id: z.string().uuid(),
  checked: z.boolean().optional(),
  quantity: z.number().positive().optional(),
});

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let shoppingList = await prisma.shoppingList.findFirst({
      where: { userId: session.user.id },
      include: {
        items: {
          orderBy: [{ checked: 'asc' }, { category: 'asc' }, { name: 'asc' }],
          include: { foodItem: true },
        },
      },
    });

    if (!shoppingList) {
      shoppingList = await prisma.shoppingList.create({
        data: {
          userId: session.user.id,
          name: 'Weekly Grocery Essentials',
          items: {
            create: [
              { name: 'Chicken Breast (Boneless/Skinless)', category: 'Proteins & Meats', quantity: 1500, unit: 'g' },
              { name: 'Rolled Oats (Dry)', category: 'Grains & Carbs', quantity: 500, unit: 'g' },
              { name: 'Whole Eggs (Large)', category: 'Proteins & Meats', quantity: 12, unit: 'large' },
              { name: 'Broccoli (Fresh/Frozen)', category: 'Produce & Fruits', quantity: 800, unit: 'g' },
              { name: 'Greek Yogurt (0% Plain)', category: 'Dairy & Supplements', quantity: 500, unit: 'g' },
            ],
          },
        },
        include: {
          items: {
            orderBy: [{ checked: 'asc' }, { category: 'asc' }, { name: 'asc' }],
            include: { foodItem: true },
          },
        },
      });
    }

    return NextResponse.json(shoppingList);
  } catch (error) {
    console.error('Error fetching shopping list:', error);
    return NextResponse.json({ error: 'Failed to fetch shopping list' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = addItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid shopping list payload', details: parsed.error.format() }, { status: 400 });
    }

    // Ensure list exists
    let shoppingList = await prisma.shoppingList.findFirst({
      where: { userId: session.user.id },
    });

    if (!shoppingList) {
      shoppingList = await prisma.shoppingList.create({
        data: { userId: session.user.id, name: 'Weekly Grocery Essentials' },
      });
    }

    if (parsed.data.action === 'auto_generate') {
      const [userProfile, recipes] = await Promise.all([
        (prisma as any).userProfile.findUnique({ where: { userId: session.user.id } }).catch(() => null),
        prisma.recipe.findMany({
          where: { userId: session.user.id },
          include: { ingredients: { include: { foodItem: true } } },
        }),
      ]);

      const recipeNames = recipes.map((r) => r.name);
      const aiStaples = await generateAIWeeklyStaples(
        userProfile?.goal || 'LEAN_GAIN',
        userProfile?.targetCalories || 2200,
        recipeNames
      );

      const staplesToInsert: { name: string; category: string; quantity: number; unit: string }[] = [...aiStaples];

      // Map recipe ingredients from user's custom saved recipes
      for (const recipe of recipes) {
        for (const ing of recipe.ingredients) {
          staplesToInsert.push({
            name: `${ing.foodItem.name} (${recipe.name})`,
            category: 'Recipe Ingredients',
            quantity: Number(ing.servingQuantity) * recipe.servings,
            unit: ing.unit || 'g',
          });
        }
      }

      await prisma.shoppingListItem.createMany({
        data: staplesToInsert.map((item) => ({
          shoppingListId: shoppingList.id,
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
        })),
      });

      const updatedList = await prisma.shoppingList.findUnique({
        where: { id: shoppingList.id },
        include: { items: { orderBy: [{ checked: 'asc' }, { category: 'asc' }] } },
      });

      return NextResponse.json(updatedList, { status: 201 });
    }

    // Single item add
    if (!parsed.data.name) {
      return NextResponse.json({ error: 'Item name is required' }, { status: 400 });
    }

    const newItem = await prisma.shoppingListItem.create({
      data: {
        shoppingListId: shoppingList.id,
        name: parsed.data.name,
        category: parsed.data.category || 'General',
        quantity: parsed.data.quantity || 1,
        unit: parsed.data.unit || 'g',
        foodItemId: parsed.data.foodItemId,
      },
      include: { foodItem: true },
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error('Error adding shopping item:', error);
    return NextResponse.json({ error: 'Failed to add shopping list item' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = updateItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid update payload', details: parsed.error.format() }, { status: 400 });
    }

    const { id, checked, quantity } = parsed.data;

    const existing = await prisma.shoppingListItem.findUnique({
      where: { id },
      include: { shoppingList: true },
    });

    if (!existing || existing.shoppingList.userId !== session.user.id) {
      return NextResponse.json({ error: 'Item not found or unauthorized' }, { status: 404 });
    }

    const updated = await prisma.shoppingListItem.update({
      where: { id },
      data: {
        ...(typeof checked === 'boolean' ? { checked } : {}),
        ...(typeof quantity === 'number' ? { quantity } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating shopping item:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
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
    const clearChecked = searchParams.get('clearChecked') === 'true';
    const clearAll = searchParams.get('clearAll') === 'true';

    const shoppingList = await prisma.shoppingList.findFirst({
      where: { userId: session.user.id },
    });

    if (!shoppingList) {
      return NextResponse.json({ error: 'Shopping list not found' }, { status: 404 });
    }

    if (clearAll) {
      await prisma.shoppingListItem.deleteMany({
        where: {
          shoppingListId: shoppingList.id,
        },
      });
      return NextResponse.json({ success: true, clearedAll: true });
    }

    if (clearChecked) {
      await prisma.shoppingListItem.deleteMany({
        where: {
          shoppingListId: shoppingList.id,
          checked: true,
        },
      });
      return NextResponse.json({ success: true, clearedChecked: true });
    }

    if (!id) {
      return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
    }

    const item = await prisma.shoppingListItem.findUnique({
      where: { id },
      include: { shoppingList: true },
    });

    if (!item || item.shoppingList.userId !== session.user.id) {
      return NextResponse.json({ error: 'Item not found or unauthorized' }, { status: 404 });
    }

    await prisma.shoppingListItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error('Error deleting shopping item:', error);
    return NextResponse.json({ error: 'Failed to delete shopping list item' }, { status: 500 });
  }
}
