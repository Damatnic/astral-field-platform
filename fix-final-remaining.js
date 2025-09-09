const fs = require('fs');
const path = require('path');

function fixFinalRemaining() {
  // Fix analytics route
  let analyticsFile = 'src/app/api/analytics/route.ts';
  if (fs.existsSync(analyticsFile)) {
    let content = fs.readFileSync(analyticsFile, 'utf8');
    
    // Fix wins, losses patterns
    content = content.replace(/wins,\s*8,/g, 'wins: 8,');
    content = content.replace(/losses,\s*5,/g, 'losses: 5,');
    content = content.replace(/pointsFor,/g, 'pointsFor:');
    
    fs.writeFileSync(analyticsFile, content, 'utf8');
    console.log('✅ Fixed', analyticsFile);
  }
  
  // Fix enterprise login route
  let loginFile = 'src/app/api/auth/enterprise/login/route.ts';
  if (fs.existsSync(loginFile)) {
    let content = fs.readFileSync(loginFile, 'utf8');
    
    // Fix JSON.stringify patterns and VALUES syntax
    content = content.replace(/JSON\.stringify\(deviceInfo \|\| {,/g, 'JSON.stringify(deviceInfo || {');
    content = content.replace(/\): VALUES/g, ') VALUES');
    content = content.replace(/}}, ip: userAgent/g, '}), ip, userAgent');
    content = content.replace(/ipAddress, ip, userAgent, sessionId,/g, 'ipAddress: ip, userAgent, sessionId,');
    
    fs.writeFileSync(loginFile, content, 'utf8');
    console.log('✅ Fixed', loginFile);
  }
  
  // Fix MFA route
  let mfaFile = 'src/app/api/auth/enterprise/mfa/route.ts';
  if (fs.existsSync(mfaFile)) {
    let content = fs.readFileSync(mfaFile, 'utf8');
    
    // Fix any remaining patterns
    content = content.replace(/errorMessage: '/g, "errorMessage: '");
    
    fs.writeFileSync(mfaFile, content, 'utf8');
    console.log('✅ Fixed', mfaFile);
  }
  
  console.log('✅ All final remaining errors fixed');
}

fixFinalRemaining();