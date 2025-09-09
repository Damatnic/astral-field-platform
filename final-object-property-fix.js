const fs = require('fs');
const path = require('path');

// Final targeted fix for remaining object property syntax errors
const fixes = [
  // Fix "news, true" -> "news: true"  
  { pattern: /news,\s*\n\s*true(?=\s*[,}])/g, replacement: 'news: true' },
  
  // Fix regex method calls: ".replace(/pattern/g: '')" -> ".replace(/pattern/g, '')"
  { pattern: /\.replace\(([^)]+):\s*([^)]+)\)/g, replacement: '.replace($1, $2)' },
  
  // Fix object literal formatting: "error: ... , { status: 500" -> "error: ... }, { status: 500"
  { pattern: /error:\s*([^,}]+)\s*,\s*{\s*status:\s*(\d+)\s*}/g, replacement: 'error: $1 }, { status: $2' },
  
  // Fix position syntax: "position, 3" -> "position: 3"  
  { pattern: /position,\s*(\d+)/g, replacement: 'position: $1' },
  
  // Fix array parameter: "[leagueId: 'value']" -> "[leagueId, 'value']"
  { pattern: /\[(\w+):\s*'([^']+)'\]/g, replacement: "[$1, '$2']" },
  
  // Fix ternary in error messages: "? error.message: 'text'" -> "? error.message : 'text'"
  { pattern: /\?\s*error\.message:\s*"([^"]+)"/g, replacement: '? error.message : "$1"' },
  
  // Fix SQL conflict syntax: "ON CONFLICT(slug): DO" -> "ON CONFLICT(slug) DO"
  { pattern: /ON\s+CONFLICT\(([^)]+)\):\s*DO/gi, replacement: 'ON CONFLICT($1) DO' }
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
        console.log(`Fixed ${fileChanges} final property issues in ${path.relative(process.cwd(), filePath)}`);
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

console.log('🔧 Running final object property fix...');
const srcPath = path.join(process.cwd(), 'src');
const results = processDirectory(srcPath);

console.log(`\n✅ Final object property fix complete!`);
console.log(`📊 Applied ${results.totalChanges} final fixes across ${results.filesChanged} files`);

console.log('\n🎯 Final patterns fixed:');
console.log('- news, true -> news: true');
console.log('- .replace(pattern: value) -> .replace(pattern, value)'); 
console.log('- Object literal formatting fixes');
console.log('- position, number -> position: number');
console.log('- Array parameter syntax fixes');
console.log('- SQL CONFLICT syntax fixes');