import { NextResponse } from 'next/server';
import { dataService } from '@/lib/dataService';

export async function GET() {
  try {
    const data = await dataService.getSalesData();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retrieve data' }, { status: 500 });
  }
}
