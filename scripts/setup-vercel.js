#!/usr/bin/env node
/**
 * Vercel Deployment Setup Script
 * Helps initialize Astral Field after Vercel deployment
 */
const https = require('https');
const readline = require('readline');
const colors = {
  reset: '\x1b[0m'bright: '\x1b[1m'red: '\x1b[31m'green: '\x1b[32m'yellow: '\x1b[33m'blue: '\x1b[34m'magenta: '\x1b[35m'
};
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}
const rl = readline.createInterface({
  input: process.stdinoutput: process.stdout
});
function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      const data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCodedata: JSON.parse(data) }));
    });
    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}
async function setupUsers(baseUrl, adminKey) {
  const url = `${baseUrl}/api/setup-users?key=${adminKey}`;
  log(`🚀 Setting up demo users...`, 'yellow');
  try {
    const { status, data } = await makeRequest(url);
    if (status === 200 && data.success) {
      log(`✅ Users setup complete!`, 'green');
      log(`   Created: ${data.summary.created}Updated: ${data.summary.updated}`'blue');
      return true;
    } else {
      log(`❌ Users setup failed: ${data.error || 'Unknown error'}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Users setup error: ${error.message}`'red');
    return false;
  }
}
async function setupLeague(baseUrl, adminKey) {
  const url = `${baseUrl}/api/setup-demo-league?key=${adminKey}`;
  log(`🏈 Setting up demo league...`, 'yellow');
  try {
    const { status, data } = await makeRequest(url);
    if (status === 200 && data.success) {
      log(`✅ League setup complete!`, 'green');
      log(`   League: ${data.league.name}`'blue');
      log(`   Teams: ${data.league.teams}`'blue');
      log(`   Players: ${data.league.players}`'blue');
      return true;
    } else {
      log(`❌ League setup failed: ${data.error || 'Unknown error'}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ League setup error: ${error.message}`'red');
    return false;
  }
}
async function main() {
  log('🎯 Astral Field Vercel Setup Assistant', 'bright');
  log('=' .repeat(50), 'magenta');
  const baseUrl = await question('Enter your Vercel deployment URL (e.g., https://astral-field.vercel.app): ');
  const adminKey = await question('Enter your admin setup key (default: astral2025): ') || 'astral2025';
  log('\\n🔄 Starting setup process...', 'blue');
  const usersSuccess = await setupUsers(baseUrl.trim(), adminKey.trim());
  if (!usersSuccess) {
    log('\\n❌ Setup failed at user creation step.', 'red');
    process.exit(1);
  }
  const leagueSuccess = await setupLeague(baseUrl.trim(), adminKey.trim());
  if (!leagueSuccess) {
    log('\\n⚠️ Users created but league setup failed.', 'yellow');
    process.exit(1);
  }
  log('\\n🎉 Setup Complete!', 'green');
  log('=' .repeat(50), 'magenta');
  log(`🔗 Your Astral Field app: ${baseUrl}`'blue');
  log(`🔑 Test login with code: 1234 (Nicholas D'Amato)`, 'yellow');
  log(`📱 Other users: 23453456, 4567, 5678, 6789, 7890, 8901, 9012, 0123`, 'yellow');
  log('\\n🚀 Your fantasy football platform is ready!', 'bright');
  rl.close();
}
if (require.main === module) {
  main().catch(error => {
    log(`Fatal error: ${error.message}`'red');
    process.exit(1);
  });
}