import { NextRequest, NextResponse } from 'next/server';
import openaiService from '@/services/ai/openaiService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, context, contextData } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      return NextResponse.json(
        { error: 'Last message must be from user' },
        { status: 400 }
      );
    }

    let response: string;

    // Route to appropriate AI service method based on context
    switch (context) {
      case 'matchup':
        response = await openaiService.analyzeMatchup(
          contextData?.team1 || {},
          contextData?.team2 || {},
          contextData?.week || 1
        );
        break;
      
      case 'waiver':
        response = await openaiService.getWaiverTargets(
          contextData?.availablePlayers || [],
          contextData?.userRoster || [],
          contextData?.leagueSettings || {}
        );
        break;
      
      case 'lineup':
        response = await openaiService.optimizeLineup(
          contextData?.roster || [],
          contextData?.week || 1
        );
        break;
      
      default:
        response = await openaiService.getFantasyAdvice(
          lastMessage.content,
          contextData?.playerContext,
          contextData?.leagueContext
        );
    }

    return NextResponse.json({
      message: {
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('AI Chat API error:', error);
    
    // Handle specific OpenAI errors
    if (error.message.includes('API key')) {
      return NextResponse.json(
        { error: 'AI service not configured. Please check API key.' },
        { status: 503 }
      );
    }
    
    if (error.message.includes('quota')) {
      return NextResponse.json(
        { error: 'AI service quota exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'AI service temporarily unavailable' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  try {
    const isConnected = await openaiService.testConnection();
    
    return NextResponse.json({
      status: isConnected ? 'connected' : 'disconnected',
      service: 'OpenAI',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error', 
        error: 'Failed to check AI service status',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}