const fs = require('fs');
const path = require('path');

// Fix malformed patterns in API route files
function fixApiRoutes() {
  const apiDir = 'src/app/api';
  let totalFixes = 0;
  
  function processFile(filePath) {
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let fixes = 0;
    const originalContent = content;
    
    // Fix malformed property declarations with trailing commas
    content = content.replace(/(\w+): (string|number|boolean|any|unknown|null|undefined|Json);,\s*\n\s+/g, (match, prop, type) => {
      fixes++;
      return `${prop}: ${type};\n  `;
    });
    
    // Fix timestamp patterns
    content = content.replace(/timestamp: (number|string);,/g, 'timestamp: $1;');
    content = content.replace(/timestamp,\s+new Date/g, 'timestamp: new Date');
    
    // Fix renderTime patterns
    content = content.replace(/renderTime,\s+`/g, 'renderTime: `');
    content = content.replace(/renderTime: (number|string);,/g, 'renderTime: $1;');
    
    // Fix component patterns  
    content = content.replace(/component: string;,/g, 'component: string;');
    
    // Fix url patterns
    content = content.replace(/url: string;,/g, 'url: string;');
    
    // Fix avgLoadTime and similar patterns
    content = content.replace(/avg(\w+): (number|string);,/g, 'avg$1: $2;');
    
    // Fix status patterns
    content = content.replace(/status: (string|"[^"]+");,/g, 'status: $1;');
    
    // Fix malformed object properties in response objects
    content = content.replace(/,\s*(\w+),\s+/g, ', $1: ');
    
    // Fix malformed join patterns
    content = content.replace(/:\s+join\(/g, '.join(');
    
    // Fix malformed typeof patterns
    content = content.replace(/typeof:\s+(\w+)/g, 'typeof $1');
    
    // Fix avgLoadTime: 0, patterns
    content = content.replace(/avg(\w+): 0,\s*\n/g, 'avg$1: 0,\n      ');
    
    // Fix timestamp, new Date patterns
    content = content.replace(/timestamp,\s+new Date/g, 'timestamp: new Date');
    
    // Fix renderTime, patterns
    content = content.replace(/renderTime,\s+/g, 'renderTime: ');
    
    // Fix patterns like "status: logged"
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      totalFixes += fixes;
      console.log(`✅ Fixed ${filePath} - ${fixes} fixes`);
    }
  }
  
  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else {
        processFile(filePath);
      }
    }
  }
  
  walkDir(apiDir);
  console.log(`\n✅ Total fixes applied: ${totalFixes}`);
}

fixApiRoutes();