/**
 * Environment Variable Validation System
 * 
 * This module provides comprehensive validation for all environment variables
 * used in Astral Field, ensuring type safety and proper configuration.
 */

import { URL } from 'url';

// Environment Variable Categories
export interface DatabaseConfig {
  DATABASE_URL: string;
  NEON_DATABASE_URL: string;
}

export interface AuthConfig {
  JWT_SECRET: string;
  ADMIN_SETUP_KEY: string;
  ENCRYPTION_SECRET: string;
}

export interface AIConfig {
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  GEMINI_API_KEY?: string;
  DEEPSEEK_API_KEY?: string;
}

export interface ServicesConfig {
  REDIS_URL?: string;
  KV_URL?: string;
  UPSTASH_REDIS_URL?: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

export interface PushNotificationConfig {
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  NEXT_PUBLIC_VAPID_KEY?: string;
  NEXT_PUBLIC_VAPID_PUBLIC_KEY?: string;
}

export interface SportsConfig {
  SPORTS_IO_API_KEY?: string;
  SPORTSDATA_API_KEY?: string;
  ESPN_API_KEY?: string;
  NEXT_PUBLIC_SPORTSDATA_API_KEY?: string;
  WEATHER_API_KEY?: string;
  NEXT_PUBLIC_WEATHER_API_KEY?: string;
  NEXT_PUBLIC_NFL_VENUES_API?: string;
  SPORTSDATA_API_URL?: string;
}

export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'test' | 'production';
  NEXT_PUBLIC_APP_URL: string;
  NEXT_TELEMETRY_DISABLED?: string;
  DEPLOYMENT_ID?: string;
  API_SECRET_KEY?: string;
  NEXT_PUBLIC_WS_URL?: string;
  DEBUG?: string;
  LOG_CONSOLE?: string;
  CUSTOM_KEY?: string;
  CI?: string;
  PLAYWRIGHT_BASE_URL?: string;
}

export interface AdminConfig {
  ADMIN_EMAIL?: string;
  ADMIN_USERNAME?: string;
  ADMIN_PASSWORD?: string;
}

export interface MonitoringConfig {
  METRICS_ENDPOINT?: string;
  METRICS_API_KEY?: string;
  LOG_ENDPOINT?: string;
  LOG_API_KEY?: string;
  SENTRY_DSN?: string;
  WEBHOOK_URL?: string;
}

export interface DatabaseAdvancedConfig {
  DB_MAX_CONNECTIONS?: string;
  DB_IDLE_TIMEOUT?: string;
  DB_CONNECTION_TIMEOUT?: string;
  PGSSLMODE?: string;
  TEST_DATABASE_URL?: string;
  TEST_SUPABASE_URL?: string;
  TEST_SUPABASE_ANON_KEY?: string;
  TEST_SUPABASE_SERVICE_KEY?: string;
}

export interface SecurityConfig {
  CSP_REPORT_URI?: string;
  MAX_WS_CONNECTIONS?: string;
}

export interface WebSocketConfig {
  REDIS_HOST?: string;
  REDIS_PORT?: string;
  REDIS_PASSWORD?: string;
}

// Complete validated environment
export interface ValidatedEnv extends 
  DatabaseConfig,
  AuthConfig,
  AIConfig,
  ServicesConfig,
  PushNotificationConfig,
  SportsConfig,
  EnvironmentConfig,
  AdminConfig,
  MonitoringConfig,
  DatabaseAdvancedConfig,
  SecurityConfig,
  WebSocketConfig {}

// Validation error types
export class ValidationError extends Error {
  constructor(public variable: string, public reason: string) {
    super(`Environment variable validation failed for ${variable}: ${reason}`);
    this.name = 'ValidationError';
  }
}

export class MissingVariableError extends Error {
  constructor(public variables: string[]) {
    super(`Missing required environment variables: ${variables.join(', ')}`);
    this.name = 'MissingVariableError';
  }
}

// Validation rules and utilities
class EnvironmentValidator {
  private static readonly MIN_SECRET_LENGTH = 32;
  private static readonly MIN_JWT_SECRET_LENGTH = 64;
  private static readonly MIN_API_KEY_LENGTH = 16;

  // URL validation
  static isValidUrl(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  // Database URL validation
  static isValidDatabaseUrl(value: string): boolean {
    if (!this.isValidUrl(value)) return false;
    const url = new URL(value);
    return url.protocol === 'postgresql:' || url.protocol === 'postgres:';
  }

  // API key format validation
  static isValidOpenAIKey(value: string): boolean {
    return value.startsWith('sk-') && value.length >= 50;
  }

  static isValidAnthropicKey(value: string): boolean {
    return value.startsWith('sk-ant-') && value.length >= 40;
  }

  static isValidSportsIOKey(value: string): boolean {
    return value.length >= this.MIN_API_KEY_LENGTH;
  }

  // Secret validation
  static isValidSecret(value: string, minLength: number = this.MIN_SECRET_LENGTH): boolean {
    return value.length >= minLength;
  }

  // JWT secret validation
  static isValidJWTSecret(value: string): boolean {
    return this.isValidSecret(value, this.MIN_JWT_SECRET_LENGTH);
  }

  // VAPID key validation
  static isValidVAPIDKey(value: string): boolean {
    // VAPID keys should be base64url encoded and specific lengths
    const publicKeyPattern = /^[A-Za-z0-9_-]{87}$/;
    const privateKeyPattern = /^[A-Za-z0-9_-]{43}$/;
    return publicKeyPattern.test(value) || privateKeyPattern.test(value);
  }

  // Environment-specific validation
  static validateForEnvironment(env: string, variable: string, value: string): void {
    if (env === 'production') {
      // Production-specific validation
      if (variable === 'JWT_SECRET' && !this.isValidJWTSecret(value)) {
        throw new ValidationError(variable, 'JWT secret must be at least 64 characters in production');
      }
      if (variable === 'ENCRYPTION_SECRET' && !this.isValidSecret(value, 64)) {
        throw new ValidationError(variable, 'Encryption secret must be at least 64 characters in production');
      }
    }
  }
}

// Main validation function
export function validateEnvironmentVariables(): ValidatedEnv {
  const env = process.env.NODE_ENV || 'development';
  const errors: ValidationError[] = [];
  const missing: string[] = [];

  // Helper function to get and validate required variables
  function getRequired(key: string): string {
    const value = process.env[key];
    if (!value || value.trim() === '') {
      missing.push(key);
      return '';
    }
    return value.trim();
  }

  // Helper function to get optional variables
  function getOptional(key: string): string | undefined {
    const value = process.env[key];
    return value && value.trim() !== '' ? value.trim() : undefined;
  }

  // Validate database configuration
  const databaseUrl = getRequired('DATABASE_URL') || getRequired('NEON_DATABASE_URL');
  const neonDatabaseUrl = getRequired('NEON_DATABASE_URL') || getRequired('DATABASE_URL');

  if (databaseUrl && !EnvironmentValidator.isValidDatabaseUrl(databaseUrl)) {
    errors.push(new ValidationError('DATABASE_URL', 'Must be a valid PostgreSQL connection string'));
  }

  // Validate auth configuration
  const jwtSecret = getRequired('JWT_SECRET');
  if (jwtSecret && !EnvironmentValidator.isValidJWTSecret(jwtSecret)) {
    errors.push(new ValidationError('JWT_SECRET', 'Must be at least 64 characters long for security'));
  }

  const adminSetupKey = getRequired('ADMIN_SETUP_KEY');
  if (adminSetupKey && !EnvironmentValidator.isValidSecret(adminSetupKey)) {
    errors.push(new ValidationError('ADMIN_SETUP_KEY', 'Must be at least 32 characters long'));
  }

  const encryptionSecret = getRequired('ENCRYPTION_SECRET');
  if (encryptionSecret && !EnvironmentValidator.isValidSecret(encryptionSecret)) {
    errors.push(new ValidationError('ENCRYPTION_SECRET', 'Must be at least 32 characters long'));
  }

  // Validate AI service keys (optional but format-checked if present)
  const openaiKey = getOptional('OPENAI_API_KEY');
  if (openaiKey && !EnvironmentValidator.isValidOpenAIKey(openaiKey)) {
    errors.push(new ValidationError('OPENAI_API_KEY', 'Must be a valid OpenAI API key (starts with sk- and proper length)'));
  }

  const anthropicKey = getOptional('ANTHROPIC_API_KEY');
  if (anthropicKey && !EnvironmentValidator.isValidAnthropicKey(anthropicKey)) {
    errors.push(new ValidationError('ANTHROPIC_API_KEY', 'Must be a valid Anthropic API key (starts with sk-ant- and proper length)'));
  }

  const sportsIOKey = getOptional('SPORTS_IO_API_KEY');
  if (sportsIOKey && !EnvironmentValidator.isValidSportsIOKey(sportsIOKey)) {
    errors.push(new ValidationError('SPORTS_IO_API_KEY', 'Must be at least 16 characters long'));
  }

  const sportsDataKey = getOptional('SPORTSDATA_API_KEY');
  if (sportsDataKey && !EnvironmentValidator.isValidSportsIOKey(sportsDataKey)) {
    errors.push(new ValidationError('SPORTSDATA_API_KEY', 'Must be at least 16 characters long'));
  }

  // Validate service configuration
  const supabaseUrl = getRequired('NEXT_PUBLIC_SUPABASE_URL');
  if (supabaseUrl && !EnvironmentValidator.isValidUrl(supabaseUrl)) {
    errors.push(new ValidationError('NEXT_PUBLIC_SUPABASE_URL', 'Must be a valid URL'));
  }

  const supabaseAnonKey = getRequired('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (supabaseAnonKey && supabaseAnonKey.length < 100) {
    errors.push(new ValidationError('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'Must be a valid Supabase anonymous key'));
  }

  // Validate Redis URL if provided (check multiple possible Redis URLs)
  const redisUrl = getOptional('REDIS_URL');
  const kvUrl = getOptional('KV_URL');
  const upstashRedisUrl = getOptional('UPSTASH_REDIS_URL');
  
  if (redisUrl && !EnvironmentValidator.isValidUrl(redisUrl)) {
    errors.push(new ValidationError('REDIS_URL', 'Must be a valid Redis connection URL'));
  }
  if (kvUrl && !EnvironmentValidator.isValidUrl(kvUrl)) {
    errors.push(new ValidationError('KV_URL', 'Must be a valid KV connection URL'));
  }
  if (upstashRedisUrl && !EnvironmentValidator.isValidUrl(upstashRedisUrl)) {
    errors.push(new ValidationError('UPSTASH_REDIS_URL', 'Must be a valid Upstash Redis URL'));
  }

  // Validate push notification configuration
  const vapidPublicKey = getRequired('VAPID_PUBLIC_KEY');
  const vapidPrivateKey = getRequired('VAPID_PRIVATE_KEY');

  // VAPID keys are required for push notifications
  if (env === 'production') {
    if (!vapidPublicKey) missing.push('VAPID_PUBLIC_KEY');
    if (!vapidPrivateKey) missing.push('VAPID_PRIVATE_KEY');
  }

  // Validate environment configuration
  const appUrl = getRequired('NEXT_PUBLIC_APP_URL');
  if (appUrl && !EnvironmentValidator.isValidUrl(appUrl)) {
    errors.push(new ValidationError('NEXT_PUBLIC_APP_URL', 'Must be a valid URL'));
  }

  // Validate NODE_ENV
  const nodeEnv = process.env.NODE_ENV as any;
  if (nodeEnv && !['development', 'test', 'production'].includes(nodeEnv)) {
    errors.push(new ValidationError('NODE_ENV', 'Must be development, test, or production'));
  }

  // Environment-specific validation
  [
    { key: 'JWT_SECRET', value: jwtSecret },
    { key: 'ENCRYPTION_SECRET', value: encryptionSecret }
  ].forEach(({ key, value }) => {
    if (value) {
      try {
        EnvironmentValidator.validateForEnvironment(env, key, value);
      } catch (error) {
        if (error instanceof ValidationError) {
          errors.push(error);
        }
      }
    }
  });

  // Production-specific required variables
  if (env === 'production') {
    const productionRequired = [
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

    productionRequired.forEach(key => {
      if (!process.env[key]) {
        missing.push(key);
      }
    });
  }

  // Throw errors if validation failed
  if (missing.length > 0) {
    throw new MissingVariableError(missing);
  }

  if (errors.length > 0) {
    const errorMessage = errors.map(e => e.message).join('\n');
    throw new Error(`Environment validation failed:\n${errorMessage}`);
  }

  // Return validated configuration
  return {
    // Database
    DATABASE_URL: databaseUrl,
    NEON_DATABASE_URL: neonDatabaseUrl,
    
    // Auth
    JWT_SECRET: jwtSecret,
    ADMIN_SETUP_KEY: adminSetupKey,
    ENCRYPTION_SECRET: encryptionSecret,
    
    // AI Services
    OPENAI_API_KEY: openaiKey,
    ANTHROPIC_API_KEY: anthropicKey,
    GEMINI_API_KEY: getOptional('GEMINI_API_KEY'),
    DEEPSEEK_API_KEY: getOptional('DEEPSEEK_API_KEY'),
    
    // Services
    REDIS_URL: redisUrl,
    KV_URL: kvUrl,
    UPSTASH_REDIS_URL: upstashRedisUrl,
    SUPABASE_URL: supabaseUrl,
    SUPABASE_ANON_KEY: supabaseAnonKey,
    SUPABASE_SERVICE_ROLE_KEY: getOptional('SUPABASE_SERVICE_ROLE_KEY'),
    
    // Push Notifications
    VAPID_PUBLIC_KEY: vapidPublicKey,
    VAPID_PRIVATE_KEY: vapidPrivateKey,
    NEXT_PUBLIC_VAPID_KEY: getOptional('NEXT_PUBLIC_VAPID_KEY'),
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: getOptional('NEXT_PUBLIC_VAPID_PUBLIC_KEY'),
    
    // Sports Data
    SPORTS_IO_API_KEY: sportsIOKey,
    SPORTSDATA_API_KEY: sportsDataKey,
    ESPN_API_KEY: getOptional('ESPN_API_KEY'),
    NEXT_PUBLIC_SPORTSDATA_API_KEY: getOptional('NEXT_PUBLIC_SPORTSDATA_API_KEY'),
    WEATHER_API_KEY: getOptional('WEATHER_API_KEY'),
    NEXT_PUBLIC_WEATHER_API_KEY: getOptional('NEXT_PUBLIC_WEATHER_API_KEY'),
    NEXT_PUBLIC_NFL_VENUES_API: getOptional('NEXT_PUBLIC_NFL_VENUES_API'),
    SPORTSDATA_API_URL: getOptional('SPORTSDATA_API_URL'),
    
    // Environment
    NODE_ENV: (nodeEnv || 'development') as 'development' | 'test' | 'production',
    NEXT_PUBLIC_APP_URL: appUrl,
    NEXT_TELEMETRY_DISABLED: getOptional('NEXT_TELEMETRY_DISABLED'),
    DEPLOYMENT_ID: getOptional('DEPLOYMENT_ID'),
    API_SECRET_KEY: getOptional('API_SECRET_KEY'),
    NEXT_PUBLIC_WS_URL: getOptional('NEXT_PUBLIC_WS_URL'),
    DEBUG: getOptional('DEBUG'),
    LOG_CONSOLE: getOptional('LOG_CONSOLE'),
    CUSTOM_KEY: getOptional('CUSTOM_KEY'),
    CI: getOptional('CI'),
    PLAYWRIGHT_BASE_URL: getOptional('PLAYWRIGHT_BASE_URL'),
    
    // Admin Configuration
    ADMIN_EMAIL: getOptional('ADMIN_EMAIL'),
    ADMIN_USERNAME: getOptional('ADMIN_USERNAME'),
    ADMIN_PASSWORD: getOptional('ADMIN_PASSWORD'),
    
    // Monitoring
    METRICS_ENDPOINT: getOptional('METRICS_ENDPOINT'),
    METRICS_API_KEY: getOptional('METRICS_API_KEY'),
    LOG_ENDPOINT: getOptional('LOG_ENDPOINT'),
    LOG_API_KEY: getOptional('LOG_API_KEY'),
    SENTRY_DSN: getOptional('SENTRY_DSN'),
    WEBHOOK_URL: getOptional('WEBHOOK_URL'),
    
    // Database Advanced
    DB_MAX_CONNECTIONS: getOptional('DB_MAX_CONNECTIONS'),
    DB_IDLE_TIMEOUT: getOptional('DB_IDLE_TIMEOUT'),
    DB_CONNECTION_TIMEOUT: getOptional('DB_CONNECTION_TIMEOUT'),
    PGSSLMODE: getOptional('PGSSLMODE'),
    TEST_DATABASE_URL: getOptional('TEST_DATABASE_URL'),
    TEST_SUPABASE_URL: getOptional('TEST_SUPABASE_URL'),
    TEST_SUPABASE_ANON_KEY: getOptional('TEST_SUPABASE_ANON_KEY'),
    TEST_SUPABASE_SERVICE_KEY: getOptional('TEST_SUPABASE_SERVICE_KEY'),
    
    // Security
    CSP_REPORT_URI: getOptional('CSP_REPORT_URI'),
    MAX_WS_CONNECTIONS: getOptional('MAX_WS_CONNECTIONS'),
    
    // WebSocket
    REDIS_HOST: getOptional('REDIS_HOST'),
    REDIS_PORT: getOptional('REDIS_PORT'),
    REDIS_PASSWORD: getOptional('REDIS_PASSWORD')
  };
}

// Type-safe environment access
let _validatedEnv: ValidatedEnv | null = null;

export function getValidatedEnv(): ValidatedEnv {
  if (!_validatedEnv) {
    _validatedEnv = validateEnvironmentVariables();
  }
  return _validatedEnv;
}

// Reset validation cache (useful for testing)
export function resetValidationCache(): void {
  _validatedEnv = null;
}

// Validation status checker
export function getValidationStatus(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missing: string[];
  configured: {
    database: boolean;
    auth: boolean;
    aiServices: string[];
    pushNotifications: boolean;
    sports: boolean;
  };
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missing: string[] = [];

  try {
    const env = validateEnvironmentVariables();
    
    // Check AI services availability
    const availableAI: string[] = [];
    if (env.OPENAI_API_KEY) availableAI.push('OpenAI');
    if (env.ANTHROPIC_API_KEY) availableAI.push('Anthropic');
    if (env.GEMINI_API_KEY) availableAI.push('Gemini');
    if (env.DEEPSEEK_API_KEY) availableAI.push('DeepSeek');

    if (availableAI.length === 0) {
      warnings.push('No AI services configured. Some features may be limited.');
    }

    if (!env.SPORTS_IO_API_KEY) {
      warnings.push('Sports data API not configured. Live data features may be limited.');
    }

    if (!env.REDIS_URL && env.NODE_ENV === 'production') {
      warnings.push('Redis not configured. Caching and real-time features may be limited.');
    }

    return {
      isValid: true,
      errors,
      warnings,
      missing,
      configured: {
        database: !!(env.DATABASE_URL || env.NEON_DATABASE_URL),
        auth: !!(env.JWT_SECRET && env.ADMIN_SETUP_KEY && env.ENCRYPTION_SECRET),
        aiServices: availableAI,
        pushNotifications: !!(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY),
        sports: !!env.SPORTS_IO_API_KEY
      }
    };

  } catch (error) {
    if (error instanceof MissingVariableError) {
      missing.push(...error.variables);
    } else if (error instanceof Error) {
      errors.push(error.message);
    }

    return {
      isValid: false,
      errors,
      warnings,
      missing,
      configured: {
        database: false,
        auth: false,
        aiServices: [],
        pushNotifications: false,
        sports: false
      }
    };
  }
}

// Export validation utilities
export { EnvironmentValidator };