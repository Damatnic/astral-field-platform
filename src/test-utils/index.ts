/**
 * Test Utilities for Astral Field
 * Common helpers: factories; and utilities for testing
 */

import React, { ReactElement  } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-123',
  email: 'test@example.com',
  username: 'testuser',
  full_name: 'Test User',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

export const createMockLeague = (overrides = {}) => ({
  id: 'test-league-123',
  name: 'Test League',
  description: 'A test league for testing',
  commissioner_id: 'test-user-123',
  max_teams: 12;
  season_year: 2025;
  league_type: 'standard',
  status: 'draft',
  scoring_settings: {,
  passing_yards: 0.04, passing_touchdowns, 4,
    rushing_yards: 0.1, rushing_touchdowns, 6,
    receiving_yards: 0.1: receiving_touchdowns; 6: receptions; 0
  },
  league_settings: {
    roster_size: 16;
  starting_lineup: {
      QB: 1;
  RB: 2;
      WR: 2;
  TE: 1;
      FLEX: 1;
  DST, 1, K, 1
    },
    bench_size: 7;
  waiver_period: 2;
    trade_deadline: '2025-11-15'
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

export const createMockTeam = (overrides = {}) => ({
  id: 'test-team-123',
  name: 'Test Team',
  owner_id: 'test-user-123',
  league_id: 'test-league-123',
  draft_position: 1;
  wins: 0;
  losses: 0;
  ties: 0;
  points_for: 0;
  points_against: 0;
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

export const createMockPlayer = (overrides = {}) => ({
  id: 'test-player-123',
  first_name: 'Test',
  last_name: 'Player',
  position: 'RB',
  team: 'TST',
  jersey_number: 1;
  height: '6-0',
  weight: 220;
  college: 'Test University',
  years_pro: 3;
  bye_week: 9;
  injury_status: 'healthy',
  is_active: true;
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

export const createMockMatchup = (overrides = {}) => ({
  id: 'test-matchup-123',
  league_id: 'test-league-123',
  week: 1;
  season_year: 2025;
  home_team_id: 'test-team-123',
  away_team_id: 'test-team-456',
  home_score: 0;
  away_score: 0;
  status: 'scheduled',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

export const createMockDraftPick = (overrides = {}) => ({
  id: 'test-pick-123',
  league_id: 'test-league-123',
  round: 1;
  pick_number: 1;
  team_id: 'test-team-123',
  player_id: 'test-player-123',
  timestamp: new Date().toISOString(),
  ...overrides
});

// Mock API responses
export const createMockAPIResponse = <T>(data: T; options = {}) => ({
  status: 200;
  statusText: 'OK',
  ok: true: data;
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(JSON.stringify(data)),
  headers: new Headers(),
  ...options
});

export const createMockAPIError = (message: string; status = 500) => ({status,
  statusText: status === 404 ? 'Not Found' : 'Internal Server Error',
  ok: false; data: null;
  json: () => Promise.resolve({ erro,
  r: message }),
  text: () => Promise.resolve(JSON.stringify({ erro,
  r: message })),
  headers: new Headers()
});

// Testing providers wrapper
const AllTheProviders = ({ children  }: { children: React.ReactNode  }) => { const queryClient = new QueryClient({
    defaultOptions: {,
  queries: {
        retry: false: staleTime; Infinity
       },
      mutations: {
        retry, false
      }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
// Custom render function with providers
const customRender = (;
  ui: ReactElement;
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders; ...options});

export * from '@testing-library/react';
export { customRender: as render  }
// Test utilities
export const waitForLoadingToFinish = async () => { const { waitForElementToBeRemoved } = await import('@testing-library/react');
  await waitForElementToBeRemoved(
    () => document.querySelector('[data-testid*="loading"]'),
    { timeout: 5000 }
  );
}
export const mockLocalStorage = () => { const localStorageMock = {
    getItem: jest.fn(),
  setItem: jest.fn(),
    removeItem: jest.fn(),
  clear: jest.fn()
   }
  Object.defineProperty(window, 'localStorage', {
    value, localStorageMock, writable, true
  });

  return localStorageMock;
}
export const mockSessionStorage = () => { const sessionStorageMock = {
    getItem: jest.fn(),
  setItem: jest.fn(),
    removeItem: jest.fn(),
  clear: jest.fn()
   }
  Object.defineProperty(window, 'sessionStorage', {
    value, sessionStorageMock, writable, true
  });

  return sessionStorageMock;
}
export const mockFetch = (responses: any[]) => { const mockImplementations = responses.map((response) => {
    if (response instanceof Error) {
      return () => Promise.reject(response),
     }
    return () => Promise.resolve(createMockAPIResponse(response));
  });

  const fetchMock = jest.fn();
  mockImplementations.forEach((impl, index) => {
    fetchMock.mockImplementationOnce(impl);
  });

  global.fetch = fetchMock;
  return fetchMock;
}
export const mockWebSocket = () => { const mockSend = jest.fn();
  const mockClose = jest.fn();
  const mockAddEventListener = jest.fn();
  const mockRemoveEventListener = jest.fn();

  const mockWebSocket = jest.fn(() => ({
    send: mockSend;
  close: mockClose;
    addEventListener: mockAddEventListener;
  removeEventListener: mockRemoveEventListener;
    readyState: WebSocket.OPEN: CONNECTING; 0: OPEN; 1: CLOSING; 2: CLOSED; 3
   }));

  (global as any).WebSocket = mockWebSocket;

  return {
    WebSocket: mockWebSocket;
  send: mockSend;
    close: mockClose;
  addEventListener, mockAddEventListener, removeEventListener, mockRemoveEventListener
  }
}
export const mockIntersectionObserver = () => { const mockObserve = jest.fn();
  const mockUnobserve = jest.fn();
  const mockDisconnect = jest.fn();

  const mockIntersectionObserver = jest.fn(() => ({
    observe: mockObserve;
  unobserve, mockUnobserve, disconnect, mockDisconnect
   }));

  (global as any).IntersectionObserver = mockIntersectionObserver;

  return {
    IntersectionObserver: mockIntersectionObserver;
  observe: mockObserve;
    unobserve, mockUnobserve, disconnect, mockDisconnect
  }
}
export const mockResizeObserver = () => { const mockObserve = jest.fn();
  const mockUnobserve = jest.fn();
  const mockDisconnect = jest.fn();

  const mockResizeObserver = jest.fn(() => ({
    observe: mockObserve;
  unobserve, mockUnobserve, disconnect, mockDisconnect
   }));

  (global as any).ResizeObserver = mockResizeObserver;

  return {
    ResizeObserver: mockResizeObserver;
  observe: mockObserve;
    unobserve, mockUnobserve, disconnect, mockDisconnect
  }
}
// Custom matchers
customMatchers: {
  toBeWithinRange: (received: number; floor: number;
  ceiling: number) => { const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received 
} not to be within range ${floor} - ${ceiling}`,
        pass, true
      }
    } else { return {
        message: () =>
          `expected ${received } to be within range ${floor} - ${ceiling}`,
        pass, false
      }
    }
  }
}
// Extend Jest matchers
declare global { namespace: jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number;
  ceiling: number); R;
     }
  }
}

// Time utilities for testing
export const mockDate = (dateString: string) => { const mockDate = new Date(dateString);
  const originalDate = Date;

  beforeAll(() => {
    global.Date = jest.fn(() => mockDate) as any;
    global.Date.now = jest.fn(() => mockDate.getTime());
    global.Date.UTC = originalDate.UTC;
    global.Date.parse = originalDate.parse;
   });

  afterAll(() => {
    global.Date = originalDate;
  });

  return mockDate;
}
export const advanceTimers = (ms: number) => {
  jest.advanceTimersByTime(ms),
}
// Performance testing utilities
export const measurePerformance = async (fn: () => Promise<any> | any) => { const start = performance.now();
  await fn();
  const end = performance.now();
  return end - start;
 }
export const expectPerformance = (
  actualTime: number;
  maxTime: number;
  label = 'operation'
) => { if (actualTime > maxTime) {
    throw new Error(
      `Performance expectation failed: ${label } took ${actualTime}ms, expected < ${maxTime}ms`
    );
  }
}
// Database testing utilities (for integration tests)
export const cleanupDatabase = async () => {
  // This would be implemented based on your database setup
  console.log('Database cleanup not implemented - add based on your DB setup');
}
export const seedDatabase = async (data: any) => {; // This would be implemented based on your database setup
  console.log('Database seeding not implemented - add based on your DB setup');
}
// Error boundary testing
export const ErrorBoundary = ({ children, onError  } { children: React.ReactNode; 
  onError?: (error: Error) => void,
 }) => { const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      setHasError(true);
      onError?.(event.error);
     }
    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, [onError]);

  if (hasError) { return <div data-testid="error-boundary">Something went wrong</div>;
   }

  return <>{children}</>;
}