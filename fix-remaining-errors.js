const fs = require('fs');
const path = require('path');

// Define the specific files with errors and their fixes
const files = [
  'C:\\Users\\damat\\_REPOS\\astral-field\\src\\components\\commissioner\\CommissionerTools.tsx',
  'C:\\Users\\damat\\_REPOS\\astral-field\\src\\components\\league\\LeagueNavigation.tsx',
  'C:\\Users\\damat\\_REPOS\\astral-field\\src\\app\\admin\\setup\\page.tsx',
  'C:\\Users\\damat\\_REPOS\\astral-field\\src\\app\\api\\admin\\audit-logs\\route.ts',
  'C:\\Users\\damat\\_REPOS\\astral-field\\src\\app\\api\\admin\\monitoring\\route.ts'
];

function fixRemainingErrors() {
  let totalFixed = 0;
  
  files.forEach(filePath => {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }
    
    try {
      let content = fs.readFileSync(filePath, 'utf-8');
      const originalContent = content;
      
      // Fix object literal commas instead of colons
      content = content.replace(/(\w+),\s*(\d+),/g, '$1: $2,');
      content = content.replace(/(\w+),\s*true,/g, '$1: true,');
      content = content.replace(/(\w+),\s*false,/g, '$1: false,');
      content = content.replace(/(\w+),\s*'([^']+)',/g, '$1: \'$2\',');
      content = content.replace(/(\w+),\s*"([^"]+)",/g, '$1: "$2",');
      
      // Fix specific patterns in CommissionerTools
      content = content.replace(/roster_size,\s*16,/g, 'roster_size: 16,');
      content = content.replace(/bench_size,\s*7,/g, 'bench_size: 7,');
      content = content.replace(/ir_slots,\s*2,/g, 'ir_slots: 2,');
      content = content.replace(/playoff_start_week,\s*15,/g, 'playoff_start_week: 15,');
      content = content.replace(/playoff_teams,\s*6,/g, 'playoff_teams: 6,');
      content = content.replace(/faab_budget,\s*1000,/g, 'faab_budget: 1000,');
      content = content.replace(/is_active,\s*true,/g, 'is_active: true,');
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
      content = content.replace(/enabled,\s*true,/g, 'enabled: true,');
      content = content.replace(/enabled,\s*false,/g, 'enabled: false,');
      
      // Fix object literal missing colons
      content = content.replace(/{\s*status\s+(\d+)\s*}/g, '{ status: $1 }');
      content = content.replace(/{\s*success,\s*true,/g, '{ success: true,');
      content = content.replace(/{\s*success,\s*false,/g, '{ success: false,');
      
      // Fix function parameter syntax errors
      content = content.replace(/(\w+),\s*string;/g, '$1: string,');
      content = content.replace(/function\s+(\w+)\(\{([^}]+)\}\s*:\s*\{([^}]+)\}\s*\)\s*\{/g, 'function $1({ $2 }: { $3 }) {');
      
      // Fix malformed destructuring and object syntax
      content = content.replace(/const\s+bod,\s*y:/g, 'const body:');
      content = content.replace(/\{\s*:\s*\.\.t,/g, '{ ...t,');
      content = content.replace(/\[;/g, '[');
      content = content.replace(/\];$/g, '];');
      
      // Fix template literal syntax
      content = content.replace(/type\s+`([^`]+)`,/g, 'type: `$1`,');
      
      // Fix unterminated strings and malformed className attributes
      content = content.replace(/className="([^"]*)\s+hover\.\s*([^"]*);/g, 'className="$1 hover:$2"');
      content = content.replace(/dark;\s*([^"]+)"/g, 'dark:$1"');
      content = content.replace(/dar,\s*k:/g, 'dark:');
      content = content.replace(/hove,\s*r:/g, 'hover:');
      content = content.replace(/focu,\s*s:/g, 'focus:');
      content = content.replace(/;\s*text-/g, ' text-');
      content = content.replace(/;\s*bg-/g, ' bg-');
      content = content.replace(/;\s*border-/g, ' border-');
      content = content.replace(/;\s*opacity-/g, ' opacity-');
      
      // Fix string concatenation and timestamp errors
      content = content.replace(/0:\s*0,\s*0:\s*00Z"/g, '0:00:00Z"');
      content = content.replace(/T1,\s*0:\s*0,\s*0:\s*00Z"/g, 'T10:00:00Z"');
      content = content.replace(/T08:3,\s*0:00Z"/g, 'T08:30:00Z"');
      content = content.replace(/,\s*T08:3,\s*0:00Z"/g, 'T08:30:00Z"');
      content = content.replace(/3:00\s*AM',\s*nextRun:\s*'2024-11-27\s*0,\s*3:\s*0,\s*0:\s*00'/g, '3:00 AM\', nextRun: \'2024-11-27 03:00:00\'');
      content = content.replace(/9:00\s*AM',\s*nextRun:\s*'2024-11-26\s*09:0,\s*0:00'/g, '9:00 AM\', nextRun: \'2024-11-26 09:00:00\'');
      content = content.replace(/2:00\s*AM',\s*nextRun:\s*'2024-11-25\s*02:0,\s*0:00'/g, '2:00 AM\', nextRun: \'2024-11-25 02:00:00\'');
      
      // Fix more malformed properties and syntax
      content = content.replace(/Save:\s*Settings;/g, 'Save Settings');
      content = content.replace(/Add:\s*Team;/g, 'Add Team');
      content = content.replace(/Team:\s*Management;/g, 'Team Management');
      content = content.replace(/Schedule:\s*Management;/g, 'Schedule Management');
      content = content.replace(/Regenerate:\s*Schedule;/g, 'Regenerate Schedule');
      content = content.replace(/Export:\s*Schedule;/g, 'Export Schedule');
      content = content.replace(/Scoring:\s*Adjustments;/g, 'Scoring Adjustments');
      content = content.replace(/League:\s*Communications;/g, 'League Communications');
      content = content.replace(/Send:\s*Message;/g, 'Send Message');
      content = content.replace(/Quick:\s*Actions;/g, 'Quick Actions');
      content = content.replace(/Playoff:\s*Reminder;/g, 'Playoff Reminder');
      content = content.replace(/Lineup:\s*Reminder;/g, 'Lineup Reminder');
      content = content.replace(/Pending:\s*Transactions;/g, 'Pending Transactions');
      content = content.replace(/Confirm:\s*Action;/g, 'Confirm Action');
      content = content.replace(/Engagement:\s*Score;/g, 'Engagement Score');
      content = content.replace(/Activity:\s*Score;/g, 'Activity Score');
      content = content.replace(/Fairness:\s*Index;/g, 'Fairness Index');
      content = content.replace(/Analytics:\s*Export;/g, 'Analytics Export');
      content = content.replace(/Performance:\s*Dashboard;/g, 'Performance Dashboard');
      content = content.replace(/New:\s*Action;/g, 'New Action');
      content = content.replace(/Reported:\s*Issues;/g, 'Reported Issues');
      content = content.replace(/Take:\s*Action;/g, 'Take Action');
      content = content.replace(/Moderation:\s*Tools;/g, 'Moderation Tools');
      content = content.replace(/Issue:\s*Warning;/g, 'Issue Warning');
      content = content.replace(/Suspend:\s*User;/g, 'Suspend User');
      content = content.replace(/Automation:\s*Rules;/g, 'Automation Rules');
      content = content.replace(/Create:\s*Rule;/g, 'Create Rule');
      content = content.replace(/Scheduled:\s*Tasks;/g, 'Scheduled Tasks');
      content = content.replace(/Next:\s*Run;/g, 'Next Run');
      content = content.replace(/Automation:\s*Templates;/g, 'Automation Templates');
      content = content.replace(/Trade:\s*Processing;/g, 'Trade Processing');
      content = content.replace(/Use:\s*Template;/g, 'Use Template');
      content = content.replace(/Injury:\s*Notifications;/g, 'Injury Notifications');
      content = content.replace(/Weekly:\s*Reports;/g, 'Weekly Reports');
      content = content.replace(/League:\s*Name;/g, 'League Name');
      content = content.replace(/Scoring:\s*Type;/g, 'Scoring Type');
      content = content.replace(/Roster:\s*Size;/g, 'Roster Size');
      content = content.replace(/Bench:\s*Size;/g, 'Bench Size');
      content = content.replace(/Trade:\s*Deadline;/g, 'Trade Deadline');
      content = content.replace(/FAAB:\s*Budget;/g, 'FAAB Budget');
      content = content.replace(/Luck:\s*Factor;/g, 'Luck Factor');
      
      // Fix specific malformed syntax patterns
      content = content.replace(/\.\s+([a-zA-Z])/g, ' $1'); // Fix broken classes with dots
      content = content.replace(/:\s+([a-zA-Z])/g, ':$1'); // Fix colon spacing
      content = content.replace(/hover;\s*bg-/g, 'hover:bg-'); // Fix hover syntax
      content = content.replace(/dark\.\s*bg-/g, 'dark:bg-'); // Fix dark mode syntax
      content = content.replace(/;\s*divide-/g, ' divide-'); // Fix divide syntax
      content = content.replace(/;\s*text-/g, ' text-'); // Fix text color syntax
      
      // Fix array initialization syntax
      content = content.replace(/\[\s*;/g, '[');
      
      // Fix new Date constructor calls
      content = content.replace(/{\s*new:\s*Date\(/g, '{ new Date(');
      
      // Fix grid layout classes
      content = content.replace(/md:\s*grid-cols-2\s*l,\s*g:grid-cols-4/g, 'md:grid-cols-2 lg:grid-cols-4');
      content = content.replace(/md:\s*grid-cols-2\s*l,\s*g:grid-cols-3/g, 'md:grid-cols-2 lg:grid-cols-3');
      
      // Fix peer class syntax
      content = content.replace(/peer-focus:\s*outline-none\s+peer-focus:ring-4\s+peer-focus:ring-blue-300\s+dark:peer-focus:ring-blue-800\s+rounded-full\s+peer\s+dar,\s*k:bg-gray-600\s+peer-checke,\s*d:\s*afte,\s*r:\s*translate-x-full/g, 'peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full');
      content = content.replace(/dar,\s*k:border-gray-600\s+peer-checke,\s*d:bg-blue-600/g, 'dark:border-gray-600 peer-checked:bg-blue-600');
      
      // Fix more specific hover and dark mode patterns
      content = content.replace(/r:text-gray-800\s+dar,\s*k:hove,\s*r;\s*text-gray-200/g, 'r:text-gray-800 dark:hover:text-gray-200');
      content = content.replace(/hover:\s*text-blue-600\s+dar,\s*k:hove,\s*r:text-blue-400/g, 'hover:text-blue-600 dark:hover:text-blue-400');
      content = content.replace(/hover:\s*text-red-600\s+dar,\s*k:hover;\s*text-red-400/g, 'hover:text-red-600 dark:hover:text-red-400');
      
      // Fix conditional ternary operator syntax
      content = content.replace(/\?\s*'([^']+)'\s+\.\s*'([^']+)'/g, "? '$1' : '$2'");
      content = content.replace(/:\s*'([^']+)'\s+\.\s*'([^']+)'/g, ": '$1' : '$2'");
      
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

fixRemainingErrors();