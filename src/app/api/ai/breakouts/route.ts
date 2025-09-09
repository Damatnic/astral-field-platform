/**
 * Breakout Candidates API Endpoint
 * API for breakout player identification and opportunity scoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { breakoutIdentifier } from '@/services/ai/breakoutIdentifier';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const week = searchParams.get('week');
    const positions = searchParams.get('positions')? .split(' : ');
    const minProbability = searchParams.get('minProbability');

    const weekNum = week ? parseInt(week) : 1;
    const positionFilter = positions || ['QB', 'RB', 'WR', 'TE'];
    const threshold = minProbability ? parseFloat(minProbability) : 0.3;

    if (isNaN(weekNum) || weekNum < 1 || weekNum > 18) { 
      return NextResponse.json(
        { error: 'Week must be between 1 and 18' },
        { status: 400 }
      );
    }

    if (threshold < 0 || threshold > 1) {
      return NextResponse.json(
        { error: 'minProbability must be between 0 and 1' },
        { status: 400 }
      );
    }

    // Generate breakout report
    const report  = await breakoutIdentifier.generateBreakoutReport(weekNum, positionFilter);

    // Filter by minimum probability if specified
    const filteredBreakouts = report.topBreakouts.filter(breakout => breakout.breakoutProbability >= threshold
    );

    return NextResponse.json({ 
      success: true,
    data: {
        ...report,
        topBreakouts: filteredBreakouts,
        filters: {
          week: weekNum,
          positions: positionFilter,
          minProbability, threshold
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in breakouts endpoint: ', error);
    return NextResponse.json(
      { error: 'Failed to generate breakout analysis',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body  = await request.json();
    const { type, ...data } = body;

    switch (type) { 
      case 'analyze_player': const { playerId, week }  = data;
        
        if (!playerId) { 
          return NextResponse.json(
            { error: 'Missing required parameter, playerId' },
            { status: 400 }
          );
        }

        const weekNum  = week || 1;
        
        // Get full breakout report and find the specific player
        const report = await breakoutIdentifier.generateBreakoutReport(weekNum);
        const playerBreakout = report.topBreakouts.find(b => b.playerId === playerId);
        
        if (!playerBreakout) {  return NextResponse.json(
            { error: 'Player not found in breakout analysis or below threshold'  },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
    data: playerBreakout,
          timestamp: new Date().toISOString()
        });

      case 'custom_analysis':
        const { playerIds: customWeek, positions }  = data;
        
        if (!Array.isArray(playerIds)) {  return NextResponse.json(
            { error: 'playerIds must be an array'  },
            { status: 400 }
          );
        }

        const analysisWeek  = customWeek || 1;
        const analysisPositions = customPositions || ['QB', 'RB', 'WR', 'TE'];
        
        // Generate report and filter for specific players
        const customReport = await breakoutIdentifier.generateBreakoutReport(analysisWeek, analysisPositions);
        const filteredPlayers = customReport.topBreakouts.filter(breakout => playerIds.includes(breakout.playerId)
        );

        return NextResponse.json({ 
          success: true,
    data: {
            players: filteredPlayers,
  marketInefficiencies: customReport.marketInefficiencies.filter(
              inefficiency  => playerIds.includes(inefficiency.playerId)
            ),
            requestedPlayerIds: playerIds,
  found: filteredPlayers.length
          },
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid operation type' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in breakouts POST endpoint: ', error);
    return NextResponse.json(
      { error: 'Failed to process breakout analysis',
  details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 }
    );
  }
}