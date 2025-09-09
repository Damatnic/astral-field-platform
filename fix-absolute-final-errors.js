const fs = require('fs');

function fixAbsoluteFinalErrors() {
  // Fix learning route - rename duplicate playerId
  let learningFile = 'src/app/api/ai/learning/route.ts';
  if (fs.existsSync(learningFile)) {
    let content = fs.readFileSync(learningFile, 'utf8');
    
    // Fix duplicate playerId declaration
    content = content.replace(/const { playerId, enhancedPlayerId,/g, 'const { playerId: enhancedPlayerId,');
    
    fs.writeFileSync(learningFile, content, 'utf8');
    console.log('✅ Fixed', learningFile);
  }
  
  // Fix waivers route - rename duplicate leagueId
  let waiversFile = 'src/app/api/ai/waivers/route.ts';
  if (fs.existsSync(waiversFile)) {
    let content = fs.readFileSync(waiversFile, 'utf8');
    
    // Fix duplicate leagueId declaration
    content = content.replace(/const { leagueId, batchLeagueId:/g, 'const { leagueId: batchLeagueId,');
    
    fs.writeFileSync(waiversFile, content, 'utf8');
    console.log('✅ Fixed', waiversFile);
  }
  
  // Fix analytics route
  let analyticsFile = 'src/app/api/analytics/route.ts';
  if (fs.existsSync(analyticsFile)) {
    let content = fs.readFileSync(analyticsFile, 'utf8');
    
    // Fix object syntax
    content = content.replace(/totalUsers,\s*1247,/g, 'totalUsers: 1247,');
    content = content.replace(/activeLeagues,\s*23,/g, 'activeLeagues: 23,');
    content = content.replace(/totalGames,\s*156,/g, 'totalGames: 156,');
    
    fs.writeFileSync(analyticsFile, content, 'utf8');
    console.log('✅ Fixed', analyticsFile);
  }
  
  // Fix enterprise login route
  let loginFile = 'src/app/api/auth/enterprise/login/route.ts';
  if (fs.existsSync(loginFile)) {
    let content = fs.readFileSync(loginFile, 'utf8');
    
    // Fix parameter syntax
    content = content.replace(/sessionId, userId:/g, 'sessionId, userId,');
    content = content.replace(/expiresAt:/g, 'expiresAt,');
    content = content.replace(/is_active: created_at/g, 'is_active, created_at');
    content = content.replace(/true: NOW\(\)/g, 'true, NOW()');
    
    fs.writeFileSync(loginFile, content, 'utf8');
    console.log('✅ Fixed', loginFile);
  }
  
  // Fix enterprise MFA route
  let mfaFile = 'src/app/api/auth/enterprise/mfa/route.ts';
  if (fs.existsSync(mfaFile)) {
    let content = fs.readFileSync(mfaFile, 'utf8');
    
    // Fix parameter syntax
    content = content.replace(/handleMFASetup\(user, ip:/g, 'handleMFASetup(user, ip,');
    
    fs.writeFileSync(mfaFile, content, 'utf8');
    console.log('✅ Fixed', mfaFile);
  }
  
  console.log('✅ All absolute final errors fixed');
}

fixAbsoluteFinalErrors();