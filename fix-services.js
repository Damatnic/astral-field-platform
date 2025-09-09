#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Comprehensive TypeScript Services Fix Script
 * Fixes systematic corruption patterns in TypeScript files
 */

class TypeScriptFixer {
  constructor() {
    this.fixCount = 0;
    this.fileCount = 0;
    this.errors = [];
  }

  // Fix patterns in order of complexity to avoid conflicts
  applyFixes(content, filePath) {
    const originalContent = content;
    
    try {
      // 1. Fix 'use: client' -> 'use client'
      content = content.replace(/'use:\s*client'/g, "'use client'");
      
      // 2. Fix malformed export const declarations early
      content = content.replace(/export const (\w+) = \{,/g, '$1: {');
      content = content.replace(/const (\w+) = \{,/g, '$1: {');
      content = content.replace(/export const _(\w+) = \{/g, '$1: {');
      
      // 3. Fix broken object property patterns (most complex first)
      // Pattern: const varName = { -> varName: {
      content = content.replace(/const (\w+) = \{ ([^}]+) \}/g, '$1: { $2 }');
      
      // 4. Fix interface property declarations with trailing commas
      content = content.replace(/(\w+:\s*[^,;{}]+),(\s*(?:\n|$))/g, '$1;$2');
      
      // 5. Fix method declarations with semicolons instead of colons
      content = content.replace(/async\s+(\w+)\s*\([^)]*\);\s*Promise</g, 'async $1(params): Promise');
      content = content.replace(/async:\s*(\w+)\s*\(/g, 'async $1(');
      
      // 6. Fix private/public method declarations
      content = content.replace(/private:\s*async\s+/g, 'private async ');
      content = content.replace(/private:\s*(\w+)/g, 'private $1');
      
      // 7. Fix parameter concatenation issues
      content = content.replace(/(\w+):\s*string(\w+):/g, '$1: string, $2:');
      content = content.replace(/(\w+):\s*number(\w+):/g, '$1: number, $2:');
      
      // 8. Fix method signatures with semicolon instead of colon
      content = content.replace(/\)\s*;\s*Promise</g, '): Promise<');
      content = content.replace(/\)\s*;\s*(\w+)</g, '): $1<');
      
      // 9. Fix object property assignments with double commas
      content = content.replace(/:\s*([^,;{}]+),,/g, ': $1,');
      content = content.replace(/,,\s*}/g, ' }');
      
      // 10. Fix array type declarations
      content = content.replace(/Array<\{([^}]+),,\s*\}>/g, 'Array<{$1}>');
      
      // 11. Fix malformed property sequences
      // Pattern: property: type,, another: type -> property: type, another: type
      content = content.replace(/([a-zA-Z_$][a-zA-Z0-9_$]*):\s*([^,;}\n]+),,\s*([a-zA-Z_$][a-zA-Z0-9_$]*):/g, '$1: $2, $3:');
      
      // 12. Fix return type declarations
      content = content.replace(/\);\s*Promise</g, '): Promise<');
      
      // 13. Fix property declarations with comments and colons
      content = content.replace(/:\s*([^\/\n;,]+)\s*\/\/ ([^:]+):/g, ': $1; // $2');
      
      // 14. Fix interface closing patterns
      content = content.replace(/}\s*;\s*$/gm, '}');
      
      // 15. Fix specific patterns found in files
      content = content.replace(/playerId:\s*string\s*season:/g, 'playerId: string, season:');
      content = content.replace(/stringseason:/g, 'string, season:');
      content = content.replace(/numberseason:/g, 'number, season:');
      
      // 16. Fix broken line patterns with weird formatting
      content = content.replace(/wee,\s*k:/g, 'week:');
      content = content.replace(/nam,\s*e:/g, 'name:');
      content = content.replace(/typ,\s*e:/g, 'type:');
      content = content.replace(/tim,\s*e:/g, 'time:');
      
      // 17. Fix method parameter lists with concatenated types
      content = content.replace(/\(([^)]*?)(\w+):\s*(\w+)(\w+):\s*(\w+)/g, '($1$2: $3, $4: $5');
      
      // 18. Fix class method declarations
      content = content.replace(/class\s+(\w+)\s*\{\s*async:\s*/g, 'class $1 {\n  async ');
      
      // 19. Clean up consecutive commas and semicolons
      content = content.replace(/,\s*,/g, ',');
      content = content.replace(/;\s*;/g, ';');
      content = content.replace(/\{\s*,/g, '{');
      
      // 20. Fix malformed property sequences in objects
      content = content.replace(/(\w+):\s*([^,;\n}]+)(\w+):/g, '$1: $2,\n  $3:');
      
      // 21. Advanced fixes for specific corruption patterns
      // Fix broken const declarations in middle of interfaces
      content = content.replace(/export const (\w+) = \{([^}]*)\}/g, (match, varName, content) => {
        return `${varName}: {\n${content}\n}`;
      });
      
      // 22. Fix malformed method calls and async patterns
      content = content.replace(/async (\w+)\(([^)]*)\)([^{]*){/g, 'async $1($2)$3 {');
      
      // 23. Fix Promise return type patterns
      content = content.replace(/Promise<([^>]+)>\s*{/g, ': Promise<$1> {');
      
      // 24. Clean up syntax errors in property declarations
      content = content.replace(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*([^,;}\n]+)\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1: $2,\n  $3:');
      
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
        
        if (entry.isDirectory()) {
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
    console.log('🔧 Starting TypeScript Services Fix Script...\n');
    
    const servicesPath = path.join(__dirname, 'src', 'services');
    
    if (!fs.existsSync(servicesPath)) {
      console.error(`❌ Services directory not found: ${servicesPath}`);
      process.exit(1);
    }
    
    console.log(`📁 Processing directory: ${servicesPath}\n`);
    
    this.processDirectory(servicesPath);
    
    console.log('\n📊 Fix Summary:');
    console.log(`   Files processed: ${this.fileCount}`);
    console.log(`   Files fixed: ${this.fixCount}`);
    console.log(`   Errors: ${this.errors.length}`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      this.errors.forEach(error => console.log(`   ${error}`));
    }
    
    if (this.fixCount > 0) {
      console.log('\n✅ TypeScript services fixes completed successfully!');
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