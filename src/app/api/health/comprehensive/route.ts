import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/database";
import envServiceGetter from "@/lib/env-config";

interface HealthCheck {
  service: string;
  status: "healthy" | "unhealthy" | "warning";
  details?: Record<string, unknown>;
  responseTime?: number;
}

interface ComprehensiveHealthReport {
  overall: "healthy" | "unhealthy" | "degraded";
  timestamp: string;
  checks: HealthCheck[];
  summary: {
    total: number;
    healthy: number;
    unhealthy: number;
    warnings: number;
  };
}

async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const health = await database.healthCheck();
    return {
      service: "database",
      status: health.status === "healthy" ? "healthy" : "unhealthy",
      details: health.details,
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      service: "database",
      status: "unhealthy",
      details: { error: error instanceof Error ? error.message : "Unknown error" },
      responseTime: Date.now() - start,
    };
  }
}

async function checkEnvironmentConfig(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const config = envServiceGetter.get().getConfigurationStatus();
    const hasIssues = !config.database.configured || !config.supabase.configured;
    
    return {
      service: "environment",
      status: hasIssues ? "warning" : "healthy",
      details: config,
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      service: "environment",
      status: "unhealthy",
      details: { error: error instanceof Error ? error.message : "Unknown error" },
      responseTime: Date.now() - start,
    };
  }
}

async function checkAPIEndpoints(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    // Test critical API endpoints
    const endpoints = [
      "/api/health",
      "/api/database/migrate",
      "/api/leagues/00000000-0000-0000-0000-000000000001/matchup",
    ];

    const results = await Promise.allSettled(
      endpoints.map(async (endpoint) => {
        const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}${endpoint}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        return { endpoint, status: response.status, ok: response.ok };
      })
    );

    const failed = results.filter(result => 
      result.status === 'rejected' || 
      (result.status === 'fulfilled' && !result.value.ok)
    );

    return {
      service: "api_endpoints",
      status: failed.length === 0 ? "healthy" : failed.length < endpoints.length ? "warning" : "unhealthy",
      details: {
        total: endpoints.length,
        failed: failed.length,
        results: results.map(result => 
          result.status === 'fulfilled' ? result.value : { error: result.reason }
        ),
      },
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      service: "api_endpoints",
      status: "unhealthy",
      details: { error: error instanceof Error ? error.message : "Unknown error" },
      responseTime: Date.now() - start,
    };
  }
}

async function checkFileSystem(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Check critical files exist
    const criticalFiles = [
      'package.json',
      'next.config.js',
      'tsconfig.json',
      '.env.local',
      'db/schema.sql',
    ];

    const fileChecks = await Promise.allSettled(
      criticalFiles.map(async (file) => {
        await fs.access(path.join(process.cwd(), file));
        return file;
      })
    );

    const missing = fileChecks.filter(check => check.status === 'rejected');

    return {
      service: "filesystem",
      status: missing.length === 0 ? "healthy" : "warning",
      details: {
        total: criticalFiles.length,
        missing: missing.length,
        missingFiles: missing.map((_, index) => criticalFiles[index]),
      },
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      service: "filesystem",
      status: "unhealthy",
      details: { error: error instanceof Error ? error.message : "Unknown error" },
      responseTime: Date.now() - start,
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();

    // Run all health checks in parallel
    const [dbCheck, envCheck, apiCheck, fsCheck] = await Promise.all([
      checkDatabase(),
      checkEnvironmentConfig(),
      checkAPIEndpoints(),
      checkFileSystem(),
    ]);

    const checks = [dbCheck, envCheck, apiCheck, fsCheck];
    
    // Calculate summary
    const summary = {
      total: checks.length,
      healthy: checks.filter(c => c.status === "healthy").length,
      unhealthy: checks.filter(c => c.status === "unhealthy").length,
      warnings: checks.filter(c => c.status === "warning").length,
    };

    // Determine overall status
    let overall: "healthy" | "unhealthy" | "degraded";
    if (summary.unhealthy > 0) {
      overall = "unhealthy";
    } else if (summary.warnings > 0) {
      overall = "degraded";
    } else {
      overall = "healthy";
    }

    const report: ComprehensiveHealthReport = {
      overall,
      timestamp: new Date().toISOString(),
      checks,
      summary,
    };

    const totalTime = Date.now() - startTime;

    return NextResponse.json({
      ...report,
      meta: {
        totalResponseTime: totalTime,
        version: "1.0.0",
        environment: process.env.NODE_ENV,
      },
    });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      {
        overall: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Health check system failure",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
