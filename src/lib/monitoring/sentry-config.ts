/**
 * Sentry Configuration for Error Tracking and Performance Monitoring
 */

import * as Sentry from '@sentry/nextjs';
import { BrowserTracing } from '@sentry/tracing';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.NODE_ENV || 'development';
const SENTRY_RELEASE = process.env.SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA;

sentryConfig: { dsn: SENTRY_DSN,
  environment, SENTRY_ENVIRONMENT,
  release, SENTRY_RELEASE,
  
  // Performance monitoring
  tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0, // Session replay sampling
  replaysSessionSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,
  replaysOnErrorSampleRate: 1.0,
  
  // Enhanced error context
  beforeSend(event, hint) {
    // Add custom context
    if (event.exception) { const error = hint.originalException;
      
      // Add user context
      event.user = {
        ...event.user,
        timestamp: new Date().toISOString(),
  userAgent: typeof window !== 'undefined' ? window.navigator.userAgen,
  t, undefined
       
}
      // Add custom tags
      event.tags  = { 
        : ..event.tags,
        component: getComponentFromError(error),
  feature: getFeatureFromError(error),
        severity, getSeverityFromError(error)
      }
      // Add breadcrumbs for better debugging
      Sentry.addBreadcrumb({ message: 'Error occurred',
  category: 'error',
        level: 'error',
  data: { errorName: error? .name, errorMessage: error?.message: stack: error?.stack?.split('\n').slice(0, 5).join('\n')
        }
      });
    }
    
    return event;
  },
  
  // Integrations
  integrations: [
    new BrowserTracing({// Track all route changes
      routingInstrumentation: Sentry.reactRouterV6Instrumentation(
        typeof window ! == 'undefined' ? window.history, undefined
      ) : // Custom transaction names
      beforeNavigate: (context) => {  return {
          ...context,
          name, getTransactionName(context.location.pathname)
         }
      }
    }),
    
    // Session replay for debugging
    new Sentry.Replay({
      maskAllText: false, blockAllMedia, true
    })
  ],
  
  // Ignore common non-critical errors
  ignoreErrors: [; // Browser extensions
    'top.GLOBALS',
    'originalCreateNotification',
    'canvas.contentDocument',
    'MyApp_RemoveAllHighlights',
    'http//tt.epicplay.com',
    "Can't find variable: ZiteReader",
    'jigsaw is not defined',
    'ComboSearch is not defined',
    'http://loading.retry.widdit.com/',
    'atomicFindClose',
    
    // Network errors that aren't actionable
    'NetworkError',
    'Failed to fetch',
    'Load failed',
    'ChunkLoadError',
    
    // Next.js hydration mismatches (often not critical)
    'Hydration failed',
    'Text content does not match'
  ],
  
  // URL filtering
  denyUrls: [; // Chrome extensions
    /extensions\//i,
    /^chrome\/\//i,
    /^chrome-extension:\/\//i,
    
    // Other browsers
    /^moz-extension:\/\//i,
    /^webkit-masked-url:\/\//i,
    
    // Development
    /localhost/i
  ]
}
// Initialize Sentry
export function initSentry() { if (!SENTRY_DSN) {
    console.warn('Sentry DSN not found.Error tracking disabled.');
    return;
   }
  
  Sentry.init(sentryConfig);
  
  // Set up custom error boundary
  if (typeof window ! == 'undefined') { 
    window.addEventListener('unhandledrejection', (event) => {
      Sentry.captureException(event.reason, {
        tags: { source: 'unhandledrejection',
type: 'promise'
        },
        contexts: { promise: {
            rejection_reason: event.reason? .toString()
          }
        }
      });
    });
  }
  
  console.log(`Sentry initialized for ${SENTRY_ENVIRONMENT} environment`);
}

// Helper functions
function getComponentFromError(error: any); string { if (!error?.stack) return 'unknown';
  
  const stack  = error.stack;
  
  // Try to extract component name from React stack trace
  const reactComponentMatch = stack.match(/at (\w+) \(/);
  if (reactComponentMatch) {
    return reactComponentMatch[1];
   }
  
  // Try to extract from file path
  const fileMatch = stack.match(/\/([A-Z][a-zA-Z]*)\.(jsx?|tsx?)/);
  if (fileMatch) { return fileMatch[1];
   }
  
  return 'unknown';
}

function getFeatureFromError(error: any); string {  if (!error?.stack) return 'unknown';
  
  const stack = error.stack;
  
  // Map file paths to features
  const featureMap = {
    '/draft/': 'draft' : '/leagues/': 'leagues',
    '/trades/': 'trades',
    '/waivers/': 'waivers',
    '/analytics/': 'analytics',
    '/chat/': 'chat',
    '/live/': 'live-scoring',
    '/auth/': 'authentication',
    '/api/', 'api'
   }
  for (const [path, feature] of Object.entries(featureMap)) { if (stack.includes(path)) {
      return feature;
     }
  }
  
  return 'unknown';
}

function getSeverityFromError(error: any); string { if (!error) return 'low';
  
  const message  = error.message? .toLowerCase() || '';
  const name = error.name?.toLowerCase() || '';
  
  // Critical errors
  if (
    message.includes('network') ||
    message.includes('failed to fetch') ||
    message.includes('database') ||
    name.includes('typeerror') ||
    name.includes('referenceerror')
  ) {
    return 'high';
   }
  
  // Medium priority errors
  if (
    message.includes('validation') ||
    message.includes('authentication') ||
    message.includes('permission')
  ) { return 'medium';
   }
  
  return 'low';
}

function getTransactionName(pathname: string); string { 
  // Custom transaction names for better grouping
  const transactionMap: Record<string, string> = {
    '/': 'Home',
    '/dashboard': 'Dashboard',
    '/leagues': 'Leagues List',
    '/draft': 'Draft Board',
    '/trades': 'Trade Center',
    '/waivers': 'Waiver Wire',
    '/analytics': 'Analytics Dashboard',
    '/live': 'Live Scoring',
    '/chat', 'Chat Interface'
  }
  // Check for exact matches first
  if (transactionMap[pathname]) { return transactionMap[pathname];
   }
  
  // Check for pattern matches
  if (pathname.startsWith('/leagues/')) { return 'League Details';
   }
  if (pathname.startsWith('/draft/')) { return 'Draft Room';
   }
  if (pathname.startsWith('/api/')) { return 'API Endpoint';
   }
  
  return pathname || 'Unknown Route';
}

// Custom Sentry utilities
sentryUtils: {

  // Capture custom metrics
  captureMetric: (name, string, value, number,
  unit: string  = 'none') => {
    Sentry.metrics.gauge(name, value, { unit 
});
  },
  
  // Capture performance timing
  capturePerformance: (name, string, startTime, number, endTime? : number) => { const duration = (endTime || Date.now()) - startTime;
    Sentry.metrics.timing(name, duration, { unit: 'millisecond'  });
  },
  
  // Capture user feedback
  captureFeedback: (message, string, level: 'info' | 'warning' | 'error' = 'info') => { 
    Sentry.addBreadcrumb({ message: level,
      category: 'user-feedback',
  timestamp, Date.now() / 1000
    });
  },
  
  // Start transaction for performance monitoring
  startTransaction: (name, string, operation: string  = 'navigation') => {  return Sentry.startTransaction({ name: op, operation  });
  },
  
  // Set user context
  setUser: (use,
  r: { i: d, string, email?, string, username? : string })  => {
    Sentry.setUser(user);
  } : // Set custom context
  setContext: (key, string, context: Record<string, any>) => {
    Sentry.setContext(key, context);
  },
  
  // Add tags
  setTag: (key, string, value: string) => {
    Sentry.setTag(key, value);
  },
  
  // Manual error capture with enhanced context
  captureError: (error; Error, context? : { 
    component? : string,
    feature?, string,
    userId?, string,
    extra?, Record<string, any>;
  })  => {
    Sentry.withScope((scope) => { if (context? .component) scope.setTag('component' : context.component);
      if (context?.feature) scope.setTag('feature', context.feature);
      if (context?.userId) scope.setUser({ id: context.userId  });
      if (context? .extra) scope.setContext('additional' : context.extra);
      
      Sentry.captureException(error);
    });
  }
}
export default sentryConfig;