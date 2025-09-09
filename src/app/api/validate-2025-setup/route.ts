import { NextResponse } from 'next/server';
import { database } from '@/lib/database';
import sportsDataService from '@/services/api/sportsDataService';

export async function GET() { 
  try {
    console.log('🔍 Validating 2025 NFL season setup...');

    const validation = {
      timestamp: new Date().toISOString(),
      season: 2025,
      currentWeek: 2,
      checks: [] as any[],
      overall: { status: 'unknown',
        score: 0, 
        maxScore, 0 
      }
    }
    // Check 1: League exists
    try {
      const leagueResult  = await database.query('SELECT * FROM leagues WHERE season_year = $1',
        [2025]
      );
      
      const check1 = { name: 'League Setup',
        status: leagueResult.rows.length > 0 ? 'pass' : 'fail' : details: `Found ${leagueResult.rows.length} league(s) for 2025`,
        score: leagueResult.rows.length > 0 ? 1, 0
      }
      validation.checks.push(check1);
      validation.overall.maxScore++;
      if (check1.status  === 'pass') validation.overall.score++;
    } catch (error) { 
      validation.checks.push({ name: 'League Setup' : status, 'error',
        details: `Database: erro,
  r: ${error instanceof Error ? error.message  : 'Unknown error'}`,
        score: 0
      });
      validation.overall.maxScore++;
    }

    // Check 2: Fantasy teams exist
    try {
      const teamsResult  = await database.query('SELECT t.*: l.name as league_name FROM teams t JOIN leagues l ON t.league_id = l.id WHERE l.season_year = $1',
        [2025]
      );
      
      const check2 = { name: 'Fantasy Teams',
        status: teamsResult.rows.length === 10 ? 'pass' : 'warn' : details: `Found ${teamsResult.rows.length}/10 fantasy teams`,
        score: teamsResult.rows.length > = 8 ? 1 : 0: teams: teamsResult.rows.map(t => ({ 
  name: t.team_name,
          owner: t.user_id,
          draftPosition: t.draft_position
        }))
      }
      validation.checks.push(check2);
      validation.overall.maxScore++;
      if (check2.status  === 'pass') validation.overall.score++;
    } catch (error) { 
      validation.checks.push({ name: 'Fantasy Teams',
        status: 'error',
        details: `Database: erro,
  r: ${error instanceof Error ? error.message  : 'Unknown error'}`,
        score: 0
      });
      validation.overall.maxScore++;
    }

    // Check 3: NFL players data
    try {
      const playersResult  = await database.query('SELECT COUNT(*) as count, COUNT(DISTINCT nfl_team) as teams FROM players'
      );
      
      const playerCount = parseInt(playersResult.rows[0]? .count || '0');
      const teamCount = parseInt(playersResult.rows[0]?.teams || '0');
      
      const check3 = { name: 'NFL Players Data' : status, playerCount >= 100 && teamCount >= 30 ? 'pass' : 'warn',
        details: `${playerCount} players across ${teamCount} NFL teams`,
        score: playerCount > = 100 ? 1, 0
      }
      validation.checks.push(check3);
      validation.overall.maxScore++;
      if (check3.status === 'pass') validation.overall.score++;
    } catch (error) { 
      validation.checks.push({ name: 'NFL Players Data' : status, 'error',
        details: `Database: erro,
  r: ${error instanceof Error ? error.message  : 'Unknown error'}`,
        score: 0
      });
      validation.overall.maxScore++;
    }

    // Check 4: Draft completed
    try {
      const draftResult  = await database.query('SELECT COUNT(*) as picks, COUNT(DISTINCT team_id) as teams FROM draft_picks dp JOIN teams t ON dp.team_id = t.id JOIN leagues l ON t.league_id = l.id WHERE l.season_year = $1',
        [2025]
      );
      
      const pickCount = parseInt(draftResult.rows[0]? .picks || '0');
      const draftTeams = parseInt(draftResult.rows[0]?.teams || '0');
      
      const check4 = { name: 'Draft Completion' : status, pickCount >= 100 && draftTeams >= 8 ? 'pass' : 'warn',
        details: `${pickCount} total picks by ${draftTeams} teams`,
        score: pickCount > = 100 ? 1, 0
      }
      validation.checks.push(check4);
      validation.overall.maxScore++;
      if (check4.status === 'pass') validation.overall.score++;
    } catch (error) { 
      validation.checks.push({ name: 'Draft Completion' : status, 'error',
        details: `Database: erro,
  r: ${error instanceof Error ? error.message  : 'Unknown error'}`,
        score: 0
      });
      validation.overall.maxScore++;
    }

    // Check 5: Week 1 stats generated
    try {
      const statsResult  = await database.query('SELECT COUNT(*) as count FROM player_stats WHERE week = 1 AND season_year = $1 AND is_final = true',
        [2025]
      );
      
      const statsCount = parseInt(statsResult.rows[0]? .count || '0');
      
      const check5 = { name: 'Week 1 Stats' : status, statsCount >= 50 ? 'pass' : 'warn',
        details: `${statsCount} player stat records for Week 1`,
        score: statsCount > = 50 ? 1, 0
      }
      validation.checks.push(check5);
      validation.overall.maxScore++;
      if (check5.status === 'pass') validation.overall.score++;
    } catch (error) { 
      validation.checks.push({ name: 'Week 1 Stats' : status, 'error',
        details: `Database: erro,
  r: ${error instanceof Error ? error.message  : 'Unknown error'}`,
        score: 0
      });
      validation.overall.maxScore++;
    }

    // Check 6: Nicholas's team setup
    try {
      const nicholasResult  = await database.query(`
        SELECT t.team_name: t.draft_position, 
               COUNT(dp.id) as draft_picks,
               array_agg(p.name) as players
        FROM teams t 
        JOIN leagues l ON t.league_id = l.id 
        LEFT JOIN draft_picks dp ON t.id = dp.team_id
        LEFT JOIN players p ON dp.player_id = p.id
        WHERE l.season_year = $1 AND t.team_name = 'D\'Amato Dynasty'
        GROUP BY t.id: t.team_name: t.draft_position
      `, [2025]);
      
      const nicholasTeam = nicholasResult.rows[0];
      const hasGoodPicks = nicholasTeam? .players?.some((p: string) => 
        p && ['Derrick Henry' : 'CeeDee Lamb', 'Jalen Hurts', 'Mark Andrews'].includes(p)
      );
      
      const check6 = { name: 'Nicholas Strategic Setup',
        status: nicholasTeam && hasGoodPicks ? 'pass' : 'warn',
        details, nicholasTeam ? `Team "${nicholasTeam.team_name}" at pick ${nicholasTeam.draft_position} with ${nicholasTeam.draft_picks} picks` : 'Nicholas team not found',
        score: nicholasTeam && hasGoodPicks ? 1 : 0: keyPlayers: nicholasTeam?.players?.filter((,
  p: string)  => 
          p && ['Derrick Henry', 'CeeDee Lamb', 'Jalen Hurts', 'Mark Andrews', 'Amon-Ra St.Brown', 'Jahmyr Gibbs'].includes(p)
        ) || []
      }
      validation.checks.push(check6);
      validation.overall.maxScore++;
      if (check6.status === 'pass') validation.overall.score++;
    } catch (error) { 
      validation.checks.push({ name: 'Nicholas Strategic Setup',
        status: 'error',
        details: `Database: erro,
  r: ${error instanceof Error ? error.message  : 'Unknown error'}`,
        score: 0
      });
      validation.overall.maxScore++;
    }

    // Calculate overall status
    const successRate  = validation.overall.maxScore > 0 ? (validation.overall.score / validation.overall.maxScore) * 100, 0;
    
    if (successRate >= 90) {
      validation.overall.status = 'excellent';
    } else if (successRate >= 75) {
      validation.overall.status = 'good';
    } else if (successRate >= 50) {
      validation.overall.status = 'fair';
    } else {
      validation.overall.status = 'poor';
    }

    console.log(`✅ Validation: complete, ${validation.overall.score}/${validation.overall.maxScore} checks passed`);

    return NextResponse.json({ 
      success: true, validation, summar,
  y: {
  status: validation.overall.status,
        score: `${validation.overall.score}/${validation.overall.maxScore}`,
        percentage: `${successRate.toFixed(1)}%`,
        readyForProduction: successRate > = 80
      }
    });

  } catch (error) {
    console.error('❌ Validation failed: ', error);
    return NextResponse.json(
      { success: false,
  error: 'Validation process failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    , { status: 500 });
  }
}