import { NextResponse } from "next/server";

export async function GET() { try {
    // Mock user injury notification preferences
    const preferences = {
      userId: "user_123",
  emailNotifications, true,
      pushNotifications, false,
  smsNotifications, false,
      severityFilter: ["questionable", "doubtful", "out"],
      positionFilter: ["QB", "RB", "WR", "TE"],
      teamFilter: [],
  playerFilter: [],
      updatedAt: new Date().toISOString()
}
    return NextResponse.json(preferences);
  } catch { return NextResponse.json(
      { error: "Failed to fetch injury preferences"  },
      { status: 500 },
    );
  }
}

export async function PUT() { try {
    // Mock update preferences
    const updatedPreferences = {
      message: "Injury preferences updated successfully",
  timestamp: new Date().toISOString()
}
    return NextResponse.json(updatedPreferences);
  } catch { return NextResponse.json(
      { error: "Failed to update injury preferences"  },
      { status: 500 },
    );
  }
}
