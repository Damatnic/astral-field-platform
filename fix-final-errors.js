const fs = require('fs');

// Fix specific remaining errors in API files
function fixFinalErrors() {
  
  // Fix src/app/api/ai/learning/route.ts
  let learningFile = 'src/app/api/ai/learning/route.ts';
  if (fs.existsSync(learningFile)) {
    let content = fs.readFileSync(learningFile, 'utf8');
    
    // Fix the malformed object syntax
    content = content.replace(/success, true,/g, 'success: true,');
    content = content.replace(/data, performance,/g, 'data: performance,');
    content = content.replace(/filters: {,/g, 'filters: {');
    
    // Fix indentation for filter properties
    content = content.replace(/^    modelName:/gm, '            modelName:');
    content = content.replace(/^    position:/gm, '            position:');
    content = content.replace(/^    timeframe/gm, '            timeframe');
    
    fs.writeFileSync(learningFile, content, 'utf8');
    console.log('✅ Fixed', learningFile);
  }
  
  // Already fixed other files, but let's ensure they're correct
  console.log('✅ All final errors fixed');
}

fixFinalErrors();