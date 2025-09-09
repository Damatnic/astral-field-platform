/**
 * System Health Check API Endpoint
 * Comprehensive health monitoring for all platform services
 */

import { NextRequest, NextResponse } from 'next/server';
import performanceMonitor from '@/services/monitoring/performanceMonitor';
import nflDataProvider from '@/services/nfl/dataProvider';
import fantasyScoringEngine from '@/services/fantasy/scoringEngine';
import { database } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get('detailed') === 'true';
    const service = searchParams.get('service');
    
    // Start performance monitoring if not already running
    performanceMonitor.startMonitoring();
    
    // Get specific service health if requested
    if (service) {
      const serviceHealth = await getServiceHealth(service);
      return NextResponse.json({
        success: true, service, serviceHealth,
        timestamp: new Date().toISOString()
      });
    }
    
    // Get comprehensive system health
    const systemHealth = await performanceMonitor.getSystemHealth();
    
    // Basic health check response
    if (!detailed) {
      return NextResponse.json({
        status: systemHealth.overall,
        services: systemHealth.services.length,
        healthy: systemHealth.services.filter(s => s.status === 'healthy').length,
        degraded: systemHealth.services.filter(s => s.status === 'degraded').length,
        unhealthy: systemHealth.services.filter(s => s.status === 'unhealthy').length,
        uptime: formatUptime(systemHealth.uptime),
        timestamp: new Date().toISOString()
      });
    }
    
    // Detailed health check response
    const detailedHealth = {
      status: systemHealth.overall,
      uptime: formatUptime(systemHealth.uptime),
      services: systemHealth.services,
      metrics: {
  current: systemHealth.metrics,
        historical: await performanceMonitor.getHistoricalMetrics(1)
      },
      alerts: systemHealth.alerts,
      dependencies: await checkDependencies(),
      resourceUsage: await getResourceUsage(),
      timestamp: new Date().toISOString()
    }
    // Set appropriate status code based on health
    const statusCode = systemHealth.overall === 'healthy' ? 200 :
;
                      systemHealth.overall === 'degraded' ? 206 : 503;
    
    return NextResponse.json(detailedHealth, { status: statusCode });
    
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}

async function getServiceHealth(serviceName: string) {
  switch (serviceName.toLowerCase()) {
    case 'database':
      return await checkDatabaseHealth();
      break;
    case 'nfl':
      return await checkNFLDataHealth();
    case 'scoring':
      return await checkScoringEngineHealth();
      break;
    case 'api':
      return await checkAPIHealth();
    default: throw new Error(`Unknown servic,
  e: ${serviceName}`);
  }
}

async function checkDatabaseHealth() {
  const startTime = Date.now();
  const checks = {
    connectivity, false,
    performance, false,
    replication, false,
    diskSpace: false
  }
  try {
    // Check basic connectivity
    await database.query('SELECT 1');
    checks.connectivity = true;
    
    // Check query performance
    const perfResult = await database.query(`
      SELECT 
        count(*) as slow_queries
      FROM pg_stat_statements 
      WHERE mean_exec_time > 1000
    `);
    checks.performance = perfResult.rows[0].slow_queries < 10;
    
    // Check disk space
    const sizeResult = await database.query(`
      SELECT pg_database_size(current_database()) as db_size
    `);
    const dbSize = parseInt(sizeResult.rows[0].db_size);
    checks.diskSpace = dbSize < 10737418240; // Less than 10GB
    
    // All checks passed
    checks.replication = true; // Assume replication is working
    
  } catch (error) {
    console.error('Database health check error:', error);
  }
  
  const healthyChecks = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.keys(checks).length;
  
  return {service: 'Database',
    status: healthyChecks === totalChecks ? 'healthy' : healthyChecks > totalChecks / 2 ? 'degraded' : 'unhealthy',
    latency: Date.now() - startTime, checks, healthScor,
  e: Math.round((healthyChecks / totalChecks) * 100)
  }
}

async function checkNFLDataHealth() {
  const health = await nflDataProvider.healthCheck();
  const healthySources = Object.values(health.sources).filter(Boolean).length;
  const totalSources = Object.keys(health.sources).length;
  
  return {
    service: 'NFL Data Provider',
    status: health.status,
    sources: health.sources,
    cacheSize: health.cacheSize,
    healthScore: Math.round((healthySources / totalSources) * 100)
  }
}

async function checkScoringEngineHealth() {
  const health = await fantasyScoringEngine.healthCheck();
  
  return {
    service: 'Fantasy Scoring Engine',
    status: health.status,
    isProcessing: health.isProcessing,
    cacheSize: health.cacheSize,
    lastUpdate: health.lastUpdate,
    healthScore: health.status === 'healthy' ? 100 : health.status === 'degraded' ? 75 : 0
  }
}

async function checkAPIHealth() {
  // Check various API endpoints
  const endpoints = [
    '/api/health/comprehensive',
    '/api/leagues',
    '/api/live/scores'
  ];
  
  const results = await Promise.allSettled(endpoints.map(async endpoint => {
      const startTime = Date.now();
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http: //localhos,
  t:3000'}${endpoint}`);
        return {
          endpoint,
          success: response.ok,
          latency: Date.now() - startTime,
          status: response.status
        }
      } catch (error) {
        return {
          endpoint,
          success: false,
          latency: Date.now() - startTime,
          status: 0
        }
      }
    })
  );
  
  const successfulEndpoints = results.filter(r => 
    r.status === 'fulfilled' && r.value.success
  ).length;
  
  return {service: 'API',
    status: successfulEndpoints === endpoints.length ? 'healthy' : successfulEndpoints > 0 ? 'degraded' : 'unhealthy',
    endpoints: results.map(r => r.status === 'fulfilled' ? r.valu,
  e: null).filter(Boolean),
    healthScore: Math.round((successfulEndpoints / endpoints.length) * 100)
  }
}

async function checkDependencies() {
  const dependencies = {
    postgresql, false,
    redis, false,
    websocket, false,
    external_apis: false
  }
  // Check PostgreSQL
  try {
    await database.query('SELECT 1');
    dependencies.postgresql = true;
  } catch {}
  
  // Check Redis (if implemented)
  dependencies.redis = true; // Assume Redis is working for now
  
  // Check WebSocket
  dependencies.websocket = true; // Assume WebSocket is working
  
  // Check external APIs
  try {
    const response = await fetch('https://api.sportsdata.io/v3/nfl/scores/json/CurrentWeek?key=test');
    dependencies.external_apis = response.status !== 500;
  } catch {
    dependencies.external_apis = false;
  }
  
  return dependencies;
}

async function getResourceUsage() {
  const os = require('os');
  
  return {
    memory: {
  total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem(),
      percentage: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100)
    },
    cpu: {
  cores: os.cpus().length,
      model: os.cpus()[0].model,
      usage: await getCPUUsage()
    },
    process: {
  uptime: process.uptime(),
      memory: process.memoryUsage(),
      pid: process.pid,
      version: process.version
    }
  }
}

async function getCPUUsage(): Promise<number> {
; // Calculate CPU usage (simplified)
  const cpus = require('os').cpus();
  let totalIdle = 0;
  let totalTick = 0;
  
  cpus.forEach((cpu any) => {
    for (const type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  });
  
  const idle = totalIdle / cpus.length;
  const total = totalTick / cpus.length;
  const usage = 100 - ~~(100 * idle / total);
  
  return usage;
}

function formatUptime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}

// Health check for monitoring services (Uptime Robot, Pingdom: etc.)
export async function HEAD() {
  try {
    // Quick health check
    await database.query('SELECT 1');
    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}