const fs = require('fs');
const path = require('path');

function fixApiFiles() {
  const fixes = [
    {
      file: 'src/app/api/ai/injuries/route.ts',
      patterns: [
        { from: /success,\s*\n\s*false,/g, to: 'success: false,' },
        { from: /success,\s*false,/g, to: 'success: false,' }
      ]
    },
    {
      file: 'src/app/api/ai/learning/route.ts',
      patterns: [
        { from: /filters: {,/g, to: 'filters: {' },
        { from: /data, insights,/g, to: 'data: insights,' },
        { from: /data, weights,/g, to: 'data: weights,' },
        { from: /data, healthCheck,/g, to: 'data: healthCheck,' },
        { from: /data, batchResults,/g, to: 'data: batchResults,' },
        { from: /data, enhancedPrediction,/g, to: 'data: enhancedPrediction,' },
        { from: /data, batchPredictions,/g, to: 'data: batchPredictions,' },
        { from: /enhanced, true,/g, to: 'enhanced: true,' },
        { from: /success, false/g, to: 'success: false' },
        { from: /actualPoints: factors/g, to: 'actualPoints,\n          factors' },
        { from: /wee,\s*\n\s*k: enhancedWeek/g, to: 'week: enhancedWeek' },
        { from: /wee,\s*\n\s*k: batchWeek/g, to: 'week: batchWeek' },
        { from: /playerIds, batchPlayerIds,/g, to: 'playerIds: batchPlayerIds,' }
      ]
    },
    {
      file: 'src/app/api/ai/predictions/route.ts', 
      patterns: [
        { from: /success,\s*\n\s*true,/g, to: 'success: true,' },
        { from: /success,\s*true,/g, to: 'success: true,' },
        { from: /data,\s*\n\s*prediction,/g, to: 'data: prediction,' }
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

fixApiFiles();