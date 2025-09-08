/**
 * Fantasy Operations Load Tests
 * Tests core fantasy football operations under load
 */

import { check, sleep } from 'k6';
import http from 'k6/http';
import ws from 'k6/ws';
import { Trend, Counter, Rate } from 'k6/metrics';
import { generateTestUser, generateLeagueData, generateTeamData } from '../load-test.config.js';

// Custom metrics
const leagueCreationDuration = new Trend('league_creation_duration');
const leagueJoinDuration = new Trend('league_join_duration');
const rosterUpdateDuration = new Trend('roster_update_duration');
const draftActionDuration = new Trend('draft_action_duration');
const tradeProposalDuration = new Trend('trade_proposal_duration');
const websocketConnectionTime = new Trend('websocket_connection_time');

const fantasyOperationFailures = new Counter('fantasy_operation_failures');
const fantasyOperationSuccess = new Rate('fantasy_operation_success');

export const options = {
  scenarios: {
    fantasy_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 20 },
        { duration: '5m', target: 50 },
        { duration: '5m', target: 50 },
        { duration: '2m', target: 0 },
      ],
    },
  },
  thresholds: {
    league_creation_duration: ['p(95) < 2000'],
    league_join_duration: ['p(95) < 1000'],
    roster_update_duration: ['p(95) < 800'],
    draft_action_duration: ['p(90) < 300'],
    websocket_connection_time: ['p(95) < 1000'],
    fantasy_operation_success: ['rate > 0.90'],
  },
};

const BASE_URL = __ENV.BASE_URL;
const WS_URL = __ENV.WS_URL;

// Test data storage
let authToken = '';
let leagueId = '';
let teamId = '';

export default function () {
  const userIndex = __VU * 1000 + __ITER;
  const testUser = generateTestUser(userIndex);
  
  // 1. Authenticate user
  if (!authenticateUser(testUser)) {
    return;
  }

  // 2. Randomly choose fantasy operation to test
  const operations = [
    'createLeague',
    'joinLeague', 
    'manageRoster',
    'simulateDraft',
    'proposeTrade',
    'realTimeUpdates'
  ];
  
  const operation = operations[Math.floor(Math.random() * operations.length)];
  
  switch (operation) {
    case 'createLeague':
      testLeagueCreation();
      break;
    case 'joinLeague':
      testLeagueJoining();
      break;
    case 'manageRoster':
      testRosterManagement();
      break;
    case 'simulateDraft':
      testDraftOperations();
      break;
    case 'proposeTrade':
      testTradeOperations();
      break;
    case 'realTimeUpdates':
      testRealTimeFeatures();
      break;
  }

  sleep(Math.random() * 3 + 1);
}

function authenticateUser(user) {
  // First try to create user (might fail if exists)
  http.post(
    `${BASE_URL}/api/auth/signup`,
    JSON.stringify(user),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  // Then login
  const loginResponse = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      email: user.email,
      password: user.password,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (loginResponse.status === 200) {
    const body = JSON.parse(loginResponse.body);
    authToken = body.token;
    return true;
  }

  return false;
}

function testLeagueCreation() {
  if (!authToken) return;

  const leagueData = generateLeagueData(__VU * 1000 + __ITER);
  
  const start = Date.now();
  const response = http.post(
    `${BASE_URL}/api/leagues`,
    JSON.stringify(leagueData),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    }
  );
  const duration = Date.now() - start;

  leagueCreationDuration.add(duration);

  const success = check(response, {
    'league creation status is 201': (r) => r.status === 201,
    'league creation returns league data': (r) => {
      if (r.status === 201) {
        const body = JSON.parse(r.body);
        leagueId = body.league?.id;
        return body.league && body.league.id;
      }
      return false;
    },
    'league creation response time < 3s': (r) => r.timings.duration < 3000,
  });

  if (success) {
    fantasyOperationSuccess.add(1);
  } else {
    fantasyOperationFailures.add(1);
    fantasyOperationSuccess.add(0);
  }
}

function testLeagueJoining() {
  if (!authToken) return;

  // First create a league to join
  const leagueData = generateLeagueData(__VU * 1000 + __ITER + 'join');
  const createResponse = http.post(
    `${BASE_URL}/api/leagues`,
    JSON.stringify(leagueData),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    }
  );

  if (createResponse.status !== 201) {
    fantasyOperationFailures.add(1);
    return;
  }

  const createdLeague = JSON.parse(createResponse.body);
  const testLeagueId = createdLeague.league.id;

  // Now join the league
  const teamData = generateTeamData(__VU * 1000 + __ITER);
  
  const start = Date.now();
  const joinResponse = http.post(
    `${BASE_URL}/api/leagues/${testLeagueId}/join`,
    JSON.stringify(teamData),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    }
  );
  const duration = Date.now() - start;

  leagueJoinDuration.add(duration);

  const success = check(joinResponse, {
    'league join status is 201': (r) => r.status === 201,
    'league join returns team data': (r) => {
      if (r.status === 201) {
        const body = JSON.parse(r.body);
        teamId = body.team?.id;
        return body.team && body.team.id;
      }
      return false;
    },
  });

  if (success) {
    fantasyOperationSuccess.add(1);
  } else {
    fantasyOperationFailures.add(1);
    fantasyOperationSuccess.add(0);
  }
}

function testRosterManagement() {
  if (!authToken || !teamId) {
    // Create league and join first
    testLeagueCreation();
    if (leagueId) {
      const teamData = generateTeamData(__VU);
      const joinResponse = http.post(
        `${BASE_URL}/api/leagues/${leagueId}/join`,
        JSON.stringify(teamData),
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );
      
      if (joinResponse.status === 201) {
        teamId = JSON.parse(joinResponse.body).team.id;
      } else {
        return;
      }
    } else {
      return;
    }
  }

  // Test roster operations
  const operations = [
    'getPlayers',
    'addPlayer',
    'setLineup',
    'dropPlayer'
  ];

  operations.forEach(operation => {
    const start = Date.now();
    let response;

    switch (operation) {
      case 'getPlayers':
        response = http.get(
          `${BASE_URL}/api/players?position=RB&available=true`,
          {
            headers: { 'Authorization': `Bearer ${authToken}` },
          }
        );
        break;

      case 'addPlayer':
        response = http.post(
          `${BASE_URL}/api/teams/${teamId}/roster`,
          JSON.stringify({ playerId: 'test-player-id' }),
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`,
            },
          }
        );
        break;

      case 'setLineup':
        response = http.put(
          `${BASE_URL}/api/teams/${teamId}/lineup`,
          JSON.stringify({
            week: 1,
            lineup: {
              QB: ['test-qb-id'],
              RB: ['test-rb1-id', 'test-rb2-id'],
              WR: ['test-wr1-id', 'test-wr2-id'],
            }
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`,
            },
          }
        );
        break;

      case 'dropPlayer':
        response = http.delete(
          `${BASE_URL}/api/teams/${teamId}/roster/test-player-id`,
          null,
          {
            headers: { 'Authorization': `Bearer ${authToken}` },
          }
        );
        break;
    }

    const duration = Date.now() - start;
    rosterUpdateDuration.add(duration);

    const success = check(response, {
      [`${operation} response is successful`]: (r) => [200, 201, 404].includes(r.status),
    });

    if (success) {
      fantasyOperationSuccess.add(1);
    } else {
      fantasyOperationFailures.add(1);
      fantasyOperationSuccess.add(0);
    }

    sleep(0.1);
  });
}

function testDraftOperations() {
  if (!authToken) return;

  // Simulate draft picks
  const draftActions = [
    'getDraftBoard',
    'makePick',
    'skipPick',
    'getDraftStatus'
  ];

  draftActions.forEach(action => {
    const start = Date.now();
    let response;

    switch (action) {
      case 'getDraftBoard':
        response = http.get(
          `${BASE_URL}/api/draft/${leagueId || 'test-league'}/board`,
          {
            headers: { 'Authorization': `Bearer ${authToken}` },
          }
        );
        break;

      case 'makePick':
        response = http.post(
          `${BASE_URL}/api/draft/${leagueId || 'test-league'}/pick`,
          JSON.stringify({ playerId: 'test-player-id' }),
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`,
            },
          }
        );
        break;

      case 'skipPick':
        response = http.post(
          `${BASE_URL}/api/draft/${leagueId || 'test-league'}/skip`,
          JSON.stringify({}),
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`,
            },
          }
        );
        break;

      case 'getDraftStatus':
        response = http.get(
          `${BASE_URL}/api/draft/${leagueId || 'test-league'}/status`,
          {
            headers: { 'Authorization': `Bearer ${authToken}` },
          }
        );
        break;
    }

    const duration = Date.now() - start;
    draftActionDuration.add(duration);

    check(response, {
      [`${action} response is handled`]: (r) => r.status >= 200 && r.status < 500,
    });

    sleep(0.2);
  });
}

function testTradeOperations() {
  if (!authToken) return;

  // Test trade proposal
  const tradeData = {
    receivingTeamId: 'test-team-2',
    offeredPlayers: ['player-1', 'player-2'],
    requestedPlayers: ['player-3', 'player-4'],
    message: 'Load test trade proposal'
  };

  const start = Date.now();
  const response = http.post(
    `${BASE_URL}/api/trades`,
    JSON.stringify(tradeData),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    }
  );
  const duration = Date.now() - start;

  tradeProposalDuration.add(duration);

  check(response, {
    'trade proposal handled': (r) => r.status >= 200 && r.status < 500,
  });
}

function testRealTimeFeatures() {
  if (!authToken) return;

  const wsStart = Date.now();
  
  const res = ws.connect(`${WS_URL}/socket.io/?EIO=4&transport=websocket`, null, function (socket) {
    socket.on('open', function () {
      const connectTime = Date.now() - wsStart;
      websocketConnectionTime.add(connectTime);
      
      // Simulate real-time interactions
      socket.send(JSON.stringify({
        type: 'join_league',
        data: { leagueId: leagueId || 'test-league' }
      }));

      socket.setTimeout(function () {
        socket.send(JSON.stringify({
          type: 'live_scoring_update',
          data: { week: 1 }
        }));
      }, 1000);

      socket.setTimeout(function () {
        socket.close();
      }, 5000);
    });

    socket.on('message', function (message) {
      check(message, {
        'websocket message received': (msg) => msg.length > 0,
      });
    });

    socket.on('error', function (e) {
      console.log('WebSocket error:', e);
      fantasyOperationFailures.add(1);
    });
  });

  check(res, {
    'websocket connection established': (r) => r && r.status === 101,
  });
}

export function handleSummary(data) {
  return {
    'fantasy-load-summary.html': htmlReport(data),
    'fantasy-load-summary.json': JSON.stringify(data, null, 2),
  };
}

function htmlReport(data) {
  const fantasyMetrics = [
    'league_creation_duration',
    'league_join_duration',
    'roster_update_duration', 
    'draft_action_duration',
    'trade_proposal_duration',
    'websocket_connection_time'
  ];

  let html = `
    <html>
      <head>
        <title>Fantasy Operations Load Test Results</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .metric { margin: 10px 0; padding: 10px; border-left: 4px solid #007cba; }
          .success { border-left-color: #28a745; }
          .warning { border-left-color: #ffc107; }
          .error { border-left-color: #dc3545; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .chart { margin: 20px 0; }
        </style>
      </head>
      <body>
        <h1>Fantasy Operations Load Test Results</h1>
        <p><strong>Test Duration:</strong> ${data.state?.testRunDurationMs ? (data.state.testRunDurationMs / 1000).toFixed(1) + 's' : 'N/A'}</p>
        <p><strong>Virtual Users:</strong> ${data.metrics.vus?.values?.max || 'N/A'}</p>
        <p><strong>Total Operations:</strong> ${data.metrics.iterations?.values?.count || 0}</p>
        
        <h2>Fantasy Operation Performance</h2>
        <table>
          <tr><th>Operation</th><th>Avg Duration</th><th>P95 Duration</th><th>Status</th></tr>
  `;

  fantasyMetrics.forEach(metric => {
    if (data.metrics[metric]) {
      const values = data.metrics[metric].values;
      const threshold = data.metrics[metric].thresholds;
      
      html += `
        <tr>
          <td>${metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
          <td>${values.avg ? values.avg.toFixed(2) + 'ms' : 'N/A'}</td>
          <td>${values.p95 ? values.p95.toFixed(2) + 'ms' : 'N/A'}</td>
          <td>${threshold && Object.values(threshold)[0]?.ok ? '✅ Pass' : '❌ Fail'}</td>
        </tr>
      `;
    }
  });

  const successRate = data.metrics.fantasy_operation_success?.values?.rate || 0;
  const failureCount = data.metrics.fantasy_operation_failures?.values?.count || 0;

  html += `
        </table>
        
        <h2>Operation Success Metrics</h2>
        <div class="metric ${successRate > 0.9 ? 'success' : successRate > 0.8 ? 'warning' : 'error'}">
          <strong>Success Rate:</strong> ${(successRate * 100).toFixed(2)}%
        </div>
        <div class="metric ${failureCount < 10 ? 'success' : failureCount < 50 ? 'warning' : 'error'}">
          <strong>Total Failures:</strong> ${failureCount}
        </div>
        
        <h2>WebSocket Performance</h2>
        <div class="metric">
          <strong>Connection Time (P95):</strong> 
          ${data.metrics.websocket_connection_time?.values?.p95?.toFixed(2) || 'N/A'}ms
        </div>
        
        <h2>Recommendations</h2>
        <ul>
  `;

  // Performance recommendations
  const avgLeagueCreation = data.metrics.league_creation_duration?.values?.avg || 0;
  const avgRosterUpdate = data.metrics.roster_update_duration?.values?.avg || 0;
  const avgWsConnection = data.metrics.websocket_connection_time?.values?.avg || 0;

  if (avgLeagueCreation > 1500) {
    html += '<li class="warning">League creation is slow. Consider database indexing and query optimization.</li>';
  }

  if (avgRosterUpdate > 600) {
    html += '<li class="warning">Roster updates are taking too long. Review database transactions and locking.</li>';
  }

  if (avgWsConnection > 800) {
    html += '<li class="warning">WebSocket connections are slow to establish. Check server capacity and network.</li>';
  }

  if (successRate < 0.9) {
    html += '<li class="error">Operation success rate is below target. Investigate error patterns and system stability.</li>';
  }

  if (avgLeagueCreation < 1000 && avgRosterUpdate < 400 && successRate > 0.95) {
    html += '<li class="success">Fantasy operations performance is excellent across the board!</li>';
  }

  html += `
        </ul>
        
        <h2>Load Test Configuration</h2>
        <p>This test simulated realistic fantasy football operations including league creation, team management, draft actions, and real-time features.</p>
      </body>
    </html>
  `;

  return html;
}