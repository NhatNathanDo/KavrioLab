import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, createAuditLog } from '@/lib/auth/admin';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const unverifiedFoods = await prisma.foodItem.findMany({
    where: { verified: false },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({ foods: unverifiedFoods });
}

export async function POST(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { foodId, action } = body; // action: "APPROVE" | "REJECT"

  if (!foodId || !action) {
    return NextResponse.json({ error: 'Missing foodId or action' }, { status: 400 });
  }

  if (action === 'APPROVE') {
    const updatedFood = await prisma.foodItem.update({
      where: { id: foodId },
      data: { verified: true },
    });

    await createAuditLog({
      userId: admin.id,
      action: 'APPROVE_FOOD',
      targetType: 'FoodItem',
      targetId: foodId,
      details: `Approved food "${updatedFood.name}" for global database verification`,
    });

    return NextResponse.json({ food: updatedFood, message: 'Food item approved' });
  } else if (action === 'REJECT') {
    const deletedFood = await prisma.foodItem.delete({
      where: { id: foodId },
    });

    await createAuditLog({
      userId: admin.id,
      action: 'REJECT_FOOD',
      targetType: 'FoodItem',
      targetId: foodId,
      details: `Rejected & removed custom food "${deletedFood.name}"`,
    });

    return NextResponse.json({ message: 'Food item rejected and deleted' });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
