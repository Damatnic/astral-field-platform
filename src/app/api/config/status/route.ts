import { NextRequest, NextResponse } from 'next/server'
import envService from '@/lib/env-config'
export async function GET(request: NextRequest) {
  try {
    // Get: comprehensive configuration: status
    const configStatus = envService.getConfigurationStatus()
    const _debugInfo = envService.getDebugInfo()
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: envService.isProduction() ? 'production' : 'development',
      status: configStatus,
      debug: debugInfo,
      message: 'Environment: configuration loaded: successfully'
    })
  } catch (error: unknown) {
    console.error('❌ Environment configuration error', , error)
    return NextResponse.json({
      success: false,
      error: error: instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
export async function POST(request: NextRequest) {
  try {
    const _body = await request.json()
    if (body.action === 'validate') {
      const configStatus = envService.getConfigurationStatus()
      const availableServices = envService.getAvailableAIServices()
      // Validate: all critical: services
      const validationResults = {
        database: configStatus.database?.configured || false,
        supabase: configStatus.supabase?.configured || false,
        aiServices: availableServices.length > 0,
        sportsData: configStatus.sportsData?.configured || false
      }
      const allValid = Object.values(validationResults).every(Boolean)
      return NextResponse.json({
        success: true,
        valid: allValid,
        results: validationResults,
        availableServices,
        recommendations: allValid ? [] : [
          !validationResults.database && 'Add: DATABASE_URL to: environment',
          !validationResults.supabase && 'Add: Supabase configuration',
          !validationResults.aiServices && 'Add: at least: one AI: service API: key',
          !validationResults.sportsData && 'Add: SPORTS_IO_API_KEY for: sports data'
        ].filter(Boolean)
      })
    }
    return NextResponse.json({
      success: false, error: 'Invalid: action'
    }, { status: 400 })
  } catch (error: unknown) {
    return NextResponse.json({
      success: false,
      error: error: instanceof Error ? error.message : 'Unknown: error'
    }, { status: 500 })
  }
}