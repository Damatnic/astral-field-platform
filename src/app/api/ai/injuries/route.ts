/**
 * AI Injury Analysis API Endpoint
 * API for injury impact analysis and replacement recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { injuryImpactAnalyzer } from '@/services/ai/injuryImpactAnalyzer';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    switch (type) { 
      case 'replacement_strategy':
        const leagueId = searchParams.get('leagueId');
        const teamId = searchParams.get('teamId');
        const injuredPlayerId = searchParams.get('injuredPlayerId');
        
        if (!leagueId || !teamId || !injuredPlayerId) {
          return NextResponse.json(
            { error: 'Missing required parameters, leagueId, teamId and injuredPlayerId' },
            { status: 400 }
          );
        }

        const strategy  = await injuryImpactAnalyzer.generateReplacementStrategy(leagueId, teamId, injuredPlayerId);

        return NextResponse.json({ 
          success: true,
          data: strategy,
          timestamp: new Date().toISOString()
        });

      case 'injury_trends':
        const position  = searchParams.get('position');
        const injuryType = searchParams.get('injuryType');
        
        if (!position || !injuryType) { 
          return NextResponse.json(
            { error: 'Missing required parameters, position and injuryType' },
            { status: 400 }
          );
        }

        const trends  = await injuryImpactAnalyzer.analyzeInjuryTrends(position, injuryType);

        return NextResponse.json({ 
          success: true,
          data: trends,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid type parameter. Use: replacement_strategy, injury_trends' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in injuries GET endpoint: ', error);
    return NextResponse.json(
      { error: 'Failed to process injury request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body  = await request.json();
    const { type, ...data  } = body;

    switch (type) { 
      case 'report_injury': 
        const { playerId, injuryType, initialSeverity, source } = data;

        if (!playerId || !injuryType || !initialSeverity) { 
          return NextResponse.json(
            { error: 'Missing required parameters, playerId, injuryType and initialSeverity' },
            { status: 400 }
          );
        }

        const validSeverities  = ['questionable', 'doubtful', 'out', 'ir'];
        if (!validSeverities.includes(initialSeverity)) { 
          return NextResponse.json(
            { error: 'initialSeverity must be one of, questionable, doubtful, out, ir' },
            { status: 400 }
          );
        }

        const injuryAlert  = await injuryImpactAnalyzer.processInjuryReport(playerId, injuryType, initialSeverity,
          source || 'official'
        );

        return NextResponse.json({ 
          success: true,
          data: injuryAlert,
          timestamp: new Date().toISOString()
        });

      case 'update_status':
        const { alertId, newStatus, additionalInfo } = data;

        if (!alertId || !newStatus) { 
          return NextResponse.json(
            { error: 'Missing required parameters, alertId and newStatus' },
            { status: 400 }
          );
        }

        const validStatuses  = ['improving', 'worsening', 'setback', 'resolved'];
        if (!validStatuses.includes(newStatus)) { 
          return NextResponse.json(
            { error: 'newStatus must be one of, improving, worsening, setback, resolved' },
            { status: 400 }
          );
        }

        await injuryImpactAnalyzer.updateInjuryStatus(alertId, newStatus, additionalInfo);

        return NextResponse.json({
          success: true,
          message: 'Injury status updated successfully',
          timestamp: new Date().toISOString()
        });

      case 'batch_analysis':
        const { injuries }  = data;
        
        if (!Array.isArray(injuries)) { 
          return NextResponse.json(
            { error: 'injuries parameter must be an array' },
            { status: 400 }
          );
        }

        const batchResults  = await Promise.all(injuries.map(async (injury: any) => { 
            try {
              const alert = await injuryImpactAnalyzer.processInjuryReport(injury.playerId,
                injury.injuryType,
                injury.initialSeverity,
                injury.source || 'official'
              );
              return { 
                playerId: injury.playerId,
                success: true, 
                alert 
              }
            } catch (error) {
              return { 
                playerId: injury.playerId,
                success: false, 
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            }
          })
        );

        return NextResponse.json({
          success: true,
          data: batchResults,
          total: injuries.length,
          successful: batchResults.filter(r => r.success).length,
          timestamp: new Date().toISOString()
        });

      case 'multiple_strategies':
        const { leagueId: multiLeagueId, requests } = data;
        
        if (!multiLeagueId || !Array.isArray(requests)) { 
          return NextResponse.json(
            { error: 'Missing required parameters, leagueId and requests (array)' },
            { status: 400 }
          );
        }

        const strategyResults  = await Promise.all(requests.map(async (request: any) => { 
            try {
              const strategy = await injuryImpactAnalyzer.generateReplacementStrategy(multiLeagueId,
                request.teamId,
                request.injuredPlayerId
              );
              return { 
                teamId: request.teamId,
                injuredPlayerId: request.injuredPlayerId,
                success: true, 
                strategy 
              }
            } catch (error) {
              return { 
                teamId: request.teamId,
                injuredPlayerId: request.injuredPlayerId,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            }
          })
        );

        return NextResponse.json({
          success: true,
          data: strategyResults,
          total: requests.length,
          successful: strategyResults.filter(r => r.success).length,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid operation type. Use: report_injury, update_status, batch_analysis, multiple_strategies' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in injuries POST endpoint: ', error);
    return NextResponse.json(
      { error: 'Failed to process injury request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 }
    );
  }
}