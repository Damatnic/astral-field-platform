/**
 * Chat Messages API Endpoint
 * Handles sending, fetching: and managing chat messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { chatService } from '@/services/chat/chatService';
import { verifyJWT } from '@/lib/auth/jwt-config';
import { z } from 'zod';
import { 
  userInputValidationMiddleware, validateChatMessage, validateQueryParams, queryParamsSchema, createValidationErrorResponse,
  hasValidationErrors
} from '@/lib/validation';

export const GET = userInputValidationMiddleware(async (request: NextRequest) => { try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Authentication required'  }, { status: 401 });
    }

    const decoded = verifyJWT(token) as any;
    
    // Validate query parameters
    const queryValidation = validateQueryParams(request, queryParamsSchema.extend({
      leagueId: z.string().uuid(),
  roomType: z.enum(['general', 'trades', 'waivers', 'off-topic']),
      before: z.string().optional(),
  search: z.string().max(100).optional()
    }));
    
    if (hasValidationErrors(queryValidation)) { return NextResponse.json(
        createValidationErrorResponse(queryValidation.errors),
        { status: 400  }
      );
    }

    const { leagueId, roomType, limit, before: search } = queryValidation.data!;

    let messages;
    if (search) { messages = await chatService.searchMessages(leagueId, roomType, search, limit);
     } else { messages = await chatService.getMessageHistory(leagueId, roomType, limit, before || undefined);
     }

    return NextResponse.json({
      success: true, data: messages,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Chat messages GET API error:', error);
    return NextResponse.json(
      { success: false,
  error: 'Failed to fetch messages',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});

export const POST = userInputValidationMiddleware(async (request: NextRequest) => { try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Authentication required'  }, { status: 401 });
    }

    const decoded = verifyJWT(token) as any;
    
    // Validate message data with comprehensive sanitization
    const messageValidation = await validateChatMessage(request);
    
    if (hasValidationErrors(messageValidation)) { return NextResponse.json(
        createValidationErrorResponse(messageValidation.errors),
        { status: 400  }
      );
    }

    const validatedData = messageValidation.data!;
    
    const message = await chatService.sendMessage(validatedData.leagueId as string,
      validatedData.roomType as any,
      decoded.userId,
      validatedData.content as string,
      'text',
      validatedData.replyToId as string | undefined
    );

    return NextResponse.json({
      success: true, data: message, timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Chat messages POST API error:', error);
    return NextResponse.json(
      { success: false,
  error: 'Failed to send message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});

export const DELETE = userInputValidationMiddleware(async (request: NextRequest) => { try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Authentication required'  }, { status: 401 });
    }

    const decoded = verifyJWT(token) as any;
    
    // Validate query parameters for message deletion
    const queryValidation = validateQueryParams(request, z.object({
      messageId: z.string().uuid('Invalid message ID format'),
  leagueId: z.string().uuid('Invalid league ID format'),
      roomType: z.enum(['general', 'trades', 'waivers', 'off-topic']),
      reason: z.string().max(200).optional()
    }));
    
    if (hasValidationErrors(queryValidation)) { return NextResponse.json(
        createValidationErrorResponse(queryValidation.errors),
        { status: 400  }
      );
    }

    const { messageId, leagueId, roomType, reason } = queryValidation.data!;

    await chatService.moderateMessage(messageId, decoded.userId, 'delete', reason);

    return NextResponse.json({
      success: true,
  message: 'Message deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Chat messages DELETE API error:', error);
    return NextResponse.json(
      { success: false,
  error: 'Failed to delete message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});