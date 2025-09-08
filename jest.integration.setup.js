// Integration test setup
require('dotenv').config({ path: '.env.test' })

// Set test environment variables
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/astral_field_test'
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.TEST_SUPABASE_URL || 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.TEST_SUPABASE_ANON_KEY || 'test-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.TEST_SUPABASE_SERVICE_KEY || 'test-service-key'
process.env.OPENAI_API_KEY = 'test-openai-key'

// Mock external services for integration tests
global.fetch = jest.fn()

// Database cleanup utilities
const { Pool } = require('pg')
let testPool

beforeAll(async () => {
  // Create test database connection pool
  if (process.env.DATABASE_URL) {
    testPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
    })
  }
})

beforeEach(async () => {
  // Clean up database before each test
  if (testPool) {
    try {
      // Start transaction for test isolation
      await testPool.query('BEGIN')
    } catch (error) {
      console.warn('Database setup warning:', error.message)
    }
  }
  
  // Reset all mocks
  jest.clearAllMocks()
  
  // Reset fetch mock
  global.fetch.mockClear()
})

afterEach(async () => {
  // Rollback transaction after each test
  if (testPool) {
    try {
      await testPool.query('ROLLBACK')
    } catch (error) {
      // Ignore rollback errors
    }
  }
})

afterAll(async () => {
  // Close database connections
  if (testPool) {
    await testPool.end()
  }
})

// Mock Supabase for integration tests
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      })),
    },
    from: jest.fn((table) => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        upsert: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        like: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        contains: jest.fn().mockReturnThis(),
        filter: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        single: jest.fn(),
        maybeSingle: jest.fn(),
      }
      return mockQueryBuilder
    }),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        download: jest.fn(),
        remove: jest.fn(),
        list: jest.fn(),
        getPublicUrl: jest.fn(),
      })),
    },
    realtime: {
      channel: jest.fn(() => ({
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
      })),
    },
    rpc: jest.fn(),
  })),
}))

// Mock OpenAI for integration tests
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: 'Mock AI response for testing',
                role: 'assistant',
              },
            },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 10,
            total_tokens: 20,
          },
        }),
      },
    },
    embeddings: {
      create: jest.fn().mockResolvedValue({
        data: [
          {
            embedding: Array(1536).fill(0.1),
            index: 0,
          },
        ],
        usage: {
          prompt_tokens: 10,
          total_tokens: 10,
        },
      }),
    },
  })),
}))

// Mock Socket.IO for integration tests
jest.mock('socket.io', () => ({
  Server: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    to: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    close: jest.fn(),
    listen: jest.fn(),
  })),
}))

// Test utilities for integration tests
global.testUtils = {
  createMockUser: () => ({
    id: 'test-user-id',
    email: 'test@example.com',
    username: 'testuser',
    full_name: 'Test User',
    created_at: new Date().toISOString(),
  }),
  
  createMockLeague: () => ({
    id: 'test-league-id',
    name: 'Test League',
    commissioner_id: 'test-user-id',
    max_teams: 12,
    season_year: 2025,
    status: 'draft',
    created_at: new Date().toISOString(),
  }),
  
  createMockTeam: () => ({
    id: 'test-team-id',
    name: 'Test Team',
    owner_id: 'test-user-id',
    league_id: 'test-league-id',
    created_at: new Date().toISOString(),
  }),
  
  createMockPlayer: () => ({
    id: 'test-player-id',
    name: 'Test Player',
    position: 'RB',
    team: 'TST',
    bye_week: 9,
    created_at: new Date().toISOString(),
  }),

  mockFetch: (data, options = {}) => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: jest.fn().mockResolvedValueOnce(data),
      text: jest.fn().mockResolvedValueOnce(JSON.stringify(data)),
      headers: new Headers(),
      ...options,
    })
  },

  mockFetchError: (error, status = 500) => {
    global.fetch.mockRejectedValueOnce(
      new Error(error)
    )
  },
}

// Increase timeout for integration tests
jest.setTimeout(30000)