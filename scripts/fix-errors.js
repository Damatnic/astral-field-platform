#!/usr/bin/env node

/**
 * Automated Error Fix Script for Astral Field Project
 * This script fixes common errors across the entire codebase
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Fix functions for different error types
const fixes = {
  // Fix missing sql import in database files
  fixMissingSqlImport: {
    description: 'Fix missing sql import in database files',
    files: [
      'src/app/api/database/migrate/route.ts'
    ],
    fix: (content, filePath) => {
      if (!content.includes("import { sql }") && content.includes("sql.")) {
        // Replace sql. with db.query
        content = content.replace(/sql\./g, 'db.');
        log(`  ✓ Fixed sql references in ${filePath}`, 'green');
      }
      return content;
    }
  },

  // Fix missing lucide-react icons
  fixMissingLucideIcons: {
    description: 'Fix missing lucide-react icon imports',
    pattern: /\.(tsx?|jsx?)$/,
    fix: (content, filePath) => {
      const iconMappings = {
        'Fire': 'Flame',
        'Sort': 'ArrowUpDown',
        'Toggle': 'ToggleLeft'
      };
      
      let modified = false;
      for (const [oldIcon, newIcon] of Object.entries(iconMappings)) {
        if (content.includes(oldIcon) && content.includes('lucide-react')) {
          content = content.replace(new RegExp(`\\b${oldIcon}\\b`, 'g'), newIcon);
          modified = true;
        }
      }
      
      if (modified) {
        log(`  ✓ Fixed lucide-react icons in ${filePath}`, 'green');
      }
      return content;
    }
  },

  // Fix React unescaped entities
  fixUnescapedEntities: {
    description: 'Fix React unescaped entities',
    pattern: /\.(tsx|jsx)$/,
    fix: (content, filePath) => {
      let modified = false;
      
      // Fix apostrophes in JSX
      const jsxPattern = />(.*?)'/g;
      if (jsxPattern.test(content)) {
        content = content.replace(/([>][^<]*)'([^<]*[<])/g, '$1&apos;$2');
        modified = true;
      }
      
      // Fix quotes in JSX
      const quotePattern = />(.*?)"/g;
      if (quotePattern.test(content)) {
        content = content.replace(/([>][^<]*)"([^<]*[<])/g, '$1&quot;$2');
        modified = true;
      }
      
      if (modified) {
        log(`  ✓ Fixed unescaped entities in ${filePath}`, 'green');
      }
      return content;
    }
  },

  // Fix unused variables
  fixUnusedVariables: {
    description: 'Fix unused variables',
    pattern: /\.(ts|tsx|js|jsx)$/,
    fix: (content, filePath) => {
      let modified = false;
      
      // Common unused variables in catch blocks
      content = content.replace(/catch\s*\(\s*error\s*\)\s*{([^}]*console\.error[^}]*)?}/g, (match, body) => {
        if (!body || !body.includes('error')) {
          modified = true;
          return 'catch (_error) {' + (body || '') + '}';
        }
        return match;
      });
      
      // Remove unused imports (common ones)
      const unusedImports = [
        { pattern: /import\s+{\s*request\s*}\s+from\s+['"][^'"]+['"];?\n?/g, check: 'request' },
        { pattern: /import\s+{\s*error\s*}\s+from\s+['"][^'"]+['"];?\n?/g, check: 'error' }
      ];
      
      for (const { pattern, check } of unusedImports) {
        if (content.match(pattern) && !content.includes(`${check}.`) && !content.includes(`${check}(`)) {
          content = content.replace(pattern, '');
          modified = true;
        }
      }
      
      if (modified) {
        log(`  ✓ Fixed unused variables in ${filePath}`, 'green');
      }
      return content;
    }
  },

  // Fix missing key props
  fixMissingKeyProps: {
    description: 'Fix missing key props in lists',
    pattern: /\.(tsx|jsx)$/,
    fix: (content, filePath) => {
      let modified = false;
      
      // Add key to map functions without key
      content = content.replace(/\.map\((\([^)]+\)|[^,]+),?\s*([^)]*)\)\s*=>\s*(\(|<)/g, (match, param, index) => {
        if (!match.includes('key=')) {
          // Check if we're returning JSX
          const afterArrow = match.substring(match.indexOf('=>') + 2).trim();
          if (afterArrow.startsWith('(') || afterArrow.startsWith('<')) {
            // This is likely returning JSX, needs investigation
            log(`  ⚠ Potential missing key in ${filePath}`, 'yellow');
          }
        }
        return match;
      });
      
      return content;
    }
  },

  // Fix TypeScript any types
  fixAnyTypes: {
    description: 'Fix TypeScript any types',
    pattern: /\.tsx?$/,
    fix: (content, filePath) => {
      let modified = false;
      
      // Replace common any types with more specific ones
      const replacements = [
        { from: /:\s*any\[\]/g, to: ': unknown[]' },
        { from: /:\s*any(?!\w)/g, to: ': unknown' },
        { from: /as\s+any(?!\w)/g, to: 'as unknown' }
      ];
      
      for (const { from, to } of replacements) {
        if (content.match(from)) {
          content = content.replace(from, to);
          modified = true;
        }
      }
      
      if (modified) {
        log(`  ✓ Fixed any types in ${filePath}`, 'green');
      }
      return content;
    }
  },

  // Fix prefer-const warnings
  fixPreferConst: {
    description: 'Fix prefer-const warnings',
    pattern: /\.(ts|tsx|js|jsx)$/,
    fix: (content, filePath) => {
      let modified = false;
      
      // Fix let declarations that are never reassigned
      const letPattern = /let\s+(\w+)\s*=\s*([^;]+);/g;
      const matches = [...content.matchAll(letPattern)];
      
      for (const match of matches) {
        const varName = match[1];
        const fullMatch = match[0];
        
        // Check if variable is reassigned
        const reassignPattern = new RegExp(`\\b${varName}\\s*=(?!=)`, 'g');
        const allMatches = [...content.matchAll(reassignPattern)];
        
        if (allMatches.length === 1) {
          // Only the initial assignment exists
          content = content.replace(fullMatch, fullMatch.replace('let', 'const'));
          modified = true;
        }
      }
      
      if (modified) {
        log(`  ✓ Fixed prefer-const in ${filePath}`, 'green');
      }
      return content;
    }
  },

  // Add missing imports
  addMissingImports: {
    description: 'Add missing imports',
    pattern: /\.(tsx?|jsx?)$/,
    fix: (content, filePath) => {
      let modified = false;
      const imports = [];
      
      // Check for missing React import (for older React versions)
      if (content.includes('JSX.Element') && !content.includes('import React')) {
        imports.push("import React from 'react';");
      }
      
      // Check for missing Next.js imports
      if (content.includes('useRouter') && !content.includes('from "next/navigation"')) {
        imports.push("import { useRouter } from 'next/navigation';");
      }
      
      if (imports.length > 0) {
        content = imports.join('\n') + '\n' + content;
        modified = true;
        log(`  ✓ Added missing imports in ${filePath}`, 'green');
      }
      
      return content;
    }
  }
};

// Process a single file
function processFile(filePath, fixFunctions) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    for (const fix of fixFunctions) {
      content = fix(content, filePath);
    }
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    return false;
  } catch (error) {
    log(`  ✗ Error processing ${filePath}: ${error.message}`, 'red');
    return false;
  }
}

// Recursively find files matching pattern
function findFiles(dir, pattern, exclude = []) {
  const files = [];
  
  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      // Skip excluded directories
      if (exclude.some(ex => fullPath.includes(ex))) {
        continue;
      }
      
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && pattern.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

// Main execution
async function main() {
  log('\n🔧 Astral Field Error Fix Script', 'cyan');
  log('================================\n', 'cyan');
  
  const srcDir = path.join(process.cwd(), 'src');
  const exclude = ['node_modules', '.next', 'dist', 'build'];
  
  let totalFixed = 0;
  
  // Run each fix
  for (const [name, config] of Object.entries(fixes)) {
    log(`\n${config.description}...`, 'blue');
    
    let files = [];
    if (config.files) {
      // Specific files
      files = config.files.map(f => path.join(process.cwd(), f));
    } else if (config.pattern) {
      // Find files by pattern
      files = findFiles(srcDir, config.pattern, exclude);
    }
    
    let fixedCount = 0;
    for (const file of files) {
      if (fs.existsSync(file)) {
        if (processFile(file, [config.fix])) {
          fixedCount++;
        }
      }
    }
    
    if (fixedCount > 0) {
      log(`  Fixed ${fixedCount} file(s)`, 'green');
      totalFixed += fixedCount;
    }
  }
  
  // Run additional automated fixes
  log('\n\nRunning additional automated fixes...', 'blue');
  
  try {
    // Format with Prettier if available
    log('  Running Prettier...', 'yellow');
    execSync('npx prettier --write "src/**/*.{ts,tsx,js,jsx,json,css,md}" --ignore-path .gitignore', { stdio: 'pipe' });
    log('  ✓ Prettier formatting complete', 'green');
  } catch (error) {
    log('  ⚠ Prettier not available or failed', 'yellow');
  }
  
  try {
    // Run ESLint autofix
    log('  Running ESLint autofix...', 'yellow');
    execSync('npx eslint --fix "src/**/*.{ts,tsx,js,jsx}" --quiet', { stdio: 'pipe' });
    log('  ✓ ESLint autofix complete', 'green');
  } catch (error) {
    log('  ⚠ Some ESLint issues could not be auto-fixed', 'yellow');
  }
  
  log('\n\n✨ Error fixing complete!', 'green');
  log(`   Total files modified: ${totalFixed}`, 'green');
  
  // Run type check to see remaining issues
  log('\n\nChecking for remaining TypeScript errors...', 'blue');
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    log('  ✓ No TypeScript errors found!', 'green');
  } catch (error) {
    log('  ⚠ Some TypeScript errors remain. Run "npm run type-check" for details.', 'yellow');
  }
  
  log('\n📝 Next steps:', 'cyan');
  log('  1. Review the changes with: git diff', 'cyan');
  log('  2. Run tests with: npm test', 'cyan');
  log('  3. Start dev server: npm run dev', 'cyan');
  log('  4. Commit fixes: git add -A && git commit -m "fix: automated error fixes"', 'cyan');
}

// Run the script
main().catch(error => {
  log(`\n✗ Script failed: ${error.message}`, 'red');
  process.exit(1);
});