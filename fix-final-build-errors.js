const fs = require('fs');

function fixFinalBuildErrors() {
  // Fix AI route
  let aiFile = 'src/app/api/ai/route.ts';
  if (fs.existsSync(aiFile)) {
    let content = fs.readFileSync(aiFile, 'utf8');
    
    // Fix the error message
    content = content.replace(/{ error: 'Invalid operation type\.Us,\s*\n\s*e: test_connection'/g, "{ error: 'Invalid operation type. Use: test_connection'");
    
    fs.writeFileSync(aiFile, content, 'utf8');
    console.log('✅ Fixed', aiFile);
  }
  
  // Fix waivers route
  let waiversFile = 'src/app/api/ai/waivers/route.ts';
  if (fs.existsSync(waiversFile)) {
    let content = fs.readFileSync(waiversFile, 'utf8');
    
    // Fix parameter syntax
    content = content.replace(/customTeamId:\s*availablePlayers/g, 'customTeamId, availablePlayers');
    
    fs.writeFileSync(waiversFile, content, 'utf8');
    console.log('✅ Fixed', waiversFile);
  }
  
  // Fix component-performance route
  let compFile = 'src/app/api/analytics/component-performance/route.ts';
  if (fs.existsSync(compFile)) {
    let content = fs.readFileSync(compFile, 'utf8');
    
    // Fix object property syntax
    content = content.replace(/totalComponents,\s*0,/g, 'totalComponents: 0,');
    
    fs.writeFileSync(compFile, content, 'utf8');
    console.log('✅ Fixed', compFile);
  }
  
  // Fix performance route
  let perfFile = 'src/app/api/analytics/performance/route.ts';
  if (fs.existsSync(perfFile)) {
    let content = fs.readFileSync(perfFile, 'utf8');
    
    // Fix object property syntax
    content = content.replace(/totalSamples,\s*0,/g, 'totalSamples: 0,');
    content = content.replace(/avgLoadTime,\s*0,/g, 'avgLoadTime: 0,');
    content = content.replace(/avgFirstContentfulPaint,\s*0,/g, 'avgFirstContentfulPaint: 0,');
    content = content.replace(/avgLargestContentfulPaint,\s*0,/g, 'avgLargestContentfulPaint: 0,');
    
    fs.writeFileSync(perfFile, content, 'utf8');
    console.log('✅ Fixed', perfFile);
  }
  
  console.log('✅ All final build errors fixed');
}

fixFinalBuildErrors();