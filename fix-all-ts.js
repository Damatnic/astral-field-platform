#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Comprehensive TypeScript Project Fix Script
 * Fixes systematic corruption patterns in all TypeScript files
 */

class TypeScriptFixer {
  constructor() {
    this.fixCount = 0;
    this.fileCount = 0;
    this.errors = [];
  }

  applyFixes(content, filePath) {
    const originalContent = content;
    
    try {
      // 1. Fix 'use: client' -> 'use client'
      content = content.replace(/'use:\s*client'/g, "'use client'");
      
      // 2. Fix malformed export const declarations early
      content = content.replace(/export const (\w+) = \{,/g, '$1: {');
      content = content.replace(/const (\w+) = \{,/g, '$1: {');
      content = content.replace(/export const _(\w+) = \{/g, '$1: {');
      
      // 3. Fix broken import statements with colons
      content = content.replace(/(\w+):\s*(\w+),/g, '$1, $2,');
      content = content.replace(/validateQueryParams:\s*validateRequestBody,\s*queryParamsSchema:\s*createValidationErrorResponse/g, 
                              'validateQueryParams, validateRequestBody, queryParamsSchema, createValidationErrorResponse');
      
      // 4. Fix object property syntax issues
      content = content.replace(/metrics,\s*aggregateStats:\s*timeWindow:\s*timeWindow/g, 'metrics, aggregateStats: timeWindow');
      
      // 5. Fix malformed object literals in code
      content = content.replace(/type\s+"([^"]+)"/g, 'type: "$1"');
      
      // 6. Fix interface property declarations with commas instead of semicolons
      content = content.replace(/(\w+):\s*string;,/g, '$1: string;');
      content = content.replace(/(\w+):\s*number;,/g, '$1: number;');
      
      // 7. Fix array declarations with leading semicolons
      content = content.replace(/=\s*\[;/g, '= [');
      
      // 8. Fix broken line patterns with weird formatting
      content = content.replace(/wee,\s*k:/g, 'week:');
      content = content.replace(/nam,\s*e:/g, 'name:');
      content = content.replace(/typ,\s*e:/g, 'type:');
      content = content.replace(/tim,\s*e:/g, 'time:');
      
      // 9. Fix method declarations with semicolons instead of colons
      content = content.replace(/async\s+(\w+)\s*\([^)]*\);\s*Promise</g, 'async $1(params): Promise');
      content = content.replace(/async:\s*(\w+)\s*\(/g, 'async $1(');
      
      // 10. Fix private/public method declarations
      content = content.replace(/private:\s*async\s+/g, 'private async ');
      content = content.replace(/private:\s*(\w+)/g, 'private $1');
      
      // 11. Fix parameter concatenation issues
      content = content.replace(/(\w+):\s*string(\w+):/g, '$1: string, $2:');
      content = content.replace(/(\w+):\s*number(\w+):/g, '$1: number, $2:');
      
      // 12. Fix method signatures with semicolon instead of colon
      content = content.replace(/\)\s*;\s*Promise</g, '): Promise<');
      content = content.replace(/\)\s*;\s*(\w+)</g, '): $1<');
      
      // 13. Fix object property assignments with double commas
      content = content.replace(/:\s*([^,;{}]+),,/g, ': $1,');
      content = content.replace(/,,\s*}/g, ' }');
      
      // 14. Fix array type declarations
      content = content.replace(/Array<\{([^}]+),,\s*\}>/g, 'Array<{$1}>');
      
      // 15. Fix malformed property sequences
      content = content.replace(/([a-zA-Z_$][a-zA-Z0-9_$]*):\s*([^,;}\n]+),,\s*([a-zA-Z_$][a-zA-Z0-9_$]*):/g, '$1: $2, $3:');
      
      // 16. Fix return type declarations
      content = content.replace(/\);\s*Promise</g, '): Promise<');
      
      // 17. Fix property declarations with comments and colons
      content = content.replace(/:\s*([^\/\n;,]+)\s*\/\/ ([^:]+):/g, ': $1; // $2');
      
      // 18. Fix interface closing patterns
      content = content.replace(/}\s*;\s*$/gm, '}');
      
      // 19. Fix specific patterns found in files
      content = content.replace(/playerId:\s*string\s*season:/g, 'playerId: string, season:');
      content = content.replace(/stringseason:/g, 'string, season:');
      content = content.replace(/numberseason:/g, 'number, season:');
      
      // 20. Fix method parameter lists with concatenated types
      content = content.replace(/\(([^)]*?)(\w+):\s*(\w+)(\w+):\s*(\w+)/g, '($1$2: $3, $4: $5');
      
      // 21. Fix class method declarations
      content = content.replace(/class\s+(\w+)\s*\{\s*async:\s*/g, 'class $1 {\n  async ');
      
      // 22. Clean up consecutive commas and semicolons
      content = content.replace(/,\s*,/g, ',');
      content = content.replace(/;\s*;/g, ';');
      content = content.replace(/\{\s*,/g, '{');
      
      // 23. Fix malformed property sequences in objects
      content = content.replace(/(\w+):\s*([^,;\n}]+)(\w+):/g, '$1: $2,\n  $3:');
      
      // 24. Fix broken const declarations in middle of interfaces
      content = content.replace(/export const (\w+) = \{([^}]*)\}/g, (match, varName, content) => {
        return `${varName}: {\n${content}\n}`;
      });
      
      // 25. Fix malformed method calls and async patterns
      content = content.replace(/async (\w+)\(([^)]*)\)([^{]*){/g, 'async $1($2)$3 {');
      
      // 26. Fix Promise return type patterns
      content = content.replace(/Promise<([^>]+)>\s*{/g, ': Promise<$1> {');
      
      // 27. Clean up syntax errors in property declarations
      content = content.replace(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*([^,;}\n]+)\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1: $2,\n  $3:');
      
      // 28. Fix double Promise return type declarations
      content = content.replace(/:\s*:\s*Promise</g, ': Promise<');
      
      // 29. Fix syntax errors in object properties within interfaces
      content = content.replace(/\s*;\s*,/g, ',');
      content = content.replace(/\s*,\s*;/g, ';');
      
      // 30. Fix trailing semicolons and commas in wrong places
      content = content.replace(/,(\s*})/g, '$1');
      
      if (content !== originalContent) {
        this.fixCount++;
      }
      
      return content;
    } catch (error) {
      this.errors.push(`Error fixing ${filePath}: ${error.message}`);
      return originalContent;
    }
  }

  processFile(filePath) {
    try {
      console.log(`Processing: ${filePath}`);
      
      const content = fs.readFileSync(filePath, 'utf8');
      const fixedContent = this.applyFixes(content, filePath);
      
      if (content !== fixedContent) {
        fs.writeFileSync(filePath, fixedContent, 'utf8');
        console.log(`✓ Fixed: ${filePath}`);
      } else {
        console.log(`  No changes needed: ${filePath}`);
      }
      
      this.fileCount++;
    } catch (error) {
      this.errors.push(`Failed to process ${filePath}: ${error.message}`);
      console.error(`✗ Error processing ${filePath}: ${error.message}`);
    }
  }

  processDirectory(dirPath) {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          this.processDirectory(fullPath);
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
          this.processFile(fullPath);
        }
      }
    } catch (error) {
      this.errors.push(`Failed to read directory ${dirPath}: ${error.message}`);
      console.error(`✗ Error reading directory ${dirPath}: ${error.message}`);
    }
  }

  run() {
    console.log('🔧 Starting Comprehensive TypeScript Fix Script...\n');
    
    const projectRoot = __dirname;
    const srcPath = path.join(projectRoot, 'src');
    
    if (!fs.existsSync(srcPath)) {
      console.error(`❌ Source directory not found: ${srcPath}`);
      process.exit(1);
    }
    
    console.log(`📁 Processing directory: ${srcPath}\n`);
    
    this.processDirectory(srcPath);
    
    console.log('\n📊 Fix Summary:');
    console.log(`   Files processed: ${this.fileCount}`);
    console.log(`   Files fixed: ${this.fixCount}`);
    console.log(`   Errors: ${this.errors.length}`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      this.errors.forEach(error => console.log(`   ${error}`));
    }
    
    if (this.fixCount > 0) {
      console.log('\n✅ TypeScript fixes completed successfully!');
      console.log('   Run `npm run build` or `tsc` to verify the fixes.');
    } else {
      console.log('\n✅ All files were already properly formatted.');
    }
  }
}

// Run the fixer
if (require.main === module) {
  const fixer = new TypeScriptFixer();
  fixer.run();
}

module.exports = TypeScriptFixer;