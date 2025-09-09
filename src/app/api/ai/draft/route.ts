/**
 * AI Draft API Endpoint
 * API for draft assistance and mock draft simulation
 */

import { NextRequest, NextResponse } from 'next/server';
import { draftAssistant } from '@/services/draft/draftAssistant';
import { mockDraftSimulator } from '@/services/draft/mockDraftSimulator';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    switch (type) {
      case 'recommendations':
        const leagueId = searchParams.get('leagueId');
        const teamId = searchParams.get('teamId');
        const currentPick = searchParams.get('currentPick');
        const availablePlayers = searchParams.get('availablePlayers')?.split(',');
        
        if (!leagueId || !teamId || !currentPick) {
          return NextResponse.json(
            { error: 'Missing required parameters: leagueId, teamId and currentPick' },
            { status: 400 }
          );
        }

        const pickNumber = parseInt(currentPick);
        if (isNaN(pickNumber) || pickNumber < 1) {
          return NextResponse.json(
            { error: 'currentPick must be a positive number' },
            { status: 400 }
          );
        }

        const recommendations = await draftAssistant.getDraftRecommendations(
          leagueId, teamId, pickNumber,
          availablePlayers
        );

        return NextResponse.json({
          success: true,
          data: recommendations,
          count: recommendations.length,
          timestamp: new Date().toISOString()
        });

      case 'team_needs':
        const needsLeagueId = searchParams.get('leagueId');
        const needsTeamId = searchParams.get('teamId');
        
        if (!needsLeagueId || !needsTeamId) {
          return NextResponse.json(
            { error: 'Missing required parameters: leagueId and teamId' },
            { status: 400 }
          );
        }

        const teamNeeds = await draftAssistant.analyzeTeamNeeds(needsLeagueId, needsTeamId);

        return NextResponse.json({
          success: true,
          data: teamNeeds,
          timestamp: new Date().toISOString()
        });

      case 'pick_trade_value':
        const tradePickNumber = searchParams.get('pickNumber');
        
        if (!tradePickNumber) {
          return NextResponse.json(
            { error: 'Missing required parameter: pickNumber' },
            { status: 400 }
          );
        }

        const pick = parseInt(tradePickNumber);
        if (isNaN(pick) || pick < 1) {
          return NextResponse.json(
            { error: 'pickNumber must be a positive number' },
            { status: 400 }
          );
        }

        const tradeValue = await draftAssistant.getPickTradeValue(pick);

        return NextResponse.json({
          success: true,
          data: {
            pickNumber: pick,
            tradeValue
          },
          timestamp: new Date().toISOString()
        });

      case 'mock_draft_result':
        const draftId = searchParams.get('draftId');
        
        if (!draftId) {
          return NextResponse.json(
            { error: 'Missing required parameter: draftId' },
            { status: 400 }
          );
        }

        const draftResult = mockDraftSimulator.getDraftResult(draftId);
        
        if (!draftResult) {
          return NextResponse.json(
            { error: 'Draft not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          data: draftResult,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid type parameter. Use: recommendations, team_needs, pick_trade_value, mock_draft_result' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in draft GET endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process draft request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ...data } = body;

    switch (type) {
      case 'track_pick':
        const { leagueId, pickNumber, teamId, playerId } = data;

        if (!leagueId || pickNumber === undefined || !teamId || !playerId) {
          return NextResponse.json(
            { error: 'Missing required parameters: leagueId, pickNumber, teamId, playerId' },
            { status: 400 }
          );
        }

        await draftAssistant.trackDraftProgress(leagueId, pickNumber, teamId, playerId);

        return NextResponse.json({
          success: true,
          message: 'Draft pick tracked successfully',
          timestamp: new Date().toISOString()
        });

      case 'start_mock_draft':
        const { userTeamId, settings } = data;

        if (!userTeamId || !settings) {
          return NextResponse.json(
            { error: 'Missing required parameters: userTeamId and settings' },
            { status: 400 }
          );
        }

        // Validate settings
        const requiredSettings = ['leagueSize', 'rounds', 'scoringFormat', 'startingPositions'];
        const missingSettings = requiredSettings.filter(setting => !settings[setting]);
        
        if (missingSettings.length > 0) {
          return NextResponse.json(
            { error: `Missing required settings: ${missingSettings.join(', ')}` },
            { status: 400 }
          );
        }

        const draftId = await mockDraftSimulator.startMockDraft(userTeamId, settings);

        return NextResponse.json({
          success: true,
          data: {
            draftId,
            message: 'Mock draft started successfully'
          },
          timestamp: new Date().toISOString()
        });

      case 'simulate_full_draft':
        const { draftId: simDraftId } = data;
        
        if (!simDraftId) {
          return NextResponse.json(
            { error: 'Missing required parameter: draftId' },
            { status: 400 }
          );
        }

        const simulationResult = await mockDraftSimulator.simulateFullDraft(simDraftId);

        return NextResponse.json({
          success: true,
          data: simulationResult,
          timestamp: new Date().toISOString()
        });

      case 'make_user_pick':
        const { userDraftId, pickUserTeamId, pickPlayerId } = data;

        if (!userDraftId || !pickUserTeamId || !pickPlayerId) {
          return NextResponse.json(
            { error: 'Missing required parameters: draftId, userTeamId, playerId' },
            { status: 400 }
          );
        }

        const userPick = await mockDraftSimulator.makeUserPick(userDraftId, pickUserTeamId, pickPlayerId);

        return NextResponse.json({
          success: true,
          data: userPick,
          timestamp: new Date().toISOString()
        });

      case 'get_pick_recommendations':
        const { recDraftId, recUserTeamId, count } = data;

        if (!recDraftId || !recUserTeamId) {
          return NextResponse.json(
            { error: 'Missing required parameters: draftId, userTeamId' },
            { status: 400 }
          );
        }

        const pickRecommendations = await mockDraftSimulator.getPickRecommendations(recDraftId, recUserTeamId, count || 5);

        return NextResponse.json({
          success: true,
          data: pickRecommendations,
          count: pickRecommendations.length,
          timestamp: new Date().toISOString()
        });

      case 'cleanup_draft':
        const { draftId: cleanupDraftId } = data;
        
        if (!cleanupDraftId) {
          return NextResponse.json(
            { error: 'Missing required parameter: draftId' },
            { status: 400 }
          );
        }

        mockDraftSimulator.cleanup(cleanupDraftId);

        return NextResponse.json({
          success: true,
          message: 'Draft cleaned up successfully',
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid operation type. Use: track_pick, start_mock_draft, simulate_full_draft, make_user_pick, get_pick_recommendations, cleanup_draft' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in draft POST endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process draft request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}