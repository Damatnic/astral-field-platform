#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🎯 Fixing exact build errors from the compiler output...');

// Manually fix the exact files with exact patterns mentioned in build errors
const fixes = [
  {
    file: 'src/app/api/admin/audit-logs/route.ts',
    find: 'const { page: limit; startDate, endDate, userId, action: severity } = queryValidation.data!;',
    replace: 'const { page, limit, startDate, endDate, userId, action, severity } = queryValidation.data!;'
  },
  {
    file: 'src/app/api/ai/breakouts/route.ts',
    find: 'players: filteredPlayers;',
    replace: 'players: filteredPlayers,'
  },
  {
    file: 'src/app/api/ai/draft/route.ts',
    find: 'pickNumber: pick;',
    replace: 'pickNumber: pick,'
  },
  {
    file: 'src/app/api/ai/injuries/route.ts',
    find: 'await injuryImpactAnalyzer.updateInjuryStatus(alertId: newStatus; additionalInfo);',
    replace: 'await injuryImpactAnalyzer.updateInjuryStatus(alertId, newStatus, additionalInfo);'
  },
  {
    file: 'src/app/api/ai/predictions/route.ts',
    find: 'validateQueryParams: validateRequestBody; createValidationErrorResponse, hasValidationErrors, idSchema,',
    replace: 'validateQueryParams, validateRequestBody, createValidationErrorResponse, hasValidationErrors, idSchema,'
  }
];

function fixFile(fileName, find, replace) {
  const filePath = path.resolve(fileName);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${fileName}`);
    return false;
  }
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes(find)) {
      content = content.replace(find, replace);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${fileName}`);
      console.log(`   Changed: "${find}" → "${replace}"`);
      return true;
    } else {
      console.log(`ℹ️  Pattern not found in: ${fileName}`);
      console.log(`   Looking for: "${find}"`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error fixing ${fileName}:`, error.message);
    return false;
  }
}

// Apply each specific fix
let totalFixed = 0;
console.log(`🔧 Applying ${fixes.length} specific fixes...\n`);

fixes.forEach((fix, index) => {
  console.log(`[${index + 1}/${fixes.length}] Processing: ${fix.file}`);
  if (fixFile(fix.file, fix.find, fix.replace)) {
    totalFixed++;
  }
  console.log('');
});

console.log('='.repeat(60));
console.log(`📊 Results:`);
console.log(`   Fixes attempted: ${fixes.length}`);
console.log(`   Files successfully fixed: ${totalFixed}`);

// Additional cleanup - fix any remaining obvious patterns
console.log('\n🧹 Additional cleanup...');

const additionalFiles = [
  'src/app/api/auth/enterprise/login/route.ts',
  'src/app/api/auth/enterprise/mfa/route.ts',
  'src/app/api/auth/enterprise/oauth/[provider]/route.ts'
];

let additionalFixed = 0;

additionalFiles.forEach(file => {
  const filePath = path.resolve(file);
  if (fs.existsSync(filePath)) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let changed = false;
      
      // Fix basic syntax issues that keep appearing
      const originalContent = content;
      
      // Fix success: false: error patterns
      content = content.replace(/success:\s*false:\s*error,/g, 'success: false,\n      error:');
      
      // Fix object property colon issues in responses
      content = content.replace(/success:\s*true:\s*([^,\n]+),/g, 'success: true,\n      $1:');
      
      // Fix ipAddress: ip: userAgent patterns
      content = content.replace(/ipAddress:\s*ip:\s*userAgent;/g, 'ipAddress: ip,\n        userAgent,');
      
      // Fix userId: eventType patterns  
      content = content.replace(/userId:\s*user\.id:\s*eventType,/g, 'userId: user.id,\n        eventType:');
      
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Additional cleanup applied to: ${file}`);
        additionalFixed++;
        changed = true;
      }
      
      if (!changed) {
        console.log(`ℹ️  No additional cleanup needed for: ${file}`);
      }
    } catch (error) {
      console.error(`❌ Error in additional cleanup for ${file}:`, error.message);
    }
  }
});

console.log(`\n📊 Additional cleanup results: ${additionalFixed} files updated`);

console.log('\n✨ Exact build error fixes completed!');
console.log('🚀 Ready to test build again...');