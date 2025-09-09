const fs = require('fs');
const path = require('path');

function fixRemainingIssues() {
  // Files that need fixing based on the error messages
  const files = [
    'C:\\Users\\damat\\_REPOS\\astral-field\\src\\app\\api\\ai\\breakouts\\route.ts',
    'C:\\Users\\damat\\_REPOS\\astral-field\\src\\app\\api\\ai\\draft\\route.ts',
    'C:\\Users\\damat\\_REPOS\\astral-field\\src\\app\\api\\ai\\injuries\\route.ts',
    'C:\\Users\\damat\\_REPOS\\astral-field\\src\\app\\api\\ai\\learning\\route.ts',
    'C:\\Users\\damat\\_REPOS\\astral-field\\src\\app\\api\\ai\\predictions\\route.ts'
  ];

  let totalFixed = 0;

  files.forEach(filePath => {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }
    
    try {
      let content = fs.readFileSync(filePath, 'utf-8');
      const originalContent = content;
      
      // Fix broken string literals that span lines
      content = content.replace(/'Missing required paramete,\s*r:\s*playerId'/g, "'Missing required parameter: playerId'");
      content = content.replace(/'Missing required paramete,\s*r:\s*pickNumber'/g, "'Missing required parameter: pickNumber'");
      content = content.replace(/'Missing required parameter,\s*s:\s*position and injuryType'/g, "'Missing required parameters: position and injuryType'");
      
      // Fix broken function calls
      content = content.replace(/getModelPerformance\(\s*;\s*modelName/g, 'getModelPerformance(modelName');
      
      // Fix array syntax
      content = content.replace(/z\.discriminatedUnion\('type',\s*\[\s*;\s*recordOutcomeSchema,/g, "z.discriminatedUnion('type', [recordOutcomeSchema,");
      
      // Fix duplicate variable declarations
      const lines = content.split('\n');
      const fixedLines = [];
      const declaredVars = new Set();
      
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        // Check for variable declarations
        const varMatch = line.match(/const\s+{\s*([^}]+)\s*}\s*=/);
        if (varMatch) {
          const vars = varMatch[1].split(',').map(v => v.trim().split(':')[0].trim());
          const newVars = vars.filter(v => {
            if (declaredVars.has(v)) {
              return false; // Skip already declared variable
            }
            declaredVars.add(v);
            return true;
          });
          
          if (newVars.length === 0) {
            continue; // Skip this line entirely if all vars are already declared
          } else if (newVars.length !== vars.length) {
            // Rebuild the line with only new variables
            line = line.replace(varMatch[1], newVars.join(', '));
          }
        }
        
        fixedLines.push(line);
      }
      
      content = fixedLines.join('\n');
      
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`✅ Fixed: ${path.basename(filePath)}`);
        totalFixed++;
      } else {
        console.log(`⚪ No changes needed: ${path.basename(filePath)}`);
      }
      
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  });

  console.log(`\n🎉 Fixed ${totalFixed} files out of ${files.length} total files`);
}

fixRemainingIssues();