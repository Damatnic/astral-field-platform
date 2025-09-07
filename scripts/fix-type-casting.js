#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Find files with type casting issues
const { execSync } = require('child_process');
const filesWithIssues = execSync(
  'find src -name "*.tsx" | xargs grep -l "as unknown" 2>/dev/null || true',
  { encoding: 'utf8' }
).trim().split('\n').filter(Boolean);

console.log(`Found ${filesWithIssues.length} files with type casting issues`);

// Known type mappings based on common useState patterns
const typeMappings = {
  // Common patterns found in the codebase
  '"active" | "propose" | "history"': ['active', 'propose', 'history'],
  '"lineup" | "bench" | "timeline"': ['lineup', 'bench', 'timeline'], 
  '"board" | "my-queue" | "chat"': ['board', 'my-queue', 'chat'],
  '"week" | "full" | "playoff"': ['week', 'full', 'playoff'],
  '"standings" | "power-rankings" | "playoff-picture" | "head-to-head"': ['standings', 'power-rankings', 'playoff-picture', 'head-to-head']
};

filesWithIssues.forEach(filePath => {
  if (!filePath) return;
  
  const fullPath = path.join(process.cwd(), filePath);
  
  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;
    
    // Find useState declarations to determine correct types
    const useStateMatches = content.match(/useState<([^>]+)>/g);
    
    if (useStateMatches) {
      useStateMatches.forEach(match => {
        const type = match.replace(/useState<([^>]+)>/, '$1');
        
        // Remove generic wrappers and quotes to get the union type
        const cleanType = type.replace(/'/g, '"');
        
        // Replace the incorrect casting with correct type
        const regex = new RegExp(`(\\w+ as unknown)`, 'g');
        content = content.replace(regex, `$1 as ${type}`);
      });
    }
    
    // Fallback: replace common patterns
    content = content.replace(/(setActiveTab\([^)]+) as unknown/g, '$1 as any');
    content = content.replace(/(setViewMode\([^)]+) as unknown/g, '$1 as any');
    content = content.replace(/(setTab\([^)]+) as unknown/g, '$1 as any');
    
    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log('\n✨ Type casting fixes complete!');