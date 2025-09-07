import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const leagueId = searchParams.get('leagueId');

    if (!leagueId) {
      return NextResponse.json(
        { error: 'League ID is required' },
        { status: 400 }
      );
    }

    // Mock live league data
    const liveData = {
      leagueId,
      isLive: true,
      currentWeek: 14,
      lastUpdated: new Date().toISOString(),
      activeMatches: [
        {
          gameId: 'game_1',
          homeTeam: 'KC',
          awayTeam: 'LV',
          quarter: 2,
          timeRemaining: '8:45',
          homeScore: 14,
          awayScore: 7
        }
      ],
      playerUpdates: [
        {
          playerId: 'player_123',
          name: 'Patrick Mahomes',
          team: 'KC',
          position: 'QB',
          points: 18.5,
          projectedPoints: 22.0
        }
      ]
    };

    return NextResponse.json(liveData);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch live league data' },
      { status: 500 }
    );
  }
}
