#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
/**
 * Fix aggressive parameter prefixing issues that broke function signatures
 */
const FIXES = [
  // Fix _async to async in function signatures
  {
    pattern: /export const (GET|POST|PUT|DELETE|PATCH) = handleApiError\(_async \(/g,
    replacement: 'export const $1 = handleApiError(async ('
  },
  {
    pattern: /= handleApiError\(_async \(/g,
    replacement: '= handleApiError(async ('
  },
  {
    pattern: /async function \(/g,
    replacement: 'function async ('
  },
  // Fix React component parameters
  {
    pattern: /return \(_</g,
    replacement: 'return (<'
  },
  // Fix destructuring parameters with mixed prefixing
  {
    pattern: /_\(\[__(\w+)\]\)/g,
    replacement: '([$1])'
  },
  {
    pattern: /_\(\[(\w+)_(\w+)\]\)/g,
    replacement: '([$1$2])'
  },
  {
    pattern: /\.filter\(_\(\[__(\w+)\]\)/g,
    replacement: '.filter(([_$1])'
  },
  {
    pattern: /\.map\(_\(\[(\w+)_(\w+)\]\)/g,
    replacement: '.map(([$1$2])'
  },
  // Fix Array.from with prefixed parameters
  {
    pattern: /Array\.from\(_\{ length: (\w+) \}, _\(_, _(\w+)\)/g,
    replacement: 'Array.from({ length: $1 }, (_, $2)'
  },
  // Fix common callback patterns
  {
    pattern: /\.map\(_\((\w+)_(\w+)\)/g,
    replacement: '.map(($1$2)'
  },
  {
    pattern: /\.filter\(_\((\w+)_(\w+)\)/g,
    replacement: '.filter(($1$2)'
  },
  {
    pattern: /\.sort\(_\((\w+)_(\w+)\)/g,
    replacement: '.sort(($1$2)'
  },
  // Fix function parameters that reference wrong variable names
  {
    pattern: /const appendLog = \(_(\w+): string\) => setLog\(prev => \[\.\.\.prev, `\${new Date\(\)\.toLocaleTimeString\(\)\} — \${(\w+)`\]\)/g,
    replacement: 'const appendLog = ($1: string) => setLog(prev => [...prev, `${new Date().toLocaleTimeString()} — ${$1}`])'
  }
];
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasChanges = false;
    // Apply all fixes
    FIXES.forEach(fix => {
      const originalContent = content;
      content = content.replace(fix.pattern, fix.replacement);
      if (content !== originalContent) {
        hasChanges = true;
      }
    });
    // Additional context-specific fixes
    if (filePath.includes('admin/setup/page.tsx')) {
      // Fix the specific issue in this file
      content = content.replace(
        /const appendLog = \(_line: string\) => setLog\(prev => \[\.\.\.prev, `\${new Date\(\)\.toLocaleTimeString\(\)\} — \${line}`\]\)/g,
        'const appendLog = (line: string) => setLog(prev => [...prev, `${new Date().toLocaleTimeString()} — ${line}`])'
      );
      content = content.replace(
        /\{log\.map\(_\(l, _i\) => \(<div key=\{i\}>\{l\}<\/div>\)\)\}/g,
        '{log.map((l, i) => (<div key={i}>{l}</div>))}'
      );
      hasChanges = true;
    }
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed parameter prefixing in: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}: `error.message);
    return false;
  }
}
function findTSFiles(dir) {
  const files = [];
  function scanDir(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory() && !['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
        scanDir(fullPath);
      } else if (entry.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx'))) {
        files.push(fullPath);
      }
    }
  }
  scanDir(dir);
  return files;
}
// Main execution
console.log('🔧 Starting parameter prefixing fix...\n');
const srcDir = path.join(process.cwd(), 'src');
const tsFiles = findTSFiles(srcDir);
const fixedCount = 0;
tsFiles.forEach(file => {
  if (processFile(file)) {
    fixedCount++;
  }
});
console.log(`\n✨ Parameter prefixing fix complete!`);
console.log(`📊 Fixed ${fixedCount} files out of ${tsFiles.length} TypeScript files`);