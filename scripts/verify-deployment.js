#!/usr/bin/env node

/**
 * Deployment Verification Script
 * Verifies that the Astral Field deployment is working correctly
 */

const https = require('https');
const http = require('http');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function verifyEndpoint(name, url, expectedStatus = 200) {
  try {
    log(`🔍 Testing ${name}...`, 'yellow');
    const { status, data } = await makeRequest(url);
    
    if (status === expectedStatus || status === 200 || (status >= 300 && status < 400)) {
      const statusText = status === 200 ? 'OK' : status >= 300 && status < 400 ? 'Redirect' : 'OK';
      log(`✅ ${name}: ${statusText} (${status})`, 'green');
      return true;
    } else {
      log(`❌ ${name}: Failed (${status})`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ ${name}: Error - ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  const baseUrl = process.argv[2];
  
  if (!baseUrl) {
    log('Usage: node verify-deployment.js <base-url>', 'red');
    log('Example: node verify-deployment.js https://your-app.vercel.app', 'blue');
    process.exit(1);
  }

  log('🚀 Astral Field Deployment Verification', 'bright');
  log('=' .repeat(50), 'blue');
  
  const tests = [
    ['Home Page', `${baseUrl}`],
    ['Health Check', `${baseUrl}/api/health`],
    ['Login Page', `${baseUrl}/auth/login`],
    ['Dashboard', `${baseUrl}/dashboard`],
    ['Players API', `${baseUrl}/api/players`],
  ];

  let passed = 0;
  let total = tests.length;

  for (const [name, url] of tests) {
    const success = await verifyEndpoint(name, url);
    if (success) passed++;
  }

  log('=' .repeat(50), 'blue');
  
  if (passed === total) {
    log(`🎉 All tests passed! (${passed}/${total})`, 'green');
    log('Your Astral Field deployment is ready!', 'green');
    log(`\n🔗 Quick start:`, 'blue');
    log(`1. Setup: ${baseUrl}/api/setup-users?key=astral2025`, 'yellow');
    log(`2. Demo League: ${baseUrl}/api/setup-demo-league?key=astral2025`, 'yellow');
    log(`3. Login: ${baseUrl}/auth/login (use code: 1234)`, 'yellow');
  } else {
    log(`⚠️  Some tests failed (${passed}/${total})`, 'yellow');
    log('Please check the deployment logs and configuration.', 'yellow');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    log(`Fatal error: ${error.message}`, 'red');
    process.exit(1);
  });
}