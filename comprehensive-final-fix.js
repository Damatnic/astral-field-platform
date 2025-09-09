const fs = require('fs');
const path = require('path');

// Comprehensive final fix for all remaining patterns
const fixes = [
  // Fix "status, 'value'" -> "status: 'value'"
  { pattern: /status,\s*'([^']+)'/g, replacement: "status: '$1'" },
  
  // Fix "failureReason, 'text'" -> "failureReason: 'text'"
  { pattern: /failureReason,\s*'([^']+)'/g, replacement: "failureReason: '$1'" },
  
  // Fix "lastUpdated, new Date()" -> "lastUpdated: new Date()"
  { pattern: /lastUpdated,\s*new\s+Date\(\)/g, replacement: 'lastUpdated: new Date()' },
  
  // Fix "error, `template`" -> "error: `template`"
  { pattern: /error,\s*`([^`]+)`/g, replacement: "error: `$1`" },
  
  // Fix ternary operator: "? value + 'text' , other" -> "? value + 'text' : other"
  { pattern: /\?\s*([^,]+)\s*,\s*([^}]+)}/g, replacement: '? $1 : $2}' },
  
  // Fix variable conflicts by renaming duplicates
  { pattern: /const\s*{\s*leagueId:\s*customLeagueId,\s*teamId,\s*customTeamId/g, replacement: 'const { leagueId: customLeagueId, teamId: customTeamId' },
  
  // Fix destructuring: remove teamId from conflicts
  { pattern: /(const\s*{\s*[^}]*),\s*teamId,\s*(customTeamId[^}]*})/g, replacement: '$1, $2' },
  
  // Fix "Math.round(value) + "ms" , value" -> "Math.round(value) + "ms" : value"
  { pattern: /Math\.round\(([^)]+)\)\s*\+\s*"ms"\s*,\s*([^}]+)}/g, replacement: 'Math.round($1) + "ms" : $2}' }
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
        console.log(`Fixed ${fileChanges} comprehensive issues in ${path.relative(process.cwd(), filePath)}`);
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

console.log('🎯 Running comprehensive final fix...');
const srcPath = path.join(process.cwd(), 'src');
const results = processDirectory(srcPath);

console.log(`\n✅ Comprehensive final fix complete!`);
console.log(`📊 Applied ${results.totalChanges} comprehensive fixes across ${results.filesChanged} files`);

console.log('\n🎯 Comprehensive patterns fixed:');
console.log('- status, "value" -> status: "value"');
console.log('- failureReason, "text" -> failureReason: "text"');
console.log('- lastUpdated, new Date() -> lastUpdated: new Date()');
console.log('- error, `template` -> error: `template`');
console.log('- ternary operator fixes');
console.log('- variable conflict resolution');
console.log('- template literal and complex expression fixes');