const fs = require('fs');
const path = require('path');

function fixImportIssues() {
  const specificFixes = [
    {
      file: 'C:\\Users\\damat\\_REPOS\\astral-field\\src\\components\\commissioner\\CommissionerTools.tsx',
      patterns: [
        // Fix import statement - should use commas not colons for aliases
        {
          find: /Settings: Shield, Users: Calendar, BarChart3: DollarSign, MessageCircle: AlertTriangle, Crown: Edit, Trash2: Plus, Eye: Lock, Unlock: RefreshCw, Download: Upload, Mail: Bell,/g,
          replace: 'Settings, Shield, Users, Calendar, BarChart3, DollarSign, MessageCircle, AlertTriangle, Crown, Edit, Trash2, Plus, Eye, Lock, Unlock, RefreshCw, Download, Upload, Mail, Bell,'
        },
        {
          find: /CheckCircle: XCircle, Clock: Target, TrendingUp: Award, FileText: Database, Activity: Zap,/g,
          replace: 'CheckCircle, XCircle, Clock, Target, TrendingUp, Award, FileText, Database, Activity, Zap,'
        },
        {
          find: /UserCheck: Ban, AlertCircle: Filter, Search: MoreHorizontal, ChevronDown: ChevronUp, Star: History, Gavel: Users2, Scale, ExternalLink/g,
          replace: 'UserCheck, Ban, AlertCircle, Filter, Search, MoreHorizontal, ChevronDown, ChevronUp, Star, History, Gavel, Users2, Scale, ExternalLink'
        }
      ]
    },
    {
      file: 'C:\\Users\\damat\\_REPOS\\astral-field\\src\\components\\league\\LeagueNavigation.tsx',
      patterns: [
        // Fix import statement
        {
          find: /Home: Users,\s*Calendar: Trophy,\s*TrendingUp: Settings,\s*Search: DollarSign,/g,
          replace: 'Home, Users, Calendar, Trophy, TrendingUp, Settings, Search, DollarSign,'
        }
      ]
    },
    {
      file: 'C:\\Users\\damat\\_REPOS\\astral-field\\src\\app\\admin\\setup\\page.tsx',
      patterns: [
        // Fix JSON.stringify call
        {
          find: /JSON\.stringify\(results: null, 2\)/g,
          replace: 'JSON.stringify(results, null, 2)'
        }
      ]
    },
    {
      file: 'C:\\Users\\damat\\_REPOS\\astral-field\\src\\app\\api\\admin\\audit-logs\\route.ts',
      patterns: [
        // Fix import statement
        {
          find: /adminValidationMiddleware: validateQueryParams, validateRequestBody: queryParamsSchema, createValidationErrorResponse,/g,
          replace: 'adminValidationMiddleware, validateQueryParams, validateRequestBody, queryParamsSchema, createValidationErrorResponse,'
        }
      ]
    },
    {
      file: 'C:\\Users\\damat\\_REPOS\\astral-field\\src\\app\\api\\ai\\breakouts\\route.ts',
      patterns: [
        // Fix object spread syntax
        {
          find: /\.\.\.report: topBreakouts, filteredBreakouts,/g,
          replace: '...report, topBreakouts: filteredBreakouts,'
        }
      ]
    }
  ];

  let totalFixed = 0;

  specificFixes.forEach(({ file, patterns }) => {
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

  console.log(`\n🎉 Fixed ${totalFixed} files out of ${specificFixes.length} total files`);
}

fixImportIssues();