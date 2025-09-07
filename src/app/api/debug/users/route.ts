import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Mock users data for debug
    const users = [
      {
        id: "1",
        email: "admin@example.com",
        username: "admin",
        password_hash: "hashed_password_1",
        created_at: "2025-01-01T00:00:00Z",
      },
      {
        id: "2",
        email: "user@example.com",
        username: "user",
        password_hash: "hashed_password_2",
        created_at: "2025-01-02T00:00:00Z",
      },
    ];

    // Return sanitized user info (no password hashes)
    const sanitizedUsers = users.map((user) => ({
      id: user.id,
      email: user.email,
      username: user.username,
      hasPasswordHash: !!user.password_hash,
      created_at: user.created_at,
    }));

    console.log(`Debug: Found ${users.length} users in database`);

    return NextResponse.json({
      success: true,
      count: users.length,
      users: sanitizedUsers,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("❌ Debug users error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch debug users",
      },
      { status: 500 },
    );
  }
}
