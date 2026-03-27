import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API;

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ type: string; symbol: string }> }
) {
    try {
        const { type, symbol } = await params;
        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || '1y';
        const interval = searchParams.get('interval') || '1d';

        const response = await fetch(
            `${API_BASE_URL}/history/${type}/${symbol}?period=${period}&interval=${interval}`
        );
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching history data:', error);
        return NextResponse.json({ error: 'Failed to fetch history data', bars: [] }, { status: 500 });
    }
}
