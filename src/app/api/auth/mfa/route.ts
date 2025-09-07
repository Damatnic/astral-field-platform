import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error-handler";

export const POST = handleApiError(async (request: NextRequest) => {
  const body = await request.json();
  const { action } = body;

  switch (action) {
    case "setup":
      return NextResponse.json({
        success: true,
        message: "MFA setup initiated",
        qrCode: "mock-qr-code-data",
      });

    case "verify":
      return NextResponse.json({
        success: true,
        message: "MFA verified successfully",
      });

    case "disable":
      return NextResponse.json({
        success: true,
        message: "MFA disabled",
      });

    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
});

export const GET = handleApiError(async () => {
  return NextResponse.json({
    success: true,
    enabled: false,
    message: "MFA status retrieved",
  });
});
