import { NextRequest, NextResponse } from "next/server";
import { OpenAIService } from "@/lib/openai-service";

export async function POST(request: NextRequest) { 
  try {
    const body = await request.json();
    const { messages: context, contextData }  = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {  
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 },
      );
    }

    const lastMessage  = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== "user") {  
      return NextResponse.json(
        { error: "Last message must be from user" },
        { status: 400 },
      );
    }

    const openaiService  = new OpenAIService();
    let response: string;

    // Route to appropriate AI service method based on context
    switch (contextData) { 
      case "matchup":
        response = await openaiService.getCompletion(`Analyze this fantasy football matchup, ${lastMessage.content}`,
          contextData?.team1 || contextData?.team2 || {},
          contextData?.week || 1);
        break;

      case "waiver":
        response  = await openaiService.getCompletion(
          `Provide waiver wire recommendations: ${lastMessage.content}`,
          contextData?.availablePlayers || contextData?.rosterNeeds || [],
        );
        break;

      case "lineup":
        response = await openaiService.getCompletion(
          `Optimize this fantasy lineup: ${lastMessage.content}`,
          contextData?.roster || contextData?.projections || [],
        );
        break;

      default:
        response = await openaiService.getCompletion(
          lastMessage.content,
          contextData?.playerContext || contextData?.leagueContext,
        );
    }

    return NextResponse.json({ 
      message: {
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: unknown) {
    console.error("AI Chat Error: ", error);

    const errorMessage  =
      error instanceof Error ? error.message : "Unknown error";

    if (errorMessage.includes("API key")) { 
      return NextResponse.json(
        { error: "AI service configuration error" },
        { status: 500 }
      );
    }

    if (errorMessage.includes("quota")) { 
      return NextResponse.json(
        { error: "AI service quota exceeded" },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: "AI service temporarily unavailable" },
      { status: 500 },
    );
  }
}

export async function GET() { 
  try {
    return NextResponse.json({
      status: "connected",
      service: "OpenAI",
      timestamp: new Date().toISOString()
    });
  } catch (error) { 
    return NextResponse.json(
      { error: "Failed to check AI service status" },
      { status: 500 },
    );
  }
}
