#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Final syntax error fix...');

// Final comprehensive fixes for all remaining issues
const finalFixes = [
  // Fix audit-logs destructuring
  {
    pattern: /const\s*\{\s*page:\s*limit;\s*startDate,\s*endDate,\s*userId,\s*action:\s*severity\s*\}\s*=\s*queryValidation\.data!/g,
    replacement: 'const { page, limit, startDate, endDate, userId, action, severity } = queryValidation.data!',
    description: 'Fix audit logs destructuring'
  },

  // Fix breakouts object property
  {
    pattern: /players:\s*filteredPlayers;/g,
    replacement: 'players: filteredPlayers,',
    description: 'Fix players property syntax'
  },

  // Fix draft object property
  {
    pattern: /pickNumber:\s*pick;/g,
    replacement: 'pickNumber: pick,',
    description: 'Fix pickNumber property syntax'
  },

  // Fix injuries method call
  {
    pattern: /alertId:\s*newStatus;\s*additionalInfo/g,
    replacement: 'alertId, newStatus, additionalInfo',
    description: 'Fix injury status method call'
  },

  // Fix predictions import (the one we missed)
  {
    pattern: /validateQueryParams:\s*validateRequestBody;\s*createValidationErrorResponse,\s*hasValidationErrors,\s*idSchema,/g,
    replacement: 'validateQueryParams, validateRequestBody, createValidationErrorResponse, hasValidationErrors, idSchema,',
    description: 'Fix predictions import statement'
  },

  // Fix any remaining semicolon in object properties
  {
    pattern: /(\w+):\s*([^,;}]+);(?=\s*[\n\s]*[},])/gm,
    replacement: '$1: $2,',
    description: 'Fix trailing semicolons in object properties'
  },

  // Fix method call parameters with colons
  {
    pattern: /(\w+):\s*(\w+);\s*(\w+)(?=[,)])/g,
    replacement: '$1, $2, $3',
    description: 'Fix method call parameters'
  },

  // Fix destructuring with colons and semicolons
  {
    pattern: /const\s*\{\s*([^}]*?):\s*([^;}]+);\s*([^}]*?)\s*\}\s*=/g,
    replacement: (match, p1, p2, p3) => {
      // Split and reconstruct properly
      const parts = match.split('=')[0];
      const cleaned = parts.replace(/:\s*([^;,]+);/g, ', $1,').replace(/:\s*([^;,}]+)\s*}/g, ', $1 }');
      return cleaned + ' =';
    },
    description: 'Fix complex destructuring patterns'
  },

  // Fix remaining comma/colon confusion in objects
  {
    pattern: /(\w+),\s*(\w+):\s*([^,;}]+)/g,
    replacement: '$1: $2, $3',
    description: 'Fix object property colon placement'
  },

  // Fix mfaEnabled property syntax
  {
    pattern: /mfaEnabled:\s*true;/g,
    replacement: 'mfaEnabled: true,',
    description: 'Fix mfaEnabled property'
  },

  // Fix backupCodes property syntax
  {
    pattern: /backupCodes:\s*newBackupCodes;/g,
    replacement: 'backupCodes: newBackupCodes,',
    description: 'Fix backupCodes property'
  },

  // Fix metadata object issues
  {
    pattern: /availableMethods:\s*mfaSetup\.methods:\s*ip;/g,
    replacement: 'availableMethods: mfaSetup.methods, ip,',
    description: 'Fix metadata availableMethods syntax'
  },

  // Fix more complex metadata patterns
  {
    pattern: /method,\s*challengeId,\s*backupCodeUse,\s*d:\s*result\.backupCodeUsed/g,
    replacement: 'method, challengeId, backupCodeUsed: result.backupCodeUsed',
    description: 'Fix backupCodeUsed metadata'
  },

  // Fix remainingAttempts pattern
  {
    pattern: /remainingAttempt,\s*s:\s*result\.remainingAttempts/g,
    replacement: 'remainingAttempts: result.remainingAttempts',
    description: 'Fix remainingAttempts metadata'
  },

  // Fix ON CONFLICT syntax
  {
    pattern: /ON\s+CONFLICT\(([^)]+)\):\s*DO/g,
    replacement: 'ON CONFLICT($1) DO',
    description: 'Fix ON CONFLICT syntax'
  },

  // Fix VALUES with colon
  {
    pattern: /true:\s*NOW\(\)/g,
    replacement: 'true, NOW()',
    description: 'Fix VALUES with colon'
  },

  // Fix final JSON.stringify issues
  {
    pattern: /expiresAt:\s*JSON\.stringify\(\{,/g,
    replacement: 'expiresAt, JSON.stringify({',
    description: 'Fix JSON.stringify parameter'
  },

  // Fix audit log parameter issues
  {
    pattern: /ipAddress:\s*ip;\s*userAgent:\s*sessionId;/g,
    replacement: 'ipAddress: ip, userAgent, sessionId,',
    description: 'Fix audit log parameters'
  }
];

// Function to apply all fixes to a file
function fixAllSyntax(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    let totalChanges = 0;

    // Apply each fix pattern
    finalFixes.forEach(fix => {
      const originalContent = content;
      content = content.replace(fix.pattern, fix.replacement);
      if (content !== originalContent) {
        hasChanges = true;
        totalChanges++;
        console.log(`  ✓ Applied: ${fix.description}`);
      }
    });

    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed ${totalChanges} patterns in: ${path.relative(process.cwd(), filePath)}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Get all TypeScript files in API routes
const apiFiles = [
  'src/app/api/admin/audit-logs/route.ts',
  'src/app/api/ai/breakouts/route.ts',
  'src/app/api/ai/draft/route.ts', 
  'src/app/api/ai/injuries/route.ts',
  'src/app/api/ai/predictions/route.ts',
  'src/app/api/auth/enterprise/login/route.ts',
  'src/app/api/auth/enterprise/mfa/route.ts',
  'src/app/api/auth/enterprise/oauth/[provider]/route.ts'
];

let totalFixed = 0;

console.log(`🎯 Processing ${apiFiles.length} critical API files...\n`);

apiFiles.forEach(file => {
  const fullPath = path.resolve(file);
  if (fs.existsSync(fullPath)) {
    console.log(`🔍 Processing: ${file}`);
    if (fixAllSyntax(fullPath)) {
      totalFixed++;
    }
  } else {
    console.log(`⚠️  File not found: ${file}`);
  }
});

console.log('\n' + '='.repeat(60));
console.log(`📊 Final Fix Summary:`);
console.log(`   Files processed: ${apiFiles.length}`);
console.log(`   Files fixed: ${totalFixed}`);
console.log(`   Fix patterns available: ${finalFixes.length}`);

console.log('\n✨ Final syntax fix completed!');

// Let's also specifically handle the OAuth file issues that keep recurring
const oauthFile = 'src/app/api/auth/enterprise/oauth/[provider]/route.ts';
if (fs.existsSync(oauthFile)) {
  console.log('\n🔧 Special handling for OAuth file...');
  let oauthContent = fs.readFileSync(oauthFile, 'utf8');
  let oauthFixed = false;
  
  // Fix any remaining issues in OAuth file
  const oauthSpecific = [
    // Fix the VALUES issue specifically
    {
      pattern: /\)\s*VALUES\s*\(\$1,\s*\$2,\s*\$3,\s*\$4,\s*\$5,\s*\$6,\s*\$7,\s*\$8,\s*NOW\(\),\s*true:\s*NOW\(\)\)/g,
      replacement: ') VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), true, NOW())'
    },
    // Fix JSON.stringify issue
    {
      pattern: /crypto\.createHash\('sha256'\)\.update\(refreshToken\)\.digest\('hex'\),\s*expiresAt:\s*JSON\.stringify\(\{,/g,
      replacement: "crypto.createHash('sha256').update(refreshToken).digest('hex'), expiresAt, JSON.stringify({"
    }
  ];
  
  oauthSpecific.forEach(fix => {
    const before = oauthContent;
    oauthContent = oauthContent.replace(fix.pattern, fix.replacement);
    if (oauthContent !== before) {
      oauthFixed = true;
      console.log('  ✓ Fixed OAuth specific pattern');
    }
  });
  
  if (oauthFixed) {
    fs.writeFileSync(oauthFile, oauthContent, 'utf8');
    console.log('✅ OAuth file specially handled');
  }
}