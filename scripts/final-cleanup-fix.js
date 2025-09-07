const fs = require('fs');
const path = require('path');

console.log('🤖 @ParseBot - Final Cleanup Fix Script');
console.log('Targeting remaining 394 ESLint issues...\n');

let filesFixed = 0;
let totalFixes = 0;

// Read all TypeScript/JavaScript files recursively
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !['node_modules', '.git', '.next', 'dist', 'build'].includes(file)) {
      getAllFiles(filePath, fileList);
    } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Main fix function
function fixParsingErrors(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let localFixes = 0;

    // Fix 1: Missing commas in object literals (most common issue)
    // Pattern: } \n property: or } \n 'property': or } \n "property":
    content = content.replace(/}\s*\n\s*([a-zA-Z_$][\w$]*\s*:|['"`][^'"`]*['"`]\s*:)/g, '},\n  $1');
    if (content !== originalContent) localFixes++;

    // Fix 2: Missing commas after object properties
    // Pattern: : value \n property: (without comma)
    content = content.replace(/:\s*([^,\s][^\n]*)\s*\n\s*([a-zA-Z_$][\w$]*\s*:|['"`][^'"`]*['"`]\s*:)/g, ': $1,\n  $2');
    if (content !== originalContent) localFixes++;

    // Fix 3: Fix numeric separators in wrong context
    // Pattern: number_number (underscore in wrong place)
    content = content.replace(/(\d)_(\d)/g, '$1$2');
    if (content !== originalContent) localFixes++;

    // Fix 4: Fix malformed destructuring parameters
    // Pattern: {prop} {anotherProp} -> {prop}, {anotherProp}
    content = content.replace(/\{\s*([^}]+)\s*\}\s+\{\s*([^}]+)\s*\}/g, '{$1}, {$2}');
    if (content !== originalContent) localFixes++;

    // Fix 5: Fix missing commas in function parameters
    content = content.replace(/\)\s+([a-zA-Z_$][\w$]*\s*:)/g, '), $1');
    if (content !== originalContent) localFixes++;

    // Fix 6: Fix React unescaped entities
    content = content.replace(/can't/g, "can&apos;t");
    content = content.replace(/won't/g, "won&apos;t");
    content = content.replace(/don't/g, "don&apos;t");
    if (content !== originalContent) localFixes++;

    // Fix 7: Fix malformed arrow function parameters
    content = content.replace(/=>\s*\(\s*([^)]+)\s*\)\s*=>/g, '=> ($1) =>');
    if (content !== originalContent) localFixes++;

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      filesFixed++;
      totalFixes += localFixes;
      console.log(`✅ Fixed ${localFixes} issues in: ${path.relative(process.cwd(), filePath)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.log(`❌ Error processing ${filePath}: ${error.message}`);
    return false;
  }
}

// Process all files
console.log('Scanning project files...');
const allFiles = getAllFiles('./src');
allFiles.push(...getAllFiles('./scripts'));
allFiles.push(...getAllFiles('./__tests__'));

// Add config files
const configFiles = [
  './jest.config.js',
  './next.config.js',
  './tailwind.config.ts',
];

configFiles.forEach(file => {
  if (fs.existsSync(file)) {
    allFiles.push(file);
  }
});

console.log(`Found ${allFiles.length} files to process\n`);

// Process files
allFiles.forEach(filePath => {
  fixParsingErrors(filePath);
});

console.log('\n🎯 @ParseBot Final Summary:');
console.log(`📁 Files processed: ${allFiles.length}`);
console.log(`✅ Files fixed: ${filesFixed}`);
console.log(`🔧 Total fixes applied: ${totalFixes}`);
console.log(`\n🚀 Run 'npx eslint . --ext .ts,.tsx,.js,.jsx' to see the improvement!`);