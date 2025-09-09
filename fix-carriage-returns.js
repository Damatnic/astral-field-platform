const fs = require('fs');
const path = require('path');

function fixFiles() {
  const files = [
    'src/app/api/ai/learning/route.ts',
    'src/app/api/ai/route.ts',
    'src/app/api/ai/trades/route.ts',
    'src/app/api/ai/waivers/route.ts',
    'src/app/api/analytics/component-performance/route.ts'
  ];
  
  files.forEach(file => {
    if (fs.existsSync(file)) {
      let content = fs.readFileSync(file, 'utf8');
      
      // Remove carriage returns and fix patterns
      content = content.replace(/\r/g, '');
      
      // Fix specific patterns
      content = content.replace(/filters:\s*{\s*,/g, 'filters: {');
      content = content.replace(/data:\s*{\s*,/g, 'data: {');
      content = content.replace(/summary:\s*{\s*,/g, 'summary: {');
      content = content.replace(/performance:\s*{\s*,/g, 'performance: {');
      
      // Fix trades route
      content = content.replace(/proposedPlayers:\s*requestedPlayers/g, 'proposedPlayers, requestedPlayers');
      
      // Fix waivers route
      content = content.replace(/error\.message\s+'Unknown error'/g, "error.message : 'Unknown error'");
      
      // Fix component-performance route
      content = content.replace(/const bod,\s*\n\s*y: ComponentMetric/g, 'const body: ComponentMetric');
      
      fs.writeFileSync(file, content, 'utf8');
      console.log(`✅ Fixed ${file}`);
    }
  });
}

fixFiles();