import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetch('http://localhost:8000/news', { cache: 'no-store' });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch news data from backend: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API /api/news Error:', error);
    return NextResponse.json({ error: 'Failed to fetch news data' }, { status: 500 });
  }
}
