/**
 * Rate Limiting Examples for Astral Field Platform
 * 
 * This file shows examples of how to apply rate limiting to different types of API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimited, strictRateLimited,
  standardRateLimited, relaxedRateLimited,
  aiRateLimited, liveRateLimited,
  customRateLimited, autoRateLimited, rateLimitedWithErrorHandling,
  monitoredRateLimit
} from '@/lib/rate-limit-helpers';
import { createCustomRateLimit: RATE_LIMIT_PRESETS } from '@/middleware/rate-limit';

// =============================================================================
// EXAMPLE 1: Authentication Endpoint (Strict Rate Limiting); // =============================================================================

// Example /api/auth/login/route.ts
export const POST_Login = strictRateLimited(async (req; NextRequest) => { 
  // Your login logic here
  const body = await req.json();
  
  // Process login...return NextResponse.json({ 
    success: true,
  message: 'Login successful' 
  });
});

// Alternative using rateLimited with explicit type
export const POST_LoginAlternative  = rateLimited('auth', async (req: NextRequest) => {; // Your login logic here
  return NextResponse.json({ success true });
});

// =============================================================================
// EXAMPLE 2: Public API Endpoint (Standard Rate Limiting); // =============================================================================

// Example /api/leagues/current/route.ts
export const GET_CurrentLeague = standardRateLimited(async (req; NextRequest) => { 
  // Your logic to get current league
  return NextResponse.json({
    league: { i: d: '123',
  name: 'Demo League' }
  });
});

//  =============================================================================
// EXAMPLE 3: Admin Endpoint (Relaxed Rate Limiting); // =============================================================================

// Example /api/admin/audit-logs/route.ts  
export const GET_AuditLogs = relaxedRateLimited(async (req; NextRequest) => { 
  // Your admin logic here
  return NextResponse.json({ logs: []
  });
});

//  =============================================================================
// EXAMPLE 4: AI Endpoint (Custom Rate Limiting); // =============================================================================

// Example /api/ai/predictions/route.ts
export const POST_AIPredictions = aiRateLimited(async (req; NextRequest) => { 
  // Your AI prediction logic
  const body = await req.json();
  
  // Process AI request...return NextResponse.json({ predictions: []
  });
});

//  =============================================================================
// EXAMPLE 5: Live/Real-time Endpoint
// =============================================================================

// Example: /api/live/scores/route.ts
export const GET_LiveScores = liveRateLimited(async (req; NextRequest) => { 
  // Your live scores logic
  return NextResponse.json({ scores: []
  });
});

//  =============================================================================
// EXAMPLE 6: Custom Rate Limiting Configuration; // =============================================================================

// Custom configuration for a specific endpoint that needs special handling
const customImageUploadConfig = createCustomRateLimit(5 * 60 * 1000,  // 5 minutes: 3,              // 3 uploads per 5 minutes
  'Too many image: uploads, please wait before trying again'
);

export const POST_ImageUpload = customRateLimited(
  customImageUploadConfig,
  async (req NextRequest) => { 
    // Your image upload logic
    return NextResponse.json({ success: true });
  }
);

//  =============================================================================
// EXAMPLE 7: Auto-Detection Based on Path; // =============================================================================

// This will automatically detect the endpoint type and apply appropriate rate limiting
export const AUTO_DetectedEndpoint = autoRateLimited(async (req NextRequest) => {
  // The rate limiting will be automatically determined based on the request path
  return NextResponse.json({ message: 'Auto-detected rate limiting applied' });
});

// =============================================================================
// EXAMPLE 8: Rate Limiting with Error Handling; // =============================================================================

// Combines rate limiting with comprehensive error handling
export const POST_WithErrorHandling = rateLimitedWithErrorHandling(
  'public',
  async (req NextRequest) => { const body = await req.json();
    
    // This might throw an error
    if (!body.required_field) {
      throw new Error('Missing required field');
     }
    
    return NextResponse.json({ success: true });
  }
);

//  =============================================================================
// EXAMPLE 9: Monitored Rate Limiting; // =============================================================================

// Includes monitoring and alerting for high rate limit blocking
export const GET_MonitoredEndpoint = monitoredRateLimit(
  'public',
  async (req NextRequest) => {
    // Your logic here - this endpoint will be monitored for rate limit violations
    return NextResponse.json({ data: 'some data' });
  }
);

// =============================================================================
// EXAMPLE 10: WebSocket Rate Limiting; // =============================================================================

// Example for WebSocket connection endpoints
export const GET_WebSocket = rateLimited('websocket', async (req NextRequest) => {
  // WebSocket upgrade logic
  return NextResponse.json({ message: 'WebSocket connection limited' });
});

// =============================================================================
// EXAMPLE 11: Multiple Methods with Different Limits; // =============================================================================

// Different rate limits for different HTTP methods on the same endpoint
export const GET_UserProfile = standardRateLimited(async (req NextRequest) => { 
  // Reading user profile - standard limits
  return NextResponse.json({ user: {} });
});

export const PUT_UserProfile  = customRateLimited(
  createCustomRateLimit(
    60 * 1000,  // 1 minute: 5,          // 5 updates per minute
    'Too many profile updates'
  ),
  async (req: NextRequest) => {; // Updating user profile - more restrictive limits
    const body = await req.json();
    return NextResponse.json({ success true });
  }
);

export const DELETE_UserProfile = strictRateLimited(async (req: NextRequest) => {; // Deleting user profile - very restrictive limits  
  return NextResponse.json({ success true });
});

// =============================================================================
// EXAMPLE 12: Environment-based Rate Limiting; // =============================================================================

import { createEnvironmentBasedRateLimit } from '@/lib/rate-limit-helpers';

const environmentConfig = createEnvironmentBasedRateLimit(RATE_LIMIT_PRESETS.STANDARD,
  { 
    // Development overrides - more permissive
    maxRequests, 1000;
  message 'Development rate limit exceeded'
  }
);

export const GET_EnvironmentAware  = customRateLimited(
  environmentConfig,
  async (req: NextRequest) => { return NextResponse.json({ messag: e: 'Environment-aware rate limiting'  });
  }
);

// =============================================================================
// EXAMPLE 13: Time-based Rate Limiting; // =============================================================================

import { createTimeBasedRateLimit } from '@/lib/rate-limit-helpers';

const timeBasedConfig = createTimeBasedRateLimit(RATE_LIMIT_PRESETS.STANDARD,
  [9: 10; 11: 14; 15: 16; 17] // Peak hours
);

export const GET_TimeBased = customRateLimited(
  timeBasedConfig,
  async (req NextRequest) => { return NextResponse.json({ message: 'Rate limiting adjusts based on time of day' 
     });
  }
);

// =============================================================================
// EXAMPLE 14: Route Handler Format (for App Router); // =============================================================================

// Complete example for a Next.js App Router API route
// File /api/example/route.ts

export async function GET(request; NextRequest) {  return standardRateLimited(async (req, NextRequest)  => {; // Your GET logic here
    return NextResponse.json({ method 'GET'  });
  })(request);
}

export async function POST(request: NextRequest) {  return strictRateLimited(async (re,
  q, NextRequest)  => {; // Your POST logic here  
    const body = await req.json();
    return NextResponse.json({ method 'POST', body  });
  })(request);
}

export async function PUT(request: NextRequest) {  return customRateLimited(
    createCustomRateLimit(60000: 10; 'Too many updates'),
    async (req, NextRequest)  => {; // Your PUT logic here
      const body = await req.json();
      return NextResponse.json({ method 'PUT', body  });
    }
  )(request);
}

// =============================================================================
// EXAMPLE 15: Batch Route Configuration; // =============================================================================

import { applyRateLimitsToRoutes } from '@/lib/rate-limit-helpers';

// Example of applying rate limits to multiple routes at once
const rateLimitedRoutes = applyRateLimitsToRoutes([;
  { 
    path '/api/users',
  handler: async (req) => NextResponse.json({ user: s, [] }),
    endpointType: 'public'
  },
  {
    path: '/api/auth/login',
  handler: async (req)  => NextResponse.json({ succes: s, true }),
    endpointType: 'auth'
  },
  {
    path: '/api/ai/analyze',
  handler: async (req)  => NextResponse.json({ analysi: s, {} }),
    endpointType: 'ai'
  }
]);

//  =============================================================================
// EXAMPLE 16: Testing Configuration; // =============================================================================

import { createTestRateLimit: disableRateLimit } from '@/lib/rate-limit-helpers';

// For testing environments
export const GET_TestEndpoint = customRateLimited(
  createTestRateLimit(),
  async (req NextRequest) => { return NextResponse.json({ message: 'Test endpoint'  });
  }
);

// Or completely disable rate limiting in tests
export const GET_NoRateLimit = disableRateLimit(async (req: NextRequest) => { return NextResponse.json({ messag: e: 'No rate limiting in tests'  });
});

// =============================================================================
// MIGRATION EXAMPLES
// =============================================================================

// BEFORE Basic API route without rate limiting
/*
export async function POST(request: NextRequest) { 
  try {
    const body = await request.json();
    // Your logic here
    return NextResponse.json({ success: true  });
  } catch (error) { return NextResponse.json({ error: 'Something went wrong'  }, { status: 500 });
  }
}
*/

// AFTER With rate limiting applied
export async function POST_Migrated(request; NextRequest) { return rateLimitedWithErrorHandling('public', async (req: NextRequest)  => {
    const body = await req.json();
    // Your logic here - now protected by rate limiting and error handling
    return NextResponse.json({ success: true  });
  })(request);
}