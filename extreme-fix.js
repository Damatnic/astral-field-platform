const fs = require('fs');
const path = require('path');

// Extreme fixes for the most complex remaining syntax errors
const fixes = [
  // Fix function call with schema: "validateQueryParams(request: z.object" -> "validateQueryParams(request, z.object"
  { pattern: /validateQueryParams\(request:\s*/g, replacement: 'validateQueryParams(request, ' },
  
  // Fix object property: "data: { draftId: message," -> "data: { draftId, message:"
  { pattern: /data:\s*{\s*draftId:\s*message,\s*'/g, replacement: 'data: { draftId, message: \'' },
  
  // Fix object literal: "success, true," -> "success: true,"
  { pattern: /success,\s*true,/g, replacement: 'success: true,' },
  
  // Fix duplicate property: "position, position ||" -> "position: position ||"
  { pattern: /position,\s*position\s*\|\|/g, replacement: 'position: position ||' },
  
  // Fix message property: "message, 'text'" -> "message: 'text'"
  { pattern: /message,\s*'([^']+)'/g, replacement: "message: '$1'" },
  
  // Fix return object: "{ playerId: success:" -> "{ playerId, success:"
  { pattern: /{\s*playerId:\s*success:/g, replacement: '{ playerId, success:' },
  
  // Fix destructuring: "{ playerIds: week, batchWeek" -> "{ playerIds, week, batchWeek"
  { pattern: /{\s*playerIds:\s*week,\s*batchWeek/g, replacement: '{ playerIds, week, batchWeek' },
  
  // Fix timeframe property syntax
  { pattern: /timeframe\s*}\s*,\s*timestamp:/g, replacement: 'timeframe }, timestamp:' }
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
        console.log(`Fixed ${fileChanges} extreme issues in ${path.relative(process.cwd(), filePath)}`);
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

console.log('💥 Running extreme syntax fix...');
const srcPath = path.join(process.cwd(), 'src');
const results = processDirectory(srcPath);

console.log(`\n✅ Extreme syntax fix complete!`);
console.log(`📊 Applied ${results.totalChanges} extreme fixes across ${results.filesChanged} files`);

console.log('\n🎯 Extreme patterns fixed:');
console.log('- function parameter syntax issues');
console.log('- malformed object literal properties');
console.log('- destructuring assignment errors');
console.log('- complex property-value confusion');