const fs = require('fs');
const path = require('path');

function comprehensiveSyntaxFix() {
  // Get all TypeScript files recursively
  function getAllTsFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...getAllTsFiles(fullPath));
      } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
        files.push(fullPath);
      }
    });
    
    return files;
  }

  const srcDir = 'C:\\Users\\damat\\_REPOS\\astral-field\\src';
  const allFiles = getAllTsFiles(srcDir);
  let totalFixed = 0;

  allFiles.forEach(filePath => {
    try {
      let content = fs.readFileSync(filePath, 'utf-8');
      const originalContent = content;
      
      // Fix all the systematic patterns found in errors
      
      // 1. Fix object property syntax - "success: true: data" should be "success: true, data"
      content = content.replace(/success:\s*true:\s*data,/g, 'success: true, data:');
      
      // 2. Fix function parameter syntax - "playerId: injuryType" should be "playerId, injuryType"  
      content = content.replace(/(\w+):\s*(\w+),\s*(\w+),/g, '$1, $2, $3,');
      
      // 3. Fix broken object literals starting with comma
      content = content.replace(/:\s*{,\s*/g, ': {\n    ');
      content = content.replace(/data:\s*{,/g, 'data: {');
      
      // 4. Fix complex broken patterns like "enhanced: timestam, p: new Date()"
      content = content.replace(/enhanced:\s*timestam,\s*p:\s*new Date\(\)\.toISOString\(\)/g, 'enhanced, timestamp: new Date().toISOString()');
      
      // 5. Fix import alias syntax - colons should be commas
      content = content.replace(/(\w+):\s*(\w+),/g, '$1, $2,');
      
      // 6. Remove orphaned commas at end of objects and lines
      content = content.replace(/,\s*}/g, '\n  }');
      content = content.replace(/,\s*]/g, '\n  ]');
      
      // 7. Fix line breaks in object properties
      content = content.replace(/,\s*(\w+):\s*(\w+)\s*\|\|\s*'([^']+)',\s*(\w+):\s*(\w+)\s*\|\|\s*'([^']+)',\s*(\w+)/g, ',\n    $1: $2 || \'$3\',\n    $4: $5 || \'$6\',\n    $7');
      
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`✅ Fixed: ${path.relative(srcDir, filePath)}`);
        totalFixed++;
      }
      
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  });

  console.log(`\n🎉 Fixed ${totalFixed} files out of ${allFiles.length} total files`);
}

comprehensiveSyntaxFix();