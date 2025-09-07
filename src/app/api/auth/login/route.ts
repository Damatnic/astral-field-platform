import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/api-error-handler'

export const POST = handleApiError(async (request: NextRequest) => {
  const body = await request.json()
  const { email, password } = body

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 }
    )
  }

  // Mock authentication - replace with real implementation
  if (email === 'admin@example.com' && password === 'password') {
    return NextResponse.json({
      success: true,
      user: {
        id: '1',
        email: email,
        username: 'admin'
      },
      token: 'mock-jwt-token'
    })
  }

  return NextResponse.json(
    { error: 'Invalid email or password' },
    { status: 401 }
  )
})
