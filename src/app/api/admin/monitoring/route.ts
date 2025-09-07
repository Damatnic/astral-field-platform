import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Basic monitoring data
    const metrics = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
      status: 'operational'
    }
    
    return NextResponse.json({
      success: true,
      data: {
        metrics,
        healthStatus: 'healthy',
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Admin monitoring error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve monitoring data' },
      { status: 500 }
    )
  }
}