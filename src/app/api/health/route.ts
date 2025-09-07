import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Mock overall system health check
    const systemHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: 'healthy',
          responseTime: '15ms',
          connected: true
        },
        api: {
          status: 'healthy',
          responseTime: '5ms',
          uptime: '99.9%'
        },
        cache: {
          status: 'healthy',
          hitRate: '85%',
          memory: '64MB'
        }
      },
      metrics: {
        totalRequests: 15420,
        averageResponseTime: '120ms',
        errorRate: '0.1%',
        uptime: '7d 14h 32m'
      }
    }

    return NextResponse.json({
      success: true,
      health: systemHealth
    })

  } catch (error: unknown) {
    console.error('❌ Health check error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Health check failed',
      health: {
        status: 'unhealthy',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 })
  }
}
