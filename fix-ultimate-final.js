#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔧 Starting ultimate syntax fix...');

// Define all the patterns we need to fix
const fixes = [
  // Fix {, patterns
  {
    pattern: /\{\,/g,
    replacement: '{',
    description: 'Fix malformed object opening with comma'
  },
  
  // Fix property declarations like "email, string," to "email: string;"
  {
    pattern: /(\w+),\s*string,/g,
    replacement: '$1: string;',
    description: 'Fix property declarations with commas instead of colons'
  },
  
  // Fix property declarations like "device, string," to "device: string;"
  {
    pattern: /(\w+),\s*(\w+),/g,
    replacement: '$1: $2;',
    description: 'Fix general property declarations'
  },
  
  // Fix patterns like "failureReaso," followed by newline and "n: 'text'"
  {
    pattern: /failureReaso,\s*\n\s*n:\s*([^,}]+)/g,
    replacement: 'failureReason: $1',
    description: 'Fix split failureReason property'
  },
  
  // Fix patterns like "ipAddress, ip," to "ipAddress: ip,"
  {
    pattern: /ipAddress,\s*ip,/g,
    replacement: 'ipAddress: ip,',
    description: 'Fix ipAddress property syntax'
  },
  
  // Fix patterns like "userAgent, failureReaso," to "userAgent, failureReason:"
  {
    pattern: /userAgent,\s*failureReaso,/g,
    replacement: 'userAgent, failureReason:',
    description: 'Fix userAgent and failureReason syntax'
  },
  
  // Fix patterns like "challengeId: rememberMe = false" to "challengeId, rememberMe = false"
  {
    pattern: /challengeId:\s*rememberMe\s*=/g,
    replacement: 'challengeId, rememberMe =',
    description: 'Fix destructuring assignment syntax'
  },
  
  // Fix SQL query syntax issues - remove semicolon at start of string
  {
    pattern: /`\s*;\s*\n/g,
    replacement: '`\n',
    description: 'Fix SQL query syntax with leading semicolon'
  },
  
  // Fix "WHERE id = $1: WHERE" to "WHERE id = $1"
  {
    pattern: /WHERE\s+id\s*=\s*\$1:\s*WHERE/g,
    replacement: 'WHERE id = $1',
    description: 'Fix duplicate WHERE clause'
  },
  
  // Fix "last_login: preferences" to "last_login, preferences"
  {
    pattern: /last_login:\s*preferences/g,
    replacement: 'last_login, preferences',
    description: 'Fix field selection syntax'
  },
  
  // Fix "accountLocked, true," to "accountLocked: true,"
  {
    pattern: /accountLocked,\s*true,/g,
    replacement: 'accountLocked: true,',
    description: 'Fix boolean property syntax'
  },
  
  // Fix "mfaRequired, true," to "mfaRequired: true,"
  {
    pattern: /mfaRequired,\s*true,/g,
    replacement: 'mfaRequired: true,',
    description: 'Fix mfaRequired property syntax'
  },
  
  // Fix "challengeId, mfaChallengeId," to "challengeId: mfaChallengeId,"
  {
    pattern: /challengeId,\s*mfaChallengeId,/g,
    replacement: 'challengeId: mfaChallengeId,',
    description: 'Fix challengeId property syntax'
  },
  
  // Fix "token, mfaToken," to "token: mfaToken,"
  {
    pattern: /token,\s*mfaToken,/g,
    replacement: 'token: mfaToken,',
    description: 'Fix token property syntax'
  },
  
  // Fix "ipAddres, s: ip" to "ipAddress: ip"
  {
    pattern: /ipAddres,\s*s:\s*ip/g,
    replacement: 'ipAddress: ip',
    description: 'Fix split ipAddress property'
  },
  
  // Fix JSON.stringify patterns like "JSON.stringify(deviceInfo || {,"
  {
    pattern: /JSON\.stringify\(([^)]+)\s*\|\|\s*\{\,/g,
    replacement: 'JSON.stringify($1 || {',
    description: 'Fix JSON.stringify with malformed default object'
  },
  
  // Fix object property syntax like "id, userId," to "id: userId,"
  {
    pattern: /id,\s*userId,/g,
    replacement: 'id: userId,',
    description: 'Fix id property syntax'
  },
  
  // Fix "firstName: user.first_name," followed by incorrect syntax
  {
    pattern: /firstName:\s*user\.first_name,\s*lastName:\s*user\.last_name,\s*role:\s*user\.role,/g,
    replacement: 'firstName: user.first_name,\n        lastName: user.last_name,\n        role: user.role,',
    description: 'Fix user property mapping'
  },
  
  // Fix "token, sessionToken," to "token: sessionToken,"
  {
    pattern: /token,\s*sessionToken,/g,
    replacement: 'token: sessionToken,',
    description: 'Fix token property syntax'
  },
  
  // Fix "refreshToken, expiresA," to "refreshToken, expiresAt:"
  {
    pattern: /refreshToken,\s*expiresA,/g,
    replacement: 'refreshToken, expiresAt:',
    description: 'Fix expiresAt property syntax'
  },
  
  // Fix "t: expiresAt.toISOString()" to "expiresAt.toISOString()"
  {
    pattern: /t:\s*expiresAt\.toISOString\(\)/g,
    replacement: 'expiresAt.toISOString()',
    description: 'Fix expiresAt method call'
  },
  
  // Fix "security: {newDevic," to "security: { newDevice:"
  {
    pattern: /security:\s*\{\s*newDevic,/g,
    replacement: 'security: {\n        newDevice:',
    description: 'Fix newDevice property syntax'
  },
  
  // Fix "e: !recentLogins" to "!recentLogins"
  {
    pattern: /e:\s*(!recentLogins[^,}]+)/g,
    replacement: '$1',
    description: 'Fix boolean expression syntax'
  },
  
  // Fix "mfaUsed: user.mfa_enabled," syntax
  {
    pattern: /mfaUsed:\s*user\.mfa_enabled,/g,
    replacement: 'mfaUsed: user.mfa_enabled,',
    description: 'Fix mfaUsed property syntax'
  },
  
  // Fix function declaration syntax "export async function GET(request: NextRequest) { try {"
  {
    pattern: /export\s+async\s+function\s+(\w+)\([^)]+\)\s*\{\s*try\s*\{/g,
    replacement: 'export async function $1(request: NextRequest) {\n  try {',
    description: 'Fix function declaration with try block'
  },
  
  // Fix response object syntax
  {
    pattern: /response:\s*any\s*=\s*\{([^}]+)\s*\}/g,
    replacement: (match, content) => {
      // Fix the content inside the response object
      const fixed = content
        .replace(/success:\s*true,\s*loginMethods:/g, 'success: true,\n      loginMethods:')
        .replace(/socialLogins:/g, '\n      socialLogins:')
        .replace(/mfaRequired:\s*false\s*\}/g, '\n      mfaRequired: false\n    }');
      return `response: any = {${fixed}}`;
    },
    description: 'Fix response object formatting'
  },
  
  // Fix "email_verified: role" to "email_verified, role"
  {
    pattern: /email_verified:\s*role/g,
    replacement: 'email_verified, role',
    description: 'Fix SELECT field syntax'
  },
  
  // Fix general patterns like "word, word," where it should be "word: word,"
  {
    pattern: /(\w+),\s*(\w+),\s*(?=\n|\s*})/g,
    replacement: '$1: $2,',
    description: 'Fix general property syntax patterns'
  },
  
  // Fix metadata object patterns
  {
    pattern: /metadata:\s*\{\,/g,
    replacement: 'metadata: {',
    description: 'Fix metadata object syntax'
  },
  
  // Fix severity patterns
  {
    pattern: /severity:\s*'medium',\s*metadata:\s*\{\,/g,
    replacement: "severity: 'medium',\n        metadata: {",
    description: 'Fix severity and metadata syntax'
  }
];

// Function to fix a single file
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Apply each fix pattern
    fixes.forEach(fix => {
      const originalContent = content;
      content = content.replace(fix.pattern, fix.replacement);
      if (content !== originalContent) {
        hasChanges = true;
        console.log(`  ✓ Applied: ${fix.description}`);
      }
    });
    
    // Additional manual fixes for specific patterns
    
    // Fix the POST function declaration in enterprise login
    if (filePath.includes('enterprise/login/route.ts')) {
      content = content.replace(
        /export async function POST\(request: NextRequest\) \{ const startTime = Date\.now\(\);/,
        'export async function POST(request: NextRequest) {\n  const startTime = Date.now();'
      );
    }
    
    // Fix destructuring with incorrect property mapping
    content = content.replace(
      /const \{ email, password, mfaToken, challengeId, rememberMe = false, deviceInfo \} = requestBody;/,
      'const { email, password, mfaToken, challengeId, rememberMe = false, deviceInfo } = requestBody;'
    );
    
    // Fix the ipAddress variable reference
    content = content.replace(/ipAddress, ip,/g, 'ipAddress: ip,');
    
    // Fix query strings with malformed syntax
    content = content.replace(/SELECT \n/g, 'SELECT\n');
    
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

// Get all TypeScript files that might need fixing
const filesToFix = [
  // Specific files we know have issues
  'src/app/api/auth/enterprise/login/route.ts',
  'src/app/api/auth/enterprise/mfa/route.ts',
  
  // Get all TypeScript files in the project
  ...glob.sync('src/**/*.ts', {
    ignore: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '**/*.d.ts',
      '**/*.test.ts',
      '**/*.spec.ts'
    ]
  })
];

let totalFixed = 0;
let filesProcessed = 0;

console.log(`📁 Processing ${filesToFix.length} TypeScript files...\n`);

filesToFix.forEach(file => {
  const fullPath = path.resolve(file);
  if (fs.existsSync(fullPath)) {
    console.log(`🔍 Checking: ${file}`);
    if (fixFile(fullPath)) {
      totalFixed++;
    }
    filesProcessed++;
  }
});

console.log('\n' + '='.repeat(50));
console.log(`📊 Fix Summary:`);
console.log(`   Files processed: ${filesProcessed}`);
console.log(`   Files fixed: ${totalFixed}`);
console.log(`   Fix patterns applied: ${fixes.length}`);
console.log('✨ Ultimate syntax fix completed!');

// Verify the main problematic file was fixed
const mainFile = 'src/app/api/auth/enterprise/login/route.ts';
if (fs.existsSync(mainFile)) {
  const content = fs.readFileSync(mainFile, 'utf8');
  const hasIssues = content.includes(', string,') || content.includes('{,') || content.includes('failureReaso,');
  
  if (hasIssues) {
    console.log('⚠️  Some syntax issues may remain in the main file. Manual review recommended.');
  } else {
    console.log('✅ Main enterprise login file appears to be fixed!');
  }
}