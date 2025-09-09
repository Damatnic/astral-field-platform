const fs = require('fs');
const path = require('path');

// Nuclear-level fixes for the most stubborn remaining syntax errors
const fixes = [
  // Fix "success, true" -> "success: true" (standalone)
  { pattern: /success,\s*\n\s*true(?=\s*[,}\]])/g, replacement: 'success: true' },
  
  // Fix duplicate variable declarations by renaming conflicts
  { pattern: /const\s*{\s*playerIds,\s*week,\s*batchWeek/g, replacement: 'const { playerIds, batchWeek' },
  
  // Fix malformed arrays: "features, [" -> "features: ["
  { pattern: /features,\s*\[/g, replacement: 'features: [' },
  
  // Fix arrow array markers: ",->" or "|->" or "`->" -> proper array items
  { pattern: /[,|`]->\s*/g, replacement: '' },
  
  // Fix "data, messageData" -> "data: messageData"
  { pattern: /data,\s*messageData/g, replacement: 'data: messageData' },
  
  // Fix "source z.string()" -> "source: z.string()"
  { pattern: /source\s+z\.string\(/g, replacement: 'source: z.string(' },
  
  // Fix "error, 'message'" -> "error: 'message'" in context
  { pattern: /error,\s*'Player not in analysis'/g, replacement: "error: 'Player not in analysis'" },
  
  // Fix missing colon in object return: "{ teamId: success:" -> "{ teamId, success:"
  { pattern: /{\s*teamId:\s*success:\s*true/g, replacement: '{ teamId, success: true' },
  
  // Fix array ending issues
  { pattern: /\s+errors\.push\(\.\.\.(.*?)\)\.?}/g, replacement: '\n    errors.push(...$1);\n  }' }
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
        console.log(`Fixed ${fileChanges} nuclear issues in ${path.relative(process.cwd(), filePath)}`);
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

console.log('☢️ Running nuclear syntax fix...');
const srcPath = path.join(process.cwd(), 'src');
const results = processDirectory(srcPath);

console.log(`\n✅ Nuclear syntax fix complete!`);
console.log(`📊 Applied ${results.totalChanges} nuclear fixes across ${results.filesChanged} files`);

console.log('\n🎯 Nuclear patterns fixed:');
console.log('- success, true -> success: true');
console.log('- duplicate variable declarations');
console.log('- malformed array syntax');
console.log('- object property assignment errors');
console.log('- array markup cleanup');