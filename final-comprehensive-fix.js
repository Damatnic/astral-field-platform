const fs = require('fs');
const path = require('path');

function finalFix() {
  const apiDir = 'src/app/api';
  let totalFixes = 0;
  
  function processFile(filePath) {
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let fixes = 0;
    
    // Fix malformed object patterns
    content = content.replace(/filters: {,/g, () => { fixes++; return 'filters: {'; });
    content = content.replace(/data: {,/g, () => { fixes++; return 'data: {'; });
    
    // Fix success patterns
    content = content.replace(/success,\s*true,/g, () => { fixes++; return 'success: true,'; });
    content = content.replace(/success,\s*false,/g, () => { fixes++; return 'success: false,'; });
    content = content.replace(/success,\s*\n\s*true,/g, () => { fixes++; return 'success: true,'; });
    content = content.replace(/success,\s*\n\s*false,/g, () => { fixes++; return 'success: false,'; });
    
    // Fix data patterns
    content = content.replace(/data,\s*(\w+),/g, (match, prop) => { fixes++; return `data: ${prop},`; });
    
    // Fix property patterns
    content = content.replace(/enhanced,\s*true,/g, () => { fixes++; return 'enhanced: true,'; });
    content = content.replace(/enhanced,\s*false,/g, () => { fixes++; return 'enhanced: false,'; });
    
    // Fix colon patterns in specific contexts
    content = content.replace(/(\w+)UserTeamId:\s*(\w+)PlayerId/g, (match, p1, p2) => { 
      fixes++; 
      return `${p1}UserTeamId, ${p2}PlayerId`; 
    });
    
    // Fix actualPoints patterns
    content = content.replace(/actualPoints:\s*factors/g, () => { 
      fixes++; 
      return 'actualPoints,\n          factors'; 
    });
    
    // Fix week patterns
    content = content.replace(/wee,\s*\n\s*k:\s*(\w+)/g, (match, weekVar) => { 
      fixes++; 
      return `week: ${weekVar}`; 
    });
    
    // Fix playerId patterns
    content = content.replace(/playerId:\s*playerId1,/g, () => { 
      fixes++; 
      return 'playerId,'; 
    });
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      totalFixes += fixes;
      console.log(`✅ Fixed ${filePath} - ${fixes} fixes`);
    }
  }
  
  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else {
        processFile(filePath);
      }
    }
  }
  
  walkDir(apiDir);
  
  // Also process services directory
  if (fs.existsSync('src/services')) {
    walkDir('src/services');
  }
  
  console.log(`\n✅ Total fixes applied: ${totalFixes}`);
}

finalFix();