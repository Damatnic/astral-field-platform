import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Mock database health check
    const healthCheck = {
      status: 'healthy',
      details: {
        connected: true,
        responseTime: Math.floor(Math.random() * 50) + 10, // 10-60ms
        lastChecked: new Date().toISOString()
      }
    }

    const poolStats = {
      totalConnections: 10,
      idleConnections: 8,
      activeConnections: 2
    }

    const testQuery = {
      executed: true,
      duration: '15ms',
      result: 'successful'
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      database: {
        status: healthCheck.status,
        details: healthCheck.details,
        poolStats,
        testQuery
      }
    })

  } catch (error: unknown) {
    console.error('❌ Database health check error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Database health check failed',
      database: {
        status: 'unhealthy',
        details: {
          connected: false,
          error: 'Connection failed'
        }
      }
    }, { status: 500 })
  }
}
