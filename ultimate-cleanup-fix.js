const fs = require('fs');
const path = require('path');

function ultimateCleanupFix() {
  // Define the exact files with errors and their precise fixes
  const fixes = [
    {
      file: 'C:\\Users\\damat\\_REPOS\\astral-field\\src\\components\\league\\LeagueNavigation.tsx',
      patterns: [
        { find: /Shuffle: BarChart3,/g, replace: 'Shuffle, BarChart3,' },
        { find: /MessageCircle: Crown,/g, replace: 'MessageCircle, Crown,' },
        { find: /Vote: MessageSquare,/g, replace: 'Vote, MessageSquare,' },
        { find: /Award: BookOpen,/g, replace: 'Award, BookOpen,' }
      ]
    },
    {
      file: 'C:\\Users\\damat\\_REPOS\\astral-field\\src\\app\\api\\ai\\breakouts\\route.ts',
      patterns: [
        { find: /success: true: data, playerBreakout,/g, replace: 'success: true, data: playerBreakout,' }
      ]
    },
    {
      file: 'C:\\Users\\damat\\_REPOS\\astral-field\\src\\app\\api\\ai\\draft\\route.ts',
      patterns: [
        { find: /leagueId: teamId, pickNumber,/g, replace: 'leagueId, teamId, pickNumber,' }
      ]
    },
    {
      file: 'C:\\Users\\damat\\_REPOS\\astral-field\\src\\app\\api\\ai\\injuries\\route.ts',
      patterns: [
        { find: /success: true: data, strategy,/g, replace: 'success: true, data: strategy,' }
      ]
    },
    {
      file: 'C:\\Users\\damat\\_REPOS\\astral-field\\src\\app\\api\\ai\\learning\\route.ts',
      patterns: [
        { find: /filters: {,/g, replace: 'filters: {' }
      ]
    }
  ];

  let totalFixed = 0;

  fixes.forEach(({ file, patterns }) => {
    if (!fs.existsSync(file)) {
      console.log(`⚠️  File not found: ${file}`);
      return;
    }
    
    try {
      let content = fs.readFileSync(file, 'utf-8');
      const originalContent = content;
      let changed = false;
      
      patterns.forEach(({ find, replace }) => {
        if (find.test(content)) {
          content = content.replace(find, replace);
          changed = true;
        }
      });
      
      if (changed) {
        fs.writeFileSync(file, content, 'utf-8');
        console.log(`✅ Fixed: ${path.basename(file)}`);
        totalFixed++;
      } else {
        console.log(`⚪ No changes needed: ${path.basename(file)}`);
      }
      
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  });

  console.log(`\n🎉 Fixed ${totalFixed} files out of ${fixes.length} total files`);
}

ultimateCleanupFix();