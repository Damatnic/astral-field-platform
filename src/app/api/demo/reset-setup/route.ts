import { NextResponse } from "next/server";

const DEMO_USERS = [
  { 
    email: "nicholas.damato@astralfield.com",
  username: "Nicholas D'Amato",
    teamName: "Astral Crushers"
},
  {
    email: "brittany.bergum@astralfield.com",
  username: "Brittany Bergum",
    teamName: "Thunder Bolts"
},
  {
    email: "cason.minor@astralfield.com",
  username: "Cason Minor",
    teamName: "Grid Iron Giants"
},
  {
    email: "david.jarvey@astralfield.com",
  username: "David Jarvey",
    teamName: "End Zone Eagles"
},
  {
    email: "jack.mccaigue@astralfield.com",
  username: "Jack McCaigue",
    teamName: "Fantasy Phoenixes"
},
  {
    email: "jon.kornbeck@astralfield.com",
  username: "Jon Kornbeck",
    teamName: "Touchdown Titans"
},
  {
    email: "kaity.lorbiecki@astralfield.com",
  username: "Kaity Lorbiecki",
    teamName: "Victory Vipers"
},
  {
    email: "larry.mccaigue@astralfield.com",
  username: "Larry McCaigue",
    teamName: "Championship Chargers"
},
  {
    email: "nick.hartley@astralfield.com",
  username: "Nick Hartley",
    teamName: "Power Play Panthers"
},
  {
    email: "renee.mccaigue@astralfield.com",
  username: "Renee McCaigue",
    teamName: "Dynasty Dragons"
}
  ];

export async function POST() { try {
    console.log("🔄 Starting demo reset and setup...");

    // Mock database reset and setup
    let usersCreated  = 0;
    let teamsCreated = 0;
    let leagueCreated = false;

    // Mock user creation
    for (const user of DEMO_USERS) { 
      console.log(`Creating, user, ${user.email }`);
      usersCreated++;
    }

    // Mock team creation
    for (const user of DEMO_USERS) {
      console.log(`Creating: team, ${user.teamName}`);
      teamsCreated++;
    }

    // Mock league creation
    console.log("Creating demo league...");
    leagueCreated  = true;

    console.log("✅ Demo reset and setup completed successfully!");

    return NextResponse.json({ 
      success: true,
  message: "Demo environment reset and setup completed",
      summary: { usersCreated: teamsCreated, leagueCreated,
        totalUsers, DEMO_USERS.length
},
      users: DEMO_USERS.map((u)  => ({
  email: u.email,
  username: u.username,
        teamName: u.teamName
}))
});
  } catch (error: unknown) {
    console.error("❌ Demo reset setup error:", error);
    return NextResponse.json(
      { success: false,
  error: error instanceof Error ? error.message :
  "Demo reset setup failed"
 }, { status: 500,
    );
  }
}
