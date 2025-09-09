import { NextRequest, NextResponse } from 'next/server';
import { draftAssistant } from '@/services/draft/draftAssistant';

export async function POST(
  request: NextRequest,
  { params }: { params: { leagueId: string } }
) {
  try {
    const { leagueId } = params;
    const body = await request.json();
    const { teamId, currentPick, draftedPlayerIds = [] } = body;

    if (!leagueId || !teamId || !currentPick) {
      return NextResponse.json(
        { error: 'League ID, team ID, and current pick are required' },
        { status: 400 }
      );
    }

    console.log(`🎯 Getting draft recommendations for team ${teamId} in league ${leagueId}, pick ${currentPick}`);

    // Get AI-powered recommendations
    const recommendations = await draftAssistant.getDraftRecommendations(leagueId, teamId, currentPick,
      draftedPlayerIds
    );

    // Transform recommendations to match our interface
    const formattedRecommendations = recommendations.map(rec => ({
      id: rec.playerId,
      name: rec.playerName,
      position: rec.position,
      team: rec.team,
      overallRank: rec.overallRank,
      positionRank: rec.positionRank,
      projectedPoints: rec.leagueContext?.replacementLevel || 0,
      confidence: rec.confidence,
      valueScore: rec.valueScore,
      riskLevel: rec.riskLevel,
      scarcityFactor: rec.scarcityFactor,
      reasoning: rec.reasoning
    }));

    // Get team analysis
    const teamNeeds = await draftAssistant.analyzeTeamNeeds(leagueId, teamId);
    
    // Get draft strategy
    const draftAnalysis = {
      recommendations: formattedRecommendations,
      teamNeeds,
      nextRecommendedPositions: teamNeeds.targetPositions,
      draftStrategy: {
        approach: teamNeeds.draftStrategy,
        focusPositions: teamNeeds.targetPositions,
        overallNeed: teamNeeds.overallNeeds
      }
    };
    console.log(`✅ Generated ${recommendations.length} recommendations for team ${teamId}`);

    return NextResponse.json({
      success: true,
      recommendations: formattedRecommendations,
      analysis: draftAnalysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Draft recommendations error: ', error);
    
    // Fallback recommendations if AI service fails
    const fallbackRecommendations = [
      { 
        id: 'fallback_1',
        name: 'Christian McCaffrey',
        position: 'RB',
        team: 'SF',
        overallRank: 1,
        positionRank: 1,
        projectedPoints: 285.5,
        confidence: 85,
        valueScore: 92,
        riskLevel: 'low' as const,
        scarcityFactor: 0.9,
        reasoning: ['Elite RB1 with proven track record', 'High target share in passing game', 'Strong offensive line support']
      },
      {
        id: 'fallback_2',
        name: 'Josh Allen',
        position: 'QB',
        team: 'BUF',
        overallRank: 5,
        positionRank: 1,
        projectedPoints: 378.2,
        confidence: 90,
        valueScore: 88,
        riskLevel: 'low' as const,
        scarcityFactor: 0.7,
        reasoning: ['Dual-threat QB with highest ceiling', 'Excellent supporting cast', 'Proven fantasy performer']
      },
      {
        id: 'fallback_3',
        name: 'Tyreek Hill',
        position: 'WR',
        team: 'MIA',
        overallRank: 8,
        positionRank: 3,
        projectedPoints: 243.8,
        confidence: 82,
        valueScore: 85,
        riskLevel: 'medium' as const,
        scarcityFactor: 0.6,
        reasoning: ['Elite speed creates big-play potential', 'Strong QB-WR connection', 'High target volume expected']
      }
    ];

    return NextResponse.json({
      success: true,
      recommendations: fallbackRecommendations,
      analysis: {
        teamNeeds: {
          QB: 7,
          RB: 8,
          WR: 6,
          TE: 5,
          K: 3,
          DST: 3
        },
        nextRecommendedPositions: ['RB', 'QB'],
        draftStrategy: {
          approach: 'balanced',
          focusPositions: ['RB', 'WR'],
          overallNeed: 6.5
        }
      },
      timestamp: new Date().toISOString(),
      fallback: true
    });
  }
}

// Get historical draft data and analytics
export async function GET(request: NextRequest) {
  try {
    const { leagueId } = params;
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    
    if (!leagueId) {
      return NextResponse.json(
        { error: 'League ID is required' },
        { status: 400 }
      );
    }

    // Mock draft analytics data
    const mockAnalytics = {
      leagueId,
      averagePickTime: 48.5,
      totalPicks: 192,
      completedPicks: 0,
      positionBreakdown: {
        QB: { drafted: 0, available: 32, avgRank: 45 },
        RB: { drafted: 0, available: 58, avgRank: 28 },
        WR: { drafted: 0, available: 74, avgRank: 35 },
        TE: { drafted: 0, available: 24, avgRank: 52 },
        K: { drafted: 0, available: 32, avgRank: 180 },
        DST: { drafted: 0, available: 32, avgRank: 165 }
      },
      teamAnalytics: teamId ? {
        teamId,
        picksMade: 0,
        avgPickTime: 0,
        positionsPicked: {},
        strengthScore: 0,
        needsScore: 10,
        projectedRecord: { wins: 7, losses: 7 }
      } : null,
      trends: {
        runOnPositions: [],
        valuePicks: [],
        reaches: []
      }
    };
    return NextResponse.json({
      success: true,
      analytics: mockAnalytics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Draft analytics error: ', error);
    return NextResponse.json(
      { error: 'Failed to get draft analytics' },
      { status: 500 }
    );
  }
}