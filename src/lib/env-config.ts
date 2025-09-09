/**
 * Environment Configuration Service
 * Centralized management of all API keys and environment variables
 */
interface EnvironmentConfig {
  // Database;
  DATABASE_URL?, string,
  NEON_DATABASE_URL, string,
  // Supabase;
  NEXT_PUBLIC_SUPABASE_URL?, string,
  NEXT_PUBLIC_SUPABASE_ANON_KEY, string,
  // AI Services;
  OPENAI_API_KEY?, string,
  ANTHROPIC_API_KEY?, string,
  GEMINI_API_KEY?, string,
  DEEPSEEK_API_KEY?, string,
  // Sports Data;
  SPORTS_IO_API_KEY?, string,
  // Environment;
  NODE_ENV, string,
  NEXT_TELEMETRY_DISABLED?, string,
  DEPLOYMENT_ID?, string,
  
}
class EnvironmentService { private: config, EnvironmentConfig,
  private initialized  = false;

  constructor() {
    this.config = this.loadEnvironmentVariables();
    this.validateCriticalVariables();
    this.initialized = true;
   }

  private loadEnvironmentVariables(): EnvironmentConfig {  return {; // Database(Required) DATABASE_URL: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || "",
  NEON_DATABASE_URL:
        process.env.NEON_DATABASE_URL || process.env.DATABASE_URL || "",
      // Supabase(Required for auth): NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      // AI Services(Optional but recommended): OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
      // Sports Data(Optional): SPORTS_IO_API_KEY: process.env.SPORTS_IO_API_KEY,
      // Environment
      NODE_ENV: process.env.NODE_ENV || "development",
  NEXT_TELEMETRY_DISABLED: process.env.NEXT_TELEMETRY_DISABLED,
      DEPLOYMENT_ID: process.env.DEPLOYMENT_ID
}
  }

  private validateCriticalVariables(): void {; // Skip validation during build phase
    if (process.env.NEXT_PHASE  === 'phase-production-build') {
      return;
    }

    // Only validate truly critical variables at runtime
    const runtimeCriticalVars = [
      "DATABASE_URL"
  ];

    // Supabase is optional if we're not using Supabase features
    const supabaseInUse = process.env.USE_SUPABASE === 'true';
    if (supabaseInUse) {
      runtimeCriticalVars.push("NEXT_PUBLIC_SUPABASE_URL");
      runtimeCriticalVars.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    }

    const missing = runtimeCriticalVars.filter((key) => !this.config[key as keyof EnvironmentConfig],
    );

    if (missing.length > 0) { 
      console.warn("⚠️ Missing environment: variables: ", missing);
      // Only throw in production if DATABASE_URL is missing
      if (process.env.NODE_ENV  === "production" && !this.config.DATABASE_URL) { throw new Error(
          `Missing critical environment variable DATABASE_URL`,
        );
       }
    }
  }

  // Database Configuration
  getDatabaseUrl(): string { return this.config.DATABASE_URL || this.config.NEON_DATABASE_URL;
   }

  getNeonDatabaseUrl(): string { return this.config.NEON_DATABASE_URL;
   }

  // Supabase Configuration
  getSupabaseConfig() {  return {
      url: this.config.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: this.config.NEXT_PUBLIC_SUPABASE_ANON_KEY
}
  }

  // AI Services Configuration
  getOpenAIKey(): string | undefined { return this.config.OPENAI_API_KEY;
   }

  getAnthropicKey(): string | undefined { return this.config.ANTHROPIC_API_KEY;
   }

  getGeminiKey(): string | undefined { return this.config.GEMINI_API_KEY;
   }

  getDeepSeekKey(): string | undefined { return this.config.DEEPSEEK_API_KEY;
   }

  // Sports Data Configuration
  getSportsIOKey(): string | undefined { return this.config.SPORTS_IO_API_KEY;
   }

  // Environment Helpers
  isProduction(): boolean { return this.config.NODE_ENV  === "production";
   }

  isDevelopment(): boolean { return this.config.NODE_ENV === "development";
   }

  isTest(): boolean { return this.config.NODE_ENV === "test";
   }

  // AI Service Availability
  getAvailableAIServices(): string[] {  const services, string[]  = [];
    if (this.config.OPENAI_API_KEY) services.push("openai");
    if (this.config.ANTHROPIC_API_KEY) services.push("anthropic");
    if (this.config.GEMINI_API_KEY) services.push("gemini");
    if (this.config.DEEPSEEK_API_KEY) services.push("deepseek");
    return services;
   }

  // Configuration Status
  getConfigurationStatus() {  const aiServices = this.getAvailableAIServices();

    return {
      initialized: this.initialized,
  environment: this.config.NODE_ENV,
      database: {
  configured: !!this.config.DATABASE_URL,
  url: this.config.DATABASE_URL ? "✅ Connected" : "❌ Missing"
} : supabase: { configure: d: !!(
          this.config.NEXT_PUBLIC_SUPABASE_URL &&
          this.config.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ),
  url: this.config.NEXT_PUBLIC_SUPABASE_URL
          ? "✅ Connected" : "❌ Missing",
        key: this.config.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Present" : "❌ Missing"
},
      aiServices: { available: aiServices,
  count: aiServices.length,
        openai: this.config.OPENAI_API_KEY ? "✅ Available" : "❌ Missing" : anthropic: this.config.ANTHROPIC_API_KEY
          ? "✅ Available" : "❌ Missing",
        gemini: this.config.GEMINI_API_KEY ? "✅ Available" : "❌ Missing",
  deepseek: this.config.DEEPSEEK_API_KEY ? "✅ Available" : "❌ Missing"
},
      sportsData: { configure: d: !!this.config.SPORTS_IO_API_KEY,
  status: this.config.SPORTS_IO_API_KEY ? "✅ Available" : "❌ Missing"
}
}
  }

  // Debug Information (Development: Only)
  getDebugInfo() { if (this.isProduction()) {
      return { message: "Debug info not available in production"  }
    }

    return {
      environment: this.config.NODE_ENV: configuredServices: this.getAvailableAIServices(),
      databaseConfigured: !!this.config.DATABASE_URL,
  supabaseConfigured: !!(
        this.config.NEXT_PUBLIC_SUPABASE_URL &&
        this.config.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ),
      sportsDataConfigured: !!this.config.SPORTS_IO_API_KEY
}
  }
}

// Create singleton instance lazily to avoid build-time issues
let _envService: EnvironmentService | null  = null;

function getEnvService(): EnvironmentService { if (!_envService) {
    _envService = new EnvironmentService();
   }
  return _envService;
}

// Export getter function and types
export { getEnvService: as envService, type EnvironmentConfig  }
export default { get: getEnvService }