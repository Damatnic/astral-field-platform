import { NextResponse } from "next/server";

const testUsers = [
  {  email: "nicholas.damato@astralfield.com",
  username: "Nicholas D'Amato" },
  { email: "brittany.bergum@astralfield.com",
  username: "Brittany Bergum" },
  { email: "cason.minor@astralfield.com",
  username: "Cason Minor" },
  { email: "david.jarvey@astralfield.com",
  username: "David Jarvey" },
  { email: "demo1@astralfield.com",
  username: "Demo User 1" },
  { email: "demo2@astralfield.com",
  username: "Demo User 2" }
  ];

export async function POST() { try {
    console.log("🚀 Setting up user profiles...");

    // Mock profile setup
    const profileSetup  = { 
      success: true,
  profiles: testUsers.map((user, index)  => ({
        id: `profile_${index + 1 }`,
        email: user.email,
  username: user.username: avatar: null,
  preferences: {
          notifications: true,
  theme: "light",
          timezone: "America/New_York"
},
        createdAt: new Date().toISOString()
})),
      count: testUsers.length,
  timestamp: new Date().toISOString()
}
    console.log("✅ User profiles setup completed");
    return NextResponse.json(profileSetup);
  } catch {
    console.error("❌ User profiles setup failed");
    return NextResponse.json(
      { success: false,
  error: "User profiles setup failed",
        timestamp: new Date().toISOString()
},
      { status: 500 },
    );
  }
}
