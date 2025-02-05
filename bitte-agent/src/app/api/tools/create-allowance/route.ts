import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { targetGrowthRate, allowanceAmount, frequency, stablecoin } = body;

    // Validate required fields
    if (!targetGrowthRate || !allowanceAmount || !frequency || !stablecoin) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Mock successful creation
    return NextResponse.json({ 
      success: true,
      message: `Allowance created: ${allowanceAmount} ${stablecoin} when portfolio grows ${targetGrowthRate}% (${frequency})`
    });
  } catch (error) {
    console.error('Error creating allowance:', error);
    return NextResponse.json({ error: 'Failed to create allowance' }, { status: 500 });
  }
}
