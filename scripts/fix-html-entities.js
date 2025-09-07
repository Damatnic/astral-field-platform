#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all TypeScript/React files with HTML entity issues
const filesWithIssues = execSync(
  'find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "&apos;" 2>/dev/null || true',
  { encoding: 'utf8' }
).trim().split('\n').filter(Boolean);

console.log(`Found ${filesWithIssues.length} files with HTML entity issues`);

filesWithIssues.forEach(filePath => {
  if (!filePath) return;
  
  const fullPath = path.join(process.cwd(), filePath);
  
  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;
    
    // Replace HTML entities
    content = content.replace(/&apos;/g, "'");
    content = content.replace(/&quot;/g, '"');
    content = content.replace(/&lt;/g, '<');
    content = content.replace(/&gt;/g, '>');
    content = content.replace(/&amp;/g, '&');
    
    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log('\n✨ HTML entity fixes complete!');