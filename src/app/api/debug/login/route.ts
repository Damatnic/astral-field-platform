import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Email and password required",
          debug: {
            emailProvided: !!email,
            passwordProvided: !!password,
          },
        },
        { status: 400 },
      );
    }

    // Mock debug user lookup
    const mockUsers = [
      {
        email: "admin@example.com",
        username: "admin",
        password_hash: "hashed_password",
      },
      {
        email: "user@example.com",
        username: "user",
        password_hash: "hashed_password",
      },
    ];

    const user = mockUsers.find((u) => u.email === email);

    if (!user) {
      console.log("Debug: User not found in database");
      return NextResponse.json({
        success: false,
        error: "User not found",
        debug: {
          userFound: false,
          searchedEmail: email,
          availableUsers: mockUsers.map((u) => u.email),
        },
      });
    }

    // Mock password verification
    const passwordValid = password === "password"; // Simple mock

    console.log("Debug: Login attempt:", { email, passwordValid });

    return NextResponse.json({
      success: passwordValid,
      message: passwordValid ? "Login successful" : "Invalid password",
      debug: {
        userFound: true,
        passwordValid,
        userId: user.email,
        username: user.username,
      },
    });
  } catch (error: unknown) {
    console.error("❌ Debug login error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Debug login failed",
      },
      { status: 500 },
    );
  }
}
