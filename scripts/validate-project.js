#!/usr/bin/env node

/**
 * Project Validation Script for Astral Field
 * Comprehensive checks for the entire codebase
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
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Validation checks
const checks = {
  // Check environment variables
  checkEnvVars: {
    name: 'Environment Variables',
    run: () => {
      const requiredEnvVars = [
        'DATABASE_URL',
        'NEXT_PUBLIC_STACK_PROJECT_ID',
        'NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY',
        'STACK_SECRET_SERVER_KEY'
      ];
      
      const envPath = path.join(process.cwd(), '.env.local');
      if (!fs.existsSync(envPath)) {
        return { success: false, message: '.env.local file not found!' };
      }
      
      const envContent = fs.readFileSync(envPath, 'utf8');
      const missing = requiredEnvVars.filter(v => !envContent.includes(v));
      
      if (missing.length > 0) {
        return { success: false, message: `Missing env vars: ${missing.join(', ')}` };
      }
      
      return { success: true, message: 'All required environment variables present' };
    }
  },

  // Check TypeScript compilation
  checkTypeScript: {
    name: 'TypeScript Compilation',
    run: () => {
      try {
        const output = execSync('npx tsc --noEmit 2>&1', { encoding: 'utf8' });
        return { success: true, message: 'No TypeScript errors' };
      } catch (error) {
        const errorCount = (error.stdout.match(/error TS/g) || []).length;
        return { success: false, message: `${errorCount} TypeScript errors found`, details: error.stdout };
      }
    }
  },

  // Check for missing dependencies
  checkDependencies: {
    name: 'Dependencies',
    run: () => {
      try {
        execSync('npm ls --depth=0', { stdio: 'pipe' });
        return { success: true, message: 'All dependencies installed' };
      } catch (error) {
        return { success: false, message: 'Missing or incorrect dependencies. Run: npm install' };
      }
    }
  },

  // Check for console.log statements
  checkConsoleLogs: {
    name: 'Console Logs',
    run: () => {
      const srcDir = path.join(process.cwd(), 'src');
      let consoleCount = 0;
      const files = [];
      
      function checkFile(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        const matches = content.match(/console\.(log|error|warn|info)/g);
        if (matches) {
          consoleCount += matches.length;
          files.push(path.relative(process.cwd(), filePath));
        }
      }
      
      function walkDir(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory() && !entry.name.startsWith('.')) {
            walkDir(fullPath);
          } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
            checkFile(fullPath);
          }
        }
      }
      
      walkDir(srcDir);
      
      if (consoleCount > 0) {
        return { 
          success: false, 
          message: `Found ${consoleCount} console statements in ${files.length} files`,
          warning: true 
        };
      }
      
      return { success: true, message: 'No console statements found' };
    }
  },

  // Check for TODO comments
  checkTodos: {
    name: 'TODO Comments',
    run: () => {
      const srcDir = path.join(process.cwd(), 'src');
      let todoCount = 0;
      const todos = [];
      
      function checkFile(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.includes('TODO') || line.includes('FIXME') || line.includes('HACK')) {
            todoCount++;
            todos.push({
              file: path.relative(process.cwd(), filePath),
              line: index + 1,
              text: line.trim()
            });
          }
        });
      }
      
      function walkDir(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory() && !entry.name.startsWith('.')) {
            walkDir(fullPath);
          } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
            checkFile(fullPath);
          }
        }
      }
      
      walkDir(srcDir);
      
      if (todoCount > 0) {
        return { 
          success: false, 
          message: `Found ${todoCount} TODO/FIXME comments`,
          warning: true,
          todos: todos.slice(0, 5) // Show first 5
        };
      }
      
      return { success: true, message: 'No TODO comments found' };
    }
  },

  // Check for accessibility issues
  checkAccessibility: {
    name: 'Accessibility',
    run: () => {
      const srcDir = path.join(process.cwd(), 'src');
      const issues = [];
      
      function checkFile(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for images without alt text
        if (/<img(?![^>]*alt=)[^>]*>/g.test(content)) {
          issues.push(`Missing alt text in ${path.relative(process.cwd(), filePath)}`);
        }
        
        // Check for onClick without keyboard handler
        if (/onClick(?![^}]*onKeyDown)/g.test(content)) {
          issues.push(`onClick without keyboard handler in ${path.relative(process.cwd(), filePath)}`);
        }
        
        // Check for missing aria-label on interactive elements
        if (/<button(?![^>]*aria-label)[^>]*>/g.test(content)) {
          issues.push(`Button without aria-label in ${path.relative(process.cwd(), filePath)}`);
        }
      }
      
      function walkDir(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory() && !entry.name.startsWith('.')) {
            walkDir(fullPath);
          } else if (entry.isFile() && /\.(tsx|jsx)$/.test(entry.name)) {
            checkFile(fullPath);
          }
        }
      }
      
      walkDir(srcDir);
      
      if (issues.length > 0) {
        return { 
          success: false, 
          message: `Found ${issues.length} accessibility issues`,
          warning: true,
          issues: issues.slice(0, 5)
        };
      }
      
      return { success: true, message: 'No major accessibility issues found' };
    }
  },

  // Check build
  checkBuild: {
    name: 'Next.js Build',
    run: () => {
      try {
        log('  Building project (this may take a minute)...', 'yellow');
        execSync('npm run build', { stdio: 'pipe' });
        return { success: true, message: 'Build successful' };
      } catch (error) {
        return { success: false, message: 'Build failed. Run: npm run build for details' };
      }
    }
  }
};

// Main execution
async function main() {
  log('\n🔍 Astral Field Project Validation', 'cyan');
  log('===================================\n', 'cyan');
  
  const results = [];
  let hasErrors = false;
  let hasWarnings = false;
  
  // Run all checks
  for (const [key, check] of Object.entries(checks)) {
    process.stdout.write(`Checking ${check.name}... `);
    
    try {
      const result = await check.run();
      results.push({ name: check.name, ...result });
      
      if (result.success) {
        log('✓', 'green');
      } else if (result.warning) {
        log('⚠', 'yellow');
        hasWarnings = true;
      } else {
        log('✗', 'red');
        hasErrors = true;
      }
      
      if (result.message) {
        log(`  ${result.message}`, result.success ? 'green' : result.warning ? 'yellow' : 'red');
      }
      
      if (result.details && !result.success) {
        // Show first few lines of details
        const lines = result.details.split('\n').slice(0, 5);
        lines.forEach(line => log(`    ${line}`, 'white'));
      }
      
      if (result.todos) {
        result.todos.forEach(todo => {
          log(`    ${todo.file}:${todo.line} - ${todo.text.substring(0, 50)}...`, 'yellow');
        });
      }
      
      if (result.issues) {
        result.issues.forEach(issue => {
          log(`    ${issue}`, 'yellow');
        });
      }
    } catch (error) {
      log('✗', 'red');
      log(`  Error: ${error.message}`, 'red');
      hasErrors = true;
    }
  }
  
  // Summary
  log('\n\n📊 Validation Summary', 'cyan');
  log('====================', 'cyan');
  
  const successCount = results.filter(r => r.success).length;
  const errorCount = results.filter(r => !r.success && !r.warning).length;
  const warningCount = results.filter(r => r.warning).length;
  
  log(`  ✓ Passed: ${successCount}/${results.length}`, 'green');
  if (warningCount > 0) {
    log(`  ⚠ Warnings: ${warningCount}`, 'yellow');
  }
  if (errorCount > 0) {
    log(`  ✗ Failed: ${errorCount}`, 'red');
  }
  
  if (hasErrors) {
    log('\n❌ Validation failed with errors', 'red');
    log('\nRun the following to fix:', 'cyan');
    log('  npm run fix-errors', 'cyan');
    process.exit(1);
  } else if (hasWarnings) {
    log('\n⚠️  Validation passed with warnings', 'yellow');
  } else {
    log('\n✅ All validations passed!', 'green');
  }
  
  log('\n📝 Recommendations:', 'cyan');
  log('  1. Run error fix script: npm run fix-errors', 'cyan');
  log('  2. Run tests: npm test', 'cyan');
  log('  3. Check bundle size: npm run analyze', 'cyan');
  log('  4. Run in production mode: npm run build && npm start', 'cyan');
}

// Run the script
main().catch(error => {
  log(`\n✗ Validation script failed: ${error.message}`, 'red');
  process.exit(1);
});