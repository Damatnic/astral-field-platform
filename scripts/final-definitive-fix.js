#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔥 Final Definitive ESLint Fix - Targeting Remaining 424 Issues...');

// Function to fix corrupted TypeScript/JavaScript files
function fixCorruptedFile(filePath, content) {
  let fixed = content;
  let hasChanges = false;

  // Fix HTML entities in imports and strings
  const htmlEntityFixes = [
    { find: /&apos;/g, replace: "'" },
    { find: /&quot;/g, replace: '"' },
    { find: /&amp;/g, replace: '&' },
    { find: /&lt;/g, replace: '<' },
    { find: /&gt;/g, replace: '>' },
  ];

  htmlEntityFixes.forEach(fix => {
    if (fix.find.test(fixed)) {
      fixed = fixed.replace(fix.find, fix.replace);
      hasChanges = true;
    }
  });

  // Fix malformed TypeScript syntax patterns
  const syntaxFixes = [
    // Fix "const:" -> "const"
    { find: /\bconst:\s*/g, replace: 'const ' },
    // Fix "function:" -> "function"
    { find: /\bfunction:\s*/g, replace: 'function ' },
    // Fix "return:" -> "return"
    { find: /\breturn:\s*/g, replace: 'return ' },
    // Fix "export:" -> "export"
    { find: /\bexport:\s*/g, replace: 'export ' },
    // Fix "import:" -> "import"
    { find: /\bimport:\s*/g, replace: 'import ' },
    // Fix "new:" -> "new"
    { find: /\bnew:\s*/g, replace: 'new ' },
    // Fix "if:" -> "if"
    { find: /\bif:\s*/g, replace: 'if ' },
    // Fix "else:" -> "else"
    { find: /\belse:\s*/g, replace: 'else ' },
    // Fix "async:" -> "async"
    { find: /\basync:\s*/g, replace: 'async ' },
    // Fix "await:" -> "await"
    { find: /\bawait:\s*/g, replace: 'await ' },
    // Fix "let:" -> "let"
    { find: /\blet:\s*/g, replace: 'let ' },
    // Fix "var:" -> "var"
    { find: /\bvar:\s*/g, replace: 'var ' },
    // Fix "type:" -> "type"
    { find: /\btype:\s*/g, replace: 'type ' },
    // Fix "interface:" -> "interface"
    { find: /\binterface:\s*/g, replace: 'interface ' },
    // Fix "class:" -> "class"
    { find: /\bclass:\s*/g, replace: 'class ' },
  ];

  syntaxFixes.forEach(fix => {
    if (fix.find.test(fixed)) {
      fixed = fixed.replace(fix.find, fix.replace);
      hasChanges = true;
    }
  });

  // Fix object/array syntax issues
  const objectFixes = [
    // Fix missing commas in objects: "success: truedata:" -> "success: true, data:"
    { find: /success:\s*true\s*data:/g, replace: 'success: true, data:' },
    { find: /success:\s*false\s*data:/g, replace: 'success: false, data:' },
    // Fix malformed object properties: "total: logs.lengthfilters:" -> "total: logs.length, filters:"
    { find: /total:\s*(\w+)\.length\s*filters:/g, replace: 'total: $1.length, filters:' },
    { find: /total:\s*(\w+)\.length\s*userId,/g, replace: 'total: $1.length, userId,' },
    // Fix malformed message syntax: "message: `Cleaned: up ${deletedCount} old: audit log: entries`," -> "message: `Cleaned up ${deletedCount} old audit log entries`,"
    { find: /message:\s*`([^`]+):\s*([^`]+):\s*([^`]+):\s*([^`]+):\s*([^`]+)`,/g, replace: 'message: `$1 $2 $3 $4 $5`,' },
    // Fix export data issues: "export: const _data" -> "data:"
    { find: /export:\s*const\s*_data\s*=/g, replace: 'data:' },
  ];

  objectFixes.forEach(fix => {
    if (fix.find.test(fixed)) {
      fixed = fixed.replace(fix.find, fix.replace);
      hasChanges = true;
    }
  });

  // Fix control flow issues
  const controlFlowFixes = [
    // Fix malformed if statements: "check: if (!isAdmin(request)) {" -> "if (!isAdmin(request)) {"
    { find: /check:\s*if\s*\(/g, replace: 'if (' },
    // Fix other control flow patterns
    { find: /switch\s*\(/g, replace: 'switch (' },
    { find: /while\s*\(/g, replace: 'while (' },
    { find: /for\s*\(/g, replace: 'for (' },
  ];

  controlFlowFixes.forEach(fix => {
    if (fix.find.test(fixed)) {
      fixed = fixed.replace(fix.find, fix.replace);
      hasChanges = true;
    }
  });

  // Fix import/export patterns
  const importExportFixes = [
    // Fix function parameters with colons: "function isAdmin(request: NextRequest): boolean {" should not be "function: isAdmin..."
    // This is handled by the generic syntax fixes above
    
    // Fix malformed export statements
    { find: /export:\s*(async\s+)?function/g, replace: 'export $1function' },
  ];

  importExportFixes.forEach(fix => {
    if (fix.find.test(fixed)) {
      fixed = fixed.replace(fix.find, fix.replace);
      hasChanges = true;
    }
  });

  // Fix console.log patterns: "console.error(&apos;Audit: logs API: error: &apos;error);" -> "console.error('Audit logs API error:', error);"
  const consoleFixes = [
    { find: /console\.(log|error|warn|info)\s*\(\s*(['"`])([^'"]+):\s*([^'"]+):\s*(['"`])\s*([^)]+)\)/g, replace: "console.$1($2$3 $4$5, $6)" },
  ];

  consoleFixes.forEach(fix => {
    if (fix.find.test(fixed)) {
      fixed = fixed.replace(fix.find, fix.replace);
      hasChanges = true;
    }
  });

  // Fix type annotations that got corrupted: "type as: AuditEventType" -> "type as AuditEventType"
  const typeFixes = [
    { find: /\bas:\s+/g, replace: 'as ' },
    { find: /type\s+as:\s*/g, replace: 'type as ' },
  ];

  typeFixes.forEach(fix => {
    if (fix.find.test(fixed)) {
      fixed = fixed.replace(fix.find, fix.replace);
      hasChanges = true;
    }
  });

  return { content: fixed, hasChanges };
}

// Get all TypeScript/JavaScript files from src directory
function getAllTSFiles() {
  const files = [];
  
  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else if (item.match(/\.(ts|tsx|js|jsx)$/)) {
        files.push(fullPath);
      }
    }
  }
  
  scanDir('src');
  return files;
}

// Main execution
async function main() {
  const files = getAllTSFiles();
  console.log(`📁 Found ${files.length} TypeScript/JavaScript files`);

  let processedFiles = 0;
  let fixedFiles = 0;

  for (const filePath of files) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const result = fixCorruptedFile(filePath, content);
      
      if (result.hasChanges) {
        fs.writeFileSync(filePath, result.content, 'utf8');
        console.log(`✅ Fixed corruption in ${filePath}`);
        fixedFiles++;
      }
      
      processedFiles++;
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  }

  console.log(`\n📊 Processing Complete:`);
  console.log(`   • Processed: ${processedFiles} files`);
  console.log(`   • Fixed: ${fixedFiles} files`);

  // Run ESLint to check final status
  console.log('\n🔍 Running final ESLint check...');
  try {
    const { execSync } = require('child_process');
    const eslintOutput = execSync('npx eslint src --ext .ts,.tsx,.js,.jsx --format=compact', { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    console.log('✅ ESLint passed with no issues!');
  } catch (error) {
    // ESLint failed, show summary of remaining issues
    const output = error.stdout || error.stderr || '';
    const lines = output.split('\n').filter(line => line.trim());
    
    if (lines.length > 0) {
      // Count problems
      const errorLines = lines.filter(line => line.includes('error'));
      const warningLines = lines.filter(line => line.includes('warning'));
      
      console.log(`\n📊 Final ESLint Status:`);
      console.log(`   • Errors: ${errorLines.length}`);
      console.log(`   • Warnings: ${warningLines.length}`);
      console.log(`   • Total: ${errorLines.length + warningLines.length}`);
      
      if (errorLines.length + warningLines.length > 0) {
        console.log('\n🔍 Sample remaining issues:');
        lines.slice(0, 10).forEach(line => console.log(`   ${line}`));
        if (lines.length > 10) {
          console.log(`   ... and ${lines.length - 10} more issues`);
        }
      }
    } else {
      console.log('❌ ESLint check failed but no output captured');
    }
  }

  console.log('\n🎯 Final Definitive Fix Complete!');
}

main().catch(console.error);