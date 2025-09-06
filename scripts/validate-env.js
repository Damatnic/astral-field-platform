#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Production Environment...\n');

// Required environment variables for production
const requiredEnvVars = [
  {
    name: 'NODE_ENV',
    description: 'Node environment',
    required: true,
    expectedValue: 'production'
  },
  {
    name: 'NEXT_PUBLIC_APP_URL',
    description: 'Application URL',
    required: true,
    format: /^https:\/\/.+/
  },
  {
    name: 'DATABASE_URL',
    description: 'Database connection string',
    required: true,
    format: /^postgresql:\/\/.+/
  },
  {
    name: 'NEXTAUTH_SECRET',
    description: 'NextAuth secret key',
    required: true,
    minLength: 32
  },
  {
    name: 'OPENAI_API_KEY',
    description: 'OpenAI API key',
    required: true,
    format: /^sk-.+/
  }
];

// Optional but recommended environment variables
const recommendedEnvVars = [
  'SPORTS_DATA_API_KEY',
  'REDIS_URL',
  'SENTRY_DSN',
  'ANALYTICS_ID',
  'WEBHOOK_SECRET'
];

// Security-related environment variables
const securityEnvVars = [
  'RATE_LIMIT_SECRET',
  'AUDIT_LOG_SECRET',
  'MFA_ENCRYPTION_KEY'
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

console.log('\n🔒 Validating Required Variables...');

// Validate required environment variables
for (const envVar of requiredEnvVars) {
  const value = process.env[envVar.name];
  
  if (!value) {
    console.error(`❌ ${envVar.name}: Missing required variable (${envVar.description})`);
    hasErrors = true;
    continue;
  }
  
  // Check expected value
  if (envVar.expectedValue && value !== envVar.expectedValue) {
    console.error(`❌ ${envVar.name}: Expected "${envVar.expectedValue}", got "${value}"`);
    hasErrors = true;
    continue;
  }
  
  // Check format
  if (envVar.format && !envVar.format.test(value)) {
    console.error(`❌ ${envVar.name}: Invalid format`);
    hasErrors = true;
    continue;
  }
  
  // Check minimum length
  if (envVar.minLength && value.length < envVar.minLength) {
    console.error(`❌ ${envVar.name}: Too short (minimum ${envVar.minLength} characters)`);
    hasErrors = true;
    continue;
  }
  
  console.log(`✅ ${envVar.name}: Valid`);
}

console.log('\n🔧 Checking Recommended Variables...');

// Check recommended variables
for (const envVar of recommendedEnvVars) {
  const value = process.env[envVar];
  
  if (!value) {
    console.warn(`⚠️  ${envVar}: Not set (recommended for production)`);
    hasWarnings = true;
  } else {
    console.log(`✅ ${envVar}: Set`);
  }
}

console.log('\n🛡️  Validating Security Variables...');

// Check security variables
for (const envVar of securityEnvVars) {
  const value = process.env[envVar];
  
  if (!value) {
    console.warn(`⚠️  ${envVar}: Not set (recommended for enhanced security)`);
    hasWarnings = true;
  } else if (value.length < 32) {
    console.warn(`⚠️  ${envVar}: Should be at least 32 characters for security`);
    hasWarnings = true;
  } else {
    console.log(`✅ ${envVar}: Set and secure`);
  }
}

console.log('\n📊 Environment Validation Summary:');

// Check for insecure configurations
const insecureConfigs = [];

if (process.env.NODE_ENV !== 'production') {
  insecureConfigs.push('NODE_ENV is not set to production');
}

if (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.startsWith('http://')) {
  insecureConfigs.push('Using HTTP instead of HTTPS');
}

if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
  insecureConfigs.push('NEXTAUTH_SECRET is too short');
}

if (insecureConfigs.length > 0) {
  console.log('\n🚨 Security Warnings:');
  for (const config of insecureConfigs) {
    console.warn(`⚠️  ${config}`);
    hasWarnings = true;
  }
}

// Performance recommendations
console.log('\n⚡ Performance Recommendations:');

const performanceChecks = [
  {
    name: 'Database pooling',
    check: () => process.env.DATABASE_URL && process.env.DATABASE_URL.includes('pooling=true'),
    message: 'Consider enabling database connection pooling'
  },
  {
    name: 'Redis caching',
    check: () => !!process.env.REDIS_URL,
    message: 'Redis recommended for production caching'
  },
  {
    name: 'CDN configuration',
    check: () => process.env.NEXT_PUBLIC_CDN_URL,
    message: 'CDN recommended for static assets'
  }
];

for (const check of performanceChecks) {
  if (check.check()) {
    console.log(`✅ ${check.name}: Configured`);
  } else {
    console.warn(`⚠️  ${check.name}: ${check.message}`);
    hasWarnings = true;
  }
}

// Final validation result
console.log('\n' + '='.repeat(50));

if (hasErrors) {
  console.error('❌ Environment validation FAILED');
  console.error('   Please fix the errors above before proceeding with production deployment.');
  process.exit(1);
} else if (hasWarnings) {
  console.warn('⚠️  Environment validation completed with warnings');
  console.warn('   Consider addressing the warnings for optimal production performance.');
  console.log('✅ Proceeding with build...');
} else {
  console.log('✅ Environment validation PASSED');
  console.log('   Production environment is properly configured.');
}

// Save validation report
const report = {
  timestamp: new Date().toISOString(),
  status: hasErrors ? 'failed' : hasWarnings ? 'warning' : 'passed',
  errors: hasErrors,
  warnings: hasWarnings,
  environment: Object.keys(process.env)
    .filter(key => key.startsWith('NEXT_PUBLIC_') || requiredEnvVars.some(v => v.name === key))
    .reduce((obj, key) => {
      obj[key] = key.includes('SECRET') || key.includes('KEY') ? '[REDACTED]' : process.env[key];
      return obj;
    }, {})
};

fs.writeFileSync(
  path.join(process.cwd(), 'env-validation-report.json'),
  JSON.stringify(report, null, 2)
);

console.log('\n📄 Validation report saved to env-validation-report.json');