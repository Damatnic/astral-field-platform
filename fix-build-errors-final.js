const fs = require('fs');

function fixBuildErrors() {
  const files = [
    'src/app/api/admin/audit-logs/route.ts',
    'src/app/api/ai/breakouts/route.ts',
    'src/app/api/ai/draft/route.ts',
    'src/app/api/ai/injuries/route.ts',
    'src/app/api/ai/trades/route.ts'
  ];
  
  files.forEach(file => {
    if (fs.existsSync(file)) {
      let content = fs.readFileSync(file, 'utf8');
      
      // Fix the pattern where we have "success: true: " which should be "success: true, "
      content = content.replace(/success: true:\s+/g, 'success: true,\n    ');
      
      // Fix patterns like "data, {" which should be "data: {"
      content = content.replace(/data,\s*{/g, 'data: {');
      
      // Fix patterns like "filters, {" which should be "filters: {"
      content = content.replace(/filters,\s*{/g, 'filters: {');
      content = content.replace(/filteredBreakouts:\s*filters,/g, 'filteredBreakouts,\n        filters:');
      
      // Fix message patterns
      content = content.replace(/true:\s*message,/g, 'true,\n    message:');
      
      // Fix userId: action pattern
      content = content.replace(/userId:\s*action,/g, 'userId, action,');
      
      fs.writeFileSync(file, content, 'utf8');
      console.log(`✅ Fixed ${file}`);
    }
  });
}

fixBuildErrors();