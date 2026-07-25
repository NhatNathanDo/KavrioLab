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
    const code = searchParams.get('code')?.trim();

    if (!code || code.length < 4) {
      return NextResponse.json({ error: 'Invalid barcode query' }, { status: 400 });
    }

    // 1. Check direct FoodItem barcode match
    let existingItem = await prisma.foodItem.findUnique({
      where: { barcode: code },
    });

    if (existingItem) {
      return NextResponse.json({
        found: true,
        source: existingItem.verified ? 'local_verified' : 'local',
        item: existingItem,
      });
    }

    // 2. Check BarcodeMapping
    const mapping = await prisma.barcodeMapping.findUnique({
      where: { barcode: code },
      include: { foodItem: true },
    });

    if (mapping && mapping.foodItem) {
      return NextResponse.json({
        found: true,
        source: 'local_mapping',
        item: mapping.foodItem,
      });
    }

    // 3. Query OpenFoodFacts v3 API
    const offResponse = await fetch(`https://world.openfoodfacts.org/api/v3/product/${encodeURIComponent(code)}.json`, {
      headers: {
        'User-Agent': 'KavrioLab - Fitness Operating System - Web Integration (developer@kavriolab.com)',
      },
      next: { revalidate: 3600 },
    });

    if (!offResponse.ok) {
      return NextResponse.json({ found: false, message: 'Barcode not found in OpenFoodFacts v3' }, { status: 404 });
    }

    const offData = await offResponse.json();
    if (offData.status !== 'success' && offData.status !== 1 && !offData.product) {
      return NextResponse.json({ found: false, message: 'Product profile unavailable for this barcode' }, { status: 404 });
    }

    const p = offData.product || {};
    const n = p.nutriments || {};

    const name = p.product_name || p.product_name_en || p.product_name_vi || `Scanned Product (${code})`;
    const brand = p.brands || 'OpenFoodFacts';
    const servingSize = p.serving_size || '100g';

    const calories = Math.round(Number(n['energy-kcal_100g'] || n.energy_100g / 4.184 || 0));
    const protein = Number((Number(n.proteins_100g || 0)).toFixed(2));
    const carbs = Number((Number(n.carbohydrates_100g || 0)).toFixed(2));
    const fat = Number((Number(n.fat_100g || 0)).toFixed(2));

    // Save to local DB so subsequent barcode scans are instantaneous
    const savedItem = await prisma.foodItem.create({
      data: {
        name: name.slice(0, 150),
        brand: brand.slice(0, 100),
        servingSize: servingSize.slice(0, 80),
        calories,
        protein,
        carbs,
        fat,
        barcode: code,
        verified: false,
        isCustom: false,
      },
    });

    return NextResponse.json({
      found: true,
      source: 'off_v3',
      item: savedItem,
    });
  } catch (error) {
    console.error('Error scanning barcode API:', error);
    return NextResponse.json({ error: 'Failed to process barcode' }, { status: 500 });
  }
}
