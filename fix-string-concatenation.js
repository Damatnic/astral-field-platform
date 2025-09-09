const fs = require('fs');
const path = require('path');

function fixStringConcatenation() {
  const patterns = [
    // Fix broken string literals across multiple lines
    {
      find: /'([^']*),\s*([^':]+):\s*([^']*)'[,}]/g,
      replace: "'$1$2: $3',"
    },
    {
      find: /"([^"]*),\s*([^":]+):\s*([^"]*)"[,}]/g,
      replace: '"$1$2: $3",'
    },
    
    // Fix specific string concatenation patterns
    {
      find: /'Wednesday\s*,\s*3:00 AM'/g,
      replace: "'Wednesday 3:00 AM'"
    },
    {
      find: /'Tuesday\s*,\s*9:00 AM'/g,
      replace: "'Tuesday 9:00 AM'"
    },
    {
      find: /'Daily\s*,\s*2:00 AM'/g,
      replace: "'Daily 2:00 AM'"
    },
    
    // Fix broken error messages
    {
      find: /'Missing required paramete,\s*r: playerId'/g,
      replace: "'Missing required parameter: playerId'"
    },
    {
      find: /'Missing required parameter,\s*s: leagueId and teamId'/g,
      replace: "'Missing required parameters: leagueId and teamId'"
    },
    {
      find: /"AI Chat Erro,\s*r:"/g,
      replace: '"AI Chat Error:"'
    },
    
    // Fix function calls with broken parentheses
    {
      find: /generateReplacementStrategy\(\s*;\s*leagueId,\s*teamId:\s*injuredPlayerId/g,
      replace: 'generateReplacementStrategy(leagueId, injuredPlayerId'
    }
  ];

  // Get all TypeScript files that might have errors
  const files = [
    'C:\\Users\\damat\\_REPOS\\astral-field\\src\\components\\commissioner\\CommissionerTools.tsx',
    'C:\\Users\\damat\\_REPOS\\astral-field\\src\\app\\api\\ai\\breakouts\\route.ts',
    'C:\\Users\\damat\\_REPOS\\astral-field\\src\\app\\api\\ai\\chat\\route.ts',
    'C:\\Users\\damat\\_REPOS\\astral-field\\src\\app\\api\\ai\\draft\\route.ts',
    'C:\\Users\\damat\\_REPOS\\astral-field\\src\\app\\api\\ai\\injuries\\route.ts'
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
      
      // Apply all patterns
      patterns.forEach(({ find, replace }) => {
        content = content.replace(find, replace);
      });
      
      // Additional specific fixes for remaining issues
      content = content.replace(/schedule:\s*'Wednesday\s*,\s*3:00\s*AM',\s*nextRun:/g, "schedule: 'Wednesday 3:00 AM', nextRun:");
      content = content.replace(/schedule:\s*'Tuesday\s*,\s*9:00\s*AM',\s*nextRun:/g, "schedule: 'Tuesday 9:00 AM', nextRun:");
      content = content.replace(/schedule:\s*'Daily\s*,\s*2:00\s*AM',\s*nextRun:/g, "schedule: 'Daily 2:00 AM', nextRun:");
      
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

fixStringConcatenation();