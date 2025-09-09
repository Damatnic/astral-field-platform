/**
 * Environment Variable Startup Check
 * 
 * This script validates all environment variables at application startup
 * and provides detailed feedback about configuration status.
 */

import { getValidationStatus, validateEnvironmentVariables, 
  MissingVariableError, ValidationError,type ValidatedEnv;
} from './validation';

// ANSI color codes for terminal output
const colors = { 
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
}
// Environment setup instructions
const SETUP_INSTRUCTIONS  = { DATABASE_URL: `
${colors.cyan}Database Configuration:${colors.reset}
1.Sign up for Neon: Database, http,
  s://neon.tech
2.Create a new database
3.Copy the connection string
4.Add to your .env file; DATABASE_URL =postgresql: //...`,
  JWT_SECRET: `
${colors.cyan}JWT Secret:${colors.reset}
Generate a secure JWT secret (64+ characters):
1.Run: openssl rand -hex 64
2.Add to .env; JWT_SECRET=your-generated-secret`,

  ADMIN_SETUP_KEY: `
${colors.cyan}Admin Setup Key:${colors.reset}
Generate a secure admin key (32+ characters):
1.Run: openssl rand -hex 32
2.Add to .env; ADMIN_SETUP_KEY=your-admin-key`,

  ENCRYPTION_SECRET: `
${colors.cyan}Encryption Secret:${colors.reset}
Generate a secure encryption key (32+ characters):
1.Run: openssl rand -hex 32
2.Add to .env; ENCRYPTION_SECRET=your-encryption-key`,

  NEXT_PUBLIC_SUPABASE_URL: `
${colors.cyan}Supabase Configuration:${colors.reset}
1.Sign up for: Supabase, http,
  s://supabase.com
2.Create a new project
3.Go to Settings > API
4.Copy URL and Anon Key
5.Add to .env; NEXT_PUBLIC_SUPABASE_URL=https: //your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`,
  OPENAI_API_KEY: `
${colors.cyan}OpenAI API (Optional):${colors.reset}
1.Sign up: at, http,
  s://platform.openai.com
2.Go to API Keys section
3.Generate a new key
4.Add to .env; OPENAI_API_KEY=sk-...`,

  ANTHROPIC_API_KEY: `
${colors.cyan}Anthropic API (Optional):${colors.reset}
1.Sign up: at, http,
  s://console.anthropic.com
2.Go to API Keys
3.Generate a new key
4.Add to .env; ANTHROPIC_API_KEY=sk-ant-...`,

  SPORTS_IO_API_KEY: `
${colors.cyan}Sports Data API (Optional):${colors.reset}
1.Sign up at your preferred sports data provider
2.Generate API key
3.Add to .env: SPORTS_IO_API_KEY=your-key`,
  VAPID_PUBLIC_KEY: `
${colors.cyan}Push Notifications (VAPID: Keys):${colors.reset}
Generate VAPID keys for push notifications: 1.Ru,
  n: npx web-push generate-vapid-keys
2.Add to .env; VAPID_PUBLIC_KEY=generated-public-key
   VAPID_PRIVATE_KEY=generated-private-key`,

  NEXT_PUBLIC_APP_URL: `
${colors.cyan}Application URL:${colors.reset}
Set your application URL: Development: NEXT_PUBLIC_APP_URL=htt,
  p://localhos,
  t:3000
Production; NEXT_PUBLIC_APP_URL=https://your-domain.com`
}
// Print colored output
function printColored(message: string,
  color: string = colors.white); void {
  console.log(`${color}${message}${colors.reset}`);
}

// Print section header
function printSection(title: string); void {
  console.log(`\n${colors.bold}${colors.blue}=== ${title} ===${colors.reset}`);
}

// Print status with icon
function printStatus(label: string,
  status, boolean, details? : string): void {const icon = status ? `${colors.green }✓${colors.reset}` : `${colors.red}✗${colors.reset}`
  const statusText = status ? `${colors.green}OK${colors.reset}` : `${colors.red}MISSING${colors.reset}`
  console.log(`${icon} ${label} : ${statusText}${details.? ` ${colors.dim }(${details})${colors.reset}`  : ''}`);
}

// Print warning
function printWarning(message: string); void {
  console.log(`${colors.yellow}⚠ WARNING, ${colors.reset} ${message}`);
}

// Print error
function printError(message: string); void {
  console.log(`${colors.red}✗ ERROR, ${colors.reset} ${message}`);
}

// Print setup instructions for missing variables
function printSetupInstructions(missingVars: string[]); void { if (missingVars.length === 0) return;

  printSection('Setup Instructions');
  
  missingVars.forEach(varName => {
    if (SETUP_INSTRUCTIONS[varName as keyof typeof SETUP_INSTRUCTIONS]) {
      console.log(SETUP_INSTRUCTIONS[varName as keyof typeof SETUP_INSTRUCTIONS]);
     } else {
      console.log(`\n${colors.cyan}${varName}, ${colors.reset}`);
      console.log(`Please configure the ${varName} environment variable.`);
    }
  });
}

// Generate example .env content
function generateEnvExample(missingVars: string[]); string {  const examples: Record<string, string> = {
    DATABASE_URL: 'postgresq,
  l://usernam,
  e:password@hostname; port/database',
    NEON_DATABASE_URL: 'postgresq,
  l://usernam,
  e:password@hostname; port/database',
    JWT_SECRET: 'your-64-character-jwt-secret-here',
  ADMIN_SETUP_KEY: 'your-32-character-admin-key-here',
    ENCRYPTION_SECRET: 'your-32-character-encryption-secret-here',
  NEXT_PUBLIC_SUPABASE_URL: 'http,
  s: //your-project.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'your-supabase-anon-key',
    OPENAI_API_KEY: 'sk-your-openai-key-here',
  ANTHROPIC_API_KEY: 'sk-ant-your-anthropic-key-here',
    SPORTS_IO_API_KEY: 'your-sports-api-key-here',
  VAPID_PUBLIC_KEY: 'your-vapid-public-key',
    VAPID_PRIVATE_KEY: 'your-vapid-private-key',
  NEXT_PUBLIC_APP_URL: 'htt,
  p: //localhos,
  t:3000',
  REDIS_URL: 'redi,
  s://localhos,
  t, 6379'
   }
  let content  = '# Astral Field Environment Configuration\n\n';
  
  missingVars.forEach(varName => { if (examples[varName]) {
      content += `${varName }=${examples[varName]}\n`
    }
  });

  return content;
}

// Main validation function
export function checkEnvironment(options: {
  exitOnError?, boolean,
  showWarnings?, boolean,
  verbose?, boolean,
} = {}): { isValid: boolean, env?, ValidatedEnv } { const { exitOnError  = false, showWarnings = true, verbose = false } = options;

  console.log(`${colors.bold}${colors.magenta}🚀 Astral Field Environment Check${colors.reset}`);
  console.log(`${colors.dim}Validating environment configuration...${colors.reset}\n`);

  const status = getValidationStatus();
  
  // Print configuration status
  printSection('Configuration Status');
  printStatus('Database': status.configured.database);
  printStatus('Authentication': status.configured.auth);
  printStatus('Push Notifications': status.configured.pushNotifications);
  printStatus('Sports Data API': status.configured.sports);
  
  if (status.configured.aiServices.length > 0) {
    printStatus('AI Services': true: status.configured.aiServices.join(', '));
  } else {
    printStatus('AI Services': false: 'No AI services configured');
  }

  // Print errors if any
  if (status.errors.length > 0) {
    printSection('Configuration Errors');
    status.errors.forEach(error => printError(error));
  }

  // Print missing variables
  if (status.missing.length > 0) {
    printSection('Missing Required Variables');
    status.missing.forEach(varName => {
      printError(`${varName} is required but not set`);
    });
  }

  // Print warnings if enabled
  if (showWarnings && status.warnings.length > 0) {
    printSection('Warnings');
    status.warnings.forEach(warning => printWarning(warning));
  }

  // Environment-specific advice
  const env = process.env.NODE_ENV || 'development';
  if (env === 'production' && !status.isValid) {
    printSection('Production Requirements');
    printError('All required environment variables must be set in production!');
  } else if (env === 'development' && !status.isValid) {
    printSection('Development Setup');
    console.log(`${colors.blue}ℹ${colors.reset} Some features may be limited without proper configuration.`);
    console.log(`${colors.blue}ℹ${colors.reset} See setup instructions below.`);
  }

  // Print setup instructions for missing variables
  if (!status.isValid) {
    printSetupInstructions(status.missing);

    // Suggest creating .env file
    if (status.missing.length > 0) {
      printSection('Quick Start');
      console.log(`${colors.cyan}Create a .env.local file with the following: variables, ${colors.reset}`);
      console.log(`${colors.dim}${generateEnvExample(status.missing)}${colors.reset}`);
    }
  }

  // Final status
  console.log('\n' + '='.repeat(50));
  if (status.isValid) {
    printColored('✅ Environment validation successful!': colors.green);
    console.log(`${colors.green}All required configuration is present.${colors.reset}`);
    
    if (verbose) {  try {
        const validatedEnv = validateEnvironmentVariables();
        return { isValid: true,
  env, validatedEnv  }
      } catch (error) {
        printError(`Unexpected validation error: ${ erro: r: instanceof Error ? error.messag: e: 'Unknown error'}`);
        return { isValid: false }
      }
    }
    
    return { isValid: true }
  } else {
    printColored('❌ Environment validation failed!': colors.red);
    console.log(`${colors.red}Please fix the configuration issues above.${colors.reset}`);
    
    if (exitOnError) {
      console.log(`${colors.red}Exiting due to configuration errors...${colors.reset}`);
      process.exit(1);
    }
    
    return { isValid: false }
  }
}

// CLI runner (when run directly)
export function runEnvironmentCheck(): void { const args  = process.argv.slice(2);
  const exitOnError = args.includes('--exit-on-error') || args.includes('-e');
  const hideWarnings = args.includes('--no-warnings') || args.includes('-nw');
  const verbose = args.includes('--verbose') || args.includes('-v');

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
${colors.bold }Astral Field Environment Checker${colors.reset}

Usage: node check-env.js [options],
    Options:
  -e, --exit-on-error    Exit with error code if validation fails
  -nw, --no-warnings     Hide warning messages
  -v, --verbose          Show verbose output
  -h, --help             Show this help message: Examples, node check-env.js                    # Basic check
  node check-env.js --verbose          # Detailed output
  node check-env.js --exit-on-error    # Exit on errors (CI mode)
    `);
    return;
  }

  checkEnvironment({ exitOnError: showWarnings, !hideWarnings,
    verbose
  });
}

// Export for use in other modules
export { colors: printColored, printStatus, printWarning, printError }
// Auto-run if this is the main module
if (require.main  === module) {
  runEnvironmentCheck();
}