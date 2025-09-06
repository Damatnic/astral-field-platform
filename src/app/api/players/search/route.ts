import { NextRequest, NextResponse } from 'next/server';
import playerService from '@/services/api/playerService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query')?.trim();
    const position = searchParams.get('position');
    const team = searchParams.get('team');
    const limit = searchParams.get('limit');
    const availability = searchParams.get('availability');

    // Validate query length
    if (query && query.length < 2) {
      return NextResponse.json(
        { 
          players: [], 
          message: 'Query must be at least 2 characters long',
          count: 0
        },
        { status: 200 }
      );
    }

    // Build search options
    const searchOptions: any = {};
    
    if (query) {
      searchOptions.search = query;
    }
    
    if (position && position !== 'all') {
      searchOptions.position = position;
    }
    
    if (team && team !== 'all') {
      searchOptions.team = team;
    }
    
    if (limit) {
      const parsedLimit = parseInt(limit, 10);
      if (parsedLimit > 0 && parsedLimit <= 100) {
        searchOptions.limit = parsedLimit;
      }
    }

    // Default limit if not specified
    if (!searchOptions.limit) {
      searchOptions.limit = 50;
    }

    // Get players from service
    const { players, error } = await playerService.getPlayers(searchOptions);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to search players: ' + error },
        { status: 500 }
      );
    }

    // Filter by availability if specified
    let filteredPlayers = players;
    if (availability === 'available') {
      // This would filter by players not currently rostered
      // For now, we'll return all players
      filteredPlayers = players;
    } else if (availability === 'injured') {
      filteredPlayers = players.filter(player => 
        player.injury_status && player.injury_status !== 'Healthy'
      );
    } else if (availability === 'healthy') {
      filteredPlayers = players.filter(player => 
        !player.injury_status || player.injury_status === 'Healthy'
      );
    }

    // Add additional metadata
    const enrichedPlayers = filteredPlayers.map(player => ({
      ...player,
      // Add projected points if available
      projected_points: typeof player.projections === 'object' && player.projections && 'fantasyPoints' in player.projections ? (player.projections as any).fantasyPoints : 0,
      // Add team info
      team_info: {
        abbreviation: player.nfl_team,
        bye_week: player.bye_week
      },
      // Add search relevance score
      relevance_score: query ? calculateRelevanceScore(player, query) : 1
    }));

    // Sort by relevance score if there's a query, otherwise by projected points
    enrichedPlayers.sort((a, b) => {
      if (query) {
        return b.relevance_score - a.relevance_score;
      }
      return (b.projected_points || 0) - (a.projected_points || 0);
    });

    return NextResponse.json({
      players: enrichedPlayers,
      count: enrichedPlayers.length,
      query: query || null,
      filters: {
        position: position || 'all',
        team: team || 'all',
        availability: availability || 'all'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Player search API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error during player search',
        players: [],
        count: 0
      },
      { status: 500 }
    );
  }
}

// Calculate relevance score for search results
function calculateRelevanceScore(player: any, query: string): number {
  const searchTerm = query.toLowerCase();
  const playerName = player.name.toLowerCase();
  const playerTeam = player.nfl_team.toLowerCase();
  const playerPosition = player.position.toLowerCase();
  
  let score = 0;
  
  // Exact name match gets highest score
  if (playerName === searchTerm) {
    score += 10;
  }
  // Name starts with query
  else if (playerName.startsWith(searchTerm)) {
    score += 8;
  }
  // Name contains query
  else if (playerName.includes(searchTerm)) {
    score += 5;
  }
  
  // Team match
  if (playerTeam === searchTerm || playerTeam.includes(searchTerm)) {
    score += 3;
  }
  
  // Position match
  if (playerPosition === searchTerm) {
    score += 4;
  }
  
  // Boost score based on player quality (using projections as proxy)
  if (typeof player.projections === 'object' && player.projections && 'fantasyPoints' in player.projections) {
    score += Math.min((player.projections as any).fantasyPoints / 10, 2);
  }
  
  return score;
}

// Additional utility endpoint for popular searches
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'trending':
        // Return trending/popular players
        const { players: trendingPlayers } = await playerService.getTopPlayers(20);
        return NextResponse.json({
          players: trendingPlayers,
          type: 'trending',
          count: trendingPlayers.length
        });

      case 'hot-pickups':
        // Return players frequently being picked up
        const { players: hotPickups } = await playerService.getPlayers({ limit: 15 });
        const filteredPickups = hotPickups.filter(player => 
          player.projections && typeof player.projections === 'object' && 'fantasyPoints' in player.projections && (player.projections as any).fantasyPoints > 5
        );
        
        return NextResponse.json({
          players: filteredPickups,
          type: 'hot-pickups', 
          count: filteredPickups.length
        });

      case 'breakouts':
        // Return potential breakout candidates
        const { players: breakoutCandidates } = await playerService.getPlayers({ limit: 10 });
        
        return NextResponse.json({
          players: breakoutCandidates,
          type: 'breakouts',
          count: breakoutCandidates.length
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Player search POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}