const fs = require('fs');
const path = require('path');

// Final fix for timestamp syntax issues
const fixes = [
  // Fix "timestamp, new Date()" -> "timestamp: new Date()"
  { pattern: /timestamp,\s*new\s+Date\(\)/g, replacement: 'timestamp: new Date()' },
  
  // Fix "marketInefficiencies, customReport.market" -> "marketInefficiencies: customReport.market"
  { pattern: /marketInefficiencies,\s*(customReport\.marketInefficiencies)/g, replacement: 'marketInefficiencies: $1' },
  
  // Fix "requestedPlayerIds, playerIds" -> "requestedPlayerIds: playerIds"
  { pattern: /requestedPlayerIds,\s*playerIds/g, replacement: 'requestedPlayerIds: playerIds' }
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
        console.log(`Fixed ${fileChanges} timestamp issues in ${path.relative(process.cwd(), filePath)}`);
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

console.log('⚡ Running final timestamp fix...');
const srcPath = path.join(process.cwd(), 'src');
const results = processDirectory(srcPath);

console.log(`\n✅ Final timestamp fix complete!`);
console.log(`📊 Applied ${results.totalChanges} timestamp fixes across ${results.filesChanged} files`);

console.log('\n🎯 Final patterns fixed:');
console.log('- timestamp, new Date() -> timestamp: new Date()');
console.log('- marketInefficiencies, custom -> marketInefficiencies: custom');
console.log('- requestedPlayerIds, playerIds -> requestedPlayerIds: playerIds');