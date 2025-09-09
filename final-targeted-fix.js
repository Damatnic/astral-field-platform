#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Starting final targeted fixes for remaining issues...');

// Very specific fixes for remaining problematic patterns
const fixes = [
  // Fix "error, 'message'" patterns -> "error: 'message'"
  { pattern: /{\s*error,\s*'/g, replacement: '{ error: \'' },
  
  // Fix "status, 'value'" patterns -> "status: 'value'"
  { pattern: /{\s*status,\s*'/g, replacement: '{ status: \'' },
  
  // Fix "service, 'value'" patterns -> "service: 'value'"
  { pattern: /{\s*service,\s*'/g, replacement: '{ service: \'' },
  
  // Fix ternary operator patterns "? sortBy , 'default'" -> "? sortBy : 'default'"
  { pattern: /\?\s*(\w+)\s*,\s*'/g, replacement: '? $1 : \'' },
  
  // Fix object destructuring "{ categoryId: isPinned =" -> "{ categoryId, isPinned ="
  { pattern: /{([^}]+):\s*([^=]+)=/g, replacement: '{ $1, $2 =' },
  
  // Fix "hasNextPag, e:" -> "hasNextPage:"
  { pattern: /hasNextPag,\s*e:/g, replacement: 'hasNextPage:' },
  
  // Fix console.error patterns with comma
  { pattern: /console\.error\('([^']+)',\s*'/g, replacement: 'console.error(\'$1:\', ' },
  
  // Fix "postgresql:// " with space -> "postgresql://"
  { pattern: /postgresql:\/\/\s+/g, replacement: 'postgresql://' },
  
  // Fix object property "pick: nextPick" -> "pick,"
  { pattern: /pick:\s*nextPick,/g, replacement: 'pick,' },
  
  // Fix "error instanceof Error ?" patterns
  { pattern: /error\s+instanceof\s+Error\s+\?\s*error\.message:\s*/g, replacement: 'error instanceof Error ? error.message : ' },
];

function applyFixes(content, filePath) {
  let fixedContent = content;
  let totalFixes = 0;
  
  for (const fix of fixes) {
    const matches = fixedContent.match(fix.pattern);
    if (matches) {
      console.log(`  📝 Fixing ${matches.length} instances in ${path.relative(process.cwd(), filePath)}`);
      fixedContent = fixedContent.replace(fix.pattern, fix.replacement);
      totalFixes += matches.length;
    }
  }
  
  return { content: fixedContent, fixes: totalFixes };
}

function processFiles(directory) {
  let totalFiles = 0;
  let totalFixes = 0;
  
  function processDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        processDirectory(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        try {
          const originalContent = fs.readFileSync(fullPath, 'utf8');
          const { content: fixedContent, fixes } = applyFixes(originalContent, fullPath);
          
          if (fixes > 0) {
            fs.writeFileSync(fullPath, fixedContent, 'utf8');
            console.log(`  ✅ Applied ${fixes} final fixes in ${path.relative(process.cwd(), fullPath)}`);
            totalFiles++;
            totalFixes += fixes;
          }
        } catch (error) {
          console.log(`  ⚠️  Error processing ${fullPath}: ${error.message}`);
        }
      }
    }
  }
  
  processDirectory(directory);
  return { totalFiles, totalFixes };
}

// Process the src directory
const { totalFiles, totalFixes } = processFiles('./src');

console.log(`\n🎯 Final targeted fix completed:`);
console.log(`   📁 Files modified: ${totalFiles}`);
console.log(`   🔧 Total fixes applied: ${totalFixes}`);
console.log(`\n✨ Build should now be error-free!`);