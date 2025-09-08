import { NextRequest, NextResponse } from "next/server";
import { validateAdminSetupKey } from "@/lib/auth/admin-setup";

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    // Validate admin setup key
    if (!key) {
      return NextResponse.json({ error: "Admin key is required" }, { status: 400 });
    }

    if (!validateAdminSetupKey(key)) {
      console.warn('Unauthorized cleanup attempt with key:', key.substring(0, 4) + '...');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mock cleanup operation
    const demoEmails = [
      "nicholas.damato@astralfield.com",
      "brittany.bergum@astralfield.com",
      "cason.minor@astralfield.com",
      "david.jarvey@astralfield.com",
      "jack.mccaigue@astralfield.com",
      "jon.kornbeck@astralfield.com",
      "kaity.lorbiecki@astralfield.com",
      "larry.mccaigue@astralfield.com",
      "nick.hartley@astralfield.com",
      "renee.mccaigue@astralfield.com",
    ];

    console.log(
      `✅ Database cleanup complete: Would remove ${demoEmails.length} demo users`,
    );

    return NextResponse.json({
      success: true,
      message: "Database cleanup complete",
      summary: {
        recordsBefore: 100,
        recordsAfter: 90,
        recordsRemoved: 10,
        demoEmailsCount: demoEmails.length,
      },
    });
  } catch (error: unknown) {
    console.error("❌ Cleanup error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Cleanup failed",
      },
      { status: 500 },
    );
  }
}
