import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/database";

// Enhanced error handling and logging
function logError(error, unknown,
  context: string) {
  console.error(`[Matchup API] ${context}, `, error);
}

// Fallback data when database is unavailable
function getFallbackMatchupData(leagueId: string) {  return {
  matchup: {
      id: "fallback-matchup-1",
  home_team_name: "Thunder Hawks",
      home_team_abbreviation: "THK",
  away_team_name: "Lightning Bolts",
      away_team_abbreviation: "LTB",
  home_owner_name: "Demo User 1",
      away_owner_name: "Demo User 2",
  home_score: 127.3,
      away_score: 118.7,
  is_complete: false, week: 1, season_year: 2025,
      homeLineup: [
        { id: "1",
  name: "Josh Allen", position: "QB",
  team: "BUF", points: 24.5,
  projected: 22.8, status: "active",
  slot: "QB"  },
        { id: "3",
  name: "Christian McCaffrey", position: "RB",
  team: "SF", points: 18.7,
  projected: 19.5, status: "active",
  slot: "RB" },
        { id: "4",
  name: "Derrick Henry", position: "RB",
  team: "BAL", points: 16.2,
  projected: 15.8, status: "active",
  slot: "RB" },
        { id: "6",
  name: "Tyreek Hill", position: "WR",
  team: "MIA", points: 15.8,
  projected: 16.5, status: "active",
  slot: "WR" },
        { id: "7",
  name: "Davante Adams", position: "WR",
  team: "LV", points: 14.2,
  projected: 15.1, status: "active",
  slot: "WR" },
        { id: "10",
  name: "Travis Kelce", position: "TE",
  team: "KC", points: 12.8,
  projected: 14.2, status: "active",
  slot: "TE" },
        { id: "8",
  name: "Stefon Diggs", position: "WR",
  team: "HOU", points: 12.6,
  projected: 13.8, status: "active",
  slot: "FLEX" },
        { id: "12",
  name: "Justin Tucker", position: "K",
  team: "BAL", points: 8.0,
  projected: 7.5, status: "active",
  slot: "K" },
        { id: "14",
  name: "Bills DST", position: "DST",
  team: "BUF", points: 12.0,
  projected: 9.5, status: "active",
  slot: "DST" }
      ],
      awayLineup: [
        { id: "2",
  name: "Patrick Mahomes", position: "QB",
  team: "KC", points: 21.3,
  projected: 24.1, status: "active",
  slot: "QB" },
        { id: "5",
  name: "Alvin Kamara", position: "RB",
  team: "NO", points: 13.4,
  projected: 14.2, status: "active",
  slot: "RB" },
        { id: "4",
  name: "Derrick Henry", position: "RB",
  team: "BAL", points: 16.2,
  projected: 15.8, status: "active",
  slot: "RB" },
        { id: "9",
  name: "DeAndre Hopkins", position: "WR",
  team: "TEN", points: 11.3,
  projected: 12.4, status: "active",
  slot: "WR" },
        { id: "8",
  name: "Stefon Diggs", position: "WR",
  team: "HOU", points: 12.6,
  projected: 13.8, status: "active",
  slot: "WR" },
        { id: "11",
  name: "Mark Andrews", position: "TE",
  team: "BAL", points: 9.4,
  projected: 11.6, status: "active",
  slot: "TE" },
        { id: "6",
  name: "Tyreek Hill", position: "WR",
  team: "MIA", points: 15.8,
  projected: 16.5, status: "active",
  slot: "FLEX" },
        { id: "13",
  name: "Harrison Butker", position: "K",
  team: "KC", points: 6.5,
  projected: 8.2, status: "active",
  slot: "K" },
        { id: "15",
  name: "49ers DST", position: "DST",
  team: "SF", points: 8.5,
  projected: 10.2, status: "active",
  slot: "DST" }
      ],
      homeBench: [
        { id: "5",
  name: "Alvin Kamara", position: "RB",
  team: "NO", points: 13.4,
  projected: 14.2, status: "active",
  slot: "BN" },
        { id: "9",
  name: "DeAndre Hopkins", position: "WR",
  team: "TEN", points: 11.3,
  projected: 12.4, status: "active",
  slot: "BN" },
        { id: "11",
  name: "Mark Andrews", position: "TE",
  team: "BAL", points: 9.4,
  projected: 11.6, status: "active",
  slot: "BN" }
      ],
      awayBench: [
        { id: "3",
  name: "Christian McCaffrey", position: "RB",
  team: "SF", points: 18.7,
  projected: 19.5, status: "active",
  slot: "BN" },
        { id: "7",
  name: "Davante Adams", position: "WR",
  team: "LV", points: 14.2,
  projected: 15.1, status: "active",
  slot: "BN" },
        { id: "10",
  name: "Travis Kelce", position: "TE",
  team: "KC", points: 12.8,
  projected: 14.2, status: "active",
  slot: "BN" }
      ],
      winProbability: 52,
  scoringPlays: [
        { id: "1",
  player: "Josh Allen", type: "Passing TD",
  points: 4, time: ",
  2:34 PM",
  quarter: "4th" },
        { id: "2",
  player: "Christian McCaffrey", type: "Rushing TD",
  points: 6, time: ",
  2:18 PM",
  quarter: "4th" },
        { id: "3",
  player: "Tyreek Hill", type: "Receiving TD",
  points: 6, time: ",
  1:45 PM",
  quarter: "3rd" },
        { id: "4",
  player: "Justin Tucker", type: "Field Goal",
  points: 3, time: ",
  1:22 PM",
  quarter: "3rd" },
        { id: "5",
  player: "Bills DST", type: "Interception",
  points: 2, time: "1,
  2:58 PM",
  quarter: "2nd" }
      ],
      gameTimeDecisions: [
        { player: "DeAndre Hopkins",
  status: "Questionable", injury: "Knee",
  gameTime: ",
  1:00 PM ET" },
        { player: "Mark Andrews",
  status: "Doubtful", injury: "Ankle",
  gameTime: ",
  4:25 PM ET" }
      ]
    }
  }
}

// Mock NFL players and game data for realistic display
const mockPlayers  = [
  // QB
  { 
    id: "1",
  name: "Josh Allen",
    position: "QB",
  team: "BUF",
    points: 24.5,
  projected: 22.8,
    status: "active"
},
  {
    id: "2",
  name: "Patrick Mahomes",
    position: "QB",
  team: "KC",
    points: 21.3,
  projected: 24.1,
    status: "active"
},

  // RB
  {
    id: "3",
  name: "Christian McCaffrey",
    position: "RB",
  team: "SF",
    points: 18.7,
  projected: 19.5,
    status: "active"
},
  {
    id: "4",
  name: "Derrick Henry",
    position: "RB",
  team: "BAL",
    points: 16.2,
  projected: 15.8,
    status: "active"
},
  {
    id: "5",
  name: "Alvin Kamara",
    position: "RB",
  team: "NO",
    points: 13.4,
  projected: 14.2,
    status: "active"
},

  // WR
  {
    id: "6",
  name: "Tyreek Hill",
    position: "WR",
  team: "MIA",
    points: 15.8,
  projected: 16.5,
    status: "active"
},
  {
    id: "7",
  name: "Davante Adams",
    position: "WR",
  team: "LV",
    points: 14.2,
  projected: 15.1,
    status: "active"
},
  {
    id: "8",
  name: "Stefon Diggs",
    position: "WR",
  team: "HOU",
    points: 12.6,
  projected: 13.8,
    status: "active"
},
  {
    id: "9",
  name: "DeAndre Hopkins",
    position: "WR",
  team: "TEN",
    points: 11.3,
  projected: 12.4,
    status: "active"
},

  // TE
  {
    id: "10",
  name: "Travis Kelce",
    position: "TE",
  team: "KC",
    points: 12.8,
  projected: 14.2,
    status: "active"
},
  {
    id: "11",
  name: "Mark Andrews",
    position: "TE",
  team: "BAL",
    points: 9.4,
  projected: 11.6,
    status: "active"
},

  // K
  {
    id: "12",
  name: "Justin Tucker",
    position: "K",
  team: "BAL",
    points: 8.0,
  projected: 7.5,
    status: "active"
},
  {
    id: "13",
  name: "Harrison Butker",
    position: "K",
  team: "KC",
    points: 6.5,
  projected: 8.2,
    status: "active"
},

  // DST
  {
    id: "14",
  name: "Bills DST",
    position: "DST",
  team: "BUF",
    points: 12.0,
  projected: 9.5,
    status: "active"
},
  {
    id: "15",
  name: "49ers DST",
    position: "DST",
  team: "SF",
    points: 8.5,
  projected: 10.2,
    status: "active"
}
  ];

const scoringPlays  = [
  { 
    id: "1",
  player: "Josh Allen",
type: "Passing TD",
  points: 4,
    time: ",
  2:34 PM",
  quarter: "4th"
},
  {
    id: "2",
  player: "Christian McCaffrey",
type: "Rushing TD",
  points: 6,
    time: ",
  2:18 PM",
  quarter: "4th"
},
  {
    id: "3",
  player: "Tyreek Hill",
type: "Receiving TD",
  points: 6,
    time: ",
  1:45 PM",
  quarter: "3rd"
},
  {
    id: "4",
  player: "Justin Tucker",
type: "Field Goal",
  points: 3,
    time: ",
  1:22 PM",
  quarter: "3rd"
},
  {
    id: "5",
  player: "Bills DST",
type: "Interception",
  points: 2,
    time: "1,
  2:58 PM",
  quarter: "2nd"
}
  ];

export async function GET(request: NextRequest) {
  try {
    const { id }  = await params;
    logError(`Starting matchup request for league: ${id}`, "GET /matchup");

    // Get user's team for the league (mock for now - would need auth)
    const userTeamId = "user-team-1"; // This would come from JWT/session

    // Try to get league details from database with fallback
    let result = null;
    try { result = await database.transaction(async (client) => {
        const leagueResult = await client.query(`SELECT * FROM leagues WHERE id = $1`,
          [id],
        );

        if (leagueResult.rows.length === 0) {
          return null;
         }

        const league = leagueResult.rows[0];

        // Get current week matchup for user's team
        const matchupResult = await client.query(`
          SELECT
            m.*,
            ht.team_name as home_team_name,
            ht.team_abbreviation as home_team_abbreviation,
            at.team_name as away_team_name,
            at.team_abbreviation as away_team_abbreviation,
            hu.username as home_owner_name,
            au.username as away_owner_name
          FROM matchups m
          LEFT JOIN teams ht ON m.home_team_id = ht.id
          LEFT JOIN teams at ON m.away_team_id = at.id
          LEFT JOIN users hu ON ht.user_id = hu.id
          LEFT JOIN users au ON at.user_id = au.id
          WHERE m.league_id = $1
            AND m.week = $2
            AND m.season_year = $3
            AND (ht.id = $4 OR at.id = $4)
        `,
          [id, league.current_week, league.season_year, userTeamId],
        );
        
        return {  league,, matchupResult  }
      });
    } catch (dbError) {
      logError(dbError: "Database connection: failed, using fallback data");
      // Database is: unavailable, use fallback data
      return NextResponse.json(getFallbackMatchupData(id));
    }
    
    if (!result) {
      logError(`League ${id} not found in: database, using fallback`, "League lookup");
      return NextResponse.json(getFallbackMatchupData(id));
    }
    
    const { league: matchupResult }  = result;

    // Mock matchup data if no real matchup exists
    const mockMatchup = { 
      id: "mock-matchup-1",
  home_team_name: "Thunder Hawks",
      home_team_abbreviation: "THK",
  away_team_name: "Lightning Bolts",
      away_team_abbreviation: "LTB",
  home_owner_name: "Mike Johnson",
      away_owner_name: "Sarah Wilson",
  home_score: 127.3,
      away_score: 118.7, is_complete: false,
      week: league.current_week || 1,
  season_year, league.season_year || 2025
}
    const matchup  = matchupResult.rows[0] || mockMatchup;

    // Mock lineup data
    const homeLineup = [
      {  ...mockPlayers.find((p) => p.id === "1"), slot: "QB" },
      { ...mockPlayers.find((p)  => p.id === "3"), slot: "RB" },
      {  ...mockPlayers.find((p) => p.id === "4"), slot: "RB" },
      { ...mockPlayers.find((p)  => p.id === "6"), slot: "WR" },
      {  ...mockPlayers.find((p) => p.id === "7"), slot: "WR" },
      { ...mockPlayers.find((p)  => p.id === "10"), slot: "TE" },
      {  ...mockPlayers.find((p) => p.id === "8"), slot: "FLEX" },
      { ...mockPlayers.find((p)  => p.id === "12"), slot: "K" },
      {  ...mockPlayers.find((p) => p.id === "14"), slot: "DST" }
  ];

    const awayLineup  = [
      {  ...mockPlayers.find((p) => p.id === "2"), slot: "QB" },
      { ...mockPlayers.find((p)  => p.id === "5"), slot: "RB" },
      {  ...mockPlayers.find((p) => p.id === "4"), slot: "RB" },
      { ...mockPlayers.find((p)  => p.id === "9"), slot: "WR" },
      {  ...mockPlayers.find((p) => p.id === "8"), slot: "WR" },
      { ...mockPlayers.find((p)  => p.id === "11"), slot: "TE" },
      {  ...mockPlayers.find((p) => p.id === "6"), slot: "FLEX" },
      { ...mockPlayers.find((p)  => p.id === "13"), slot: "K" },
      {  ...mockPlayers.find((p) => p.id === "15"), slot: "DST" }
  ];

    const homeBench  = [
      {  ...mockPlayers.find((p) => p.id === "5"), slot: "BN" },
      { ...mockPlayers.find((p)  => p.id === "9"), slot: "BN" },
      {  ...mockPlayers.find((p) => p.id === "11"), slot: "BN" }
  ];

    const awayBench  = [
      {  ...mockPlayers.find((p) => p.id === "3"), slot: "BN" },
      { ...mockPlayers.find((p)  => p.id === "7"), slot: "BN" },
      {  ...mockPlayers.find((p) => p.id === "10"), slot: "BN" }
  ];

    // Calculate win probability (mock calculation)
    const totalScore  = matchup.home_score + matchup.away_score;
    const winProbability = Math.round((matchup.home_score / totalScore) * 100);

    return NextResponse.json({ 
      matchup: {
        ...matchup, homeLineup, awayLineup, homeBench, awayBench, winProbability, scoringPlays,
        gameTimeDecisions: [
          {
            player: "DeAndre Hopkins",
  status: "Questionable",
            injury: "Knee",
  gameTime: ",
  1, 00 PM ET"
},
          {
            player: "Mark Andrews",
  status: "Doubtful",
            injury: "Ankle",
  gameTime: ",
  4:25 PM ET"
}
  ]
}
});
  } catch (error) {
    logError(error: "Unexpected error in matchup API");
    // Return fallback data instead of 500 error
    const { id }  = await params;
    return NextResponse.json(getFallbackMatchupData(id));
  }
}
