import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const leagueId = searchParams.get('leagueId');
    const position = searchParams.get('position');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (!leagueId) {
      return NextResponse.json(
        { error: 'League ID is required' },
        { status: 400 }
      );
    }

    // Mock player valuations
    const valuations = [
      {
        playerId: 'player_123',
        playerName: 'Josh Allen',
        team: 'BUF',
        position: 'QB',
        currentValue: 45.2,
        projectedValue: 47.8,
        trend: 'up',
        tradeValue: 'high',
        confidence: 92
      },
      {
        playerId: 'player_456',
        playerName: 'Christian McCaffrey',
        team: 'SF',
        position: 'RB',
        currentValue: 42.1,
        projectedValue: 39.5,
        trend: 'down',
        tradeValue: 'sell',
        confidence: 88
      },
      {
        playerId: 'player_789',
        playerName: 'Cooper Kupp',
        team: 'LAR',
        position: 'WR',
        currentValue: 32.8,
        projectedValue: 35.2,
        trend: 'up',
        tradeValue: 'buy',
        confidence: 85
      }
    ];

    // Filter by position if provided
    const filteredValuations = position && position !== 'all'
      ? valuations.filter(v => v.position === position.toUpperCase())
      : valuations;

    // Apply limit
    const limitedValuations = filteredValuations.slice(0, limit);

    return NextResponse.json({
      success: true,
      valuations: limitedValuations,
      metadata: {
        total: limitedValuations.length,
        position: position || 'all',
        lastUpdated: new Date().toISOString()
      }
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch player valuations' },
      { status: 500 }
    );
  }
}
