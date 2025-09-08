import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/database";

// Complete reset and setup - clears old data and sets up fresh 2025 league
export async function GET() {
  return POST(new NextRequest("http://localhost"));
}

export async function POST(req: NextRequest) {
  try {
    console.log("🔄 Starting complete reset and setup for 2025 season...");

    const result = await database.transaction(async (client) => {
      // Step 1: Clear all old data
      console.log("🗑️ Clearing old data...");
      
      const tablesToClear = [
        'lineups',
        'matchups', 
        'teams',
        'leagues',
        'users'
      ];
      
      // Use parameterized queries for table clearing - validated against whitelist
      const validTables = ['lineups', 'matchups', 'teams', 'leagues', 'users'];
      
      for (const table of tablesToClear) {
        try {
          // Validate table name against whitelist
          if (!validTables.includes(table)) {
            console.log(`⚠️ Skipping invalid table: ${table}`);
            continue;
          }
          
          // Use safe table names (no dynamic SQL)
          switch(table) {
            case 'lineups':
              await client.query('DELETE FROM lineups');
              break;
            case 'matchups':
              await client.query('DELETE FROM matchups');
              break;
            case 'teams':
              await client.query('DELETE FROM teams');
              break;
            case 'leagues':
              await client.query('DELETE FROM leagues');
              break;
            case 'users':
              await client.query('DELETE FROM users');
              break;
            default:
              console.log(`⚠️ Unknown table: ${table}`);
              continue;
          }
          console.log(`✅ Cleared ${table}`);
        } catch (e) {
          console.log(`⚠️ Could not clear ${table}:`, e);
        }
      }

      // Step 2: Create the 10 users with correct PINs
      console.log("👥 Creating users with correct PINs...");
      
      const users = [
        { name: "Jon Kornbeck", email: "jon.kornbeck@astralfield.com", username: "jon.kornbeck", pin: "1001" },
        { name: "Jack McCaigue", email: "jack.mccaigue@astralfield.com", username: "jack.mccaigue", pin: "1002" },
        { name: "Nick Hartley", email: "nick.hartley@astralfield.com", username: "nick.hartley", pin: "1003" },
        { name: "Cason Minor", email: "cason.minor@astralfield.com", username: "cason.minor", pin: "1004" },
        { name: "Brittany Bergum", email: "brittany.bergum@astralfield.com", username: "brittany.bergum", pin: "1005" },
        { name: "David Jarvey", email: "david.jarvey@astralfield.com", username: "david.jarvey", pin: "1006" },
        { name: "Larry McCaigue", email: "larry.mccaigue@astralfield.com", username: "larry.mccaigue", pin: "1007" },
        { name: "Renee McCaigue", email: "renee.mccaigue@astralfield.com", username: "renee.mccaigue", pin: "1008" },
        { name: "Nicholas D'Amato", email: "nicholas.damato@astralfield.com", username: "nicholas.damato", pin: "1009" },
        { name: "Kaity Lorbecki", email: "kaity.lorbecki@astralfield.com", username: "kaity.lorbecki", pin: "1010" }
      ];

      const userIds = [];
      for (const user of users) {
        const result = await client.query(
          `INSERT INTO users (username, email, pin, is_demo_user)
           VALUES ($1, $2, $3, true)
           ON CONFLICT (email) DO UPDATE SET
             username = EXCLUDED.username,
             pin = EXCLUDED.pin,
             is_demo_user = true
           RETURNING id`,
          [user.username, user.email, user.pin]
        );
        userIds.push({ ...user, id: result.rows[0].id });
      }

      // Step 3: Create the league with Nicholas as commissioner
      console.log("🏆 Creating 2025 league...");
      
      const nicholas = userIds.find(u => u.name === "Nicholas D'Amato");
      if (!nicholas) {
        throw new Error("Nicholas D'Amato user not found");
      }
      
      const leagueResult = await client.query(
        `INSERT INTO leagues (
          name, 
          season_year, 
          commissioner_id,
          max_teams,
          scoring_type,
          playoff_teams,
          trade_deadline_week,
          waiver_type,
          waiver_budget,
          current_week,
          roster_positions,
          scoring_settings
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT ON CONSTRAINT leagues_pkey DO UPDATE SET
          name = EXCLUDED.name,
          season_year = EXCLUDED.season_year,
          commissioner_id = EXCLUDED.commissioner_id
        RETURNING id`,
        [
          "Astral Field Championship League",
          2025,
          nicholas.id,
          10,
          "ppr",
          6,
          10,
          "faab",
          100,
          2, // Week 2 of 2025 season
          JSON.stringify({
            QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, DST: 1, K: 1, BENCH: 7, IR: 2
          }),
          JSON.stringify({
            passing: { yards: 0.04, touchdowns: 4, interceptions: -2 },
            rushing: { yards: 0.1, touchdowns: 6 },
            receiving: { receptions: 1, yards: 0.1, touchdowns: 6 },
            kicking: { pat: 1, fg_0_39: 3, fg_40_49: 4, fg_50_plus: 5 },
            defense: { sack: 1, interception: 2, fumble_recovery: 2, touchdown: 6 }
          })
        ]
      );

      const leagueId = leagueResult.rows[0].id;

      // Step 4: Create teams for all users
      console.log("🏈 Creating teams...");
      
      const teamData = [
        { user: userIds[0], name: "Kornbeck's Krusaders", abbr: "KRN" },
        { user: userIds[1], name: "Jack's Juggernauts", abbr: "JAC" },
        { user: userIds[2], name: "Hartley's Heroes", abbr: "HRT" },
        { user: userIds[3], name: "Minor League", abbr: "MIN" },
        { user: userIds[4], name: "Bergum's Blitz", abbr: "BRG" },
        { user: userIds[5], name: "Jarvey's Giants", abbr: "JRV" },
        { user: userIds[6], name: "Larry's Legends", abbr: "LAR" },
        { user: userIds[7], name: "Renee's Raiders", abbr: "REN" },
        { user: userIds[8], name: "D'Amato Dynasty", abbr: "DAM" },
        { user: userIds[9], name: "Kaity's Knights", abbr: "KAI" }
      ];

      for (let i = 0; i < teamData.length; i++) {
        const td = teamData[i];
        await client.query(
          `INSERT INTO teams (
            league_id,
            user_id,
            team_name,
            team_abbreviation,
            waiver_priority,
            waiver_budget_remaining,
            wins,
            losses,
            ties,
            points_for
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT ON CONSTRAINT teams_pkey DO UPDATE SET
            team_name = EXCLUDED.team_name,
            team_abbreviation = EXCLUDED.team_abbreviation`,
          [
            leagueId,
            td.user.id,
            td.name,
            td.abbr,
            i + 1,
            100,
            i === 8 ? 1 : (i < 5 ? 1 : 0), // Nicholas (index 8) has 1 win
            i === 8 ? 0 : (i < 5 ? 0 : 1), // Others have appropriate W-L
            0,
            i === 8 ? 128.7 : (120 - i * 2.5) // Nicholas has highest points
          ]
        );
      }

      // Get player count
      const playerCount = await client.query("SELECT COUNT(*) as count FROM players");

      return {
        usersCreated: userIds.length,
        leagueId,
        playersInDatabase: parseInt(playerCount.rows[0].count),
        users: userIds.map(u => ({
          name: u.name,
          pin: u.pin,
          email: u.email
        }))
      };
    });

    return NextResponse.json({
      success: true,
      message: "✅ Complete reset and setup successful!",
      data: result,
      instructions: [
        "Login with PIN 1009 for Nicholas D'Amato (admin/commissioner)",
        "Login with PIN 1001-1010 for other users",
        `${result.playersInDatabase} NFL players available in database`
      ]
    });

  } catch (error) {
    console.error("Reset and setup error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to reset and setup",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}