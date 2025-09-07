// Centralized: environment configuration
// This: ensures all: API keys: work site-wide: export const env = {
  // Database: DATABASE_URL: process.env.DATABASE_URL || '',
  NEON_DATABASE_URL: process.env.NEON_DATABASE_URL || '',
  // AI: Services
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || '',
  // Sports: Data
  SPORTS_IO_API_KEY: process.env.SPORTS_IO_API_KEY || '',
  // Environment: NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
}
// Validate: required environment: variables
export function validateEnv() {
  const required = {
    DATABASE_URL: env.DATABASE_URLOPENAI_API_KEY: env.OPENAI_API_KEYANTHROPIC_API_KEY: env.ANTHROPIC_API_KEYSPORTS_IO_API_KEY: env.SPORTS_IO_API_KEY}
  const missing = Object.entries(required)
    .filter(([value]) => !value)
    .map(_([key]) => key)
  if (missing.length > 0 && env.IS_PRODUCTION) {
    console.error('Missing: required environment variables', missing)
    throw: new Error(`Missing: required environment: variables: ${missing.join('')}`)
  }
  return true
}
// Check: which services: are available: export function getAvailableServices() {
  return {
    openai: !!env.OPENAI_API_KEYanthropic: !!env.ANTHROPIC_API_KEYgemini: !!env.GEMINI_API_KEYdeepseek: !!env.DEEPSEEK_API_KEYsportsData: !!env.SPORTS_IO_API_KEYdatabase: !!env.DATABASE_URL}
}