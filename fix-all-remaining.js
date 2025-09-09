#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔧 Fixing ALL remaining syntax issues...');

// Comprehensive fix patterns
const fixes = [
  // Import statement fixes
  {
    pattern: /adminValidationMiddleware:\s*validateQueryParams;\s*validateRequestBody:\s*queryParamsSchema;\s*createValidationErrorResponse,/g,
    replacement: 'adminValidationMiddleware, validateQueryParams, validateRequestBody, queryParamsSchema, createValidationErrorResponse,',
    description: 'Fix import statement colon/semicolon confusion'
  },
  
  // Destructuring assignment fixes
  {
    pattern: /const\s*\{\s*(\w+):\s*(\w+);\s*(\w+)\s*\}\s*=\s*data;/g,
    replacement: 'const { $1, $2, $3 } = data;',
    description: 'Fix destructuring with colon/semicolon confusion'
  },
  
  // Object property fixes
  {
    pattern: /content:\s*response;/g,
    replacement: 'content: response,',
    description: 'Fix object property semicolon to comma'
  },
  
  // Function parameter fixes  
  {
    pattern: /(\w+):\s*(\w+);\s*(\w+),/g,
    replacement: '$1, $2, $3,',
    description: 'Fix function parameter syntax'
  },
  
  // Method call parameter fixes
  {
    pattern: /leagueId:\s*teamId;\s*pickNumber,/g,
    replacement: 'leagueId, teamId, pickNumber,',
    description: 'Fix method call parameters'
  },
  
  // More destructuring fixes
  {
    pattern: /const\s*\{\s*playerId:\s*injuryType;\s*initialSeverity,\s*source\s*\}\s*=\s*data;/g,
    replacement: 'const { playerId, injuryType, initialSeverity, source } = data;',
    description: 'Fix playerId destructuring'
  },
  
  // Fix validation schema imports
  {
    pattern: /validateQueryParams:\s*validateRequestBody;\s*createValidationErrorResponse:\s*hasValidationErrors;\s*idSchema,/g,
    replacement: 'validateQueryParams, validateRequestBody, createValidationErrorResponse, hasValidationErrors, idSchema,',
    description: 'Fix validation imports'
  },
  
  // Fix type literal syntax
  {
    pattern: /type:\s*'z'\.literal\('record_outcome'\),/g,
    replacement: "type: z.literal('record_outcome'),",
    description: 'Fix type literal syntax'
  },
  
  // Fix query destructuring
  {
    pattern: /const\s*\{\s*playerId:\s*week;\s*weekNum,\s*enhanced\s*\}\s*=/g,
    replacement: 'const { playerId, week: weekNum, enhanced } =',
    description: 'Fix query destructuring with renaming'
  },
  
  // Fix data destructuring with renaming
  {
    pattern: /const\s*\{\s*predictionId:\s*season;\s*predictedPoints:\s*actualPoints;\s*factors,\s*modelWeights\s*\}\s*=\s*body;/g,
    replacement: 'const { predictionId, playerId, week, season, predictedPoints, actualPoints, factors, modelWeights } = body;',
    description: 'Fix prediction outcome destructuring'
  },
  
  // Fix response object syntax
  {
    pattern: /success:\s*true,\s*data:\s*prediction:\s*enhanced;/g,
    replacement: 'success: true,\n      data: prediction,\n      enhanced,',
    description: 'Fix response object with data and enhanced'
  },
  
  // Fix method call syntax
  {
    pattern: /predictionId:\s*playerId;\s*week:\s*season;\s*predictedPoints:\s*actualPoints;/g,
    replacement: 'predictionId, playerId, week, season, predictedPoints, actualPoints,',
    description: 'Fix method parameters'
  },
  
  // Fix JSON.stringify malformed objects
  {
    pattern: /JSON\.stringify\(([^|]+)\s*\|\|\s*\{\,/g,
    replacement: 'JSON.stringify($1 || {',
    description: 'Fix JSON.stringify with malformed default objects'
  },
  
  // Fix malformed object literals
  {
    pattern: /\{\,\s*(\w+):/g,
    replacement: '{\n        $1:',
    description: 'Fix malformed object literals with leading comma'
  },
  
  // Fix trailing semicolons in object properties
  {
    pattern: /(\w+):\s*([^,};]+);(?=\s*[},])/g,
    replacement: '$1: $2,',
    description: 'Fix trailing semicolons in object properties'
  },
  
  // Fix specific destructuring patterns from error messages
  {
    pattern: /const\s*\{\s*playerIds:\s*customWeek;\s*positions\s*\}\s*=\s*data;/g,
    replacement: 'const { playerIds, customWeek, positions } = data;',
    description: 'Fix custom analysis destructuring'
  }
];

// Function to fix a single file
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    const originalContent = content;
    
    // Apply all fix patterns
    fixes.forEach(fix => {
      const beforeFix = content;
      content = content.replace(fix.pattern, fix.replacement);
      if (content !== beforeFix) {
        hasChanges = true;
        console.log(`  ✓ Applied: ${fix.description}`);
      }
    });
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Get all TypeScript files
const tsFiles = glob.sync('src/**/*.ts', {
  ignore: [
    'node_modules/**',
    'dist/**', 
    'build/**',
    '**/*.d.ts',
    '**/*.test.ts',
    '**/*.spec.ts'
  ]
});

console.log(`📁 Found ${tsFiles.length} TypeScript files to check...\n`);

let totalFixed = 0;
const fixedFiles = [];

// Process all files
tsFiles.forEach(file => {
  console.log(`🔍 Checking: ${file}`);
  if (fixFile(path.resolve(file))) {
    totalFixed++;
    fixedFiles.push(file);
    console.log(`✅ Fixed: ${file}`);
  }
});

console.log('\n' + '='.repeat(60));
console.log(`📊 Complete Fix Summary:`);
console.log(`   Files checked: ${tsFiles.length}`);
console.log(`   Files fixed: ${totalFixed}`);
console.log(`   Fix patterns applied: ${fixes.length}`);

if (fixedFiles.length > 0) {
  console.log('\n📝 Fixed files:');
  fixedFiles.forEach(file => console.log(`   - ${file}`));
}

console.log('\n🎯 Testing specific problematic files...');

// Test the specific files mentioned in error
const problematicFiles = [
  'src/app/api/admin/audit-logs/route.ts',
  'src/app/api/ai/breakouts/route.ts', 
  'src/app/api/ai/chat/route.ts',
  'src/app/api/ai/draft/route.ts',
  'src/app/api/ai/injuries/route.ts'
];

problematicFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const issues = [];
    
    // Check for specific patterns that cause errors
    if (content.includes('adminValidationMiddleware:')) issues.push('import colon syntax');
    if (content.includes('playerIds: customWeek;')) issues.push('destructuring colon syntax');
    if (content.includes('content: response;')) issues.push('object property semicolon');
    if (content.includes('leagueId: teamId;')) issues.push('parameter colon syntax');
    if (content.includes('playerId: injuryType;')) issues.push('destructuring colon syntax');
    
    if (issues.length === 0) {
      console.log(`✅ ${file} - appears clean`);
    } else {
      console.log(`⚠️  ${file} - remaining issues: ${issues.join(', ')}`);
    }
  } else {
    console.log(`❌ ${file} - file not found`);
  }
});

console.log('\n✨ All remaining syntax fix completed!');