/**
 * Startup Environment Validation
 * 
 * This module provides fast startup validation that can be called
 * during application initialization to ensure critical environment
 * variables are properly configured.
 */

import { getValidationStatus } from './validation';

export interface StartupValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  criticalMissing: string[];
  summary: {
    database: boolean;
    authentication: boolean;
    basicServices: boolean;
  };
}

/**
 * Performs a quick validation check suitable for application startup.
 * This is designed to be fast and fail-fast for critical misconfigurations.
 */
export function validateStartupEnvironment(): StartupValidationResult {
  try {
    const status = getValidationStatus();
    
    const criticalMissing: string[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check for critical missing variables in production
    const env = process.env.NODE_ENV || 'development';
    if (env === 'production') {
      const productionCritical = [
        'DATABASE_URL',
        'JWT_SECRET', 
        'ADMIN_SETUP_KEY',
        'ENCRYPTION_SECRET',
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'VAPID_PUBLIC_KEY',
        'VAPID_PRIVATE_KEY',
        'NEXT_PUBLIC_APP_URL'
      ];
      
      productionCritical.forEach(key => {
        if (!process.env[key]) {
          criticalMissing.push(key);
        }
      });
    }
    
    // Copy status errors and warnings
    errors.push(...status.errors);
    warnings.push(...status.warnings);
    
    // Add specific warnings for production
    if (env === 'production') {
      if (!process.env.REDIS_URL && !process.env.KV_URL && !process.env.UPSTASH_REDIS_URL) {
        warnings.push('No caching service configured. Performance may be degraded.');
      }
      
      if (!process.env.SENTRY_DSN) {
        warnings.push('Error monitoring not configured. Consider adding Sentry DSN.');
      }
      
      if (status.configured.aiServices.length === 0) {
        warnings.push('No AI services configured. AI features will be disabled.');
      }
    }
    
    const success = status.isValid && criticalMissing.length === 0;
    
    return {
      success,
      errors,
      warnings,
      criticalMissing,
      summary: {
        database: status.configured.database,
        authentication: status.configured.auth,
        basicServices: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      }
    };
    
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Unknown validation error'],
      warnings: [],
      criticalMissing: [],
      summary: {
        database: false,
        authentication: false,
        basicServices: false
      }
    };
  }
}

/**
 * Prints a concise startup validation report to the console.
 * Suitable for application startup logs.
 */
export function printStartupValidation(): boolean {
  const result = validateStartupEnvironment();
  const env = process.env.NODE_ENV || 'development';
  
  console.log(`🚀 Astral Field Environment Validation (${env.toUpperCase()})`);
  console.log('='.repeat(50));
  
  if (result.success) {
    console.log('✅ Environment validation: PASSED');
    console.log(`   Database: ${result.summary.database ? '✅' : '❌'}`);
    console.log(`   Authentication: ${result.summary.authentication ? '✅' : '❌'}`);
    console.log(`   Basic Services: ${result.summary.basicServices ? '✅' : '❌'}`);
    
    if (result.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      result.warnings.forEach(warning => console.log(`   - ${warning}`));
    }
    
    console.log('\n🎯 Ready to start application');
    return true;
  } else {
    console.log('❌ Environment validation: FAILED');
    
    if (result.criticalMissing.length > 0) {
      console.log('\n🚨 Critical missing variables:');
      result.criticalMissing.forEach(key => console.log(`   - ${key}`));
    }
    
    if (result.errors.length > 0) {
      console.log('\n❌ Configuration errors:');
      result.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    console.log('\n💡 Fix these issues before starting the application');
    console.log('📖 See .env.example for configuration examples');
    
    return false;
  }
}

/**
 * Validates environment and exits process if critical errors are found.
 * Use this in production startup scripts.
 */
export function validateOrExit(): void {
  if (!printStartupValidation()) {
    console.log('\n🛑 Exiting due to critical environment configuration errors');
    process.exit(1);
  }
}

/**
 * Get a list of all environment variables used by Astral Field
 */
export function getAllEnvironmentVariables(): Record<string, {
  required: boolean;
  description: string;
  category: string;
  productionRequired?: boolean;
}> {
  return {
    // Database
    'DATABASE_URL': {
      required: true,
      description: 'PostgreSQL database connection string',
      category: 'Database'
    },
    'NEON_DATABASE_URL': {
      required: true,
      description: 'Alternative PostgreSQL connection (Neon preferred)',
      category: 'Database'
    },
    
    // Authentication
    'JWT_SECRET': {
      required: true,
      description: 'Secret for signing JWT tokens (64+ characters)',
      category: 'Authentication'
    },
    'ADMIN_SETUP_KEY': {
      required: true,
      description: 'Key for initial admin setup (32+ characters)',
      category: 'Authentication'
    },
    'ENCRYPTION_SECRET': {
      required: true,
      description: 'Secret for encrypting sensitive data (32+ characters)',
      category: 'Authentication'
    },
    
    // Supabase
    'NEXT_PUBLIC_SUPABASE_URL': {
      required: true,
      description: 'Supabase project URL',
      category: 'Services'
    },
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': {
      required: true,
      description: 'Supabase anonymous key',
      category: 'Services'
    },
    'SUPABASE_SERVICE_ROLE_KEY': {
      required: false,
      description: 'Supabase service role key for admin operations',
      category: 'Services'
    },
    
    // Push Notifications
    'VAPID_PUBLIC_KEY': {
      required: false,
      productionRequired: true,
      description: 'VAPID public key for push notifications',
      category: 'Push Notifications'
    },
    'VAPID_PRIVATE_KEY': {
      required: false,
      productionRequired: true,
      description: 'VAPID private key for push notifications',
      category: 'Push Notifications'
    },
    'NEXT_PUBLIC_VAPID_KEY': {
      required: false,
      description: 'Public VAPID key for client-side use',
      category: 'Push Notifications'
    },
    
    // AI Services
    'OPENAI_API_KEY': {
      required: false,
      description: 'OpenAI API key for GPT models',
      category: 'AI Services'
    },
    'ANTHROPIC_API_KEY': {
      required: false,
      description: 'Anthropic API key for Claude models',
      category: 'AI Services'
    },
    'GEMINI_API_KEY': {
      required: false,
      description: 'Google Gemini API key',
      category: 'AI Services'
    },
    'DEEPSEEK_API_KEY': {
      required: false,
      description: 'DeepSeek API key',
      category: 'AI Services'
    },
    
    // Sports Data
    'SPORTS_IO_API_KEY': {
      required: false,
      description: 'Sports data provider API key',
      category: 'Sports Data'
    },
    'SPORTSDATA_API_KEY': {
      required: false,
      description: 'SportsData.io API key',
      category: 'Sports Data'
    },
    'ESPN_API_KEY': {
      required: false,
      description: 'ESPN API key',
      category: 'Sports Data'
    },
    'WEATHER_API_KEY': {
      required: false,
      description: 'Weather API key for game conditions',
      category: 'Sports Data'
    },
    
    // Caching
    'REDIS_URL': {
      required: false,
      description: 'Redis connection URL for caching',
      category: 'Caching'
    },
    'KV_URL': {
      required: false,
      description: 'Alternative KV store URL',
      category: 'Caching'
    },
    'UPSTASH_REDIS_URL': {
      required: false,
      description: 'Upstash Redis URL',
      category: 'Caching'
    },
    
    // Application
    'NEXT_PUBLIC_APP_URL': {
      required: true,
      description: 'Application URL',
      category: 'Application'
    },
    'NODE_ENV': {
      required: true,
      description: 'Environment mode (development/test/production)',
      category: 'Application'
    },
    'API_SECRET_KEY': {
      required: false,
      description: 'Internal API secret key',
      category: 'Security'
    },
    
    // Optional Services
    'NEXT_PUBLIC_WS_URL': {
      required: false,
      description: 'WebSocket server URL',
      category: 'Real-time'
    },
    'SENTRY_DSN': {
      required: false,
      description: 'Sentry error tracking DSN',
      category: 'Monitoring'
    },
    'WEBHOOK_URL': {
      required: false,
      description: 'Webhook URL for notifications',
      category: 'Monitoring'
    }
  };
}