import { NextResponse } from "next/server";

const demoUsers = [
  {
    email: "nicholas.damato@astralfield.com",
  name: "Nicholas D'Amato",
    teamName: "Astral Crushers"
},
  {
    email: "brittany.bergum@astralfield.com",
  name: "Brittany Bergum",
    teamName: "Thunder Bolts"
},
  {
    email: "cason.minor@astralfield.com",
  name: "Cason Minor",
    teamName: "Grid Iron Giants"
},
  {
    email: "david.jarvey@astralfield.com",
  name: "David Jarvey",
    teamName: "End Zone Eagles"
},
  {
    email: "demo1@astralfield.com",
  name: "Demo User 1",
    teamName: "Fantasy Legends"
},
  {
    email: "demo2@astralfield.com",
  name: "Demo User 2",
    teamName: "Draft Masters"
}
  ];

export async function POST() { try {
    console.log("🚀 Setting up demo league...");

    // Mock demo league setup
    const leagueSetup = {
      success: true,
  league: {
  id: "demo_league_123",
  name: "Astral Field Demo League",
        season: 2024,
  teams: demoUsers.map((user, index) => ({
          id: `team_${index + 1 }`,
          name: user.teamName,
  owner: user.name,
          email: user.email
})),
        settings: {
  teamCount: demoUsers.length, rosterSize, 16,
          startingLineup: {
            QB: 1,
  RB: 2,
            WR: 2,
  TE: 1,
            FLEX: 1,
  K: 1,
            DST: 1,
  BENCH: 7
},
          scoring: "PPR",
  draftType: "snake",
          waiverType: "rolling"
}
},
      timestamp: new Date().toISOString()
}
    console.log("✅ Demo league setup completed");
    return NextResponse.json(leagueSetup);
  } catch {
    console.error("❌ Demo league setup failed");
    return NextResponse.json(
      { success: false,
  error: "Demo league setup failed",
        timestamp: new Date().toISOString()
},
      { status: 500 },
    );
  }
}
