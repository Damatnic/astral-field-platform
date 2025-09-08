/**
 * Load Testing Suite for Astral Field
 * Tests system performance under various load conditions
 */

import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Counter, Gauge, Rate, Trend } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// Custom metrics
const apiResponseTime = new Trend('api_response_time');
const websocketConnections = new Counter('websocket_connections');
const activeUsers = new Gauge('active_users');
const errorRate = new Rate('error_rate');

// Test configuration
export const options = {
  stages: [
    // Ramp up
    { duration: '2m', target: 100 },    // Ramp up to 100 users over 2 minutes
    { duration: '5m', target: 100 },    // Stay at 100 users for 5 minutes
    { duration: '2m', target: 200 },    // Ramp up to 200 users over 2 minutes
    { duration: '5m', target: 200 },    // Stay at 200 users for 5 minutes
    { duration: '2m', target: 500 },    // Spike to 500 users over 2 minutes
    { duration: '5m', target: 500 },    // Stay at 500 users for 5 minutes
    { duration: '2m', target: 100 },    // Ramp down to 100 users over 2 minutes
    { duration: '5m', target: 100 },    // Stay at 100 users for 5 minutes
    { duration: '2m', target: 0 },      // Ramp down to 0 users over 2 minutes
  ],
  thresholds: {
    // HTTP response times
    'http_req_duration': ['p(95)<2000', 'p(99)<5000'], // 95% under 2s, 99% under 5s
    'http_req_duration{endpoint:api}': ['p(95)<1000'], // API calls under 1s
    'http_req_duration{endpoint:websocket}': ['p(95)<500'], // WebSocket under 500ms
    
    // Error rates
    'http_req_failed': ['rate<0.01'], // Error rate under 1%
    'error_rate': ['rate<0.05'], // Application error rate under 5%
    
    // WebSocket connections
    'websocket_connections': ['count>1000'], // Should handle 1000+ connections
    
    // Custom metrics
    'api_response_time': ['p(95)<1500'],
  },
  ext: {
    loadimpact: {
      distribution: {
        'amazon:us:ashburn': { loadZone: 'amazon:us:ashburn', percent: 50 },
        'amazon:us:portland': { loadZone: 'amazon:us:portland', percent: 25 },
        'amazon:eu:dublin': { loadZone: 'amazon:eu:dublin', percent: 25 },
      },
    },
  },
};

// Test data
const baseURL = __ENV.BASE_URL || 'http://localhost:3000';
const wsURL = baseURL.replace('http', 'ws');

const testUsers = [
  { email: 'load-test-1@example.com', password: 'TestPass123!' },
  { email: 'load-test-2@example.com', password: 'TestPass123!' },
  { email: 'load-test-3@example.com', password: 'TestPass123!' },
];

const testLeagues = [
  { id: 'load-test-league-1', name: 'Load Test League 1' },
  { id: 'load-test-league-2', name: 'Load Test League 2' },
];

// Helper functions
function getRandomUser() {
  return testUsers[Math.floor(Math.random() * testUsers.length)];
}

function getRandomLeague() {
  return testLeagues[Math.floor(Math.random() * testLeagues.length)];
}

function authenticateUser() {
  const user = getRandomUser();
  const loginResponse = http.post(`${baseURL}/api/auth/login`, {
    email: user.email,
    password: user.password,
  }, {
    tags: { endpoint: 'auth' },
  });

  const isLoginSuccess = check(loginResponse, {
    'login successful': (r) => r.status === 200,
    'login response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  if (!isLoginSuccess) {
    errorRate.add(1);
    return null;
  }

  const authToken = loginResponse.json('token');
  return authToken;
}

function testAPIEndpoints(authToken) {
  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json',
  };

  // Test league list endpoint
  const leaguesResponse = http.get(`${baseURL}/api/leagues`, { headers }, {
    tags: { endpoint: 'api' },
  });

  check(leaguesResponse, {
    'leagues API status 200': (r) => r.status === 200,
    'leagues API response time < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  apiResponseTime.add(leaguesResponse.timings.duration);

  // Test player search endpoint
  const playersResponse = http.get(`${baseURL}/api/players?search=josh`, { headers }, {
    tags: { endpoint: 'api' },
  });

  check(playersResponse, {
    'players API status 200': (r) => r.status === 200,
    'players API has results': (r) => r.json('players').length > 0,
  }) || errorRate.add(1);

  // Test league creation endpoint
  const league = getRandomLeague();
  const createLeagueResponse = http.post(`${baseURL}/api/leagues`, {
    name: `${league.name} ${Date.now()}`,
    description: 'Load test league',
    max_teams: 12,
    season_year: 2025,
  }, { headers }, {
    tags: { endpoint: 'api' },
  });

  const isCreateSuccess = check(createLeagueResponse, {
    'create league status 201': (r) => r.status === 201,
    'create league response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  if (isCreateSuccess) {
    const newLeagueId = createLeagueResponse.json('id');
    
    // Test league details endpoint
    const leagueDetailsResponse = http.get(`${baseURL}/api/leagues/${newLeagueId}`, { headers }, {
      tags: { endpoint: 'api' },
    });

    check(leagueDetailsResponse, {
      'league details status 200': (r) => r.status === 200,
      'league details has correct data': (r) => r.json('id') === newLeagueId,
    }) || errorRate.add(1);
  } else {
    errorRate.add(1);
  }

  sleep(1);
}

function testWebSocketConnection(authToken) {
  const url = `${wsURL}/api/websocket`;
  
  const response = ws.connect(url, {
    headers: { 'Authorization': `Bearer ${authToken}` },
  }, (socket) => {
    websocketConnections.add(1);
    
    socket.on('open', () => {
      console.log('WebSocket connection opened');
      
      // Join a test league room
      socket.send(JSON.stringify({
        type: 'join_league',
        data: { leagueId: 'load-test-league-1' },
      }));
    });

    socket.on('message', (data) => {
      const message = JSON.parse(data);
      
      check(message, {
        'websocket message valid': (m) => m.type !== undefined,
        'websocket message has data': (m) => m.data !== undefined,
      }) || errorRate.add(1);
    });

    socket.on('close', () => {
      console.log('WebSocket connection closed');
    });

    socket.on('error', (e) => {
      console.error('WebSocket error:', e);
      errorRate.add(1);
    });

    // Send periodic messages to simulate real usage
    for (let i = 0; i < 5; i++) {
      sleep(2);
      socket.send(JSON.stringify({
        type: 'chat_message',
        data: {
          leagueId: 'load-test-league-1',
          message: `Load test message ${i} from user ${__VU}`,
        },
      }));
    }
  });

  check(response, {
    'websocket connection established': (r) => r && r.url === url,
  }) || errorRate.add(1);
}

function testDraftSimulation(authToken) {
  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json',
  };

  // Start a draft simulation
  const draftResponse = http.post(`${baseURL}/api/leagues/load-test-league-1/draft/start`, {}, { headers }, {
    tags: { endpoint: 'api' },
  });

  if (draftResponse.status === 200) {
    // Simulate draft picks
    for (let i = 0; i < 3; i++) {
      const pickResponse = http.post(`${baseURL}/api/leagues/load-test-league-1/draft/pick`, {
        playerId: `player-${Math.floor(Math.random() * 1000)}`,
        teamId: `team-${__VU}`,
      }, { headers }, {
        tags: { endpoint: 'api' },
      });

      check(pickResponse, {
        'draft pick successful': (r) => r.status === 200,
        'draft pick response time < 500ms': (r) => r.timings.duration < 500,
      }) || errorRate.add(1);

      sleep(1);
    }
  }
}

function testStaticAssets() {
  // Test static asset loading
  const cssResponse = http.get(`${baseURL}/_next/static/css/app.css`, {
    tags: { endpoint: 'static' },
  });

  const jsResponse = http.get(`${baseURL}/_next/static/chunks/main.js`, {
    tags: { endpoint: 'static' },
  });

  check(cssResponse, {
    'CSS loads successfully': (r) => r.status === 200,
    'CSS response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  check(jsResponse, {
    'JS loads successfully': (r) => r.status === 200,
    'JS response time < 2000ms': (r) => r.timings.duration < 2000,
  });
}

// Main test scenarios
export default function () {
  activeUsers.add(1);
  
  const scenario = Math.random();
  
  if (scenario < 0.6) {
    // 60% - Standard user journey
    const authToken = authenticateUser();
    if (authToken) {
      testAPIEndpoints(authToken);
    }
  } else if (scenario < 0.8) {
    // 20% - WebSocket intensive usage
    const authToken = authenticateUser();
    if (authToken) {
      testWebSocketConnection(authToken);
    }
  } else if (scenario < 0.95) {
    // 15% - Draft simulation
    const authToken = authenticateUser();
    if (authToken) {
      testDraftSimulation(authToken);
    }
  } else {
    // 5% - Static asset loading
    testStaticAssets();
  }
  
  activeUsers.add(-1);
  sleep(Math.random() * 3 + 1); // Random sleep between 1-4 seconds
}

// Custom summary
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'performance-report.json': JSON.stringify(data),
    'performance-report.html': generateHTMLReport(data),
  };
}

function generateHTMLReport(data) {
  const metrics = data.metrics;
  
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Astral Field Performance Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .metric { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
        .passed { background-color: #d4edda; }
        .failed { background-color: #f8d7da; }
        .chart { width: 100%; height: 300px; margin: 20px 0; }
    </style>
</head>
<body>
    <h1>Astral Field Performance Test Report</h1>
    <h2>Test Summary</h2>
    <p><strong>Test Duration:</strong> ${data.state.testRunDurationMs}ms</p>
    <p><strong>Virtual Users:</strong> ${data.state.isStdOutTTY}</p>
    
    <h2>Key Metrics</h2>
    
    <div class="metric ${metrics.http_req_duration.values.p95 < 2000 ? 'passed' : 'failed'}">
        <h3>HTTP Request Duration</h3>
        <p>95th percentile: ${metrics.http_req_duration.values.p95.toFixed(2)}ms</p>
        <p>99th percentile: ${metrics.http_req_duration.values.p99.toFixed(2)}ms</p>
        <p>Average: ${metrics.http_req_duration.values.avg.toFixed(2)}ms</p>
    </div>
    
    <div class="metric ${metrics.http_req_failed.values.rate < 0.01 ? 'passed' : 'failed'}">
        <h3>Error Rate</h3>
        <p>Failed Requests: ${(metrics.http_req_failed.values.rate * 100).toFixed(2)}%</p>
        <p>Total Requests: ${metrics.http_reqs.values.count}</p>
    </div>
    
    <div class="metric">
        <h3>WebSocket Connections</h3>
        <p>Total Connections: ${metrics.websocket_connections?.values.count || 0}</p>
    </div>
    
    <div class="metric">
        <h3>API Performance</h3>
        <p>Average Response Time: ${metrics.api_response_time?.values.avg?.toFixed(2) || 0}ms</p>
        <p>95th percentile: ${metrics.api_response_time?.values.p95?.toFixed(2) || 0}ms</p>
    </div>
    
    <h2>Recommendations</h2>
    <ul>
        ${metrics.http_req_duration.values.p95 > 2000 ? '<li style="color: red;">⚠️ HTTP response times exceed threshold. Consider optimizing database queries and caching.</li>' : '<li style="color: green;">✅ HTTP response times are within acceptable limits.</li>'}
        ${metrics.http_req_failed.values.rate > 0.01 ? '<li style="color: red;">⚠️ Error rate is too high. Investigate server errors and implement better error handling.</li>' : '<li style="color: green;">✅ Error rate is within acceptable limits.</li>'}
        ${(metrics.websocket_connections?.values.count || 0) < 100 ? '<li style="color: orange;">⚠️ WebSocket connection count is low. Verify WebSocket functionality.</li>' : '<li style="color: green;">✅ WebSocket connections are working well.</li>'}
    </ul>
    
    <p><em>Generated on ${new Date().toISOString()}</em></p>
</body>
</html>`;
}