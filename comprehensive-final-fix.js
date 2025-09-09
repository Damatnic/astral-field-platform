const fs = require('fs');
const path = require('path');

function comprehensiveFinalFix() {
  // Get all TypeScript files in the src directory recursively
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
      
      // Fix all broken string patterns
      content = content.replace(/'Missing required parameter,\s*s:\s*([^']+)'/g, "'Missing required parameters: $1'");
      content = content.replace(/'Missing required paramete,\s*r:\s*([^']+)'/g, "'Missing required parameter: $1'");
      
      // Fix all broken function calls
      content = content.replace(/(\w+)\(\s*;\s*/g, '$1(');
      content = content.replace(/Promise\.all\(\s*;/g, 'Promise.all(');
      content = content.replace(/processInjuryReport\(\s*;/g, 'processInjuryReport(');
      
      // Fix all broken object syntax
      content = content.replace(/:\s*{,/g, ': {');
      content = content.replace(/data:\s*{,/g, 'data: {');
      content = content.replace(/filters:\s*{,/g, 'filters: {');
      
      // Fix all property syntax errors
      content = content.replace(/(\w+),\s*(true|false),/g, '$1: $2,');
      content = content.replace(/(\w+),\s*(\w+),/g, '$1: $2,');
      
      // Fix status object syntax
      content = content.replace(/{\s*status\s+(\d+)\s*}/g, '{ status: $1 }');
      
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

comprehensiveFinalFix();