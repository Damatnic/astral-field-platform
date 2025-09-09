const fs = require('fs');

// Fix the absolute final issues
function fixAbsoluteFinal() {
  
  // Fix learning route
  let learningFile = 'src/app/api/ai/learning/route.ts';
  if (fs.existsSync(learningFile)) {
    let content = fs.readFileSync(learningFile, 'utf8');
    
    // Fix the {, pattern
    content = content.replace(/filters:\s*{,/g, 'filters: {');
    
    fs.writeFileSync(learningFile, content, 'utf8');
    console.log('✅ Fixed', learningFile);
  }
  
  // Fix AI route
  let aiFile = 'src/app/api/ai/route.ts';
  if (fs.existsSync(aiFile)) {
    let content = fs.readFileSync(aiFile, 'utf8');
    
    // Fix data: {, pattern
    content = content.replace(/data:\s*{,/g, 'data: {');
    content = content.replace(/summary:\s*{,/g, 'summary: {');
    content = content.replace(/performance:\s*{,/g, 'performance: {');
    
    // Fix property patterns
    content = content.replace(/totalPredictions,\s*15420,/g, 'totalPredictions: 15420,');
    content = content.replace(/activeUsers,\s*342,/g, 'activeUsers: 342,');
    content = content.replace(/apiCalls24h,\s*1852,/g, 'apiCalls24h: 1852,');
    
    fs.writeFileSync(aiFile, content, 'utf8');
    console.log('✅ Fixed', aiFile);
  }
  
  console.log('✅ All absolute final errors fixed');
}

fixAbsoluteFinal();