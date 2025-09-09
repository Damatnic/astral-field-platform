const fs = require('fs');
const path = require('path');

function finalTargetedFix() {
  const fixes = [
    {
      file: 'C:\\Users\\damat\\_REPOS\\astral-field\\src\\components\\league\\LeagueNavigation.tsx',
      patterns: [
        { find: /LineChart: Activity,/g, replace: 'LineChart, Activity,' },
        { find: /ChevronDown: MoreHorizontal,/g, replace: 'ChevronDown, MoreHorizontal,' },
        { find: /Target: Clock,/g, replace: 'Target, Clock,' }
      ]
    },
    {
      file: 'C:\\Users\\damat\\_REPOS\\astral-field\\src\\app\\api\\ai\\draft\\route.ts',
      patterns: [
        { find: /success: true: data, recommendations,/g, replace: 'success: true, data: recommendations,' }
      ]
    },
    {
      file: 'C:\\Users\\damat\\_REPOS\\astral-field\\src\\app\\api\\ai\\injuries\\route.ts',
      patterns: [
        { find: /success: true: data, trends,/g, replace: 'success: true, data: trends,' }
      ]
    },
    {
      file: 'C:\\Users\\damat\\_REPOS\\astral-field\\src\\app\\api\\ai\\learning\\route.ts',
      patterns: [
        // This should completely replace the malformed filters object
        { 
          find: /filters: {,\s*modelName: modelName \|\| 'all',\s*position: position \|\| 'all',\s*timeframe/g, 
          replace: 'filters: {\n            modelName: modelName || \'all\',\n            position: position || \'all\',\n            timeframe'
        }
      ]
    },
    {
      file: 'C:\\Users\\damat\\_REPOS\\astral-field\\src\\app\\api\\ai\\predictions\\route.ts',
      patterns: [
        { find: /validateQueryParams: validateRequestBody, createValidationErrorResponse: hasValidationErrors, idSchema,/g, replace: 'validateQueryParams, validateRequestBody, createValidationErrorResponse, hasValidationErrors, idSchema,' }
      ]
    }
  ];

  let totalFixed = 0;

  fixes.forEach(({ file, patterns }) => {
    if (!fs.existsSync(file)) {
      console.log(`⚠️  File not found: ${file}`);
      return;
    }
    
    try {
      let content = fs.readFileSync(file, 'utf-8');
      const originalContent = content;
      let changed = false;
      
      patterns.forEach(({ find, replace }) => {
        if (find.test(content)) {
          content = content.replace(find, replace);
          changed = true;
        }
      });
      
      if (changed) {
        fs.writeFileSync(file, content, 'utf-8');
        console.log(`✅ Fixed: ${path.basename(file)}`);
        totalFixed++;
      } else {
        console.log(`⚪ No changes needed: ${path.basename(file)}`);
      }
      
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  });

  console.log(`\n🎉 Fixed ${totalFixed} files out of ${fixes.length} total files`);
}

finalTargetedFix();