#!/usr/bin/env node

/**
 * Environment Validation CLI Script for Astral Field
 * 
 * This script validates environment configuration before deployment
 * and provides detailed feedback about configuration status.
 */

const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
};

function print(message, color = colors.white) {
  console.log(`${color}${message}${colors.reset}`);
}

function printHeader(message) {
  console.log(`\n${colors.bold}${colors.blue}=== ${message} ===${colors.reset}`);
}

console.log(`${colors.bold}${colors.magenta}🚀 Astral Field Environment Validator${colors.reset}`);
console.log(`${colors.dim}Validating environment configuration...${colors.reset}\n`);

// Required environment variables for all environments
const requiredEnvVars = [
  {
    name: 'NODE_ENV',
    description: 'Node environment',
    required: true,
    validValues: ['development', 'test', 'production']
  },
  {
    name: 'NEXT_PUBLIC_APP_URL',
    description: 'Application URL',
    required: true,
    format: /^https?:\/\/.+/
  },
  {
    name: 'DATABASE_URL',
    description: 'Database connection string',
    required: true,
    format: /^postgresql:\/\/.+/
  },
  {
    name: 'JWT_SECRET',
    description: 'JWT secret key',
    required: true,
    minLength: 64
  },
  {
    name: 'ADMIN_SETUP_KEY',
    description: 'Admin setup key',
    required: true,
    minLength: 32
  },
  {
    name: 'ENCRYPTION_SECRET',
    description: 'Encryption secret key',
    required: true,
    minLength: 32
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    description: 'Supabase URL',
    required: true,
    format: /^https:\/\/.+\.supabase\.co$/
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    description: 'Supabase anonymous key',
    required: true,
    minLength: 100
  }
];
// Production-specific required variables
const productionRequiredVars = [
  'VAPID_PUBLIC_KEY',
  'VAPID_PRIVATE_KEY'
];

// Optional but recommended environment variables
const recommendedEnvVars = [
  {
    name: 'REDIS_URL',
    description: 'Redis caching service',
    alternatives: ['KV_URL', 'UPSTASH_REDIS_URL'],
    category: 'Caching'
  },
  {
    name: 'OPENAI_API_KEY',
    description: 'OpenAI API key',
    alternatives: ['ANTHROPIC_API_KEY', 'GEMINI_API_KEY'],
    category: 'AI Services'
  },
  {
    name: 'SPORTS_IO_API_KEY',
    description: 'Sports data API key',
    alternatives: ['SPORTSDATA_API_KEY'],
    category: 'Sports Data'
  },
  {
    name: 'SENTRY_DSN',
    description: 'Error monitoring',
    category: 'Monitoring'
  },
  {
    name: 'WEATHER_API_KEY',
    description: 'Weather data for games',
    category: 'Sports Data'
  }
];

let hasErrors = false;
let hasWarnings = false;
// Load environment variables from .env files
const envFiles = ['.env.production.local', '.env.production', '.env.local', '.env'];
for (const envFile of envFiles) {
  const envPath = path.join(process.cwd(), envFile);
  if (fs.existsSync(envPath)) {
    console.log(`📄 Loading ${envFile}`);
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          process.env[key] = valueParts.join('=');
        }
      }
    }
  }
}
printHeader('Required Environment Variables');

// Validate required environment variables
for (const envVar of requiredEnvVars) {
  const value = process.env[envVar.name];
  
  if (!value) {
    print(`❌ ${envVar.name}: Missing required variable (${envVar.description})`, colors.red);
    hasErrors = true;
    continue;
  }
  
  // Check valid values
  if (envVar.validValues && !envVar.validValues.includes(value)) {
    print(`❌ ${envVar.name}: Invalid value "${value}". Expected: ${envVar.validValues.join(', ')}`, colors.red);
    hasErrors = true;
    continue;
  }
  
  // Check format
  if (envVar.format && !envVar.format.test(value)) {
    print(`❌ ${envVar.name}: Invalid format`, colors.red);
    hasErrors = true;
    continue;
  }
  
  // Check minimum length
  if (envVar.minLength && value.length < envVar.minLength) {
    print(`❌ ${envVar.name}: Too short (minimum ${envVar.minLength} characters)`, colors.red);
    hasErrors = true;
    continue;
  }
  
  print(`✅ ${envVar.name}: Valid`, colors.green);
}

// Check production-specific variables
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
  printHeader('Production-Specific Requirements');
  
  for (const varName of productionRequiredVars) {
    const value = process.env[varName];
    if (!value) {
      print(`❌ ${varName}: Required for production`, colors.red);
      hasErrors = true;
    } else {
      print(`✅ ${varName}: Set`, colors.green);
    }
  }
  
  // Check production security
  if (process.env.ADMIN_SETUP_KEY === 'astral2025') {
    print(`⚠️  ADMIN_SETUP_KEY: Using default value in production is insecure`, colors.yellow);
    hasWarnings = true;
  }
  
  if (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.startsWith('http://')) {
    print(`⚠️  NEXT_PUBLIC_APP_URL: Using HTTP in production is insecure`, colors.yellow);
    hasWarnings = true;
  }
}
printHeader('Recommended Services');

// Check recommended variables with alternatives
for (const service of recommendedEnvVars) {
  const mainValue = process.env[service.name];
  const alternatives = service.alternatives || [];
  const hasAlternative = alternatives.some(alt => process.env[alt]);
  
  if (mainValue) {
    print(`✅ ${service.category}: ${service.name} configured`, colors.green);
  } else if (hasAlternative) {
    const configuredAlt = alternatives.find(alt => process.env[alt]);
    print(`✅ ${service.category}: ${configuredAlt} configured (alternative)`, colors.green);
  } else {
    print(`⚠️  ${service.category}: ${service.description} not configured`, colors.yellow);
    if (alternatives.length > 0) {
      print(`   Alternatives: ${alternatives.join(', ')}`, colors.dim);
    }
    hasWarnings = true;
  }
}
// Database connection validation
printHeader('Database Configuration');

const databaseUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
if (databaseUrl) {
  if (databaseUrl.includes('pooling=true') || databaseUrl.includes('pgbouncer=true')) {
    print(`✅ Database: Connection pooling enabled`, colors.green);
  } else {
    print(`⚠️  Database: Consider enabling connection pooling for better performance`, colors.yellow);
    hasWarnings = true;
  }
  
  if (databaseUrl.includes('sslmode=require')) {
    print(`✅ Database: SSL mode enabled`, colors.green);
  } else {
    print(`⚠️  Database: Consider enabling SSL mode for security`, colors.yellow);
    hasWarnings = true;
  }
} else {
  print(`❌ Database: No valid database URL found`, colors.red);
  hasErrors = true;
}
// Final validation result
console.log('\n' + '='.repeat(60));

if (hasErrors) {
  print('❌ Environment validation: FAILED', colors.red);
  print('   Critical configuration errors must be fixed before deployment.', colors.red);
  
  console.log('\n💡 Quick fixes:');
  print('   1. Copy .env.example to .env.local', colors.dim);
  print('   2. Generate secure secrets with: openssl rand -hex 64', colors.dim);
  print('   3. Configure your database and Supabase credentials', colors.dim);
  
  process.exit(1);
} else if (hasWarnings) {
  print('⚠️  Environment validation: PASSED WITH WARNINGS', colors.yellow);
  print('   Optional features are not configured but the app will work.', colors.yellow);
  print('   Consider adding recommended services for better performance.', colors.yellow);
} else {
  print('🎉 Environment validation: ALL CHECKS PASSED', colors.green);
  print('   Your Astral Field installation is fully configured!', colors.green);
}

// Save validation report
const report = {
  timestamp: new Date().toISOString(),
  status: hasErrors ? 'failed' : hasWarnings ? 'warning' : 'passed',
  errors: hasErrors,
  warnings: hasWarnings,
  environment: process.env.NODE_ENV || 'development',
  summary: {
    required_variables: requiredEnvVars.length,
    configured_services: recommendedEnvVars.filter(service => 
      process.env[service.name] || 
      (service.alternatives && service.alternatives.some(alt => process.env[alt]))
    ).length,
    total_services: recommendedEnvVars.length
  }
};

try {
  fs.writeFileSync(
    path.join(process.cwd(), 'env-validation-report.json'),
    JSON.stringify(report, null, 2)
  );
  print('\n📄 Validation report saved to env-validation-report.json', colors.dim);
} catch (error) {
  print(`⚠️  Could not save validation report: ${error.message}`, colors.yellow);
}

console.log('\n📚 Resources:');
print('   📖 Configuration guide: .env.example', colors.dim);
print('   🔧 Detailed validation: node src/lib/env/check-env.js', colors.dim);
print('   🚀 Start application: npm run dev', colors.dim);