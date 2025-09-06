#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Environment Validation for AI Suite Production');
console.log('================================================');

const validationChecks = [
  {
    name: 'Environment Variables',
    check: validateEnvironmentVariables
  },
  {
    name: 'Database Configuration',
    check: validateDatabaseConfiguration
  },
  {
    name: 'AI Provider APIs',
    check: validateAIProviders
  },
  {
    name: 'Application Configuration',
    check: validateApplicationConfig
  },
  {
    name: 'Security Configuration',
    check: validateSecurityConfig
  },
  {
    name: 'Performance Settings',
    check: validatePerformanceSettings
  }
];

async function validateEnvironmentVariables() {
  console.log('Checking required environment variables...');
  
  const requiredVars = {
    // Database
    'NEON_DATABASE_URL': 'Neon PostgreSQL connection string',
    
    // AI Providers
    'DEEPSEEK_API_KEY': 'DeepSeek API key for cost-effective AI',
    'ANTHROPIC_API_KEY': 'Claude API key for advanced reasoning',
    'OPENAI_API_KEY': 'OpenAI API key for GPT models',
    'GEMINI_API_KEY': 'Google Gemini API key',
    
    // Authentication
    'NEXTAUTH_SECRET': 'NextAuth.js secret for session encryption',
    'NEXTAUTH_URL': 'Production URL for NextAuth callbacks',
    
    // Optional but recommended
    'REDIS_URL': 'Redis connection for caching (optional)',
    'SENTRY_DSN': 'Error tracking with Sentry (optional)',
  };
  
  const warnings = [];
  const errors = [];
  
  for (const [varName, description] of Object.entries(requiredVars)) {
    const value = process.env[varName];
    
    if (!value) {
      if (varName.includes('REDIS') || varName.includes('SENTRY')) {
        warnings.push(`⚠️  ${varName}: ${description} (optional but recommended)`);
      } else {
        errors.push(`❌ ${varName}: ${description} (required)`);
      }
    } else {
      // Validate format for specific variables
      if (varName === 'NEON_DATABASE_URL' && !value.startsWith('postgresql://')) {
        errors.push(`❌ ${varName}: Must be a valid PostgreSQL connection string`);
      } else if (varName === 'NEXTAUTH_URL' && !value.startsWith('https://')) {
        errors.push(`❌ ${varName}: Must be a valid HTTPS URL for production`);
      } else {
        console.log(`✅ ${varName}: Configured`);
      }
    }
  }
  
  if (warnings.length > 0) {
    console.log('\nWarnings:');
    warnings.forEach(warning => console.log(warning));
  }
  
  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(error => console.log(error));
    throw new Error(`${errors.length} required environment variables are missing or invalid`);
  }
  
  return { warnings: warnings.length, errors: errors.length };
}

async function validateDatabaseConfiguration() {
  console.log('Validating database configuration...');
  
  const dbUrl = process.env.NEON_DATABASE_URL;
  if (!dbUrl) {
    throw new Error('Database URL not configured');
  }
  
  // Parse database URL to validate components
  try {
    const url = new URL(dbUrl);
    
    if (url.protocol !== 'postgresql:') {
      throw new Error('Invalid database protocol, must be postgresql://');
    }
    
    if (!url.hostname || !url.pathname) {
      throw new Error('Invalid database URL format');
    }
    
    console.log(`✅ Database host: ${url.hostname}`);
    console.log(`✅ Database name: ${url.pathname.substring(1)}`);
    
    // Check if SSL is configured (required for Neon)
    const searchParams = new URLSearchParams(url.search);
    const sslMode = searchParams.get('sslmode') || 'require';
    
    if (sslMode === 'disable') {
      console.warn('⚠️  SSL is disabled for database connection (not recommended for production)');
    } else {
      console.log(`✅ SSL mode: ${sslMode}`);
    }
    
  } catch (error) {
    throw new Error(`Invalid database URL: ${error.message}`);
  }
  
  return { configured: true };
}

async function validateAIProviders() {
  console.log('Validating AI provider configurations...');
  
  const providers = {
    'DeepSeek': process.env.DEEPSEEK_API_KEY,
    'Claude': process.env.ANTHROPIC_API_KEY,
    'OpenAI': process.env.OPENAI_API_KEY,
    'Gemini': process.env.GEMINI_API_KEY
  };
  
  const configuredProviders = [];
  const missingProviders = [];
  
  for (const [name, apiKey] of Object.entries(providers)) {
    if (apiKey && apiKey.length > 10) {
      configuredProviders.push(name);
      console.log(`✅ ${name}: API key configured`);
    } else {
      missingProviders.push(name);
      console.log(`❌ ${name}: API key missing or invalid`);
    }
  }
  
  if (configuredProviders.length === 0) {
    throw new Error('At least one AI provider must be configured');
  }
  
  if (configuredProviders.length < 2) {
    console.warn('⚠️  Only one AI provider configured. Multiple providers recommended for fallback.');
  }
  
  return { 
    configured: configuredProviders.length, 
    missing: missingProviders.length,
    providers: configuredProviders
  };
}

async function validateApplicationConfig() {
  console.log('Validating application configuration...');
  
  // Check Next.js configuration
  const nextConfigPath = path.join(process.cwd(), 'next.config.js');
  if (!fs.existsSync(nextConfigPath)) {
    throw new Error('next.config.js not found');
  }
  console.log('✅ Next.js configuration found');
  
  // Check TypeScript configuration
  const tsConfigPath = path.join(process.cwd(), 'tsconfig.json');
  if (!fs.existsSync(tsConfigPath)) {
    throw new Error('tsconfig.json not found');
  }
  console.log('✅ TypeScript configuration found');
  
  // Check package.json scripts
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('package.json not found');
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const requiredScripts = ['build', 'start', 'lint', 'type-check'];
  const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
  
  if (missingScripts.length > 0) {
    throw new Error(`Missing required scripts: ${missingScripts.join(', ')}`);
  }
  console.log('✅ Required npm scripts configured');
  
  return { configured: true };
}

async function validateSecurityConfig() {
  console.log('Validating security configuration...');
  
  const nextAuthSecret = process.env.NEXTAUTH_SECRET;
  if (!nextAuthSecret || nextAuthSecret.length < 32) {
    throw new Error('NEXTAUTH_SECRET must be at least 32 characters for production');
  }
  console.log('✅ NextAuth secret configured');
  
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  if (!nextAuthUrl || !nextAuthUrl.startsWith('https://')) {
    throw new Error('NEXTAUTH_URL must be a valid HTTPS URL for production');
  }
  console.log(`✅ NextAuth URL: ${nextAuthUrl}`);
  
  // Check if NODE_ENV is set to production
  if (process.env.NODE_ENV !== 'production') {
    console.warn('⚠️  NODE_ENV is not set to "production"');
  } else {
    console.log('✅ NODE_ENV set to production');
  }
  
  return { configured: true };
}

async function validatePerformanceSettings() {
  console.log('Validating performance settings...');
  
  // Check for Redis configuration (optional but recommended)
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.warn('⚠️  Redis not configured. Caching will use in-memory storage (not recommended for production)');
  } else {
    console.log('✅ Redis configured for caching');
  }
  
  // Check rate limiting configuration
  const rateLimitConfig = {
    maxRequests: process.env.RATE_LIMIT_MAX_REQUESTS || '1000',
    windowMs: process.env.RATE_LIMIT_WINDOW_MS || '60000'
  };
  
  console.log(`✅ Rate limiting: ${rateLimitConfig.maxRequests} requests per ${rateLimitConfig.windowMs}ms`);
  
  // Check cache TTL settings
  const cacheTTL = process.env.CACHE_TTL_SECONDS || '3600';
  console.log(`✅ Cache TTL: ${cacheTTL} seconds`);
  
  return { configured: true };
}

async function runValidationChecks() {
  const results = [];
  let totalErrors = 0;
  let totalWarnings = 0;
  
  for (const { name, check } of validationChecks) {
    console.log(`\n🔍 ${name}`);
    console.log('-'.repeat(30));
    
    try {
      const result = await check();
      results.push({ name, success: true, result });
      console.log(`✅ ${name} validation passed`);
      
      if (result.warnings) totalWarnings += result.warnings;
      if (result.errors) totalErrors += result.errors;
    } catch (error) {
      results.push({ name, success: false, error: error.message });
      console.error(`❌ ${name} validation failed: ${error.message}`);
      totalErrors++;
    }
  }
  
  return { results, totalErrors, totalWarnings };
}

async function main() {
  console.log('Starting environment validation...\n');
  
  try {
    const { results, totalErrors, totalWarnings } = await runValidationChecks();
    
    console.log('\n📊 Validation Summary');
    console.log('====================');
    console.log(`Total Checks: ${results.length}`);
    console.log(`Passed: ${results.filter(r => r.success).length}`);
    console.log(`Failed: ${results.filter(r => !r.success).length}`);
    console.log(`Warnings: ${totalWarnings}`);
    
    if (totalErrors > 0) {
      console.error(`\n❌ Environment validation failed with ${totalErrors} errors`);
      console.error('Please fix the above issues before proceeding with deployment');
      process.exit(1);
    } else {
      console.log('\n✅ Environment validation passed successfully!');
      if (totalWarnings > 0) {
        console.warn(`Note: ${totalWarnings} warnings detected. Review recommendations above.`);
      }
    }
    
  } catch (error) {
    console.error('Fatal validation error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { 
  validateEnvironmentVariables,
  validateDatabaseConfiguration,
  validateAIProviders,
  validateApplicationConfig,
  validateSecurityConfig,
  validatePerformanceSettings
};