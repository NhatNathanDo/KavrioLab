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

    // 1. Check direct FoodItem barcode match in local database
    const existingItem = await prisma.foodItem.findUnique({
      where: { barcode: code },
    });

    if (existingItem) {
      return NextResponse.json({
        found: true,
        source: existingItem.verified ? 'local_verified' : 'local',
        item: existingItem,
      });
    }

    // 2. Check BarcodeMapping in local database
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
    try {
      const offResponse = await fetch(`https://world.openfoodfacts.org/api/v3/product/${encodeURIComponent(code)}.json`, {
        headers: {
          'User-Agent': 'KavrioLab - Fitness Operating System - Web Integration (developer@kavriolab.com)',
        },
        next: { revalidate: 3600 },
      });

      if (offResponse.ok) {
        const offData = await offResponse.json();
        if ((offData.status === 'success' || offData.status === 1) && offData.product) {
          const p = offData.product || {};
          const n = p.nutriments || {};

          const name = p.product_name || p.product_name_en || p.product_name_vi;
          if (name) {
            const brand = p.brands || 'OpenFoodFacts';
            const servingSize = p.serving_size || '100g';

            const calories = Math.round(Number(n['energy-kcal_100g'] || n.energy_100g / 4.184 || 0));
            const protein = Number((Number(n.proteins_100g || 0)).toFixed(2));
            const carbs = Number((Number(n.carbohydrates_100g || 0)).toFixed(2));
            const fat = Number((Number(n.fat_100g || 0)).toFixed(2));

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
          }
        }
      }
    } catch (err) {
      console.warn('OpenFoodFacts lookup error, proceeding to USDA fallback:', err);
    }

    // 4. Query USDA FoodData Central API by Barcode / GTIN / UPC
    try {
      const usdaApiKey = process.env.USDA_API_KEY || 'BRJMq9p5ansOl5i6s0XQwkPlxddhMFCnmWE7Sxwb';
      const usdaUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${usdaApiKey}&query=${encodeURIComponent(
        code
      )}&pageSize=5&dataType=Branded,SR%20Legacy,Foundation`;

      const usdaRes = await fetch(usdaUrl, {
        next: { revalidate: 3600 },
      });

      if (usdaRes.ok) {
        const usdaData = await usdaRes.json();
        const foods = Array.isArray(usdaData.foods) ? usdaData.foods : [];

        // Match by UPC/GTIN or first hit
        const cleanCode = code.replace(/^0+/, '');
        const matchedFood =
          foods.find((f: any) => f.gtinUpc && String(f.gtinUpc).replace(/^0+/, '') === cleanCode) ||
          foods[0];

        if (matchedFood && matchedFood.description) {
          const name = String(matchedFood.description).trim();
          const brand = matchedFood.brandOwner ? String(matchedFood.brandOwner).trim() : 'USDA FoodData Central';
          const servingSize = matchedFood.servingSize
            ? `${matchedFood.servingSize} ${matchedFood.servingSizeUnit || 'g'}`
            : matchedFood.servingSizeText || '100g';

          const nutrients = Array.isArray(matchedFood.foodNutrients) ? matchedFood.foodNutrients : [];
          const kcalObj = nutrients.find(
            (n: any) => n.unitName === 'KCAL' || n.nutrientId === 1008 || String(n.nutrientName).includes('Energy')
          );
          const pObj = nutrients.find(
            (n: any) => n.nutrientId === 1003 || String(n.nutrientName).includes('Protein')
          );
          const cObj = nutrients.find(
            (n: any) => n.nutrientId === 1005 || String(n.nutrientName).includes('Carbohydrate')
          );
          const fatObj = nutrients.find(
            (n: any) => n.nutrientId === 1004 || String(n.nutrientName).toLowerCase().includes('lipid') || String(n.nutrientName).toLowerCase().includes('fat')
          );

          const calories = Math.round(Number(kcalObj?.value ?? 0));
          const protein = Number(Number(pObj?.value ?? 0).toFixed(2));
          const carbs = Number(Number(cObj?.value ?? 0).toFixed(2));
          const fat = Number(Number(fatObj?.value ?? 0).toFixed(2));

          const savedUsdaItem = await prisma.foodItem.create({
            data: {
              name: name.slice(0, 150),
              brand: brand.slice(0, 100),
              servingSize: servingSize.slice(0, 80),
              calories,
              protein,
              carbs,
              fat,
              barcode: code,
              verified: true,
              isCustom: false,
            },
          });

          return NextResponse.json({
            found: true,
            source: 'usda_fdc',
            item: savedUsdaItem,
          });
        }
      }
    } catch (err) {
      console.warn('USDA FoodData lookup error:', err);
    }

    return NextResponse.json({ found: false, message: 'Barcode not found in OpenFoodFacts or USDA databases' }, { status: 404 });
  } catch (error) {
    console.error('Error scanning barcode API:', error);
    return NextResponse.json({ error: 'Failed to process barcode' }, { status: 500 });
  }
}
