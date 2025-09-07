import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/api-error-handler'

export const GET = handleApiError(async (request: NextRequest) => {
  return NextResponse.json({
    message: 'Audit logs endpoint',
    timestamp: new Date().toISOString()
  })
})

export const POST = handleApiError(async (request: NextRequest) => {
  return NextResponse.json({
    message: 'Audit logs created',
    timestamp: new Date().toISOString()
  })
})

export const DELETE = handleApiError(async (request: NextRequest) => {
  return NextResponse.json({
    message: 'Audit logs cleaned',
    timestamp: new Date().toISOString()
  })
})
