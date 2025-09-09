const fs = require('fs');
const path = require('path');

function fixAllFiles() {
  const dirs = ['src/app/api', 'src/services', 'src/lib', 'src/components'];
  let totalFixed = 0;
  
  function fixFile(filePath) {
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;
    
    // Fix success: true: patterns
    content = content.replace(/success:\s*true:\s*/g, 'success: true,\n    ');
    
    // Fix data, patterns (should be data:)
    content = content.replace(/\bdata,\s+/g, 'data: ');
    
    // Fix message, patterns (should be message:)
    content = content.replace(/\bmessage,\s+/g, 'message: ');
    
    // Fix timestamp, patterns
    content = content.replace(/\btimestamp,\s+/g, 'timestamp: ');
    
    // Fix colon-semicolon confusion in object properties
    content = content.replace(/:\s*([a-zA-Z_][a-zA-Z0-9_]*);/g, ', $1,');
    
    // Fix patterns like "filters: {" at end of line
    content = content.replace(/:\s*filters:\s*{/g, ',\n        filters: {');
    
    // Fix patterns like "data, batchResults,"
    content = content.replace(/data,\s*batchResults,/g, 'data: batchResults,');
    content = content.replace(/data,\s*strategyResults,/g, 'data: strategyResults,');
    content = content.replace(/data,\s*injuryAlert,/g, 'data: injuryAlert,');
    content = content.replace(/data,\s*trends,/g, 'data: trends,');
    content = content.replace(/data,\s*strategy,/g, 'data: strategy,');
    content = content.replace(/data,\s*playerBreakout,/g, 'data: playerBreakout,');
    content = content.replace(/data,\s*recommendations,/g, 'data: recommendations,');
    content = content.replace(/data,\s*teamNeeds,/g, 'data: teamNeeds,');
    content = content.replace(/data,\s*draftResult,/g, 'data: draftResult,');
    content = content.replace(/data,\s*simulationResult,/g, 'data: simulationResult,');
    content = content.replace(/data,\s*userPick,/g, 'data: userPick,');
    content = content.replace(/data,\s*pickRecommendations,/g, 'data: pickRecommendations,');
    
    // Fix colon patterns in specific contexts
    content = content.replace(/playerId:\s*success,/g, 'playerId,\n                success:');
    content = content.replace(/teamId:\s*injuredPlayerId,/g, 'teamId,\n                injuredPlayerId:');
    content = content.replace(/injuries.length:\s*successful,/g, 'injuries.length,\n          successful:');
    content = content.replace(/requests.length:\s*successful,/g, 'requests.length,\n          successful:');
    content = content.replace(/recommendations.length:\s*timestamp,/g, 'recommendations.length,\n          timestamp:');
    content = content.replace(/pickRecommendations.length:\s*timestamp,/g, 'pickRecommendations.length,\n          timestamp:');
    
    // Fix Use: patterns in error messages
    content = content.replace(/Use:\s*([a-zA-Z_]+);\s*/g, 'Use: $1, ');
    content = content.replace(/Use:\s*([a-zA-Z_]+):\s*/g, 'Use: $1, ');
    
    // Fix function call patterns
    content = content.replace(/\(([a-zA-Z_][a-zA-Z0-9_]*):\s*([a-zA-Z_][a-zA-Z0-9_]*);\s*([a-zA-Z_][a-zA-Z0-9_]*)\)/g, '($1, $2, $3)');
    
    // Fix audit log specific patterns
    content = content.replace(/data:\s*auditLogData:\s*timestamp,/g, 'data: auditLogData,\n    timestamp:');
    content = content.replace(/olderThan:\s*severity,/g, 'olderThan, severity,');
    
    // Fix breakout specific patterns
    content = content.replace(/topBreakouts:\s*filteredBreakouts:\s*filters:\s*{/g, 'topBreakouts: filteredBreakouts,\n        filters: {');
    content = content.replace(/positions:\s*positionFilter:\s*minProbability,/g, 'positions: positionFilter,\n          minProbability:');
    content = content.replace(/requestedPlayerIds:\s*playerIds;/g, 'requestedPlayerIds: playerIds,');
    
    // Fix success: false: patterns
    content = content.replace(/success:\s*false:\s*/g, 'success: false,\n                ');
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      totalFixed++;
      console.log(`✅ Fixed ${filePath}`);
    }
  }
  
  function walkDir(dir) {
    if (!fs.existsSync(dir)) return;
    
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else {
        fixFile(fullPath);
      }
    }
  }
  
  dirs.forEach(walkDir);
  console.log(`\n✅ Fixed ${totalFixed} files total`);
}

fixAllFiles();