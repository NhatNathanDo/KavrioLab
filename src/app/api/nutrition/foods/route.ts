import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

interface StandardizedFoodItem {
  id: string;
  name: string;
  brand: string | null;
  servingSize: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  barcode: string | null;
  verified: boolean;
  isCustom: boolean;
  source: 'local' | 'off' | 'usda';
}


const CreateCustomFoodSchema = z.object({
  name: z.string().min(2, 'Name required').max(200),
  brand: z.string().max(100).optional().nullable(),
  servingSize: z.string().max(50).optional().nullable(),
  calories: z.number().int().min(0).max(10000),
  protein: z.number().min(0).max(1000),
  carbs: z.number().min(0).max(1000),
  fat: z.number().min(0).max(1000),
  barcode: z.string().max(50).optional().nullable(),
});

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') ?? '').trim();
  const source = (searchParams.get('source') ?? 'all').toLowerCase(); // 'all' | 'local' | 'off'

  const page = Math.max(1, Number(searchParams.get('page') ?? 1) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') ?? 24) || 24));
  const results: StandardizedFoodItem[] = [];
  let totalCount = 0;

  // 1. Query Local Database (if source === 'all' || source === 'local')
  if (source === 'all' || source === 'local') {
    try {
      const whereClause: Record<string, unknown> = {};
      if (query) {
        // Search across name, brand, or barcode
        whereClause.OR = [
          { name: { contains: query, mode: 'insensitive' } },
          { brand: { contains: query, mode: 'insensitive' } },
          { barcode: { equals: query } },
        ];
      }

      // Include general verified foods OR foods custom created by this user
      whereClause.AND = [
        {
          OR: [
            { isCustom: false },
            { userId: session.user.id },
          ],
        },
      ];

      const localCount = await prisma.foodItem.count({
        where: whereClause as never,
      });
      totalCount += localCount;

      const localFoods = await prisma.foodItem.findMany({
        where: whereClause as never,
        orderBy: [{ verified: 'desc' }, { name: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      });

      for (const item of localFoods) {
        results.push({
          id: item.id,
          name: item.name,
          brand: item.brand,
          servingSize: item.servingSize,
          calories: item.calories,
          protein: Number(item.protein),
          carbs: Number(item.carbs),
          fat: Number(item.fat),
          barcode: item.barcode,
          verified: item.verified,
          isCustom: item.isCustom,
          source: 'local',
        });
      }
    } catch (err) {
      console.error('Error querying local FoodItem DB:', err);
    }
  }

  // 2. Query OpenFoodFacts API (if source === 'off' or if source === 'all' with query >= 3 chars or barcode)
  const isBarcode = /^\d{8,14}$/.test(query);
  if (source === 'off' || (source === 'all' && (query.length >= 3 || isBarcode))) {
    try {
      let offUrl = '';

      if (isBarcode) {
        // v3 API is the recommended endpoint for all new product lookups
        offUrl = `https://world.openfoodfacts.org/api/v3/product/${query}.json`;
      } else if (query) {
        // v1 API is required for full-text search because v2 server-side search does not support search_terms
        offUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
          query
        )}&search_simple=1&action=process&json=1&page=${page}&page_size=${pageSize}&fields=code,product_name,product_name_en,brands,serving_size,nutriments`;
      } else {
        // v2 API with sort_by=unique_scans_n is optimal for browsing popular products across pages
        offUrl = `https://world.openfoodfacts.org/api/v2/search?sort_by=unique_scans_n&fields=code,product_name,product_name_en,brands,serving_size,nutriments&page=${page}&page_size=${pageSize}`;
      }

      const offResponse = await fetch(offUrl, {
        headers: {
          'User-Agent': 'KavrioLab/1.0 (contact@kavriolab.app)',
        },
        next: { revalidate: 3600 }, // Cache search results for 1 hour to respect rate limits
      });

      if (offResponse.ok) {
        const offData = await offResponse.json();
        const products = isBarcode
          ? (offData.status === 'success' || offData.status === 1 ? [offData.product] : [])
          : (Array.isArray(offData.products) ? offData.products : []);

        if (source === 'off' || source === 'all') {
          totalCount += Number(offData.count || products.length || 0);
        }

        for (const p of products) {
          if (!p || (!p.product_name && !p.product_name_en)) continue;

          const name = (p.product_name || p.product_name_en || 'Unknown Product').trim();
          const brand = p.brands ? p.brands.split(',')[0].trim() : 'OpenFoodFacts';
          const servingSize = p.serving_size || '100g';
          const nutriments = p.nutriments || {};

          const calories = Math.round(Number(nutriments['energy-kcal_100g'] ?? nutriments['energy-kcal'] ?? 0));
          const protein = Number(Number(nutriments['proteins_100g'] ?? nutriments.proteins ?? 0).toFixed(1));
          const carbs = Number(Number(nutriments['carbohydrates_100g'] ?? nutriments.carbohydrates ?? 0).toFixed(1));
          const fat = Number(Number(nutriments['fat_100g'] ?? nutriments.fat ?? 0).toFixed(1));

          // Only filter out rows that have NO usable nutriments AND no meaningful product name
          if (calories === 0 && protein === 0 && carbs === 0 && fat === 0 && (name === 'Unknown Product' || !name)) continue;

          // Avoid duplicating items already present in local DB with same barcode
          const barcode = p.code ? String(p.code) : null;
          if (barcode && results.some((r) => r.barcode === barcode)) continue;

          results.push({
            id: `off_${barcode || Math.random().toString(36).substring(2, 9)}`,
            name,
            brand,
            servingSize,
            calories,
            protein,
            carbs,
            fat,
            barcode,
            verified: false,
            isCustom: false,
            source: 'off',
          });
        }
      }
    } catch (err) {
      console.error('Error fetching from OpenFoodFacts API:', err);
    }
  }

  // 3. Query USDA FoodData Central API (if source === 'usda' || (source === 'all' && query.length >= 2))
  const usdaApiKey = process.env.USDA_API_KEY || 'BRJMq9p5ansOl5i6s0XQwkPlxddhMFCnmWE7Sxwb';
  if (source === 'usda' || (source === 'all' && query.length >= 2)) {
    try {
      const usdaUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${usdaApiKey}&query=${encodeURIComponent(
        query || ''
      )}&pageSize=${pageSize}&pageNumber=${page}&dataType=SR%20Legacy,Foundation,Branded`;

      const usdaResponse = await fetch(usdaUrl, {
        next: { revalidate: 3600 }, // Cache results for 1 hour
      });

      if (usdaResponse.ok) {
        const usdaData = await usdaResponse.json();
        const foods = Array.isArray(usdaData.foods) ? usdaData.foods : [];

        if (source === 'usda' || source === 'all') {
          totalCount += Number(usdaData.totalHits || foods.length || 0);
        }

        for (const f of foods) {
          if (!f || !f.description) continue;

          const name = String(f.description).trim();
          const brand = f.brandOwner ? String(f.brandOwner).trim() : 'USDA FoodData';
          const servingSize = f.servingSize
            ? `${f.servingSize} ${f.servingSizeUnit || 'g'}`
            : f.servingSizeText || '100g';

          const nutrients = Array.isArray(f.foodNutrients) ? f.foodNutrients : [];
          const kcalObj = nutrients.find(
            (n: Record<string, unknown>) => n.unitName === 'KCAL' || n.nutrientId === 1008 || String(n.nutrientName).includes('Energy')
          );
          const pObj = nutrients.find(
            (n: Record<string, unknown>) => n.nutrientId === 1003 || String(n.nutrientName).includes('Protein')
          );
          const cObj = nutrients.find(
            (n: Record<string, unknown>) => n.nutrientId === 1005 || String(n.nutrientName).includes('Carbohydrate')
          );
          const fatObj = nutrients.find(
            (n: Record<string, unknown>) => n.nutrientId === 1004 || String(n.nutrientName).toLowerCase().includes('lipid') || String(n.nutrientName).toLowerCase().includes('fat')
          );

          const calories = Math.round(Number(kcalObj?.value ?? 0));
          const protein = Number(Number(pObj?.value ?? 0).toFixed(1));
          const carbs = Number(Number(cObj?.value ?? 0).toFixed(1));
          const fat = Number(Number(fatObj?.value ?? 0).toFixed(1));

          if (calories === 0 && protein === 0 && carbs === 0 && fat === 0 && !name) continue;

          const barcode = f.gtinUpc ? String(f.gtinUpc) : null;
          if (barcode && results.some((r) => r.barcode === barcode)) continue;

          results.push({
            id: `usda_${f.fdcId || Math.random().toString(36).substring(2, 9)}`,
            name,
            brand,
            servingSize,
            calories,
            protein,
            carbs,
            fat,
            barcode,
            verified: true, // USDA FoodData Central is a government verified database
            isCustom: false,
            source: 'usda',
          });
        }
      }
    } catch (err) {
      console.error('Error fetching from USDA FoodData Central API:', err);
    }
  }

  return NextResponse.json({

    foods: results,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    },
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = CreateCustomFoodSchema.parse(body);

    const newFood = await prisma.foodItem.create({
      data: {
        name: parsed.name,
        brand: parsed.brand || null,
        servingSize: parsed.servingSize || '100g',
        calories: parsed.calories,
        protein: parsed.protein,
        carbs: parsed.carbs,
        fat: parsed.fat,
        barcode: parsed.barcode || null,
        verified: false,
        isCustom: true,
        userId: session.user.id,
      } as never,
    });

    return NextResponse.json({ food: newFood }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
