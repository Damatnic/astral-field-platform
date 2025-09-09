const fs = require('fs');
const path = require('path');

// Final targeted fixes for remaining syntax errors
const fixes = [
  // Fix "method, 'POST'" -> "method: 'POST'" in fetch calls
  { pattern: /method,\s*'(POST|GET|PUT|DELETE|PATCH)'/g, replacement: "method: '$1'" },
  
  // Fix "type, "value"" -> "type: "value"" in object literals
  { pattern: /type,\s*"([^"]+)"/g, replacement: 'type: "$1"' },
  
  // Fix "property, z.something()" -> "property: z.something()" in Zod schemas
  { pattern: /(\w+),\s*(z\.\w+\([^)]*\))/g, replacement: '$1: $2' },
  
  // Fix "blockingRate, calculation" -> "blockingRate: calculation"
  { pattern: /blockingRate,\s*([^,\n}]+)/g, replacement: 'blockingRate: $1' },
  
  // Fix "Content-Type, 'application/json'" -> "'Content-Type': 'application/json'"
  { pattern: /'Content-Type',\s*'([^']+)'/g, replacement: "'Content-Type': '$1'" },
  
  // Fix any remaining "property, value" patterns in object literals
  { pattern: /{\s*([a-zA-Z_]\w*),\s*([^,}]+)/g, replacement: '{ $1: $2' },
  
  // Fix severity schema pattern specifically
  { pattern: /severity,\s*(z\.enum\([^)]+\))/g, replacement: 'severity: $1' }
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
        console.log(`Fixed ${fileChanges} issues in ${path.relative(process.cwd(), filePath)}`);
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

console.log('🔧 Running final syntax fix...');
const srcPath = path.join(process.cwd(), 'src');
const results = processDirectory(srcPath);

console.log(`\n✅ Final syntax fix complete!`);
console.log(`📊 Applied ${results.totalChanges} fixes across ${results.filesChanged} files`);

console.log('\n🎯 Targeted patterns fixed:');
console.log('- method, "POST" -> method: "POST"');
console.log('- type, "value" -> type: "value"');  
console.log('- property, z.enum() -> property: z.enum()');
console.log('- blockingRate, calculation -> blockingRate: calculation');
console.log('- Content-Type, "value" -> "Content-Type": "value"');