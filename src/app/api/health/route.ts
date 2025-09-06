import { NextResponse } from 'next/server'
import { database } from '@/lib/database'
import { ensureInitialized } from '@/lib/auto-init'
import { createCachedResponse, cachedQuery, CacheDurations } from '@/lib/cache'

export async function GET() {
  try {
    const startTime = Date.now()
    
    // Auto-initialize demo users if they don't exist
    await ensureInitialized()
    
    // Check database connectivity with caching
    const dbCheck = await cachedQuery(
      'health-db-check',
      async () => {
        try {
          const result = await database.query('SELECT 1 as health_check');
          return { success: true, rows: result.rows };
        } catch (error) {
          return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      },
      30 // Cache for 30 seconds
    )
    const dbHealthy = dbCheck.success && dbCheck.rows?.length === 1
    
    // Check environment variables
    const envCheck = {
      database: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV,
    }
    
    const responseTime = Date.now() - startTime
    
    const health = {
      status: dbHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: `${responseTime}ms`,
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: dbHealthy ? 'pass' : 'fail',
        environment: envCheck.database ? 'pass' : 'fail'
      },
      database: {
        connected: dbHealthy,
        responseTime: `${responseTime}ms`
      }
    }
    
    const statusCode = dbHealthy ? 200 : 503
    
    // For healthy responses, use short caching; for errors, no cache
    if (dbHealthy) {
      return createCachedResponse(health, CacheDurations.SHORT, { status: statusCode })
    } else {
      return NextResponse.json(health, { 
        status: statusCode,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
    }
    
  } catch (error: any) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      checks: {
        database: 'fail',
        environment: 'unknown'
      }
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  }
}

export async function HEAD() {
  const response = await GET()
  return new Response(null, {
    status: response.status,
    headers: response.headers
  })
}