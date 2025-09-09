#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Starting final syntax cleanup...');

// Define specific fixes for remaining issues
const specificFixes = [
  // Fix destructuring assignment - the main issue
  {
    pattern: /const \{ email: password; mfaToken: challengeId; rememberMe = false, deviceInfo \} = requestBody;/g,
    replacement: 'const { email, password, mfaToken, challengeId, rememberMe = false, deviceInfo } = requestBody;',
    description: 'Fix destructuring assignment syntax'
  },
  
  // Fix property declarations in objects
  {
    pattern: /ipAddress: ip; userAgent: failureReaso;/g,
    replacement: 'ipAddress: ip, userAgent, failureReason:',
    description: 'Fix audit log property syntax'
  },
  
  // Fix split properties like "failureReaso;" followed by "n: 'text'"
  {
    pattern: /failureReaso;\s*\n\s*n:\s*([^,}]+)/g,
    replacement: 'failureReason: $1',
    description: 'Fix split failureReason property'
  },
  
  // Fix SQL SELECT syntax
  {
    pattern: /id: email; username: password_hash; first_name: last_name; role: mfa_enabled; email_verified: phone_number; phone_verified: login_attempts; locked_until: last_login; preferences/g,
    replacement: 'id, email, username, password_hash, first_name, last_name, role, mfa_enabled, email_verified, phone_number, phone_verified, login_attempts, locked_until, last_login, preferences',
    description: 'Fix SQL SELECT field syntax'
  },
  
  // Fix object property syntax in responses
  {
    pattern: /accountLocked: true;/g,
    replacement: 'accountLocked: true,',
    description: 'Fix object property comma'
  },
  
  // Fix object property syntax "success: false: mfaRequired; true: challengeId; mfaChallengeId,"
  {
    pattern: /success: false: mfaRequired; true: challengeId; mfaChallengeId,/g,
    replacement: 'success: false,\n          mfaRequired: true,\n          challengeId: mfaChallengeId,',
    description: 'Fix MFA response object syntax'
  },
  
  // Fix "token: mfaToken; userAgent: ipAddres; s: ip" 
  {
    pattern: /token: mfaToken; userAgent: ipAddres; s: ip/g,
    replacement: 'token: mfaToken, userAgent, ipAddress: ip',
    description: 'Fix MFA challenge parameters'
  },
  
  // Fix INSERT INTO syntax
  {
    pattern: /INSERT INTO user_sessions \(\s*id: user_id; token_hash: refresh_token_hash; expires_at: device_info; ip_address: user_agent; last_activity: is_active; created_at\s*\)/g,
    replacement: 'INSERT INTO user_sessions (\n        id, user_id, token_hash, refresh_token_hash, expires_at, device_info, ip_address, user_agent, last_activity, is_active, created_at',
    description: 'Fix INSERT INTO field syntax'
  },
  
  // Fix VALUES syntax
  {
    pattern: /sessionId: userId; crypto\.createHash/g,
    replacement: 'sessionId, userId, crypto.createHash',
    description: 'Fix VALUES parameter syntax'
  },
  
  // Fix audit log parameters
  {
    pattern: /ipAddress: ip: userAgent; sessionId,/g,
    replacement: 'ipAddress: ip, userAgent, sessionId,',
    description: 'Fix audit log parameter syntax'
  },
  
  // Fix userId assignment in audit log
  {
    pattern: /userId: ipAddress; ip,/g,
    replacement: 'userId, ipAddress: ip,',
    description: 'Fix security incident log syntax'
  },
  
  // Fix metadata object syntax
  {
    pattern: /metadata: {,/g,
    replacement: 'metadata: {',
    description: 'Fix metadata object opening'
  },
  
  // Fix user object properties
  {
    pattern: /id: userId;/g,
    replacement: 'id: userId,',
    description: 'Fix user object property syntax'
  },
  
  // Fix session object properties
  {
    pattern: /token: sessionToken; refreshToken: expiresA;/g,
    replacement: 'token: sessionToken, refreshToken, expiresAt:',
    description: 'Fix session object syntax'
  },
  
  // Fix security object properties
  {
    pattern: /newDevic!recentLogins/g,
    replacement: 'newDevice: !recentLogins',
    description: 'Fix security object syntax'
  },
  
  // Fix function declaration spacing
  {
    pattern: /export async function POST\(request: NextRequest\) \{ const startTime = Date\.now\(\);/g,
    replacement: 'export async function POST(request: NextRequest) {\n  const startTime = Date.now();',
    description: 'Fix function declaration formatting'
  },
  
  // Fix GET function with query selection
  {
    pattern: /SELECT mfa_enabled: email_verified; role FROM users/g,
    replacement: 'SELECT mfa_enabled, email_verified, role FROM users',
    description: 'Fix GET query field syntax'
  },

  // Additional fixes for response object formatting
  {
    pattern: /response: any = \{\s*success: true,\s*loginMethods: \['password'\],\s*\s*\s*socialLogins: \['google', 'facebook', 'apple', 'twitter'\],\s*mfaRequired: false\s*\}/g,
    replacement: `response: any = {
      success: true,
      loginMethods: ['password'],
      socialLogins: ['google', 'facebook', 'apple', 'twitter'],
      mfaRequired: false
    }`,
    description: 'Fix response object formatting'
  }
];

// Function to fix a single file
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Apply each specific fix
    specificFixes.forEach(fix => {
      const originalContent = content;
      content = content.replace(fix.pattern, fix.replacement);
      if (content !== originalContent) {
        hasChanges = true;
        console.log(`  ✓ Applied: ${fix.description}`);
      }
    });
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${path.relative(process.cwd(), filePath)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Focus on the most problematic files first
const criticalFiles = [
  'src/app/api/auth/enterprise/login/route.ts',
  'src/app/api/auth/enterprise/mfa/route.ts',
  'src/app/api/auth/enterprise/oauth/[provider]/route.ts'
];

let totalFixed = 0;

console.log('🎯 Fixing critical authentication files...\n');

criticalFiles.forEach(file => {
  const fullPath = path.resolve(file);
  if (fs.existsSync(fullPath)) {
    console.log(`🔍 Processing: ${file}`);
    if (fixFile(fullPath)) {
      totalFixed++;
    }
  } else {
    console.log(`⚠️  File not found: ${file}`);
  }
});

console.log('\n' + '='.repeat(50));
console.log(`📊 Cleanup Summary:`);
console.log(`   Files processed: ${criticalFiles.length}`);
console.log(`   Files fixed: ${totalFixed}`);
console.log(`   Specific fixes applied: ${specificFixes.length}`);

// Verify the main file
const mainFile = 'src/app/api/auth/enterprise/login/route.ts';
if (fs.existsSync(mainFile)) {
  const content = fs.readFileSync(mainFile, 'utf8');
  const issues = [];
  
  if (content.includes('email: password;')) issues.push('destructuring syntax');
  if (content.includes('failureReaso;')) issues.push('split properties');
  if (content.includes('ipAddress: ip;')) issues.push('audit log syntax');
  if (content.includes('id: email;')) issues.push('SQL field syntax');
  
  if (issues.length === 0) {
    console.log('✅ Main enterprise login file appears to be fixed!');
  } else {
    console.log(`⚠️  Remaining issues in main file: ${issues.join(', ')}`);
  }
} else {
  console.log('❌ Main file not found for verification');
}

console.log('✨ Final syntax cleanup completed!');