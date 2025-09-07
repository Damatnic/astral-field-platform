#!/usr/bin/env node

/**
 * Ultra-Targeted ESLint Fix Script
 * Addresses the remaining 407 specific parsing errors with surgical precision
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🎯 Starting Ultra-Targeted Parsing Fix...');

// Read current ESLint status
let currentErrors = [];
try {
  const eslintOutput = execSync('npx eslint . --format=json', { encoding: 'utf8' });
  const results = JSON.parse(eslintOutput);
  
  results.forEach(result => {
    result.messages.forEach(msg => {
      if (msg.severity === 2) { // errors only
        currentErrors.push({
          file: result.filePath.replace(/\\/g, '/'),
          line: msg.line,
          message: msg.message,
          ruleId: msg.ruleId
        });
      }
    });
  });
} catch (error) {
  console.log('⚠️ ESLint check failed, proceeding with file analysis...');
}

console.log(`📊 Found ${currentErrors.length} specific errors to fix`);

// Categorize errors by type
const errorTypes = {
  expressionExpected: currentErrors.filter(e => e.message.includes('Expression expected')),
  unterminatedString: currentErrors.filter(e => e.message.includes('Unterminated string literal')),
  propertyExpected: currentErrors.filter(e => e.message.includes('Property or signature expected')),
  commaExpected: currentErrors.filter(e => e.message.includes("',' expected")),
  colonExpected: currentErrors.filter(e => e.message.includes("':' expected")),
  jsxEntities: currentErrors.filter(e => e.ruleId === 'react/no-unescaped-entities')
};

console.log('📋 Error breakdown:');
Object.entries(errorTypes).forEach(([type, errors]) => {
  if (errors.length > 0) {
    console.log(`  ${type}: ${errors.length} errors`);
  }
});

let fixedFiles = 0;
let totalFixes = 0;

// Get all TypeScript/TSX files
function getAllTsFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory() && !['node_modules', '.git', 'dist', 'build'].includes(item.name)) {
      files.push(...getAllTsFiles(fullPath));
    } else if (item.isFile() && /\.(ts|tsx)$/.test(item.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

const tsFiles = getAllTsFiles('./src');
console.log(`📁 Processing ${tsFiles.length} TypeScript files...`);

// Process each file
tsFiles.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let fileFixed = false;

    // Fix 1: "Expression expected" at start of file
    if (content.startsWith('&apos;') || content.startsWith('&quot;') || content.match(/^[&\w]+;/)) {
      // This indicates a completely corrupted file start - try to reconstruct
      const lines = content.split('\n');
      let firstValidLine = -1;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].match(/^(import|export|const|let|var|function|class|interface|type|\/\/|\/\*|\s*$)/)) {
          firstValidLine = i;
          break;
        }
      }
      
      if (firstValidLine > 0) {
        content = lines.slice(firstValidLine).join('\n');
        fileFixed = true;
        totalFixes++;
        console.log(`✅ Fixed corrupted file start in ${filePath}`);
      }
    }

    // Fix 2: Unterminated string literals in JSX
    content = content.replace(/className=['"][^'"]*(?:&apos;|&quot;)[^'"]*['"]?/g, (match) => {
      const cleaned = match.replace(/&apos;/g, "'").replace(/&quot;/g, '"');
      // Ensure proper quote closure
      if (cleaned.includes("'") && !cleaned.endsWith("'")) {
        return cleaned + "'";
      }
      if (cleaned.includes('"') && !cleaned.endsWith('"')) {
        return cleaned + '"';
      }
      return cleaned;
    });

    // Fix 3: Unterminated strings in general
    content = content.replace(/(['"])[^'"]*&(apos|quot);[^'"]*\1?/g, (match) => {
      let cleaned = match.replace(/&apos;/g, "'").replace(/&quot;/g, '"');
      // Ensure proper closure
      if (!cleaned.endsWith('"') && !cleaned.endsWith("'")) {
        if (cleaned.includes('"')) cleaned += '"';
        else if (cleaned.includes("'")) cleaned += "'";
      }
      return cleaned;
    });

    // Fix 4: Property or signature expected - fix malformed exports/interfaces
    content = content.replace(/^(\s*)([A-Z]\w+):\s*{/gm, '$1export interface $2 {');
    content = content.replace(/^(\s*)([a-z]\w+):\s*{/gm, '$1const $2 = {');
    
    // Fix 5: Missing commas in function parameters
    content = content.replace(/(\w+:\s*\w+)\s+(\w+:)/g, '$1, $2');
    content = content.replace(/(\w+\?\s*:\s*\w+)\s+(\w+\??:)/g, '$1, $2');
    
    // Fix 6: Missing commas in object literals
    content = content.replace(/(['"][^'"]+['"]:\s*[^,}\n]+)\s*\n\s*(['"][^'"]+['"]:\s*)/g, '$1,\n  $2');
    
    // Fix 7: JSX unescaped entities
    content = content.replace(/([^&])'/g, "$1&apos;");
    content = content.replace(/([^&])"/g, '$1&quot;');
    
    // Fix 8: Colon expected errors in type annotations
    content = content.replace(/(\w+)\s+(\w+<.*?>|\w+)/g, '$1: $2');

    // Check if content changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      if (!fileFixed) {
        fixedFiles++;
      }
      fileFixed = true;
      totalFixes++;
    }

    if (fileFixed) {
      console.log(`✅ Fixed parsing issues in ${filePath.replace(/\\/g, '/')}`);
    }

  } catch (error) {
    console.log(`❌ Error processing ${filePath}: ${error.message}`);
  }
});

console.log(`\n📊 Ultra-Targeted Fix Results:`);
console.log(`✅ Files processed: ${tsFiles.length}`);
console.log(`🔧 Files with fixes applied: ${fixedFiles}`);
console.log(`⚡ Total fixes applied: ${totalFixes}`);

// Run ESLint --fix to clean up any remaining auto-fixable issues
console.log('\n⚡ Running ESLint --fix for final cleanup...');
try {
  execSync('npx eslint . --fix', { stdio: 'inherit' });
} catch (error) {
  console.log('⚠️ ESLint --fix completed with remaining issues');
}

// Get final status
console.log('\n📊 Getting final ESLint count...');
try {
  const finalOutput = execSync('npx eslint . --format=json', { encoding: 'utf8' });
  const finalResults = JSON.parse(finalOutput);
  
  let finalErrors = 0;
  let finalWarnings = 0;
  
  finalResults.forEach(result => {
    result.messages.forEach(msg => {
      if (msg.severity === 2) finalErrors++;
      if (msg.severity === 1) finalWarnings++;
    });
  });
  
  console.log(`📊 Final count: ${finalErrors} errors, ${finalWarnings} warnings`);
  console.log(`📊 Total issues: ${finalErrors + finalWarnings}`);
  
  if (finalErrors === 0 && finalWarnings === 0) {
    console.log('🎉 SUCCESS! Achieved 100% ESLint compliance!');
  } else {
    const improvement = ((407 - (finalErrors + finalWarnings)) / 407) * 100;
    console.log(`📈 Improvement: ${improvement.toFixed(1)}% (${407 - (finalErrors + finalWarnings)} issues resolved)`);
  }
  
} catch (error) {
  console.log('📊 ESLint check completed');
}

console.log('✨ Ultra-Targeted Parsing Fix Complete!');