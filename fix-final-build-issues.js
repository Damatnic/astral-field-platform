const fs = require('fs');

function fixFinalIssues() {
  const fixes = [
    {
      file: 'src/app/api/ai/draft/route.ts',
      patterns: [
        { from: /recUserTeamId:\s*count/g, to: 'recUserTeamId, count' }
      ]
    },
    {
      file: 'src/app/api/ai/learning/route.ts',
      patterns: [
        { from: /filters:\s*{,/g, to: 'filters: {' }
      ]
    },
    {
      file: 'src/app/api/ai/route.ts',
      patterns: [
        { from: /data:\s*{,/g, to: 'data: {' },
        { from: /summary:\s*{,/g, to: 'summary: {' },
        { from: /performance:\s*{,/g, to: 'performance: {' },
        { from: /data\s*{/g, to: 'data: {' }
      ]
    },
    {
      file: 'src/app/api/ai/trades/route.ts',
      patterns: [
        { from: /error\.messag,\s*\n\s*e:/g, to: 'error.message' }
      ]
    },
    {
      file: 'src/app/api/ai/waivers/route.ts',
      patterns: [
        { from: /error\.messag,\s*\n\s*e:/g, to: 'error.message' }
      ]
    }
  ];
  
  let totalFixes = 0;
  
  for (const fix of fixes) {
    if (fs.existsSync(fix.file)) {
      let content = fs.readFileSync(fix.file, 'utf8');
      let fileFixed = false;
      
      for (const pattern of fix.patterns) {
        const newContent = content.replace(pattern.from, pattern.to);
        if (newContent !== content) {
          content = newContent;
          fileFixed = true;
          totalFixes++;
        }
      }
      
      if (fileFixed) {
        fs.writeFileSync(fix.file, content, 'utf8');
        console.log(`✅ Fixed ${fix.file}`);
      }
    }
  }
  
  console.log(`\n✅ Applied ${totalFixes} fixes total`);
}

fixFinalIssues();