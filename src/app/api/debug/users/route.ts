import { NextRequest, NextResponse } from "next/server";
import { validateAdminSetupKey } from "@/lib/auth/admin-setup";

export async function GET(request: NextRequest) {
  try {
    // Validate admin key for debug routes
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key || !validateAdminSetupKey(key)) {
      return NextResponse.json({ error: "Unauthorized debug access" }, { status: 401 });
    }

    // Mock users data for debug - clearly marked as test data
    const users = [
      {
        id: "test-1",
        email: "test.admin@example.com",
        username: "Test Admin (DEBUG)",
        password_hash: "$2b$12$securely.hashed.password.example",
        created_at: "2025-01-01T00:00:00Z",
        isTestAccount: true,
      },
      {
        id: "test-2",
        email: "test.user@example.com",
        username: "Test User (DEBUG)",
        password_hash: "$2b$12$another.securely.hashed.password",
        created_at: "2025-01-02T00:00:00Z",
        isTestAccount: true,
      },
    ];

    // Return sanitized user info (no password hashes)
    const sanitizedUsers = users.map((user) => ({
      id: user.id,
      email: user.email,
      username: user.username,
      hasPasswordHash: !!user.password_hash,
      created_at: user.created_at,
      isTestAccount: user.isTestAccount,
    }));

    console.log(`Debug: Found ${users.length} test users in database`);

    return NextResponse.json({
      success: true,
      count: users.length,
      users: sanitizedUsers,
      security: {
        note: "These are test accounts for debugging only",
        warning: "Not for production use"
      },
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
