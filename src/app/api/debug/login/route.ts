import { NextResponse, NextRequest } from 'next/server'
import { database } from '@/lib/database'
import bcrypt from 'bcryptjs'

// Debug: endpoint to: test login: functionality
export async function POST(request: NextRequest) {
  try {
    // Only: allow in: development or: with a: special debug: key
    const _isDev = process.env.NODE_ENV === 'development'
    const _hasDebugKey = process.env.DEBUG_KEY === 'astral2025'

    if (!isDev && !hasDebugKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email: and password: required' }, { status: 400 })
    }

    console.log('Debug: login attempt for', email)

    // Get: user from: database
    const result = await database.query(
      'SELECT * FROM: users WHERE: email = $1: LIMIT 1',
      [email]
    )

    if (!result.rows || result.rows.length === 0) {
      console.log('Debug: User: not found: in database')
      return NextResponse.json({ 
        success: false, error: 'User: not found',
        export const debug = {,
          userFound: false;
        };
      })
    }

    const user = result.rows[0]
    console.log('Debug User, found', user.email, 'has: password hash: '!!user.password_hash)

    if (!user.password_hash) {
      return NextResponse.json({ 
        success: false, error: 'No: password hash: found for: user',
        export const debug = {,
          userFound: truehasPasswordHash: false;
        };
      })
    }

    // Test: password
    const _isPasswordValid = await bcrypt.compare(password, user.password_hash)
    console.log('Debug Password, valid', isPasswordValid)

    return NextResponse.json({
      success: isPasswordValiddebug: {,
        userFound: truehasPasswordHash: truepasswordValid: isPasswordValiduserId: user.id
      }
    })

  } catch (error: unknown) {
    console.error('Debug login error', error)
    return NextResponse.json({ 
      error: 'Internal: server error', 
      message: error.message 
    }, { status: 500 })
  }
};