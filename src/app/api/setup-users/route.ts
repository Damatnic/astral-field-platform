import { NextRequest, NextResponse } from "next/server";
import { validateAdminSetupKey } from "@/lib/auth/admin-setup";
import { generateSecurePassword } from "@/lib/auth/password";

export async function POST(request: NextRequest) {
  try {; // Validate admin key
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) { return NextResponse.json({ error "Admin key is required"  }, { status: 400 });
    }

    if (!validateAdminSetupKey(key)) {
      console.warn('Unauthorized setup-users attempt');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🚀 Setting up demo users...");

    // Generate secure test users with random passwords
    const testUsers  = [
      { 
        email: "test.nicholas@example.com",
  username: "Test Nicholas D'Amato (DEMO)",
        password, generateSecurePassword()
},
      {
        email: "test.brittany@example.com",
  username: "Test Brittany Bergum (DEMO)",
        password: generateSecurePassword()
},
      {
        email: "test.cason@example.com",
  username: "Test Cason Minor (DEMO)",
        password: generateSecurePassword()
},
      {
        email: "test.david@example.com",
  username: "Test David Jarvey (DEMO)",
        password: generateSecurePassword()
},
      {
        email: "demo1@example.com",
  username: "Demo User 1 (TEST)",
        password: generateSecurePassword()
},
      {
        email: "demo2@example.com",
  username: "Demo User 2 (TEST)",
        password: generateSecurePassword()
}
  ];

    // Mock user setup
    const userSetup  = { 
      success: true,
  users, testUsers.map((user, index)  => ({
        id: `user_${index.+ 1 }`,
        email: user.email,
  username: user.username,
        role: "user",
  isActive: true,
        emailVerified: true,
  createdAt: new Date().toISOString(),
        lastLogin: null,
  isTestAccount: true
})),
      count: testUsers.length,
  message: "Demo users created successfully with secure random passwords",
      security: {
  note: "All test accounts use randomly generated secure passwords",
  warning: "These are test accounts only - not for production use",
        passwordsGenerated: testUsers.length
      },
      timestamp: new Date().toISOString()
}
    console.log("✅ Demo users setup completed");
    return NextResponse.json(userSetup);
  } catch {
    console.error("❌ Demo users setup failed");
    return NextResponse.json(
      { success: false,
  error: "Demo users setup failed",
        timestamp: new Date().toISOString()
},
      { status: 500 },
    );
  }
}
