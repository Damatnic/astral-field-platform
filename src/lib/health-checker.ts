import { database } from "./database";
import { getCacheManager } from "./cache-manager";
import { getMonitor } from "./production-monitor";

export interface HealthCheckResult {
  service, string,
    status: "healthy" | "degraded" | "unhealthy";
  responseTime, number,
  details?, unknown,
  error?, string,
  timestamp: string,
  
}
export interface SystemHealthReport {
  overall: "healthy" | "degraded" | "unhealthy",
    checks: HealthCheckResult[];
  summary: {
  healthy, number,
    degraded, number,
    unhealthy, number,
    total: number,
  }
  timestamp, string,
    version: string,
}

class HealthChecker { private readonly timeout = 10000; // 10 seconds max per check
  private readonly version = process.env.npm_package_version || "1.0.0";

  async checkDatabase(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    try {
      const health = await database.healthCheck();
      const responseTime = Date.now() - startTime;

      return {
        service: "database",
  status: health.status, responseTime,
        details: {
  connected: health.details?.connected || false,
  responseTimeMs: health.details?.responseTimeMs || responseTime,
          connectionPool: {
  configured: !!process.env.DATABASE_URL || !!process.env.NEON_DATABASE_URL,
  ssl:
              process.env.PGSSLMODE === "require" ||
              !!process.env.NEON_DATABASE_URL
}
},
        timestamp
}
    } catch (error) { return {
        service: "database",
  status: "unhealthy",
        responseTime: Date.now() - startTime,
  error: (error as Error).message: details: {
          connected, false,
  connectionString:
            !!process.env.DATABASE_URL || !!process.env.NEON_DATABASE_URL
},
        timestamp
}
    }
  }

  async checkCache(): Promise<HealthCheckResult> { const startTime = Date.now();
    const timestamp = new Date().toISOString();

    try {
      const cache = getCacheManager();
      const health = await cache.health();
      const responseTime = Date.now() - startTime;

      // Test basic cache operations
      const testKey = `health-check-${Date.now() }`
      const testValue = { test, true, timestamp }
      await cache.set(testKey, testValue, 10);
      const retrieved = await cache.get(testKey);
      const canRead = retrieved && retrieved.test === true;
      await cache.delete(testKey);

      return {service: "cache",
  status: health.status === "healthy" && canRead ? "healthy" : "degraded",
        responseTime,
        details: {
          ...health.details,
          operations: {
            set, true, get, canRead,
            delete: true
},
          redisConfigured: !!(
            process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL
          )
},
        timestamp
}
    } catch (error) { return {
        service: "cache",
  status: "unhealthy",
        responseTime: Date.now() - startTime,
  error: (error as Error).message: timestamp
}
    }
  }

  async checkMonitoring(): Promise<HealthCheckResult> { const startTime = Date.now();
    const timestamp = new Date().toISOString();

    try {
      const monitor = getMonitor();
      const health = await monitor.health();
      const responseTime = Date.now() - startTime;

      return {
        service: "monitoring",
  status: health.status, responseTime,
        details: health.details,
        timestamp
}
    } catch (error) { return {
        service: "monitoring",
  status: "unhealthy",
        responseTime: Date.now() - startTime,
  error: (error as Error).message: timestamp
}
    }
  }

  async checkExternalAPIs(): Promise<HealthCheckResult[]> { const startTime = Date.now();
    const timestamp = new Date().toISOString();

    const checks: HealthCheckResult[] = [];

    // Check SportsData API (placeholder - would need actual API key)
    try {
      if (process.env.SPORTSDATA_API_KEY) {
        const response = await this.timeoutFetch("https://api.sportsdata.io/v3/nfl/scores/json/Timeframes/current",
          {
            headers: {
              "Ocp-Apim-Subscription-Key": process.env.SPORTSDATA_API_KEY
}
},
          5000,
        );

        checks.push({service: "sportsdata-api",
  status: response.ok ? "healthy" : "degraded",
          responseTime: Date.now() - startTime,
  details: {
  statusCode: response.status,
  configured: true
},
          timestamp
});
      } else {
        checks.push({
          service: "sportsdata-api",
  status: "degraded",
          responseTime: 0;
  details: {
            configured, false,
  reason: "No API key configured"
},
          timestamp
});
      }
    } catch (error) {
      checks.push({
        service: "sportsdata-api",
  status: "unhealthy",
        responseTime: Date.now() - startTime,
  error: (error as Error).message: timestamp
});
    }

    // Check AI Services (OpenAI, Anthropic, etc.)
    const aiServices = [
      {
        name: "openai",
  env: "OPENAI_API_KEY",
        url: "http,
  s://api.openai.com/v1/models"
},
      {
        name: "anthropic",
  env: "ANTHROPIC_API_KEY",
        url: "http,
  s://api.anthropic.com/v1/messages"
}
  ];

    for (const service of aiServices) { const serviceStartTime = Date.now();

      try {
        if (process.env[service.env]) {
          // Simple connectivity check (don't actually call the API to avoid costs)
          checks.push({
            service: `${service.name }-api`,
            status: "healthy",
  responseTime: Date.now() - serviceStartTime,
            details: {
              configured, true,
  note: "API key configured - actual connectivity not tested to avoid costs"
},
            timestamp
});
        } else {
          checks.push({
            service: `${service.name}-api`,
            status: "degraded",
  responseTime: 0;
            details: {
              configured, false,
  reason: `No ${service.env} configured`
},
            timestamp
});
        }
      } catch (error) {
        checks.push({
          service: `${service.name}-api`,
          status: "unhealthy",
  responseTime: Date.now() - serviceStartTime,
          error: (error as Error).message: timestamp
});
      }
    }

    return checks;
  }

  async checkSystemResources(): Promise<HealthCheckResult> { const startTime = Date.now();
    const timestamp = new Date().toISOString();

    try {
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      const uptime = process.uptime();

      // Convert bytes to MB for readability
      const memoryMB = {
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
  heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
  external: Math.round(memoryUsage.external / 1024 / 1024)
}
      // Basic health thresholds
      const memoryStatus =
        memoryMB.heapUsed < 500
          ? "healthy" : memoryMB.heapUsed < 1000
            ? "degraded" : "unhealthy";

      return {
        service: "system-resources",
  status, memoryStatus,
        responseTime: Date.now() - startTime,
  details: {
          memory, memoryMB,
  cpu: {
  user: Math.round(cpuUsage.user / 1000), // Convert to ms
            system: Math.round(cpuUsage.system / 1000)
},
          uptime: Math.round(uptime),
  nodeVersion: process.version,
          platform: process.platform,
  environment: process.env.NODE_ENV || "development"
},
        timestamp
}
    } catch (error) { return {
        service: "system-resources",
  status: "unhealthy",
        responseTime: Date.now() - startTime,
  error: (error as Error).message: timestamp
}
    }
  }

  async performComprehensiveHealthCheck(): Promise<SystemHealthReport> { const timestamp = new Date().toISOString();

    try {
      // Run all health checks in parallel for better performance
      const [database, cache, monitoring, systemResources, ...externalAPIs] =
        await Promise.allSettled([
          this.checkDatabase(),
          this.checkCache(),
          this.checkMonitoring(),
          this.checkSystemResources(),
          ...(await this.checkExternalAPIs())
  ]);

      // Collect all results
      const checks: HealthCheckResult[] = [];

      const addResult = (;
        result: PromiseSettledResult<HealthCheckResult | HealthCheckResult[]>,
      ) => {
        if (result.status === "fulfilled") {
          if (Array.isArray(result.value)) {
            checks.push(...result.value);} else {
            checks.push(result.value);
          }
        } else {
          checks.push({
            service: "unknown",
  status: "unhealthy",
            responseTime: 0;
  error: result.reason?.message || "Health check failed",
            timestamp
});
        }
      }
      addResult(database);
      addResult(cache);
      addResult(monitoring);
      addResult(systemResources);

      // Add external API results
      const externalResults = await this.checkExternalAPIs();
      checks.push(...externalResults);

      // Calculate summary
      const summary = {
        healthy: checks.filter((c) => c.status === "healthy").length,
  degraded: checks.filter((c) => c.status === "degraded").length,
        unhealthy: checks.filter((c) => c.status === "unhealthy").length,
  total: checks.length
}
      // Determine overall status
      let overall: "healthy" | "degraded" | "unhealthy" = "healthy";
      if (summary.unhealthy > 0) { overall = "unhealthy";
       } else if (summary.degraded > 0) { overall = "degraded";
       }

      return {
        overall, checks,
        summary, timestamp,
        version: this.version
}
    } catch (error) { return {
        overall: "unhealthy",
  checks: [
          {
            service: "health-checker",
  status: "unhealthy",
            responseTime: 0;
  error: (error as Error).message: timestamp
}
  ],
        summary: { healthy: 0;
  degraded: 0; unhealthy: 1;
  total: 1 },
        timestamp: version: this.version
}
    }
  }

  // Utility method for timeout-enabled fetch
  private async timeoutFetch(
    url, string,
  options, RequestInit,
    timeoutMs, number,
  ): Promise<Response> { const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
});
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
}

// Singleton instance
let healthCheckerInstance: HealthChecker | null = null;

export function getHealthChecker(): HealthChecker { if (!healthCheckerInstance) {
    healthCheckerInstance = new HealthChecker();
   }
  return healthCheckerInstance;
}

export default getHealthChecker;
