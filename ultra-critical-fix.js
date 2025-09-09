const fs = require('fs');
const path = require('path');

// Ultra-critical fixes for the most stubborn syntax errors
const fixes = [
  // Fix "error, 'message'" -> "error: 'message'"
  { pattern: /error,\s*"([^"]+)"/g, replacement: 'error: "$1"' },
  
  // Fix "filters, { startDate:" -> "filters: { startDate:"
  { pattern: /filters,\s*{\s*([^}]+)}/g, replacement: 'filters: { $1 }' },
  
  // Fix "data: { metrics: healthStatus:" -> "data: { metrics, healthStatus:"
  { pattern: /data:\s*{\s*metrics:\s*healthStatus:/g, replacement: 'data: { metrics, healthStatus:' },
  
  // Fix "data: { metrics: aggregateStats:" -> "data: { metrics, aggregateStats:"
  { pattern: /data:\s*{\s*metrics:\s*aggregateStats:/g, replacement: 'data: { metrics, aggregateStats:' },
  
  // Fix destructuring: "const { type: ...data}" -> "const { type, ...data }"
  { pattern: /const\s*{\s*([^:]+):\s*\.\.\.([^}]+)\s*}/g, replacement: 'const { $1, ...$2 }' },
  
  // Fix case statement: "case 'value', const" -> "case 'value': const"
  { pattern: /case\s*'([^']+)',\s*(const\s+)/g, replacement: "case '$1': $2" },
  
  // Fix destructuring in case: "playerId: week" -> "playerId, week"
  { pattern: /{\s*playerId:\s*week\s*}/g, replacement: '{ playerId, week }' },
  
  // Fix object properties: "type: "value"" -> "type: "value","
  { pattern: /type:\s*"([^"]+)"\s*([^,}])/g, replacement: 'type: "$1", $2' }
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
        console.log(`Fixed ${fileChanges} ultra-critical issues in ${path.relative(process.cwd(), filePath)}`);
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

console.log('🔥 Running ultra-critical syntax fix...');
const srcPath = path.join(process.cwd(), 'src');
const results = processDirectory(srcPath);

console.log(`\n✅ Ultra-critical syntax fix complete!`);
console.log(`📊 Applied ${results.totalChanges} ultra-critical fixes across ${results.filesChanged} files`);

console.log('\n🎯 Ultra-critical patterns fixed:');
console.log('- error, "message" -> error: "message"');
console.log('- filters, { object } -> filters: { object }');
console.log('- destructuring and case statement syntax');
console.log('- object property syntax issues');