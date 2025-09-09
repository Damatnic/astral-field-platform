const fs = require('fs');
const path = require('path');

// Define specific files and their exact fixes
const fixes = [
  {
    file: 'C:\\Users\\damat\\_REPOS\\astral-field\\src\\components\\commissioner\\CommissionerTools.tsx',
    patterns: [
      {
        find: /timestamp: "2024-12-01T1,\s*0:00:00Z"/g,
        replace: 'timestamp: "2024-12-01T10:00:00Z"'
      },
      {
        find: /timestamp: "2024-12-01,\s*T08:30:00Z"/g,
        replace: 'timestamp: "2024-12-01T08:30:00Z"'
      }
    ]
  },
  {
    file: 'C:\\Users\\damat\\_REPOS\\astral-field\\src\\app\\api\\admin\\audit-logs\\route.ts',
    patterns: [
      {
        find: /olderThan z\.string\(\)\.datetime\(\)\.optional\(\)/g,
        replace: 'olderThan: z.string().datetime().optional()'
      }
    ]
  },
  {
    file: 'C:\\Users\\damat\\_REPOS\\astral-field\\src\\app\\api\\admin\\rate-limit-metrics\\route.ts',
    patterns: [
      {
        find: /error\.messag,\s*e: 'Unknown error'/g,
        replace: "error.message : 'Unknown error'"
      }
    ]
  },
  {
    file: 'C:\\Users\\damat\\_REPOS\\astral-field\\src\\app\\api\\ai\\breakouts\\route.ts',
    patterns: [
      {
        find: /\.filter\(\s*;\s*breakout =>/g,
        replace: '.filter(breakout =>'
      }
    ]
  },
  {
    file: 'C:\\Users\\damat\\_REPOS\\astral-field\\src\\app\\api\\ai\\chat\\route.ts',
    patterns: [
      {
        find: /getCompletion\(\s*;\s*`/g,
        replace: 'getCompletion(`'
      }
    ]
  }
];

function fixSpecificErrors() {
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

fixSpecificErrors();