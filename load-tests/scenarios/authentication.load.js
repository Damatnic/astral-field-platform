/**
 * Authentication Load Tests
 * Tests authentication endpoints under load
 */

import { check, sleep } from 'k6';
import http from 'k6/http';
import { Trend, Counter, Rate } from 'k6/metrics';
import { generateTestUser } from '../load-test.config.js';

// Custom metrics
const loginDuration = new Trend('login_duration');
const signupDuration = new Trend('signup_duration');
const authFailures = new Counter('auth_failures');
const authSuccessRate = new Rate('auth_success_rate');

export const options = {
  scenarios: {
    auth_load: {
      executor: 'constant-arrival-rate',
      rate: 50,
      timeUnit: '1s',
      duration: '5m',
      preAllocatedVUs: 100,
      maxVUs: 200,
    },
  },
  thresholds: {
    login_duration: ['p(95) < 1000'],
    signup_duration: ['p(95) < 2000'],
    auth_success_rate: ['rate > 0.95'],
  },
};

const BASE_URL = __ENV.BASE_URL;

export default function () {
  const userIndex = Math.floor(Math.random() * 10000) + __VU * 1000 + __ITER;
  const testUser = generateTestUser(userIndex);

  // 70% login, 30% signup to simulate realistic traffic
  if (Math.random() < 0.7) {
    testLogin(testUser);
  } else {
    testSignup(testUser);
  }
  
  sleep(Math.random() * 2 + 1); // Random sleep between 1-3 seconds
}

function testSignup(user) {
  const signupPayload = {
    email: user.email,
    username: user.username,
    password: user.password,
    firstName: user.firstName,
    lastName: user.lastName,
  };

  const signupStart = Date.now();
  
  const signupResponse = http.post(
    `${BASE_URL}/api/auth/signup`,
    JSON.stringify(signupPayload),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  const signupEnd = Date.now();
  signupDuration.add(signupEnd - signupStart);

  const signupSuccess = check(signupResponse, {
    'signup status is 201 or 409': (r) => [201, 409].includes(r.status),
    'signup response has token or error': (r) => {
      const body = JSON.parse(r.body);
      return body.token || body.error;
    },
    'signup response time < 3s': (r) => r.timings.duration < 3000,
  });

  if (signupSuccess) {
    authSuccessRate.add(1);
  } else {
    authFailures.add(1);
    authSuccessRate.add(0);
  }

  // If signup successful, test immediate login
  if (signupResponse.status === 201) {
    sleep(0.5); // Brief pause
    testLogin(user);
  }
}

function testLogin(user) {
  const loginPayload = {
    email: user.email,
    password: user.password,
  };

  const loginStart = Date.now();
  
  const loginResponse = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify(loginPayload),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  const loginEnd = Date.now();
  loginDuration.add(loginEnd - loginStart);

  const loginSuccess = check(loginResponse, {
    'login status is 200 or 401': (r) => [200, 401].includes(r.status),
    'login response has token or error': (r) => {
      const body = JSON.parse(r.body);
      return body.token || body.error;
    },
    'login response time < 2s': (r) => r.timings.duration < 2000,
  });

  if (loginResponse.status === 200) {
    authSuccessRate.add(1);
    
    // Test token validation
    const token = JSON.parse(loginResponse.body).token;
    testTokenValidation(token);
  } else if (loginResponse.status === 401) {
    // Expected for non-existent users in load test
    authSuccessRate.add(1);
  } else {
    authFailures.add(1);
    authSuccessRate.add(0);
  }
}

function testTokenValidation(token) {
  const meResponse = http.get(
    `${BASE_URL}/api/auth/me`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  check(meResponse, {
    'token validation status is 200': (r) => r.status === 200,
    'me endpoint returns user data': (r) => {
      const body = JSON.parse(r.body);
      return body.user && body.user.id;
    },
  });
}

export function handleSummary(data) {
  return {
    'auth-load-summary.html': htmlReport(data),
    'auth-load-summary.json': JSON.stringify(data, null, 2),
  };
}

function htmlReport(data) {
  const authMetrics = [
    'login_duration',
    'signup_duration', 
    'auth_success_rate',
    'auth_failures'
  ];

  let html = `
    <html>
      <head>
        <title>Authentication Load Test Results</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .metric { margin: 10px 0; padding: 10px; border-left: 4px solid #007cba; }
          .success { border-left-color: #28a745; }
          .warning { border-left-color: #ffc107; }
          .error { border-left-color: #dc3545; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>Authentication Load Test Results</h1>
        <p><strong>Test Duration:</strong> ${data.metrics.iterations?.values?.count || 0} iterations</p>
        <p><strong>Total Requests:</strong> ${data.metrics.http_reqs?.values?.count || 0}</p>
        
        <h2>Key Metrics</h2>
        <table>
          <tr><th>Metric</th><th>Value</th><th>Threshold</th><th>Status</th></tr>
  `;

  // Add authentication specific metrics
  authMetrics.forEach(metric => {
    if (data.metrics[metric]) {
      const values = data.metrics[metric].values;
      const threshold = data.metrics[metric].thresholds;
      
      html += `
        <tr>
          <td>${metric}</td>
          <td>${values.avg ? values.avg.toFixed(2) + 'ms' : values.rate || values.count || 'N/A'}</td>
          <td>${threshold ? Object.keys(threshold)[0] : 'None'}</td>
          <td>${threshold && threshold.ok ? '✅ Pass' : '❌ Fail'}</td>
        </tr>
      `;
    }
  });

  html += `
        </table>
        
        <h2>HTTP Request Details</h2>
        <div class="metric">
          <strong>Request Duration (p95):</strong> 
          ${data.metrics.http_req_duration?.values?.p95?.toFixed(2) || 'N/A'}ms
        </div>
        <div class="metric">
          <strong>Request Failure Rate:</strong> 
          ${data.metrics.http_req_failed?.values?.rate?.toFixed(4) || 'N/A'}
        </div>
        
        <h2>Performance Recommendations</h2>
        <ul>
  `;

  // Add performance recommendations based on results
  const avgLoginDuration = data.metrics.login_duration?.values?.avg || 0;
  const avgSignupDuration = data.metrics.signup_duration?.values?.avg || 0;
  const authFailureRate = data.metrics.auth_failures?.values?.count || 0;

  if (avgLoginDuration > 800) {
    html += '<li class="warning">Login duration is above optimal range. Consider database query optimization or caching.</li>';
  }

  if (avgSignupDuration > 1500) {
    html += '<li class="warning">Signup duration is high. Review password hashing settings and database writes.</li>';
  }

  if (authFailureRate > data.metrics.iterations?.values?.count * 0.05) {
    html += '<li class="error">High authentication failure rate detected. Review error handling and validation logic.</li>';
  }

  if (avgLoginDuration < 300 && avgSignupDuration < 800) {
    html += '<li class="success">Authentication performance is excellent!</li>';
  }

  html += `
        </ul>
      </body>
    </html>
  `;

  return html;
}