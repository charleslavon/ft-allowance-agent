import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get current timestamp
    const now = Date.now();
    // Create timestamps for last 7 days, every 24 hours
    const timestamps = Array.from({length: 7}, (_, i) => now - (6-i) * 24 * 60 * 60 * 1000);
    
    // Mock portfolio value history with some realistic fluctuations
    const mockPortfolioHistory = {
      prices: timestamps.map(timestamp => [
        timestamp,
        // Generate somewhat realistic portfolio values around $2240 
        2240 + Math.sin(timestamp/8.64e7) * 100 + Math.random() * 50
      ]),
      tokens: [
        {
          symbol: "NEAR",
          balance: "100.5",
          usdValue: "550.75"
        },
        {
          symbol: "ETH",
          balance: "0.1",
          usdValue: "250.00"
        }
      ],
      totalUsdValue: "800.75"
    };

    return NextResponse.json(mockPortfolioHistory);
  } catch (error) {
    console.error('Error getting balance:', error);
    return NextResponse.json({ error: 'Failed to fetch balance' }, { status: 500 });
  }
}
