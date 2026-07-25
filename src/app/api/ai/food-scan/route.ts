import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { analyzeFoodImage } from '@/lib/ai/gemini';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return NextResponse.json({ error: 'Missing image payload' }, { status: 400 });
    }

    const scanResult = await analyzeFoodImage(imageBase64);
    return NextResponse.json(scanResult);
  } catch (error) {
    console.error('Error scanning food image with AI:', error);
    return NextResponse.json(
      { error: 'Failed to scan food image', details: (error as Error).message },
      { status: 500 }
    );
  }
}
