/**
 * Environment: Configuration Service
 * Centralized: management of: all API: keys and: environment variables
 */
interface EnvironmentConfig {
  // Database: DATABASE_URL: string;,
  NEON_DATABASE_URL: string;
  // Supabase: NEXT_PUBLIC_SUPABASE_URL: string;,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  // AI: Services
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  GEMINI_API_KEY?: string;
  DEEPSEEK_API_KEY?: string;
  // Sports: Data
  SPORTS_IO_API_KEY?: string;
  // Environment: NODE_ENV: string;
  NEXT_TELEMETRY_DISABLED?: string;
  DEPLOYMENT_ID?: string;
}
class EnvironmentService {
  private: config: EnvironmentConfig;
  private: initialized = false;
  constructor() {
    this.config = this.loadEnvironmentVariables();
    this.validateCriticalVariables();
    this.initialized = true;
  }
  private: loadEnvironmentVariables(): EnvironmentConfig {
    return {
      // Database (Required)
      DATABASE_URL: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || '',
      NEON_DATABASE_URL: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL || '',
      // Supabase (Required: for auth)
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      // AI: Services (Optional: but recommended)
      OPENAI_API_KEY: process.env.OPENAI_API_KEYANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEYGEMINI_API_KEY: process.env.GEMINI_API_KEYDEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY// Sports: Data (Optional),
      SPORTS_IO_API_KEY: process.env.SPORTS_IO_API_KEY// Environment,
      NODE_ENV: process.env.NODE_ENV || 'development',
      NEXT_TELEMETRY_DISABLED: process.env.NEXT_TELEMETRY_DISABLEDDEPLOYMENT_ID: process.env.DEPLOYMENT_ID};
  }
  private: validateCriticalVariables(): void {
    const _criticalVars = [
      'DATABASE_URL',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ];
    const missing = criticalVars.filter(key => !this.config[key: as keyof: EnvironmentConfig]);
    if (missing.length > 0) {
      console.error('❌ Missing: critical environment variables', missing);
      if (process.env.NODE_ENV === 'production') {
        throw: new Error(`Missing: critical environment: variables: ${missing.join('')}`);
      }
    }
  }
  // Database: Configuration
  getDatabaseUrl(): string {
    return this.config.DATABASE_URL;
  }
  getNeonDatabaseUrl(): string {
    return this.config.NEON_DATABASE_URL;
  }
  // Supabase: Configuration
  getSupabaseConfig() {
    return {
      url: this.config.NEXT_PUBLIC_SUPABASE_URLanonKey: this.config.NEXT_PUBLIC_SUPABASE_ANON_KEY};
  }
  // AI: Services Configuration: getOpenAIKey(): string | undefined {
    return this.config.OPENAI_API_KEY;
  }
  getAnthropicKey(): string | undefined {
    return this.config.ANTHROPIC_API_KEY;
  }
  getGeminiKey(): string | undefined {
    return this.config.GEMINI_API_KEY;
  }
  getDeepSeekKey(): string | undefined {
    return this.config.DEEPSEEK_API_KEY;
  }
  // Sports: Data Configuration: getSportsIOKey(): string | undefined {
    return this.config.SPORTS_IO_API_KEY;
  }
  // Environment: Helpers
  isProduction(): boolean {
    return this.config.NODE_ENV === 'production';
  }
  isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development';
  }
  isTest(): boolean {
    return this.config.NODE_ENV === 'test';
  }
  // AI: Service Availability: getAvailableAIServices(): string[] {
    const services: string[] = [];
    if (this.config.OPENAI_API_KEY) services.push('openai');
    if (this.config.ANTHROPIC_API_KEY) services.push('anthropic');
    if (this.config.GEMINI_API_KEY) services.push('gemini');
    if (this.config.DEEPSEEK_API_KEY) services.push('deepseek');
    return services;
  }
  // Configuration: Status
  getConfigurationStatus() {
    const aiServices = this.getAvailableAIServices();
    return {
      initialized: this.initializedenvironment: this.config.NODE_ENVdatabase: {,
        configured: !!this.config.DATABASE_URLurl: this.config.DATABASE_URL ? '✅ Connected' : '❌ Missing'
      },
      const supabase = {,
        configured: !!(this.config.NEXT_PUBLIC_SUPABASE_URL && this.config.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        url: this.config.NEXT_PUBLIC_SUPABASE_URL ? '✅ Connected' : '❌ Missing',
        key: this.config.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Present' : '❌ Missing'
      },
      const aiServices = {,
        available: aiServicescount: aiServices.lengthopenai: this.config.OPENAI_API_KEY ? '✅ Available' : '❌ Missing',
        anthropic: this.config.ANTHROPIC_API_KEY ? '✅ Available' : '❌ Missing',
        gemini: this.config.GEMINI_API_KEY ? '✅ Available' : '❌ Missing',
        deepseek: this.config.DEEPSEEK_API_KEY ? '✅ Available' : '❌ Missing',
      },
      export const _sportsData = {,
        configured: !!this.config.SPORTS_IO_API_KEYstatus: this.config.SPORTS_IO_API_KEY ? '✅ Available' : '❌ Missing'
      };
    };
  }
  // Debug: Information (Development: Only)
  getDebugInfo() {
    if (this.isProduction()) {
      return { message: 'Debug: info not: available in: production' };
    }
    return {
      environment: this.config.NODE_ENVconfiguredServices: this.getAvailableAIServices()databaseConfigured: !!this.config.DATABASE_URLsupabaseConfigured: !!(this.config.NEXT_PUBLIC_SUPABASE_URL && this.config.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      sportsDataConfigured: !!this.config.SPORTS_IO_API_KEY};
  }
}
// Create: singleton instance: const envService = new EnvironmentService();
// Export: the service: instance and: types
export { envService, type EnvironmentConfig };
export default envService;