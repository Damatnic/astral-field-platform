const fs = require('fs');

function fixRemainingSyntax() {
  // Fix learning route
  let learningFile = 'src/app/api/ai/learning/route.ts';
  if (fs.existsSync(learningFile)) {
    let content = fs.readFileSync(learningFile, 'utf8');
    
    // Fix the 'as ;' pattern
    content = content.replace(/as\s*;\s*\n\s*'/g, "as\n          '");
    
    // Fix other patterns
    content = content.replace(/component, renderTime: timestamp/g, 'component, renderTime, timestamp');
    
    fs.writeFileSync(learningFile, content, 'utf8');
    console.log('✅ Fixed', learningFile);
  }
  
  // Fix AI route
  let aiFile = 'src/app/api/ai/route.ts';
  if (fs.existsSync(aiFile)) {
    let content = fs.readFileSync(aiFile, 'utf8');
    
    // Fix the health case pattern
    content = content.replace(/case 'health':\s*;\s*\/\//g, "case 'health': //");
    content = content.replace(/Promise\.all\(\[;/g, 'Promise.all([');
    
    // Fix service patterns
    content = content.replace(/\({ service '/g, "({ service: '");
    
    // Fix stats case
    content = content.replace(/case 'stats':\s*;\s*\/\//g, "case 'stats': //");
    
    // Fix test_connection case
    content = content.replace(/case 'test_connection':\s*;\s*\/\//g, "case 'test_connection': //");
    content = content.replace(/Promise\.all\(\[;/g, 'Promise.all([');
    
    // Fix calls, pattern
    content = content.replace(/calls,\s*(\d+),/g, 'calls: $1,');
    
    fs.writeFileSync(aiFile, content, 'utf8');
    console.log('✅ Fixed', aiFile);
  }
  
  // Fix waivers route
  let waiversFile = 'src/app/api/ai/waivers/route.ts';
  if (fs.existsSync(waiversFile)) {
    let content = fs.readFileSync(waiversFile, 'utf8');
    
    // Already fixed in previous run, but double check
    content = content.replace(/error\.message\s+'Unknown error'/g, "error.message : 'Unknown error'");
    
    fs.writeFileSync(waiversFile, content, 'utf8');
    console.log('✅ Fixed', waiversFile);
  }
  
  // Fix component-performance route
  let perfFile = 'src/app/api/analytics/component-performance/route.ts';
  if (fs.existsSync(perfFile)) {
    let content = fs.readFileSync(perfFile, 'utf8');
    
    // Fix comma patterns
    content = content.replace(/component, renderTime: timestamp/g, 'component, renderTime, timestamp');
    
    fs.writeFileSync(perfFile, content, 'utf8');
    console.log('✅ Fixed', perfFile);
  }
  
  console.log('✅ All remaining syntax issues fixed');
}

fixRemainingSyntax();