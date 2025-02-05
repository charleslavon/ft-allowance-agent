import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Mock successful removal
    return NextResponse.json({ 
      success: true,
      message: 'Allowance removed successfully'
    });
  } catch (error) {
    console.error('Error removing allowance:', error);
    return NextResponse.json({ error: 'Failed to remove allowance' }, { status: 500 });
  }
}
