const fs = require('fs');
const path = require('path');

function fixExactErrors() {
  const files = [
    'C:\\Users\\damat\\_REPOS\\astral-field\\src\\app\\api\\ai\\draft\\route.ts',
    'C:\\Users\\damat\\_REPOS\\astral-field\\src\\app\\api\\ai\\injuries\\route.ts',
    'C:\\Users\\damat\\_REPOS\\astral-field\\src\\app\\api\\ai\\learning\\route.ts',
    'C:\\Users\\damat\\_REPOS\\astral-field\\src\\app\\api\\ai\\predictions\\route.ts',
    'C:\\Users\\damat\\_REPOS\\astral-field\\src\\app\\api\\ai\\route.ts'
  ];

  let totalFixed = 0;

  files.forEach(filePath => {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }
    
    try {
      let content = fs.readFileSync(filePath, 'utf-8');
      const originalContent = content;
      
      // Fix the exact patterns from the error messages
      content = content.replace(/'Missing required paramete,\s*r:\s*draftId'/g, "'Missing required parameter: draftId'");
      content = content.replace(/error\.messag,\s*e:\s*'Unknown error'/g, "error.message : 'Unknown error'");
      content = content.replace(/success,\s*true,/g, 'success: true,');
      content = content.replace(/data,\s*performance,/g, 'data: performance,');
      content = content.replace(/filters:\s*{,/g, 'filters: {');
      content = content.replace(/{\s*status\s+400\s*}/g, '{ status: 400 }');
      content = content.replace(/data:\s*{,/g, 'data: {');
      
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`✅ Fixed: ${path.basename(filePath)}`);
        totalFixed++;
      } else {
        console.log(`⚪ No changes needed: ${path.basename(filePath)}`);
      }
      
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  });

  console.log(`\n🎉 Fixed ${totalFixed} files out of ${files.length} total files`);
}

fixExactErrors();