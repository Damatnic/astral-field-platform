const fs = require('fs');
const path = require('path');

// Enhanced fix script for remaining TypeScript errors
function fixTypeFiles() {
  const files = [
    'src/types/database.ts',
    'src/types/fantasy.ts',
    'src/app/api/community/threads/route.ts'
  ];
  
  let totalFixes = 0;
  
  files.forEach(filePath => {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let originalContent = content;
      let fixCount = 0;
      
      // Fix database.ts specific issues
      if (filePath.includes('database.ts')) {
        // Fix line 6: { [key: string]; Json | undefined } -> { [key: string]: Json | undefined }
        content = content.replace(/\{ \[key: string\]; Json/g, () => {
          fixCount++;
          return '{ [key: string]: Json';
        });
        
        // Fix line 1156: standalone "type string;" -> "type: string;"
        content = content.replace(/^\s*type string;/gm, () => {
          fixCount++;
          return '          type: string;';
        });
        
        // Fix malformed property patterns
        content = content.replace(/^(\s+)(\w+)\s+string;/gm, (match, indent, propName) => {
          fixCount++;
          return `${indent}${propName}: string;`;
        });
        
        content = content.replace(/^(\s+)(\w+)\s+number;/gm, (match, indent, propName) => {
          fixCount++;
          return `${indent}${propName}: number;`;
        });
        
        content = content.replace(/^(\s+)(\w+)\s+boolean;/gm, (match, indent, propName) => {
          fixCount++;
          return `${indent}${propName}: boolean;`;
        });
      }
      
      // Fix route.ts specific issues - malformed async patterns
      if (filePath.includes('route.ts')) {
        // Fix: try { await: client.query -> try { await client.query
        content = content.replace(/try \{ await: /g, () => {
          fixCount++;
          return 'try { await ';
        });
        
        // Fix: } catch (error) { await: client.query -> } catch (error) { await client.query
        content = content.replace(/\} catch \(error\) \{ await: /g, () => {
          fixCount++;
          return '} catch (error) { await ';
        });
        
        // Fix standalone colon issues in SQL VALUES
        content = content.replace(/VALUES \([^)]+\): VALUES/g, (match) => {
          fixCount++;
          return match.replace('): VALUES', ') VALUES');
        });
        
        // Fix paramCounter.+ 1 -> paramCounter + 1
        content = content.replace(/paramCounter\.\+ 1/g, () => {
          fixCount++;
          return 'paramCounter + 1';
        });
        
        // Fix FILTER patterns
        content = content.replace(/ARRAY_AGG\(([^)]+)\): FILTER/g, (match, p1) => {
          fixCount++;
          return `ARRAY_AGG(${p1}) FILTER`;
        });
        
        // Fix WHERE patterns with colons
        content = content.replace(/GREATEST\(([^)]+)\): WHERE/g, (match, p1) => {
          fixCount++;
          return `GREATEST(${p1}) WHERE`;
        });
      }
      
      // Common fixes for all files
      // Fix trailing semicolons in interface definitions
      content = content.replace(/;(\s*\|)/g, (match, p1) => {
        fixCount++;
        return p1;
      });
      
      // Fix Json array pattern
      content = content.replace(/Json\[\];/g, () => {
        fixCount++;
        return 'Json[]';
      });
      
      // Fix malformed property patterns with space before colon
      content = content.replace(/(\w+)\s+:\s+(\w+)/g, (match, p1, p2) => {
        // Only fix if it looks like a property definition
        if (/^[a-z_][a-zA-Z0-9_]*$/.test(p1) && /^[A-Z][a-zA-Z0-9_]*$/.test(p2)) {
          fixCount++;
          return `${p1}: ${p2}`;
        }
        return match;
      });
      
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Fixed ${fixCount} issues in ${filePath}`);
        totalFixes += fixCount;
      }
    } catch (err) {
      console.error(`Error processing ${filePath}:`, err.message);
    }
  });
  
  return totalFixes;
}

// Main execution
console.log('🔧 Running enhanced TypeScript fixes...\n');
const fixes = fixTypeFiles();
console.log(`\n✨ Total fixes applied: ${fixes}`);