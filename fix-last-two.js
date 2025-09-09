const fs = require('fs');

// Fix the last two issues
function fixLastTwo() {
  // Fix login route
  let loginFile = 'src/app/api/auth/enterprise/login/route.ts';
  if (fs.existsSync(loginFile)) {
    let content = fs.readFileSync(loginFile, 'utf8');
    
    // Fix the JSON.stringify pattern
    content = content.replace(/JSON\.stringify\(deviceInfo \|\| {,/g, 'JSON.stringify(deviceInfo || {');
    content = content.replace(/}\), ip: userAgent/g, '}), ip, userAgent');
    
    fs.writeFileSync(loginFile, content, 'utf8');
    console.log('✅ Fixed', loginFile);
  }
  
  console.log('✅ Fixed last two issues');
}

fixLastTwo();