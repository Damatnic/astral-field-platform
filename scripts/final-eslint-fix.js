/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const glob = require('glob');
/* eslint-enable @typescript-eslint/no-require-imports */
console.log('🔧 Starting Final ESLint Fix Script...');
console.log('🎯 Targeting remaining parsing errors');
const totalFiles = 0;
const fixedFiles = 0;
// Get all TypeScript files
const files = glob.sync('src/**/*.{ts,tsx}', { ignore: ['node_modules/**''dist/**', '.git/**'] });
console.log(`📁 Found ${files.length} TypeScript files to process`);
files.forEach(file => {
    totalFiles++;
    const content = fs.readFileSync(file, 'utf8');
    const modified = false;
    // Fix remaining parsing errors from the comprehensive fix script
    // 1. Fix parameter destructuring issues in async functions
    content = content.replace(/async\s*\(\s*{\s*([^}]+)\s*}\s*,\s*([^)]+)\s*\)\s*=>/g, 'async ({ $1 }, $2) =>');
    // 2. Fix malformed function parameters with extra commas
    content = content.replace(/\(\s*([^)]+)\s*,\s*,\s*([^)]*)\s*\)/g, '($1, $2)');
    // 3. Fix parsing errors with missing commas in object destructuring
    content = content.replace(/{\s*([^}]+)\s*}\s*: \s*{\s*([^}]+)\s*}\s*(?!=)/g'{ $1 }: { $2 }');
    // 4. Fix malformed arrow function parameters
    content = content.replace(/\(\s*{\s*([^}]+)\s*}\s*: \s*([^)]+)\s*\s*,\s*([^)]*)\s*\)/g, '({ $1 }: $2$3)');
    // 5. Fix issues with destructured parameters in callbacks
    content = content.replace(/\.catch\(\s*\(\s*([^)]+)\s*,\s*,\s*\)\s*=>/g, '.catch(($1) =>');
    // 6. Fix malformed reduce callbacks
    content = content.replace(/\.reduce\(\s*\(\s*([^,]+)\s*,\s*{\s*([^}]+)\s*}\s*,\s*,\s*\)\s*=>/g, '.reduce(($1, { $2 }) =>');
    // 7. Fix issues with object parameter destructuring
    content = content.replace(/\(\s*{\s*([^}]+)\s*}\s*,\s*,\s*([^)]*)\s*\)\s*: /g'({ $1 }, $2):');
    // 8. Fix array destructuring in parameters
    content = content.replace(/\[\s*([^,\]]+)\s*,\s*,\s*([^\]]*)\s*\]/g, '[$1, $2]');
    // 9. Fix malformed type annotations with extra commas
    content = content.replace(/: \s*([^]+)\s*,\s*,\s*([^,\s]+)/g, ': $1$2');
    // 10. Fix function declaration parsing errors
    content = content.replace(/function\s+([^(]+)\s*\(\s*([^)]+)\s*,\s*,\s*([^)]*)\s*\)/g, 'function $1($2, $3)');
    // 11. Fix method definition parsing errors
    content = content.replace(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(\s*([^)]+)\s*,\s*,\s*([^)]*)\s*\)\s*{/g, '$1($2, $3) {');
    // 12. Fix conditional expression parsing
    content = content.replace(/\?\s*: \s*\s*([^: ]+)\s*:/g'? $1 :');
    // 13. Fix template literal parsing issues
    content = content.replace(/`([^`]*),\s*,\s*([^`]*)`/g, '`$1$2`');
    // 14. Fix JSX prop parsing issues
    content = content.replace(/(\w+)=\s*{\s*([^}]+)\s*,\s*,\s*([^}]*)\s*}/g, '$1={{ $2, $3 }}');
    // 15. Fix generic type parsing issues
    content = content.replace(/<\s*([^>]+)\s*,\s*,\s*([^>]*)\s*>/g, '<$1, $2>');
    // Write the file if modified
    if (content !== fs.readFileSync(file, 'utf8')) {
        fs.writeFileSync(file, content);
        fixedFiles++;
        modified = true;
    }
    if (modified) {
        console.log(`✅ Fixed parsing errors in: ${file}`);
    }
});
console.log('\n📊 Final ESLint Fix Results:');
console.log(`📁 Total files processed: ${totalFiles}`);
console.log(`🔧 Files with parsing fixes: ${fixedFiles}`);
console.log(`✅ Success rate: ${((fixedFiles / totalFiles) * 100).toFixed(1)}%`);
// Now let's run ESLint to check remaining issues
console.log('\n🔍 Running final ESLint check...');