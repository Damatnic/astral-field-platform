#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing last remaining syntax issues...');

// Function to fix a file
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    const originalContent = content;
    
    // Fix the split failureReason pattern
    content = content.replace(/failureReason:\s*\n\s*n:\s*([^,}]+)/g, 'failureReason: $1');
    
    // Fix SQL WHERE clause with colon
    content = content.replace(/updated_at = NOW\(\):\s*WHERE/g, 'updated_at = NOW() WHERE');
    
    // Fix JSON.stringify with malformed object
    content = content.replace(/JSON\.stringify\(deviceInfo \|\| \{\,/g, 'JSON.stringify(deviceInfo || {');
    
    // Fix INSERT INTO missing closing parenthesis and VALUES
    content = content.replace(/is_active, created_at\s+VALUES/g, 'is_active, created_at\n      ) VALUES');
    
    // Fix expiresAt property syntax in session object
    content = content.replace(/token: sessionToken, refreshToken, expiresAt:\s*\n\s*expiresAt\.toISOString\(\),/g, 'token: sessionToken,\n        refreshToken,\n        expiresAt: expiresAt.toISOString(),');
    
    // Fix metadata object syntax
    content = content.replace(/metadata: \{\,/g, 'metadata: {');
    
    // Fix OAuth response object syntax
    content = content.replace(/isNewUser: use;\s*\n\s*r:/g, 'isNewUser,\n      user:');
    
    // Fix accessToken syntax
    content = content.replace(/accessToken: oauthResult\.tokens\.accessToken\s*;/g, 'accessToken: oauthResult.tokens.accessToken');
    
    if (content !== originalContent) {
      hasChanges = true;
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed remaining issues in: ${path.relative(process.cwd(), filePath)}`);
    }
    
    return hasChanges;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Fix the problematic files
const files = [
  'src/app/api/auth/enterprise/login/route.ts',
  'src/app/api/auth/enterprise/oauth/[provider]/route.ts'
];

let totalFixed = 0;

files.forEach(file => {
  const fullPath = path.resolve(file);
  if (fs.existsSync(fullPath)) {
    console.log(`🔍 Processing: ${file}`);
    if (fixFile(fullPath)) {
      totalFixed++;
    }
  }
});

console.log('\n' + '='.repeat(50));
console.log(`📊 Final Fix Summary:`);
console.log(`   Files processed: ${files.length}`);
console.log(`   Files fixed: ${totalFixed}`);

// Final verification
const mainFile = 'src/app/api/auth/enterprise/login/route.ts';
if (fs.existsSync(mainFile)) {
  const content = fs.readFileSync(mainFile, 'utf8');
  
  // Check for remaining syntax issues
  const remainingIssues = [];
  if (content.includes('failureReason:\n  n:')) remainingIssues.push('split failureReason');
  if (content.includes('NOW():')) remainingIssues.push('SQL colon syntax');
  if (content.includes('{,')) remainingIssues.push('malformed object opening');
  if (content.includes('created_at VALUES')) remainingIssues.push('missing INSERT parenthesis');
  
  if (remainingIssues.length === 0) {
    console.log('✅ All syntax issues appear to be resolved!');
  } else {
    console.log(`⚠️  Remaining issues: ${remainingIssues.join(', ')}`);
    
    // Show a snippet of the problematic area
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('failureReason:') && lines[index + 1] && lines[index + 1].includes('n:')) {
        console.log(`Line ${index + 1}: ${line}`);
        console.log(`Line ${index + 2}: ${lines[index + 1]}`);
      }
    });
  }
}

console.log('✨ Last issues fix completed!');