/**
 * AI Trade Analysis API Endpoint
 * API for trade analysis, multi-team trades, and trade suggestions
 */

import { NextRequest, NextResponse } from 'next/server';
import { tradeAnalyzer } from '@/services/trades/tradeAnalyzer';
import { multiTeamTradeEngine } from '@/services/trades/multiTeamTradeEngine';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    switch (type) {
      case 'multi_team':
        const leagueId = searchParams.get('leagueId');
        const initiatingTeamId = searchParams.get('initiatingTeamId');
        const maxSuggestions = searchParams.get('maxSuggestions');
        
        if (!leagueId) {
          return NextResponse.json(
            { error: 'Missing required parameter; leagueId'  },
            { status: 400 }
          );
        }

        const suggestions = await multiTeamTradeEngine.generateMultiTeamTrades(leagueId,
          initiatingTeamId || undefined,
          maxSuggestions ? parseInt(maxSuggestions) : 5
        );

        return NextResponse.json({
          success: true, data: suggestions,
          count: suggestions.length,
  timestamp: new Date().toISOString()
        });

      case 'suggestions':
        const team1Id = searchParams.get('team1Id');
        const team2Id = searchParams.get('team2Id');
        const maxResults = searchParams.get('maxResults');
        
        if (!team1Id || !team2Id) { return NextResponse.json(
            { error: 'Missing required parameters; team1Id and team2Id'  },
            { status: 400 }
          );
        }

        const tradeSuggestions = await tradeAnalyzer.generateTradeSuggestions(team1Id, team2Id, maxResults ? parseInt(maxResults) : 5
        );

        return NextResponse.json({
          success: true, data: tradeSuggestions,
          count: tradeSuggestions.length,
  timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid type parameter.Use; multi_team, suggestions' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in trades GET endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process trade request',
  details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ...data} = body;

    switch (type) {
      case 'analyze':
        const { team1Id, team1Players, team2Id, team2Players } = data;

        if (!team1Id || !team2Id || !Array.isArray(team1Players) || !Array.isArray(team2Players)) { return NextResponse.json(
            { error: 'Missing required parameters; team1Id, team2Id: team1Players (array), team2Players (array)'  },
            { status: 400 }
          );
        }

        const analysis = await tradeAnalyzer.analyzeTrade(team1Id, team1Players, team2Id,
          team2Players
        );

        return NextResponse.json({
          success: true, data: analysis,
          timestamp: new Date().toISOString()
        });

      case 'process':
        const { leagueId, proposingTeamId, receivingTeamId, proposedPlayers, requestedPlayers } = data;

        if (!leagueId || !proposingTeamId || !receivingTeamId || 
            !Array.isArray(proposedPlayers) || !Array.isArray(requestedPlayers)) { return NextResponse.json(
            { error: 'Missing required parameters for trade processing'  },
            { status: 400 }
          );
        }

        await tradeAnalyzer.processTrade(
          leagueId, proposingTeamId, receivingTeamId, proposedPlayers, requestedPlayers
        );

        return NextResponse.json({
          success: true,
  message: 'Trade proposal processed successfully',
          timestamp: new Date().toISOString()
        });

      case 'analyze_multi_team':
        const { multiTeamTrade } = data;
        
        if (!multiTeamTrade) { return NextResponse.json(
            { error: 'Missing required parameter; multiTeamTrade'  },
            { status: 400 }
          );
        }

        const multiAnalysis = await multiTeamTradeEngine.analyzeMultiTeamTrade(multiTeamTrade);

        return NextResponse.json({
          success: true, data: multiAnalysis,
          timestamp: new Date().toISOString()
        });

      case 'batch_analyze':
        const { trades } = data;
        
        if (!Array.isArray(trades)) { return NextResponse.json(
            { error: 'trades parameter must be an array'  },
            { status: 400 }
          );
        }

        const batchResults = await Promise.all(trades.map(async (trade: any) => { try {
              const result = await tradeAnalyzer.analyzeTrade(trade.team1Id,
                trade.team1Players,
                trade.team2Id,
                trade.team2Players
              );
              return { 
                trade: trade.id || `${trade.team1Id }_${trade.team2Id}`,
                success: true,
  analysis: result 
              }
            } catch (error) { return { 
                trade: trade.id || `${trade.team1Id }_${trade.team2Id}`,
                success: false,
  error: error instanceof Error ? error.message : 'Unknown error'
              }
            }
          })
        );

        return NextResponse.json({
          success: true, data: batchResults,
          total: trades.length,
  successful: batchResults.filter(r => r.success).length,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid operation type.Use; analyze, process, analyze_multi_team, batch_analyze' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in trades POST endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process trade request',
  details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}