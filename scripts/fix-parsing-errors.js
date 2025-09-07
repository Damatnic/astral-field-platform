/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
console.log('🔧 Fixing parsing errors caused by malformed parameters...');
const fixes = [
  // Fix malformed function parameters with commas
  {
    pattern: /\(([^)]*)\s*\)/g,
    replacement: '($1)'
  },
  // Fix malformed destructuring with trailing commas
  {
    pattern: /\{\s*([^}]+)\s*\}/g,
    replacement: (matchcontent) => {
      // Remove trailing comma from destructuring
      const cleaned = content.replace(/,\s*$/, '');
      return `{ ${cleaned} }`;
    }
  },
  // Fix function parameters with trailing commas
  {
    pattern: /\(([^)]+)\s*\)/g,
    replacement: (matchparams) => {
      const cleaned = params.replace(/,\s*$/, '');
      return `(${cleaned})`;
    }
  },
  // Fix array destructuring with trailing commas
  {
    pattern: /\[([^\]]+)\s*\]/g,
    replacement: (matchcontent) => {
      const cleaned = content.replace(/,\s*$/, '');
      return `[${cleaned}]`;
    }
  },
  // Fix malformed arrow functions with comma before =>
  {
    pattern: /\s*=>/g,
    replacement: ' =>'
  },
  // Fix type annotations with trailing commas
  {
    pattern: /:\s*([^,=>{}\\[\]()]+),\s*([=>{}\\]\)])/g,
    replacement: ': $1$2'
  }
];
function fixParsingErrors(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const modified = false;
    for (const fix of fixes) {
      const originalContent = content;
      if (typeof fix.replacement === 'function') {
        content = content.replace(fix.pattern, fix.replacement);
      } else {
        content = content.replace(fix.pattern, fix.replacement);
      }
      if (content !== originalContent) {
        modified = true;
      }
    }
    // Additional specific fixes for common parsing issues
    // Fix React component props with trailing comma before closing brace
    content = content.replace(/,(\s*}\s*>)/g, '$1');
    // Fix function calls with trailing comma
    content = content.replace(/,(\s*\)\s*;)/g, '$1');
    content = content.replace(/,(\s*\)$)/gm, '$1');
    // Fix object literal with trailing comma before closing brace in JSX
    content = content.replace(/,(\s*}\s*(?: \/\*.*?\*\/\s*)*>)/g'$1');
    // Fix generic type parameters with trailing comma
    content = content.replace(/<([^<>]+),\s*>/g, '<$1>');
    // Fix malformed conditional expressions
    content = content.replace(/,(\s*\?\s*)/g, ' $1');
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
  } catch (error) {
    console.error(`Error processing ${filePath}: `error.message);
  }
  return false;
}
function getAllTypeScriptFiles(dir = 'src') {
  const files = [];
  function scan(currentDir) {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory() && !['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
          scan(fullPath);
        } else if (entry.isFile() && /\\.(ts|tsx)$/.test(entry.name)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Cannot access directory ${currentDir}: `error.message);
    }
  }
  scan(dir);
  return files;
}
// Process all TypeScript files
const tsFiles = getAllTypeScriptFiles();
const fixedCount = 0;
console.log(`Found ${tsFiles.length} TypeScript files to process...`);
for (const file of tsFiles) {
  if (fixParsingErrors(file)) {
    fixedCount++;
    console.log(`✅ Fixed parsing errors in: ${file}`);
  }
}
console.log(`\\n🎉 Parsing error fixes completed:`);
console.log(`📁 Files processed: ${tsFiles.length}`);
console.log(`✅ Files fixed: ${fixedCount}`);
console.log(`📊 Success rate: ${((fixedCount / tsFiles.length) * 100).toFixed(1)}%`);
// Run ESLint check to see remaining parsing errors
console.log('\\n🔍 Running ESLint to check remaining parsing errors...');