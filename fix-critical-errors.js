#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing critical build errors...');

// Specific critical fixes based on the error messages
const criticalFixes = [
  // Fix import statement in admin audit-logs
  {
    file: 'src/app/api/admin/audit-logs/route.ts',
    pattern: /validateQueryParams:\s*validateRequestBody;\s*createValidationErrorResponse,/g,
    replacement: 'validateQueryParams, validateRequestBody, createValidationErrorResponse,',
    description: 'Fix import statement in admin audit-logs'
  },
  
  // Fix chat route content property
  {
    file: 'src/app/api/ai/chat/route.ts',
    pattern: /content:\s*response;/g,
    replacement: 'content: response,',
    description: 'Fix content property in chat response'
  },
  
  // Fix predictions import 
  {
    file: 'src/app/api/ai/predictions/route.ts',
    pattern: /validateQueryParams:\s*validateRequestBody;\s*createValidationErrorResponse:\s*hasValidationErrors;\s*idSchema,/g,
    replacement: 'validateQueryParams, validateRequestBody, createValidationErrorResponse, hasValidationErrors, idSchema,',
    description: 'Fix predictions import statement'
  },
  
  // Fix predictions destructuring
  {
    file: 'src/app/api/ai/predictions/route.ts',
    pattern: /const\s*\{\s*predictionId:\s*season;\s*predictedPoints:\s*actualPoints;\s*factors,\s*modelWeights\s*\}\s*=\s*body;/g,
    replacement: 'const { predictionId, playerId, week, season, predictedPoints, actualPoints, factors, modelWeights } = body;',
    description: 'Fix predictions destructuring'
  },
  
  // Fix predictions method call
  {
    file: 'src/app/api/ai/predictions/route.ts',
    pattern: /predictionId:\s*playerId;\s*week:\s*season;\s*predictedPoints:/g,
    replacement: 'predictionId, playerId, week, season, predictedPoints,',
    description: 'Fix predictions method call'
  },
  
  // Fix learning destructuring
  {
    file: 'src/app/api/ai/learning/route.ts',
    pattern: /const\s*\{\s*predictionId:\s*playerId;\s*week:\s*season;\s*predictedPoints,\s*actualPoints,\s*factors,\s*modelWeights\s*\}\s*=\s*data;/g,
    replacement: 'const { predictionId, playerId, week, season, predictedPoints, actualPoints, factors, modelWeights } = data;',
    description: 'Fix learning destructuring'
  },

  // Fix MFA function calls
  {
    file: 'src/app/api/auth/enterprise/mfa/route.ts',
    pattern: /return await handleMFASetup\(user:\s*ip;\s*userAgent\);/g,
    replacement: 'return await handleMFASetup(user, ip, userAgent);',
    description: 'Fix MFA setup call'
  },
  
  {
    file: 'src/app/api/auth/enterprise/mfa/route.ts',
    pattern: /return await handleMFAVerification\(user:\s*challengeId;\s*verificationToken,\s*method,\s*ip,\s*userAgent\);/g,
    replacement: 'return await handleMFAVerification(user, challengeId, verificationToken, method, ip, userAgent);',
    description: 'Fix MFA verification call'
  },

  // Fix MFA function signature
  {
    file: 'src/app/api/auth/enterprise/mfa/route.ts',
    pattern: /async function handleMFASetup\(user:\s*any;\s*ip:\s*string;\s*userAgent:\s*string\)/g,
    replacement: 'async function handleMFASetup(user: any, ip: string, userAgent: string)',
    description: 'Fix MFA setup function signature'
  },

  // Fix audit logger calls in MFA
  {
    file: 'src/app/api/auth/enterprise/mfa/route.ts',
    pattern: /ipAddress:\s*ip:\s*userAgent;/g,
    replacement: 'ipAddress: ip, userAgent,',
    description: 'Fix audit logger calls'
  },

  // Fix waivers destructuring
  {
    file: 'src/app/api/ai/waivers/route.ts',
    pattern: /const\s*\{\s*leagueId:\s*teamId;\s*playerId,\s*priority,\s*maxBid,\s*reasoning\s*\}\s*=\s*data;/g,
    replacement: 'const { leagueId, teamId, playerId, priority, maxBid, reasoning } = data;',
    description: 'Fix waivers destructuring'
  },

  // Fix waivers method call
  {
    file: 'src/app/api/ai/waivers/route.ts',
    pattern: /leagueId:\s*teamId;\s*playerId,/g,
    replacement: 'leagueId, teamId, playerId,',
    description: 'Fix waivers method call'
  },

  // Fix OAuth destructuring
  {
    file: 'src/app/api/auth/enterprise/oauth/[provider]/route.ts',
    pattern: /const\s*\{\s*code:\s*state;\s*error,\s*error_description\s*\}\s*=\s*requestBody;/g,
    replacement: 'const { code, state, error, error_description } = requestBody;',
    description: 'Fix OAuth destructuring'
  },

  // Fix SQL INSERT statements
  {
    file: 'src/app/api/auth/enterprise/oauth/[provider]/route.ts',
    pattern: /id:\s*email;\s*username:\s*first_name;\s*last_name:\s*avatar;\s*role,\s*email_verified,\s*preferences,\s*created_at:\s*updated_at/g,
    replacement: 'id, email, username, first_name, last_name, avatar, role, email_verified, preferences, created_at, updated_at',
    description: 'Fix SQL INSERT fields'
  },

  {
    file: 'src/app/api/auth/enterprise/oauth/[provider]/route.ts',
    pattern: /\):\s*VALUES/g,
    replacement: ') VALUES',
    description: 'Fix SQL VALUES syntax'
  },

  // Fix more SQL field syntax
  {
    file: 'src/app/api/auth/enterprise/oauth/[provider]/route.ts',
    pattern: /user_id:\s*provider;\s*provider_id:\s*email;\s*verified:\s*connected_at;\s*access_token:\s*refresh_token;\s*expires_at,\s*last_used,\s*created_at,\s*updated_at/g,
    replacement: 'user_id, provider, provider_id, email, verified, connected_at, access_token, refresh_token, expires_at, last_used, created_at, updated_at',
    description: 'Fix social logins INSERT fields'
  },

  // Fix session INSERT
  {
    file: 'src/app/api/auth/enterprise/oauth/[provider]/route.ts',
    pattern: /id:\s*user_id;\s*token_hash:\s*refresh_token_hash;\s*expires_at:\s*device_info;\s*ip_address,\s*user_agent,\s*last_activity,\s*is_active:\s*created_at/g,
    replacement: 'id, user_id, token_hash, refresh_token_hash, expires_at, device_info, ip_address, user_agent, last_activity, is_active, created_at',
    description: 'Fix session INSERT fields'
  },

  // Fix session VALUES parameters
  {
    file: 'src/app/api/auth/enterprise/oauth/[provider]/route.ts',
    pattern: /sessionId,\s*userId:\s*crypto\.createHash/g,
    replacement: 'sessionId, userId, crypto.createHash',
    description: 'Fix session VALUES parameters'
  },

  {
    file: 'src/app/api/auth/enterprise/oauth/[provider]/route.ts',
    pattern: /crypto\.createHash\('sha256'\)\.update\(refreshToken\)\.digest\('hex'\),\s*expiresAt:\s*JSON\.stringify\(\{,/g,
    replacement: 'crypto.createHash(\'sha256\').update(refreshToken).digest(\'hex\'), expiresAt, JSON.stringify({',
    description: 'Fix refresh token and JSON.stringify'
  },

  {
    file: 'src/app/api/auth/enterprise/oauth/[provider]/route.ts',
    pattern: /\}\),\s*ip:\s*userAgent/g,
    replacement: '}), ip, userAgent',
    description: 'Fix final parameters'
  },

  // Fix audit log calls in OAuth
  {
    file: 'src/app/api/auth/enterprise/oauth/[provider]/route.ts',
    pattern: /ipAddress:\s*ip:\s*userAgent;\s*sessionId;/g,
    replacement: 'ipAddress: ip, userAgent, sessionId,',
    description: 'Fix OAuth audit log calls'
  },

  // Fix SELECT statements
  {
    file: 'src/app/api/auth/enterprise/oauth/[provider]/route.ts',
    pattern: /id:\s*email;\s*username:\s*first_name;\s*last_name:\s*avatar;\s*role:\s*email_verified;\s*phone_verified,\s*mfa_enabled,\s*last_login,\s*preferences/g,
    replacement: 'id, email, username, first_name, last_name, avatar, role, email_verified, phone_verified, mfa_enabled, last_login, preferences',
    description: 'Fix SELECT field syntax'
  }
];

// Function to fix a specific file with specific patterns
function fixFileWithPatterns(file, patterns) {
  const fullPath = path.resolve(file);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${file}`);
    return false;
  }

  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    let hasChanges = false;
    
    patterns.forEach(fix => {
      const originalContent = content;
      content = content.replace(fix.pattern, fix.replacement);
      if (content !== originalContent) {
        hasChanges = true;
        console.log(`  ✓ Applied: ${fix.description}`);
      }
    });
    
    if (hasChanges) {
      fs.writeFileSync(fullPath, content, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${file}:`, error.message);
    return false;
  }
}

// Group fixes by file
const fileGroups = {};
criticalFixes.forEach(fix => {
  if (!fileGroups[fix.file]) {
    fileGroups[fix.file] = [];
  }
  fileGroups[fix.file].push(fix);
});

let totalFixed = 0;

// Process each file
Object.keys(fileGroups).forEach(file => {
  console.log(`🔍 Fixing: ${file}`);
  if (fixFileWithPatterns(file, fileGroups[file])) {
    totalFixed++;
    console.log(`✅ Fixed: ${file}`);
  }
});

console.log('\n' + '='.repeat(50));
console.log(`📊 Critical Fix Summary:`);
console.log(`   Files processed: ${Object.keys(fileGroups).length}`);
console.log(`   Files fixed: ${totalFixed}`);
console.log(`   Critical patterns applied: ${criticalFixes.length}`);

console.log('\n✨ Critical errors fix completed!');