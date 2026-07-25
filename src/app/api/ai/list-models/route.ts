import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not set in .env' }, { status: 400 });
    }

    // Direct fetch to Google AI Studio v1beta models API
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch model list from Google', googleError: data }, { status: res.status });
    }

    const availableModels = (data.models || [])
      .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
      .map((m: any) => ({
        name: m.name.replace('models/', ''),
        displayName: m.displayName,
        description: m.description,
      }));

    return NextResponse.json({
      success: true,
      count: availableModels.length,
      models: availableModels,
    });
  } catch (error) {
    console.error('Error fetching Gemini models list:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
