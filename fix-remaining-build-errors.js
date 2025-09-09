const fs = require('fs');

function fixRemainingErrors() {
  // Fix src/app/api/ai/injuries/route.ts
  let injuriesFile = 'src/app/api/ai/injuries/route.ts';
  if (fs.existsSync(injuriesFile)) {
    let content = fs.readFileSync(injuriesFile, 'utf8');
    
    // Fix the malformed success, false pattern
    content = content.replace(/success,\s*\n\s*false,/g, 'success: false,');
    
    fs.writeFileSync(injuriesFile, content, 'utf8');
    console.log('✅ Fixed', injuriesFile);
  }
  
  // Fix src/app/api/ai/learning/route.ts 
  let learningFile = 'src/app/api/ai/learning/route.ts';
  if (fs.existsSync(learningFile)) {
    let content = fs.readFileSync(learningFile, 'utf8');
    
    // Fix the malformed filters object
    content = content.replace(/filters: {,/g, 'filters: {');
    
    fs.writeFileSync(learningFile, content, 'utf8');
    console.log('✅ Fixed', learningFile);
  }
  
  // Fix src/app/api/ai/predictions/route.ts
  let predictionsFile = 'src/app/api/ai/predictions/route.ts';
  if (fs.existsSync(predictionsFile)) {
    let content = fs.readFileSync(predictionsFile, 'utf8');
    
    // Fix the malformed success pattern
    content = content.replace(/success,\s*\n\s*true,/g, 'success: true,');
    content = content.replace(/data,\s*\n\s*prediction,/g, 'data: prediction,');
    
    fs.writeFileSync(predictionsFile, content, 'utf8');
    console.log('✅ Fixed', predictionsFile);
  }
  
  console.log('✅ All remaining build errors fixed');
}

fixRemainingErrors();