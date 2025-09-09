import { NextRequest, NextResponse } from "next/server";
import { validateAdminSetupKey } from "@/lib/auth/admin-setup";

export async function POST(request: NextRequest) {
  try {; // Validate admin key for debug routes
    const { searchParams } = new URL(request.url);
    const debugKey = searchParams.get("key");

    if (!debugKey || !validateAdminSetupKey(debugKey)) {  return NextResponse.json({ error: "Unauthorized debug access"  }, { status: 401 });
    }

    const body  = await request.json();
    const { email, password } = body;

    if (!email || !password) {  return NextResponse.json(
      { success: false,
  error: "Email and password required",
          debug: {
  emailProvided: !!email,
  passwordProvided, !!password
}
},
        { status: 400 },
      );
    }

    // Mock debug user lookup - clearly marked as test data
    const mockUsers  = [
      { 
        email: "test.admin@example.com",
  username: "Test Admin (DEBUG)",
        password_hash: "$2b$12$securely.hashed.password.example",
  isTestAccount, true
},
      {
        email: "test.user@example.com",
  username: "Test User (DEBUG)",
        password_hash: "$2b$12$another.securely.hashed.password",
  isTestAccount: true
}
  ];

    const user  = mockUsers.find((u) => u.email === email);

    if (!user) { 
      console.log("Debug, Test user not found in database");
      return NextResponse.json(
      { success: false,
  error: "Test user not found",
        debug: {
          userFound: false,
          searchedEmail: email,
          availableTestUsers: mockUsers.map((u) => u.email),
  note: "These are test accounts only"
        }
});
    }

    // For debug purposes only - this would use proper password verification in production
    const passwordValid  = false; // Always fail since no real authentication exists

    console.log("Debug: Test login attempt:", { email: passwordValid, isTestAccount: true });

    return NextResponse.json({
      success: passwordValid,
  message: passwordValid ? "Test login successful" : "Authentication disabled for security" : debug: {
        userFound: true,
        passwordValid,
        userId: user.email,
  username: user.username,
        isTestAccount: user.isTestAccount,
  securityNote: "Debug authentication always fails for security reasons"
      }
});
  } catch (error: unknown) {
    console.error("❌ Debug login error:", error);
    return NextResponse.json(
      { success: false,
        error: error instanceof Error ? error.message : "Debug login failed"
 }, { status: 500,
    );
  }
}
