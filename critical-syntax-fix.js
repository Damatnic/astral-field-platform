const fs = require('fs');
const path = require('path');

// Critical targeted fixes for remaining syntax errors
const fixes = [
  // Fix import statements: "NextRequest: NextResponse" -> "NextRequest, NextResponse"
  { pattern: /import\s*{\s*NextRequest:\s*NextResponse\s*}/g, replacement: 'import { NextRequest, NextResponse }' },
  
  // Fix ternary operator: "condition , 'value'" -> "condition : 'value'"
  { pattern: /\?\s*'([^']+)'\s*,\s*'([^']+)'/g, replacement: "? '$1' : '$2'" },
  { pattern: /\?\s*"([^"]+)"\s*,\s*"([^"]+)"/g, replacement: '? "$1" : "$2"' },
  
  // Fix "Content-Type", "value" -> "'Content-Type': 'value'"
  { pattern: /{\s*"Content-Type",\s*"([^"]+)"\s*}/g, replacement: '{ "Content-Type": "$1" }' },
  
  // Fix object destructuring: "const { email: password }" -> "const { email, password }"
  { pattern: /const\s*{\s*email:\s*password\s*}/g, replacement: 'const { email, password }' },
  
  // Fix malformed JSON: "forc: e:true" -> "force: true"
  { pattern: /forc:\s*e:\s*true/g, replacement: 'force: true' },
  
  // Fix broken imports with colons: "import: something" -> "import something"
  { pattern: /import\s*{\s*(\w+):\s*(\w+),/g, replacement: 'import { $1, $2,' },
  
  // Fix object property: "database: { status: details:" -> "database: { status, details:"
  { pattern: /database:\s*{\s*status:\s*details:/g, replacement: 'database: { status, details:' },
  
  // Fix ternary in template literals: "condition , 'value'" -> "condition : 'value'"
  { pattern: /\?\s*'([^']+)'\s*,\s*'([^']+)'\s*}/g, replacement: "? '$1' : '$2' }" }
];

function processDirectory(dirPath) {
  let totalChanges = 0;
  let filesChanged = 0;
  
  function processFile(filePath) {
    if (!filePath.match(/\.(ts|tsx|js|jsx)$/)) return;
    
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let originalContent = content;
      let fileChanges = 0;
      
      fixes.forEach(fix => {
        const matches = content.match(fix.pattern);
        if (matches) {
          content = content.replace(fix.pattern, fix.replacement);
          fileChanges += matches.length;
        }
      });
      
      if (fileChanges > 0) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed ${fileChanges} critical issues in ${path.relative(process.cwd(), filePath)}`);
        totalChanges += fileChanges;
        filesChanged++;
      }
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error.message);
    }
  }
  
  function walkDirectory(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !['node_modules', '.git', '.next'].includes(item)) {
        walkDirectory(fullPath);
      } else if (stat.isFile()) {
        processFile(fullPath);
      }
    }
  }
  
  walkDirectory(dirPath);
  return { totalChanges, filesChanged };
}

console.log('🚨 Running critical syntax fix...');
const srcPath = path.join(process.cwd(), 'src');
const results = processDirectory(srcPath);

console.log(`\n✅ Critical syntax fix complete!`);
console.log(`📊 Applied ${results.totalChanges} critical fixes across ${results.filesChanged} files`);

console.log('\n🎯 Critical patterns fixed:');
console.log('- NextRequest: NextResponse -> NextRequest, NextResponse');
console.log('- condition , "value" -> condition : "value"'); 
console.log('- "Content-Type", "value" -> "Content-Type": "value"');
console.log('- forc: e:true -> force: true');
console.log('- malformed imports and object properties');