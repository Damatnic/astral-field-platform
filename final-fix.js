const fs = require('fs');
const path = require('path');

// Final aggressive fix for remaining TypeScript errors
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    
    if (file === 'node_modules' || file === '.next' || file === '.git' || file === 'dist' || file === 'build') {
      return;
    }
    
    try {
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        getAllFiles(filePath, fileList);
      } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
        fileList.push(filePath);
      }
    } catch (err) {
      // Skip files we can't access
    }
  });
  
  return fileList;
}

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let fixCount = 0;
    
    // Fix malformed object properties with type keyword
    content = content.replace(/^(\s*)type\s+(['"`]\w+['"`])/gm, (match, indent, prop) => {
      fixCount++;
      return `${indent}type: ${prop}`;
    });
    
    // Fix SQL query patterns with backticks
    content = content.replace(/const\s+(\w+Query)\s*=\s*`;/g, (match, name) => {
      fixCount++;
      return `const ${name} = \``;
    });
    
    // Fix Promise.all patterns
    content = content.replace(/await Promise\.all\(\[;/g, () => {
      fixCount++;
      return 'await Promise.all([';
    });
    
    // Fix object property syntax errors
    content = content.replace(/\{\s*type\s+(\w+)/g, (match, type) => {
      fixCount++;
      return `{ type: '${type}'`;
    });
    
    // Fix destructuring with colons
    content = content.replace(/const\s+\{\s*([^:}]+):\s*([^,}]+),/g, (match, prop1, prop2) => {
      // Only fix if it looks wrong
      if (!/^(string|number|boolean|any)$/.test(prop2.trim())) {
        fixCount++;
        return `const { ${prop1}, ${prop2},`;
      }
      return match;
    });
    
    // Fix switch case patterns
    content = content.replace(/switch\s*\(([^)]+)\)\s*\{\s*case\s+/g, (match, expr) => {
      fixCount++;
      return `switch (${expr}) {\n      case `;
    });
    
    // Fix template literal concatenation
    content = content.replace(/\$\{([^}]+)\}:([^`]+)`/g, (match, expr, after) => {
      if (!after.includes('`')) {
        fixCount++;
        return `\${${expr}}${after}\``;
      }
      return match;
    });
    
    // Fix object spread in JSX
    content = content.replace(/\{\.\.\.([^}]+)\s+\}/g, (match, spread) => {
      fixCount++;
      return `{...${spread.trim()}}`;
    });
    
    // Fix malformed arrow functions
    content = content.replace(/\)\s*:\s*=>/g, () => {
      fixCount++;
      return ') =>';
    });
    
    // Fix missing commas in object literals
    content = content.replace(/(\w+):\s*([^,}\n]+)\n\s*(\w+):/g, (match, p1, p2, p3) => {
      // Check if this is inside an object literal
      if (!p2.includes('{') && !p2.includes('=>') && !p2.includes('function')) {
        fixCount++;
        return `${p1}: ${p2},\n    ${p3}:`;
      }
      return match;
    });
    
    // Fix type annotations in function parameters
    content = content.replace(/\(([^)]+):\s*,/g, (match, params) => {
      fixCount++;
      return `(${params},`;
    });
    
    // Fix JSX expression errors
    content = content.replace(/\{([^}]+)\s+\?/g, (match, condition) => {
      if (!condition.includes('{')) {
        fixCount++;
        return `{${condition.trim()} ?`;
      }
      return match;
    });
    
    // Fix async function in try blocks
    content = content.replace(/try\s*\{\s*await\s+([^(])/g, (match, after) => {
      fixCount++;
      return `try {\n    await ${after}`;
    });
    
    // Fix return statement patterns
    content = content.replace(/return\s+\{\s*([^:}]+)\s+([^:}]+)\s*\}/g, (match, p1, p2) => {
      if (!p1.includes(':') && !p2.includes(':')) {
        fixCount++;
        return `return { ${p1}: ${p2} }`;
      }
      return match;
    });
    
    // Fix specific route.ts patterns
    if (filePath.includes('route.ts')) {
      // Fix malformed object returns
      content = content.replace(/\{\s*success:\s*true,\n\s*(\w+)\s+/g, (match, prop) => {
        fixCount++;
        return `{ success: true,\n  ${prop}: `;
      });
      
      // Fix response patterns
      content = content.replace(/NextResponse\.json\(\s*\{\s*success:\s*false,\n\s*error:\s+/g, () => {
        fixCount++;
        return 'NextResponse.json(\n      { success: false,\n  error: ';
      });
      
      // Fix SQL VALUES patterns
      content = content.replace(/VALUES\s*\([^)]+\):\s*VALUES/g, (match) => {
        fixCount++;
        return match.replace('): VALUES', ') VALUES');
      });
    }
    
    // Fix TSX specific patterns
    if (filePath.endsWith('.tsx')) {
      // Fix className concatenation
      content = content.replace(/className=\{`([^`]+)\s+\$\{/g, (match, classes) => {
        fixCount++;
        return `className={\`${classes.trim()} \${`;
      });
      
      // Fix event handlers
      content = content.replace(/onClick=\{\(\)\s*=>\s*\{/g, () => {
        fixCount++;
        return 'onClick={() => {';
      });
      
      // Fix conditional rendering
      content = content.replace(/\{([^}]+)\s*\?\s*\(/g, (match, condition) => {
        if (!condition.includes('(')) {
          fixCount++;
          return `{${condition.trim()} ? (`;
        }
        return match;
      });
    }
    
    // Write file if changes were made
    if (content !== originalContent && fixCount > 0) {
      fs.writeFileSync(filePath, content, 'utf8');
      return fixCount;
    }
    return 0;
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err.message);
    return 0;
  }
}

// Main execution
console.log('🚀 Starting FINAL TypeScript fix operation...\n');

const srcDir = path.join(process.cwd(), 'src');
const files = getAllFiles(srcDir);

console.log(`Found ${files.length} TypeScript/TSX files to process\n`);

let totalFixes = 0;
let filesFixed = 0;

files.forEach((file, index) => {
  if (index % 50 === 0) {
    console.log(`Progress: ${index}/${files.length} files processed...`);
  }
  
  const fixes = fixFile(file);
  if (fixes > 0) {
    totalFixes += fixes;
    filesFixed++;
    const relativePath = path.relative(process.cwd(), file);
    console.log(`✅ Fixed ${fixes} issues in ${relativePath}`);
  }
});

console.log('\n' + '='.repeat(60));
console.log('✨ FINAL FIX OPERATION COMPLETE!');
console.log('='.repeat(60));
console.log(`📊 Statistics:`);
console.log(`   Total files processed: ${files.length}`);
console.log(`   Files with fixes: ${filesFixed}`);
console.log(`   Total fixes applied: ${totalFixes}`);
console.log('='.repeat(60));