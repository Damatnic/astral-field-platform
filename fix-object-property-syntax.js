const fs = require('fs');
const path = require('path');

function fixObjectPropertySyntax() {
  // Files with specific object property syntax issues based on the error messages
  const files = [
    'C:\\Users\\damat\\_REPOS\\astral-field\\src\\app\\admin\\setup\\page.tsx',
    'C:\\Users\\damat\\_REPOS\\astral-field\\src\\components\\commissioner\\CommissionerTools.tsx',
    'C:\\Users\\damat\\_REPOS\\astral-field\\src\\app\\api\\admin\\audit-logs\\route.ts',
    'C:\\Users\\damat\\_REPOS\\astral-field\\src\\app\\api\\admin\\monitoring\\route.ts',
    'C:\\Users\\damat\\_REPOS\\astral-field\\src\\app\\api\\admin\\rate-limit-metrics\\route.ts'
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
      
      // Fix patterns where properties have comma instead of colon in object literals
      // Pattern: "propertyName, value," should be "propertyName: value,"
      content = content.replace(/(\w+),\s*(true|false|null|undefined|\d+|"[^"]*"|'[^']*'),/g, '$1: $2,');
      content = content.replace(/(\w+),\s*(\d+),/g, '$1: $2,');
      content = content.replace(/(\w+),\s*(true|false),/g, '$1: $2,');
      
      // Fix specific "success, true" patterns in object literals
      content = content.replace(/success,\s*true,/g, 'success: true,');
      content = content.replace(/success,\s*false,/g, 'success: false,');
      
      // Fix other common property patterns
      content = content.replace(/enabled,\s*true,/g, 'enabled: true,');
      content = content.replace(/enabled,\s*false,/g, 'enabled: false,');
      content = content.replace(/is_active,\s*(true|false),/g, 'is_active: $1,');
      
      // Fix number properties
      content = content.replace(/roster_size,\s*(\d+),/g, 'roster_size: $1,');
      content = content.replace(/bench_size,\s*(\d+),/g, 'bench_size: $1,');
      content = content.replace(/ir_slots,\s*(\d+),/g, 'ir_slots: $1,');
      content = content.replace(/playoff_start_week,\s*(\d+),/g, 'playoff_start_week: $1,');
      content = content.replace(/playoff_teams,\s*(\d+),/g, 'playoff_teams: $1,');
      content = content.replace(/faab_budget,\s*(\d+),/g, 'faab_budget: $1,');
      content = content.replace(/wins,\s*(\d+),/g, 'wins: $1,');
      content = content.replace(/losses,\s*(\d+),/g, 'losses: $1,');
      content = content.replace(/ties,\s*(\d+),/g, 'ties: $1,');
      content = content.replace(/trades,\s*(\d+),/g, 'trades: $1,');
      content = content.replace(/waivers,\s*(\d+),/g, 'waivers: $1,');
      content = content.replace(/engagement,\s*(\d+),/g, 'engagement: $1,');
      content = content.replace(/activityScore,\s*(\d+),/g, 'activityScore: $1,');
      content = content.replace(/competitiveness,\s*(\d+),/g, 'competitiveness: $1,');
      content = content.replace(/efficiency,\s*(\d+),/g, 'efficiency: $1,');
      content = content.replace(/consistency,\s*(\d+),/g, 'consistency: $1,');
      content = content.replace(/luck,\s*(\d+),/g, 'luck: $1,');
      content = content.replace(/totalComponents,\s*(\d+),/g, 'totalComponents: $1,');
      
      // Fix interface property declarations that should use semicolons or commas, not mixed syntax
      content = content.replace(/is_active,\s*boolean,/g, 'is_active: boolean,');
      
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

fixObjectPropertySyntax();