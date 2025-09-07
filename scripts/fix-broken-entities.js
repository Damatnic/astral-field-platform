const fs = require('fs');
const path = require('path');

console.log('🔧 Fix Broken HTML Entities - Starting...');

function findFilesToFix(dir) {
  let files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(item)) {
        files = files.concat(findFilesToFix(itemPath));
      }
    } else if (item.match(/\.(ts|tsx|js|jsx)$/)) {
      files.push(itemPath);
    }
  }
  return files;
}

function fixFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Simple and direct fix: convert all HTML entities back to proper quotes
  let fixedContent = content
    // Fix single quote HTML entities
    .replace(/'/g, "'")
    // Fix double quote HTML entities  
    .replace(/"/g, '"')
    // Fix specific broken patterns we identified
    .replace(/{ user: null, error:/g, '{ user: null, error:')
    .replace(/success: false, error:/g, 'success: false, error:')
    // Fix missing commas in object properties (pattern: id: 'value'username:)
    .replace(/(['"]\s*)[a-zA-Z_][a-zA-Z0-9_]*\s*:/g, (match, quote, offset, string) => {
      // Only add comma if we're not at the start of an object
      const beforeMatch = string.slice(Math.max(0, offset - 10), offset);
      if (beforeMatch.includes('{') && !beforeMatch.includes(',')) {
        return quote + ', ' + match.slice(quote.length);
      }
      return match;
    });

  const hasChanges = fixedContent !== originalContent;
  
  if (hasChanges) {
    fs.writeFileSync(filePath, fixedContent, 'utf8');
  }

  return hasChanges;
}

// Process all TypeScript/JavaScript files
const files = findFilesToFix('.');
let fixedCount = 0;

console.log(`Found ${files.length} files to check...`);

files.forEach((file, index) => {
  const relativePath = path.relative('.', file);
  console.log(`\n[${index + 1}/${files.length}] Processing: ${relativePath}`);
  
  try {
    const hasChanges = fixFile(file);
    if (hasChanges) {
      console.log(`  ✅ Fixed broken entities in: ${relativePath}`);
      fixedCount++;
    } else {
      console.log(`  ✓ No entity issues found`);
    }
  } catch (error) {
    console.log(`  ❌ Error processing ${relativePath}: ${error.message}`);
  }
});

console.log(`\n🎉 Entity Fix Complete!`);
console.log(`📊 Summary:`);
console.log(`  - Files processed: ${files.length}`);
console.log(`  - Files fixed: ${fixedCount}`);
console.log(`  - Files skipped: ${files.length - fixedCount}`);