/**
 * Comprehensive Test Utilities
 * Shared utilities and helpers for all test types
 */

import { faker } from '@faker-js/faker';
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Types
export interface TestUser {
  id: string;
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin' | 'commissioner';
  createdAt: Date;
  updatedAt: Date;
}

export interface TestLeague {
  id: string;
  name: string;
  description: string;
  commissionerId: string;
  maxTeams: number;
  currentTeams: number;
  seasonYear: number;
  status: 'forming' | 'drafting' | 'active' | 'completed';
  draftType: 'snake' | 'auction';
  scoringType: 'standard' | 'ppr' | 'half-ppr' | 'custom';
  settings: LeagueSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestTeam {
  id: string;
  name: string;
  leagueId: string;
  ownerId: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  roster: TestPlayer[];
  createdAt: Date;
}

export interface TestPlayer {
  id: string;
  name: string;
  position: 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DEF';
  team: string;
  byeWeek: number;
  isActive: boolean;
  stats: PlayerStats;
  projections: PlayerProjections;
}

export interface LeagueSettings {
  rosterSize: number;
  startingLineup: {
    qb: number;
    rb: number;
    wr: number;
    te: number;
    flex: number;
    k: number;
    def: number;
    bench: number;
  };
  waiverType: 'rolling' | 'faab' | 'reverse';
  faabBudget?: number;
  playoffTeams: number;
  playoffWeeks: number;
  tradeDeadline: string;
  scoring: ScoringSettings;
}

export interface ScoringSettings {
  passing: {
    yards: number;
    touchdowns: number;
    interceptions: number;
    completions?: number;
  };
  rushing: {
    yards: number;
    touchdowns: number;
  };
  receiving: {
    yards: number;
    touchdowns: number;
    receptions: number;
  };
  kicking: {
    fieldGoals0to39: number;
    fieldGoals40to49: number;
    fieldGoals50Plus: number;
    extraPoints: number;
  };
  defense: {
    sacks: number;
    interceptions: number;
    fumbleRecoveries: number;
    touchdowns: number;
    safeties: number;
  };
}

export interface PlayerStats {
  week: number;
  season: number;
  passingYards: number;
  passingTds: number;
  passingInterceptions: number;
  rushingYards: number;
  rushingTds: number;
  receivingYards: number;
  receivingTds: number;
  receptions: number;
  targets: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  extraPointsMade: number;
  sacks: number;
  interceptions: number;
  fumbleRecoveries: number;
  defensiveTds: number;
  pointsAllowed: number;
}

export interface PlayerProjections {
  week: number;
  season: number;
  projectedPoints: number;
  confidence: number;
  ceiling: number;
  floor: number;
}

// Data Generators
export class TestDataGenerator {
  static user(overrides: Partial<TestUser> = {}): TestUser {
    return {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      username: faker.internet.userName(),
      password: 'TestPassword123!',
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      role: 'user',
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides,
    };
  }

  static league(overrides: Partial<TestLeague> = {}): TestLeague {
    return {
      id: faker.string.uuid(),
      name: faker.company.name() + ' Fantasy League',
      description: faker.lorem.sentence(),
      commissionerId: faker.string.uuid(),
      maxTeams: faker.number.int({ min: 8, max: 14 }),
      currentTeams: faker.number.int({ min: 4, max: 12 }),
      seasonYear: 2025,
      status: faker.helpers.arrayElement(['forming', 'drafting', 'active', 'completed']),
      draftType: faker.helpers.arrayElement(['snake', 'auction']),
      scoringType: faker.helpers.arrayElement(['standard', 'ppr', 'half-ppr']),
      settings: this.leagueSettings(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides,
    };
  }

  static team(overrides: Partial<TestTeam> = {}): TestTeam {
    return {
      id: faker.string.uuid(),
      name: faker.company.name(),
      leagueId: faker.string.uuid(),
      ownerId: faker.string.uuid(),
      wins: faker.number.int({ min: 0, max: 17 }),
      losses: faker.number.int({ min: 0, max: 17 }),
      ties: faker.number.int({ min: 0, max: 2 }),
      pointsFor: faker.number.float({ min: 800, max: 1600, precision: 2 }),
      pointsAgainst: faker.number.float({ min: 800, max: 1600, precision: 2 }),
      roster: [],
      createdAt: faker.date.past(),
      ...overrides,
    };
  }

  static player(overrides: Partial<TestPlayer> = {}): TestPlayer {
    const position = faker.helpers.arrayElement(['QB', 'RB', 'WR', 'TE', 'K', 'DEF']);
    
    return {
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      position,
      team: faker.helpers.arrayElement(['BUF', 'MIA', 'NE', 'NYJ', 'BAL', 'CIN', 'CLE', 'PIT']),
      byeWeek: faker.number.int({ min: 5, max: 14 }),
      isActive: true,
      stats: this.playerStats(position),
      projections: this.playerProjections(position),
      ...overrides,
    };
  }

  static leagueSettings(overrides: Partial<LeagueSettings> = {}): LeagueSettings {
    return {
      rosterSize: 16,
      startingLineup: {
        qb: 1,
        rb: 2,
        wr: 2,
        te: 1,
        flex: 1,
        k: 1,
        def: 1,
        bench: 7,
      },
      waiverType: 'faab',
      faabBudget: 100,
      playoffTeams: 6,
      playoffWeeks: 3,
      tradeDeadline: '2025-11-15',
      scoring: this.scoringSettings(),
      ...overrides,
    };
  }

  static scoringSettings(overrides: Partial<ScoringSettings> = {}): ScoringSettings {
    return {
      passing: {
        yards: 0.04,
        touchdowns: 4,
        interceptions: -2,
      },
      rushing: {
        yards: 0.1,
        touchdowns: 6,
      },
      receiving: {
        yards: 0.1,
        touchdowns: 6,
        receptions: 1, // PPR
      },
      kicking: {
        fieldGoals0to39: 3,
        fieldGoals40to49: 4,
        fieldGoals50Plus: 5,
        extraPoints: 1,
      },
      defense: {
        sacks: 1,
        interceptions: 2,
        fumbleRecoveries: 2,
        touchdowns: 6,
        safeties: 2,
      },
      ...overrides,
    };
  }

  static playerStats(position: string, overrides: Partial<PlayerStats> = {}): PlayerStats {
    const baseStats = {
      week: faker.number.int({ min: 1, max: 18 }),
      season: 2025,
      passingYards: 0,
      passingTds: 0,
      passingInterceptions: 0,
      rushingYards: 0,
      rushingTds: 0,
      receivingYards: 0,
      receivingTds: 0,
      receptions: 0,
      targets: 0,
      fieldGoalsMade: 0,
      fieldGoalsAttempted: 0,
      extraPointsMade: 0,
      sacks: 0,
      interceptions: 0,
      fumbleRecoveries: 0,
      defensiveTds: 0,
      pointsAllowed: 0,
    };

    switch (position) {
      case 'QB':
        return {
          ...baseStats,
          passingYards: faker.number.int({ min: 180, max: 350 }),
          passingTds: faker.number.int({ min: 0, max: 4 }),
          passingInterceptions: faker.number.int({ min: 0, max: 2 }),
          rushingYards: faker.number.int({ min: 0, max: 80 }),
          rushingTds: faker.number.int({ min: 0, max: 1 }),
          ...overrides,
        };
      case 'RB':
        return {
          ...baseStats,
          rushingYards: faker.number.int({ min: 40, max: 150 }),
          rushingTds: faker.number.int({ min: 0, max: 3 }),
          receivingYards: faker.number.int({ min: 10, max: 80 }),
          receivingTds: faker.number.int({ min: 0, max: 1 }),
          receptions: faker.number.int({ min: 2, max: 8 }),
          targets: faker.number.int({ min: 3, max: 12 }),
          ...overrides,
        };
      case 'WR':
        return {
          ...baseStats,
          receivingYards: faker.number.int({ min: 30, max: 150 }),
          receivingTds: faker.number.int({ min: 0, max: 2 }),
          receptions: faker.number.int({ min: 3, max: 12 }),
          targets: faker.number.int({ min: 5, max: 15 }),
          rushingYards: faker.number.int({ min: 0, max: 20 }),
          ...overrides,
        };
      case 'TE':
        return {
          ...baseStats,
          receivingYards: faker.number.int({ min: 20, max: 100 }),
          receivingTds: faker.number.int({ min: 0, max: 2 }),
          receptions: faker.number.int({ min: 2, max: 8 }),
          targets: faker.number.int({ min: 3, max: 10 }),
          ...overrides,
        };
      case 'K':
        return {
          ...baseStats,
          fieldGoalsMade: faker.number.int({ min: 0, max: 4 }),
          fieldGoalsAttempted: faker.number.int({ min: 1, max: 5 }),
          extraPointsMade: faker.number.int({ min: 0, max: 6 }),
          ...overrides,
        };
      case 'DEF':
        return {
          ...baseStats,
          sacks: faker.number.int({ min: 0, max: 6 }),
          interceptions: faker.number.int({ min: 0, max: 3 }),
          fumbleRecoveries: faker.number.int({ min: 0, max: 2 }),
          defensiveTds: faker.number.int({ min: 0, max: 1 }),
          pointsAllowed: faker.number.int({ min: 7, max: 35 }),
          ...overrides,
        };
      default:
        return { ...baseStats, ...overrides };
    }
  }

  static playerProjections(position: string, overrides: Partial<PlayerProjections> = {}): PlayerProjections {
    const baseProjection = faker.number.float({ min: 5, max: 25, precision: 2 });
    
    return {
      week: faker.number.int({ min: 1, max: 18 }),
      season: 2025,
      projectedPoints: baseProjection,
      confidence: faker.number.float({ min: 0.5, max: 0.95, precision: 2 }),
      ceiling: baseProjection * 1.3,
      floor: baseProjection * 0.7,
      ...overrides,
    };
  }

  // Generate full roster for a team
  static roster(teamId: string, leagueSettings: LeagueSettings): TestPlayer[] {
    const roster: TestPlayer[] = [];
    const { startingLineup } = leagueSettings;

    // Generate starting lineup
    for (let i = 0; i < startingLineup.qb; i++) {
      roster.push(this.player({ position: 'QB' }));
    }
    for (let i = 0; i < startingLineup.rb; i++) {
      roster.push(this.player({ position: 'RB' }));
    }
    for (let i = 0; i < startingLineup.wr; i++) {
      roster.push(this.player({ position: 'WR' }));
    }
    for (let i = 0; i < startingLineup.te; i++) {
      roster.push(this.player({ position: 'TE' }));
    }
    for (let i = 0; i < startingLineup.k; i++) {
      roster.push(this.player({ position: 'K' }));
    }
    for (let i = 0; i < startingLineup.def; i++) {
      roster.push(this.player({ position: 'DEF' }));
    }

    // Generate bench players
    for (let i = 0; i < startingLineup.bench; i++) {
      const position = faker.helpers.arrayElement(['QB', 'RB', 'WR', 'TE']);
      roster.push(this.player({ position: position as any }));
    }

    return roster;
  }
}

// API Mock Helpers
export class ApiMockHelpers {
  static mockSuccessResponse<T>(data: T) {
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ data, success: true }),
      text: async () => JSON.stringify({ data, success: true }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    };
  }

  static mockErrorResponse(status: number, message: string) {
    return {
      ok: false,
      status,
      statusText: message,
      json: async () => ({ error: message, success: false }),
      text: async () => JSON.stringify({ error: message, success: false }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    };
  }

  static mockNetworkError() {
    throw new Error('Network error');
  }

  static mockPaginatedResponse<T>(data: T[], page: number = 1, limit: number = 10) {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = data.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      pagination: {
        page,
        limit,
        total: data.length,
        totalPages: Math.ceil(data.length / limit),
        hasNext: endIndex < data.length,
        hasPrev: page > 1,
      },
      success: true,
    };
  }
}

// React Testing Utilities
export class ReactTestHelpers {
  static createQueryClient(): QueryClient {
    return new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    });
  }

  static createWrapper(queryClient?: QueryClient) {
    const client = queryClient || this.createQueryClient();
    
    return function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={client}>
          {children}
        </QueryClientProvider>
      );
    };
  }

  static customRender(
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'> & {
      queryClient?: QueryClient;
    }
  ) {
    const { queryClient, ...renderOptions } = options || {};
    
    return render(ui, {
      wrapper: this.createWrapper(queryClient),
      ...renderOptions,
    });
  }

  // Mock implementations for common hooks
  static mockUseRouter(overrides: any = {}) {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
      route: '/',
      ...overrides,
    };
  }

  static mockUseAuth(overrides: any = {}) {
    return {
      user: TestDataGenerator.user(),
      isLoading: false,
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      signup: jest.fn(),
      ...overrides,
    };
  }
}

// Database Test Helpers
export class DatabaseTestHelpers {
  static async cleanupDatabase(db: any) {
    // Clean up test data in reverse dependency order
    const tables = [
      'roster_players',
      'rosters', 
      'trades',
      'waivers',
      'matchups',
      'teams',
      'league_members',
      'leagues',
      'users',
    ];

    for (const table of tables) {
      await db.query(`DELETE FROM ${table} WHERE id LIKE 'test-%' OR email LIKE '%@test.com'`);
    }
  }

  static async seedTestData(db: any) {
    // Create test users
    const users = [
      TestDataGenerator.user({ email: 'admin@test.com', role: 'admin' }),
      TestDataGenerator.user({ email: 'commissioner@test.com', role: 'commissioner' }),
      TestDataGenerator.user({ email: 'user1@test.com' }),
      TestDataGenerator.user({ email: 'user2@test.com' }),
    ];

    for (const user of users) {
      await db.query(
        'INSERT INTO users (id, email, username, password_hash, first_name, last_name, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [user.id, user.email, user.username, 'hashed_password', user.firstName, user.lastName, user.role, user.createdAt, user.updatedAt]
      );
    }

    // Create test league
    const league = TestDataGenerator.league({ commissionerId: users[1].id });
    await db.query(
      'INSERT INTO leagues (id, name, description, commissioner_id, max_teams, season_year, status, draft_type, scoring_type, settings, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
      [league.id, league.name, league.description, league.commissionerId, league.maxTeams, league.seasonYear, league.status, league.draftType, league.scoringType, JSON.stringify(league.settings), league.createdAt, league.updatedAt]
    );

    return { users, league };
  }
}

// Time and Date Helpers
export class TimeHelpers {
  static mockCurrentTime(date: Date) {
    jest.useFakeTimers();
    jest.setSystemTime(date);
  }

  static restoreTime() {
    jest.useRealTimers();
  }

  static createGameSchedule() {
    const games = [];
    const startDate = new Date('2025-09-07'); // First Sunday of season

    for (let week = 1; week <= 18; week++) {
      for (let game = 0; game < 16; game++) {
        const gameDate = new Date(startDate);
        gameDate.setDate(gameDate.getDate() + (week - 1) * 7);
        
        games.push({
          id: `game-${week}-${game}`,
          week,
          season: 2025,
          homeTeam: faker.helpers.arrayElement(['BUF', 'MIA', 'NE', 'NYJ']),
          awayTeam: faker.helpers.arrayElement(['BAL', 'CIN', 'CLE', 'PIT']),
          gameDate,
          isCompleted: false,
          homeScore: 0,
          awayScore: 0,
        });
      }
    }

    return games;
  }

  static getCurrentNFLWeek(currentDate: Date = new Date()): number {
    const seasonStart = new Date('2025-09-07'); // First Sunday
    const diffTime = currentDate.getTime() - seasonStart.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const week = Math.ceil(diffDays / 7);
    
    return Math.max(1, Math.min(18, week));
  }
}

// WebSocket Test Helpers
export class WebSocketTestHelpers {
  static createMockWebSocket() {
    return {
      send: jest.fn(),
      close: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      readyState: WebSocket.OPEN,
      dispatchEvent: jest.fn(),
      onopen: null,
      onclose: null,
      onmessage: null,
      onerror: null,
    };
  }

  static simulateMessage(mockWs: any, data: any) {
    if (mockWs.onmessage) {
      mockWs.onmessage({
        data: JSON.stringify(data),
        type: 'message',
        target: mockWs,
      });
    }
  }

  static simulateConnectionOpen(mockWs: any) {
    if (mockWs.onopen) {
      mockWs.onopen({
        type: 'open',
        target: mockWs,
      });
    }
  }

  static simulateConnectionClose(mockWs: any, code: number = 1000, reason: string = '') {
    if (mockWs.onclose) {
      mockWs.onclose({
        type: 'close',
        code,
        reason,
        wasClean: code === 1000,
        target: mockWs,
      });
    }
  }
}

// Performance Test Helpers
export class PerformanceTestHelpers {
  static measureRenderTime(renderFunction: () => void): number {
    const start = performance.now();
    renderFunction();
    const end = performance.now();
    return end - start;
  }

  static async measureAsyncOperation<T>(asyncFunction: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const start = performance.now();
    const result = await asyncFunction();
    const end = performance.now();
    return { result, duration: end - start };
  }

  static createLargeDataset(size: number = 1000) {
    return Array.from({ length: size }, (_, index) => TestDataGenerator.player({
      id: `perf-player-${index}`,
      name: `Performance Player ${index}`,
    }));
  }
}

// Error Simulation Helpers
export class ErrorSimulationHelpers {
  static simulateNetworkError() {
    throw new TypeError('Failed to fetch');
  }

  static simulateTimeoutError() {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 100);
    });
  }

  static simulateRateLimitError() {
    return {
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      json: async () => ({ error: 'Rate limit exceeded' }),
      headers: new Headers({
        'Retry-After': '60',
        'X-RateLimit-Remaining': '0'
      }),
    };
  }

  static simulateServerError() {
    return {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ error: 'Internal server error' }),
    };
  }
}

// Re-export everything for easy access
export {
  ReactTestHelpers as rtl,
  DatabaseTestHelpers as db,
  TimeHelpers as time,
  WebSocketTestHelpers as ws,
  PerformanceTestHelpers as perf,
  ErrorSimulationHelpers as errors,
};

// Export default test data generator for convenience
export default TestDataGenerator;