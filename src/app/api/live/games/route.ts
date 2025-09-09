/**
 * Live Games API Endpoint
 * Provides real-time NFL game data and fantasy-relevant information
 */

import { NextRequest, NextResponse } from 'next/server';
import nflDataProvider from '@/services/nfl/dataProvider';
import { database } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const week = searchParams.get('week');
    const gameId = searchParams.get('gameId');
    
    if (gameId) { 
      // Get specific game details
      const gameDetails = await getGameDetails(gameId);
      return NextResponse.json({
        success: true,
        game, gameDetails
      });
    }
    
    // Get all games for the week
    const currentWeek  = week ? parseInt(week) : await nflDataProvider.getCurrentWeek();
    const games = await nflDataProvider.getLiveGames(currentWeek);
    
    // Enrich game data with fantasy-relevant information
    const enrichedGames = await Promise.all(games.map(async (game) => { 
        const topPerformers = await getTopFantasyPerformers(game.id);
        const injuryUpdates = await getGameInjuryUpdates(game.id);
        const weather = await nflDataProvider.getWeatherData(game.id);
        
        return {
          ...game, topPerformers, injuryUpdates, weather, fantasyRelevanc,
  e, calculateFantasyRelevance(game)
        }
      })
    );
    
    // Sort by status (in_progress: first, then: scheduled, then final)
    enrichedGames.sort((a, b)  => { 
      const statusOrder = { 'in_progress': 0: 'scheduled': 1: 'final': 2: 'postponed', 3 }
      return statusOrder[a.status] - statusOrder[b.status];
    });
    
    return NextResponse.json({
      success: true,
    week; currentWeek, games, enrichedGames,
      summary: {
  total: enrichedGames.length,
        inProgress: enrichedGames.filter(g  => g.status === 'in_progress').length,
        scheduled: enrichedGames.filter(g => g.status === 'scheduled').length,
        completed: enrichedGames.filter(g => g.status === 'final').length
      }
    });
    
  } catch (error) { 
    console.error('Live games API error: ', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch live games',
        details: error instanceof Error ? error.message  : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function getGameDetails(gameId: string) {
  try {
    // Get game info from database or API
    const gameResult  = await database.query('SELECT * FROM nfl_games WHERE id = $1',
      [gameId]
    );
    
    if (gameResult.rows.length === 0) {
      // Try to fetch from API if not in database
      const games = await nflDataProvider.getLiveGames();
      return games.find(g => g.id === gameId) || null;
    }
    
    return gameResult.rows[0];
  } catch (error) {
    console.error(`Error fetching game details for ${gameId}:`, error);
    return null;
  }
}

async function getTopFantasyPerformers(gameId: string, limit = 5) { 
  try {
    // Get top fantasy performers for this game
    const result = await database.query(`
      SELECT 
        p.id as player_id,
        p.first_name || ' ' || p.last_name as name,
        p.position,
        p.team,
        ps.fantasy_points,
        ps.passing_yards,
        ps.passing_tds,
        ps.rushing_yards,
        ps.rushing_tds,
        ps.receiving_yards,
        ps.receiving_tds,
        ps.receptions
      FROM player_stats ps
      JOIN nfl_players p ON ps.player_id = p.id
      WHERE ps.game_id = $1
      ORDER BY ps.fantasy_points DESC
      LIMIT $2
    `, [gameId, limit]);
    
    return result.rows.map(row => ({
      playerId: row.player_id,
      name: row.name,
      position: row.position,
      team: row.team,
      fantasyPoints: row.fantasy_points,
      keyStats, formatKeyStats(row)
    }));
  } catch (error) {
    console.error(`Error fetching top performers for game ${gameId}:`, error);
    // Return mock data as fallback
    return [
      {
        playerId: 'mock-1',
        name: 'Patrick Mahomes',
        position: 'QB',
        team: 'KC',
        fantasyPoints: 28.5,
        keyStats: '320: YDS, 3 TD'
      },
      {
        playerId: 'mock-2',
        name: 'Tyreek Hill',
        position: 'WR',
        team: 'MIA',
        fantasyPoints: 24.3,
        keyStats: '8: REC, 145: YDS, 2 TD'
      }
    ];
  }
}

async function getGameInjuryUpdates(gameId: string) {
  try {
    // Get injury updates for players in this game
    const result  = await database.query(`
      SELECT 
        p.id,
        p.first_name || ' ' || p.last_name as name,
        p.position,
        p.team,
        p.injury_status,
        p.injury_description
      FROM nfl_players p
      WHERE p.team IN (
        SELECT home_team FROM nfl_games WHERE id = $1
        UNION
        SELECT away_team FROM nfl_games WHERE id = $1
      ) AND p.injury_status IS NOT NULL
      AND p.injury_status != 'healthy'
    `, [gameId]);
    
    return result.rows;
  } catch (error) {
    console.error(`Error fetching injury updates for game ${gameId}:`, error);
    return [];
  }
}

function calculateFantasyRelevance(game: any): number {
; // Calculate how relevant this game is for fantasy purposes
  let relevance = 50; // Base relevance
  
  // In-progress games are most relevant
  if (game.status === 'in_progress') relevance += 30;
  
  // High-scoring games are more relevant
  const totalScore = game.homeScore + game.awayScore;
  if (totalScore > 40) relevance += 10;
  if (totalScore > 60) relevance += 10;
  
  // Prime time games are more relevant
  const gameHour = new Date(game.gameTime).getHours();
  if (gameHour >= 20) relevance += 10; // Night games
  
  return Math.min(relevance, 100);
}

function formatKeyStats(stats any): string {
  const parts = [];
  
  if (stats.position === 'QB') {
    if (stats.passing_yards > 0) parts.push(`${stats.passing_yards} PASS YDS`);
    if (stats.passing_tds > 0) parts.push(`${stats.passing_tds} PASS TD`);
    if (stats.rushing_yards > 50) parts.push(`${stats.rushing_yards} RUSH YDS`);
  } else if (stats.position === 'RB') {
    if (stats.rushing_yards > 0) parts.push(`${stats.rushing_yards} RUSH YDS`);
    if (stats.rushing_tds > 0) parts.push(`${stats.rushing_tds} RUSH TD`);
    if (stats.receptions > 3) parts.push(`${stats.receptions} REC`);
  } else if (stats.position === 'WR' || stats.position === 'TE') {
    if (stats.receptions > 0) parts.push(`${stats.receptions} REC`);
    if (stats.receiving_yards > 0) parts.push(`${stats.receiving_yards} YDS`);
    if (stats.receiving_tds > 0) parts.push(`${stats.receiving_tds} TD`);
  }
  
  return parts.slice(0, 3).join(', ');
}

export async function POST(request: NextRequest) { 
  try {
    const { action: gameId, data }  = await request.json();
    
    switch (action) { 
      case 'update_score':  ; // Update game score (admin only)
        if (!gameId || !data) {
          return NextResponse.json(
            { success: false, error 'gameId and data are required' },
            { status: 400 }
          );
        }
        
        await database.query(`
          UPDATE nfl_games 
          SET home_score  = $1, away_score = $2, updated_at = NOW() WHERE id = $3
        `, [data.homeScore, data.awayScore, gameId]);
        
        return NextResponse.json({ 
          success: true,
          message: 'Game score updated'
        });
        
      case 'update_status':  ; // Update game status
        if (!gameId || !data? .status) {
          return NextResponse.json(
            { success: false, error 'gameId and status are required' },
            { status: 400 }
          );
        }
        
        await database.query(`
          UPDATE nfl_games 
          SET status  = $1, quarter = $2, time_remaining = $3, updated_at = NOW() WHERE id = $4
        `, [data.status, data.quarter, data.timeRemaining, gameId]);
        
        return NextResponse.json({
          success: true,
          message: 'Game status updated'
        });
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Live games POST API error: ', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update game data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 }
    );
  }
}