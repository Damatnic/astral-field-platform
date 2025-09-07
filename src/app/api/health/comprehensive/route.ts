import { NextRequest, NextResponse } from 'next/server'
import { database } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    // Basic health checks
    const healthReport = {
      overall: { status: 'healthy', score: 100 },
      components: {
        database: { status: 'checking', lastCheck: new Date() },
        application: { status: 'healthy', uptime: process.uptime() }
      },
      timestamp: new Date().toISOString()
    }

    // Test database connection
    try {
      await database.healthCheck()
      healthReport.components.database.status = 'healthy'
    } catch (dbError) {
      healthReport.components.database.status = 'unhealthy'
      healthReport.overall.status = 'degraded'
      healthReport.overall.score = 50
    }
    
    const statusCode = healthReport.overall.status === 'healthy' ? 200 : 503
    
    return NextResponse.json({
      success: true,
      data: healthReport
    }, { status: statusCode })
  } catch (error) {
    console.error('Comprehensive health check error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Health check failed',
        data: {
          overall: { status: 'unhealthy', score: 0 },
          components: {},
          timestamp: new Date().toISOString()
        }
      },
      { status: 503 }
    )
  }
}