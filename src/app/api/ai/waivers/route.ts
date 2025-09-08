/**
 * AI Waiver Wire API Endpoint  
 * API for intelligent waiver wire analysis and recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { intelligentWaiverSystem } from '@/services/waivers/intelligentWaiverSystem';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    switch (type) {
      case 'analysis':
        const leagueId = searchParams.get('leagueId');
        const teamId = searchParams.get('teamId');
        
        if (!leagueId || !teamId) {
          return NextResponse.json(
            { error: 'Missing required parameters: leagueId and teamId' },
            { status: 400 }
          );
        }

        const analysis = await intelligentWaiverSystem.generateWaiverAnalysis(leagueId, teamId);

        return NextResponse.json({
          success: true,
          data: analysis,
          timestamp: new Date().toISOString()
        });

      case 'newsletter':
        const newsletterLeagueId = searchParams.get('leagueId');
        
        if (!newsletterLeagueId) {
          return NextResponse.json(
            { error: 'Missing required parameter: leagueId' },
            { status: 400 }
          );
        }

        const newsletter = await intelligentWaiverSystem.generateWaiverWireNewsletter(newsletterLeagueId);

        return NextResponse.json({
          success: true,
          data: newsletter,
          timestamp: new Date().toISOString()
        });

      case 'priority':
        const priorityLeagueId = searchParams.get('leagueId');
        const priorityTeamId = searchParams.get('teamId');
        const playerId = searchParams.get('playerId');
        const currentWeek = searchParams.get('currentWeek');
        
        if (!priorityLeagueId || !priorityTeamId || !playerId) {
          return NextResponse.json(
            { error: 'Missing required parameters: leagueId, teamId, and playerId' },
            { status: 400 }
          );
        }

        // Get waiver analysis for the team first
        const teamAnalysis = await intelligentWaiverSystem.generateWaiverAnalysis(priorityLeagueId, priorityTeamId);
        const playerAnalysis = teamAnalysis.topTargets.find(target => target.playerId === playerId);
        
        if (!playerAnalysis) {
          return NextResponse.json(
            { error: 'Player not found in waiver analysis' },
            { status: 404 }
          );
        }

        // Get team budget for priority calculation
        const teamBudget = teamAnalysis.budgetAnalysis.remainingBudget;
        const week = currentWeek ? parseInt(currentWeek) : 1;
        
        const priority = await intelligentWaiverSystem.calculateAdvancedClaimPriority(
          playerAnalysis,
          teamBudget,
          week
        );

        return NextResponse.json({
          success: true,
          data: {
            playerId,
            playerAnalysis,
            priority
          },
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid type parameter. Use: analysis, newsletter, priority' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in waivers GET endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process waiver request',
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
      case 'claim':
        const {
          leagueId,
          teamId,
          playerId,
          priority,
          maxBid,
          reasoning
        } = data;

        if (!leagueId || !teamId || !playerId || priority === undefined || maxBid === undefined) {
          return NextResponse.json(
            { error: 'Missing required parameters: leagueId, teamId, playerId, priority, maxBid' },
            { status: 400 }
          );
        }

        await intelligentWaiverSystem.processWaiverClaim(
          leagueId,
          teamId,
          playerId,
          priority,
          maxBid,
          reasoning || 'AI-recommended claim'
        );

        return NextResponse.json({
          success: true,
          message: 'Waiver claim processed successfully',
          timestamp: new Date().toISOString()
        });

      case 'batch_analysis':
        const { leagueId: batchLeagueId, teamIds } = data;
        
        if (!batchLeagueId || !Array.isArray(teamIds)) {
          return NextResponse.json(
            { error: 'Missing required parameters: leagueId and teamIds (array)' },
            { status: 400 }
          );
        }

        const batchResults = await Promise.all(
          teamIds.map(async (teamId: string) => {
            try {
              const analysis = await intelligentWaiverSystem.generateWaiverAnalysis(batchLeagueId, teamId);
              return { teamId, success: true, analysis };
            } catch (error) {
              return { 
                teamId, 
                success: false, 
                error: error instanceof Error ? error.message : 'Unknown error' 
              };
            }
          })
        );

        return NextResponse.json({
          success: true,
          data: batchResults,
          total: teamIds.length,
          successful: batchResults.filter(r => r.success).length,
          timestamp: new Date().toISOString()
        });

      case 'custom_analysis':
        const { 
          leagueId: customLeagueId, 
          teamId: customTeamId, 
          availablePlayers 
        } = data;
        
        if (!customLeagueId || !customTeamId) {
          return NextResponse.json(
            { error: 'Missing required parameters: leagueId and teamId' },
            { status: 400 }
          );
        }

        const customAnalysis = await intelligentWaiverSystem.generateWaiverAnalysis(
          customLeagueId,
          customTeamId,
          availablePlayers
        );

        return NextResponse.json({
          success: true,
          data: customAnalysis,
          timestamp: new Date().toISOString()
        });

      case 'bulk_priority':
        const { 
          leagueId: bulkLeagueId, 
          teamId: bulkTeamId, 
          playerIds,
          currentWeek: bulkCurrentWeek
        } = data;
        
        if (!bulkLeagueId || !bulkTeamId || !Array.isArray(playerIds)) {
          return NextResponse.json(
            { error: 'Missing required parameters: leagueId, teamId, and playerIds (array)' },
            { status: 400 }
          );
        }

        // Get team analysis once
        const bulkTeamAnalysis = await intelligentWaiverSystem.generateWaiverAnalysis(bulkLeagueId, bulkTeamId);
        const teamBudget = bulkTeamAnalysis.budgetAnalysis.remainingBudget;
        const week = bulkCurrentWeek ? parseInt(bulkCurrentWeek) : 1;

        const bulkPriorities = await Promise.all(
          playerIds.map(async (playerId: string) => {
            try {
              const playerAnalysis = bulkTeamAnalysis.topTargets.find(target => target.playerId === playerId);
              
              if (!playerAnalysis) {
                return { playerId, success: false, error: 'Player not in analysis' };
              }

              const priority = await intelligentWaiverSystem.calculateAdvancedClaimPriority(
                playerAnalysis,
                teamBudget,
                week
              );

              return { playerId, success: true, priority };
            } catch (error) {
              return { 
                playerId, 
                success: false, 
                error: error instanceof Error ? error.message : 'Unknown error' 
              };
            }
          })
        );

        return NextResponse.json({
          success: true,
          data: bulkPriorities,
          total: playerIds.length,
          successful: bulkPriorities.filter(r => r.success).length,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid operation type. Use: claim, batch_analysis, custom_analysis, bulk_priority' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in waivers POST endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process waiver request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}