import { getUserCustomPracticeSets } from '@/app/actions/custom-practice-sets';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const practiceSets = await getUserCustomPracticeSets(userId);
    return NextResponse.json(practiceSets);
  } catch (error) {
    console.error('Error fetching practice sets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}