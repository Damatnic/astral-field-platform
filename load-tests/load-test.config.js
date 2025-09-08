/**
 * Load Testing Configuration
 * K6 configuration for performance and load testing
 */

export const options = {
  // Test scenarios for different load patterns
  scenarios: {
    // Smoke test - verify basic functionality
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '1m',
      tags: { test_type: 'smoke' },
    },

    // Load test - normal expected load
    load: {
      executor: 'constant-vus',
      vus: 50,
      duration: '5m',
      tags: { test_type: 'load' },
    },

    // Stress test - above normal load
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 200 },
        { duration: '5m', target: 200 },
        { duration: '2m', target: 0 },
      ],
      tags: { test_type: 'stress' },
    },

    // Spike test - sudden traffic spikes
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 100 },
        { duration: '30s', target: 500 }, // Spike
        { duration: '1m', target: 100 },
        { duration: '30s', target: 0 },
      ],
      tags: { test_type: 'spike' },
    },

    // Breakpoint test - find the breaking point
    breakpoint: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 1000,
      stages: [
        { duration: '2m', target: 10 },
        { duration: '5m', target: 50 },
        { duration: '5m', target: 100 },
        { duration: '5m', target: 200 },
        { duration: '5m', target: 300 },
        { duration: '5m', target: 400 },
      ],
      tags: { test_type: 'breakpoint' },
    },

    // Soak test - prolonged load
    soak: {
      executor: 'constant-vus',
      vus: 80,
      duration: '30m',
      tags: { test_type: 'soak' },
    },
  },

  // Performance thresholds
  thresholds: {
    // HTTP metrics
    http_req_duration: [
      'p(90) < 500',    // 90% of requests should complete within 500ms
      'p(95) < 800',    // 95% of requests should complete within 800ms
      'p(99) < 2000',   // 99% of requests should complete within 2s
    ],
    http_req_failed: ['rate < 0.01'],  // Error rate should be less than 1%
    http_req_receiving: ['p(95) < 100'], // Response time should be fast
    
    // Custom metrics
    'login_duration': ['p(95) < 1000'],
    'league_creation_duration': ['p(95) < 2000'],
    'draft_response_time': ['p(90) < 300'],
    'websocket_connection_time': ['p(95) < 1000'],
    
    // System metrics
    checks: ['rate > 0.99'],  // 99% of checks should pass
  },

  // Global settings
  noConnectionReuse: false,
  userAgent: 'AstralField-LoadTest/1.0',
  maxRedirects: 4,
  batch: 20,
  batchPerHost: 6,
  
  // Test data and environment
  env: {
    BASE_URL: __ENV.BASE_URL || 'http://localhost:3000',
    API_URL: __ENV.API_URL || 'http://localhost:3000/api',
    WS_URL: __ENV.WS_URL || 'ws://localhost:3000',
    TEST_USERNAME_PREFIX: 'loadtest',
    TEST_PASSWORD: 'LoadTest123!',
  },

  // Summary output
  summaryTrendStats: [
    'avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)', 'p(99.9)', 'count'
  ],
  
  // External metrics (optional - for integration with monitoring tools)
  ext: {
    loadimpact: {
      name: 'Astral Field Load Test',
      projectID: 3569396,
    },
  },
};

// Test data generators
export function generateTestUser(index) {
  return {
    email: `${__ENV.TEST_USERNAME_PREFIX}${index}@example.com`,
    username: `${__ENV.TEST_USERNAME_PREFIX}${index}`,
    password: __ENV.TEST_PASSWORD,
    firstName: `LoadTest${index}`,
    lastName: 'User',
  };
}

export function generateLeagueData(index) {
  return {
    name: `Load Test League ${index}`,
    description: `Auto-generated league for load testing`,
    maxTeams: 10,
    seasonYear: 2025,
    draftType: 'snake',
    scoringType: 'ppr',
    settings: {
      rosterSize: 16,
      startingLineup: {
        qb: 1,
        rb: 2,
        wr: 2,
        te: 1,
        flex: 1,
        k: 1,
        def: 1,
        bench: 7
      },
      waiverType: 'faab',
      playoffTeams: 4
    }
  };
}

export function generateTeamData(index) {
  return {
    name: `Load Test Team ${index}`,
    logo: null,
    description: `Auto-generated team for load testing`
  };
}