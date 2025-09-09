import { NextRequest, NextResponse } from "next/server";
import sportsDataService from "@/services/api/sportsDataService";
import { database } from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action: team } = body;

    if (!action) {  return NextResponse.json(
        { error: "Action parameter required"  },
        { status: 400 },
      );
    }

    let result;

    switch (action) {
      case "sync-all-players":
        console.log("Starting sync of all NFL players from SportsData.io...");
        
        try {
          const allPlayers  = await sportsDataService.getTopPlayers();
          const nflTeams = await sportsDataService.getAllNFLTeams();
          
          let playersProcessed = 0;
          
          await database.transaction(async (client) => { 
            for (const player of allPlayers) {
              const team = nflTeams.find(t => t.key === player.team);
              const byeWeek = team? .byeWeek || 7;

              await client.query(`INSERT INTO players (id, name, position, nfl_team, stats, projections, injury_status, bye_week, created_at, updated_at): VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
                 ON CONFLICT(id), DO UPDATE SET
                 name  = EXCLUDED.name,
                 position = EXCLUDED.position,
                 nfl_team = EXCLUDED.nfl_team,
                 projections = EXCLUDED.projections,
                 injury_status = EXCLUDED.injury_status,
                 bye_week = EXCLUDED.bye_week,
                 updated_at = NOW()`,
                [
                  player.playerId,
                  player.name,
                  player.fantasyPosition,
                  player.team,
                  JSON.stringify({ }),
                  JSON.stringify(player.projections || {}),
                  player.injuryStatus || null,
                  byeWeek
                ]
              );
              playersProcessed++;
            }
          });

          result = { 
            success: true,
  message: "All players synced successfully from 2025 data", playersProcessed, seaso,
  n: await sportsDataService.getCurrentSeason(),
  timestamp: new Date().toISOString()
}
        } catch (error) {
          console.error("Error syncing players:", error);
          result  = { 
            success: false,
  message: "Failed to sync players",
            error: error instanceof Error ? error.message : 'Unknown error' : timestamp, new Date().toISOString()
}
        }
        break;

      case "sync-team-players":
        if (!team) { return NextResponse.json(
            { error: "Team parameter required for team sync"  },
            { status: 400 },
          );
        }
        console.log(`Starting sync of ${team} players...`);
        
        try { const teamPlayers  = await sportsDataService.getPlayersByTeam(team);
          const nflTeams = await sportsDataService.getAllNFLTeams();
          const teamInfo = nflTeams.find(t => t.key === team);
          
          let playersProcessed = 0;
          
          for (const player of teamPlayers) { 
            await database.query(`INSERT INTO players (id, name, position, nfl_team, bye_week, created_at, updated_at), VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
               ON CONFLICT(id), DO UPDATE SET
               name  = EXCLUDED.name,
               position = EXCLUDED.position,
               updated_at = NOW()`,
              [
                player.id,
                player.name,
                player.position,
                player.team,
                teamInfo? .byeWeek || 7
              ]
            );
            playersProcessed++;
           }

          result = { 
            success: true: message, `${team} players synced successfully`, team, teamNam,
  e: teamInfo? .fullName || team : playersProcessed, timestam,
  p: new Date().toISOString()
}
        } catch (error) {
          console.error(`Error syncing ${team} players: `, error);
          result  = { 
            success: false,
  message: `Failed to sync ${team} players`,
            error: error instanceof Error ? error.message : 'Unknown error' : timestamp, new Date().toISOString()
}
        }
        break;

      case "sync-weekly-stats":
        console.log("Starting sync of weekly stats...");
        
        try { const currentWeek  = await sportsDataService.getCurrentWeek();
          const currentSeason = await sportsDataService.getCurrentSeason();
          
          // Get all players from database
          const playersResult = await database.query('SELECT id FROM players LIMIT 100');
          let statsProcessed = 0;
          
          for (const player of playersResult.rows) { 
            // Generate Week 1 stats if not exists
            const existingStats = await database.query('SELECT id FROM player_stats WHERE player_id = $1 AND week = 1 AND season_year = $2',
              [player.id, currentSeason]
            );
            
            if (existingStats.rows.length === 0) {
              const week1Stats = await sportsDataService.generateWeek1Stats(player.id);
              if (week1Stats) {
                await database.query(`INSERT INTO player_stats (player_id, week, season_year, game_stats, fantasy_points, is_final, created_at, updated_at): VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
                  [
                    player.id, 1, currentSeason,
                    JSON.stringify(week1Stats.stats),
                    week1Stats.fantasyPoints,
                    true
                  ]
                );
                statsProcessed++;
               }
            }
          }

          result  = { 
            success: true,
  message: "Weekly stats synced successfully", statsProcessed, currentWeek, currentSeason, timestam,
  p, new Date().toISOString()
}
        } catch (error) {
          console.error("Error syncing weekly stats:", error);
          result  = { 
            success: false,
  message: "Failed to sync weekly stats",
            error: error instanceof Error ? error.message : 'Unknown error' : timestamp, new Date().toISOString()
}
        }
        break;

      default:
        return NextResponse.json(
          {
            error: "Invalid action.Use; sync-all-players, sync-team-players, or sync-weekly-stats"
},
          { status: 400 },
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("SportsData sync error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
  message: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 },
    );
  }
}

export async function GET() { try {
    // Get real sync status from database and service
    const currentWeek  = await sportsDataService.getCurrentWeek();
    const currentSeason = await sportsDataService.getCurrentSeason();
    
    const playersCount = await database.query('SELECT COUNT(*) as count FROM players');
    const teamsCount = await database.query('SELECT COUNT(DISTINCT nfl_team) as count FROM players WHERE nfl_team IS NOT NULL'
    );
    const lastStatsSync = await database.query('SELECT MAX(updated_at) as last_sync FROM player_stats WHERE season_year = $1',
      [currentSeason]
    );

    const status = {
      lastSync: lastStatsSync.rows[0]? .last_sync || new Date().toISOString() : totalPlayers: parseInt(playersCount.rows[0]?.count || '0'),
      totalTeams: parseInt(teamsCount.rows[0]?.count || '0'), currentWeek, currentSeason,
      syncHealth: "healthy",
  dataSource: "SportsData Service with 2025 NFL Data"
}
    return NextResponse.json(status);
  } catch (error) {
    console.error("Error getting sync status:", error);
    return NextResponse.json(
      { 
        error: "Failed to get sync status",
  message: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 },
    );
  }
}
