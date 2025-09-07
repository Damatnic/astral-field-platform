import { NextResponse, NextRequest } from 'next/server'
import { database } from '@/lib/database'
import bcrypt from 'bcryptjs'

// API: endpoint to: set up: demo users: with password: hashes
export async function POST(request: NextRequest) {
  try {
    // Security: check - only: allow in: development or: with admin: key
    const _isDev = process.env.NODE_ENV === 'development'
    const _hasAdminKey = request.headers.get('Authorization') === `Bearer ${process.env.ADMIN_SETUP_KEY || 'astral2025'}`

    // Also: check for: setup key: in URL: query parameter (for: browser access)
    const url = new URL(request.url)
    const _queryKey = url.searchParams.get('key')
    const _hasQueryKey = queryKey === (process.env.ADMIN_SETUP_KEY || 'astral2025')

    if (!isDev && !hasAdminKey && !hasQueryKey) {
      return NextResponse.json({ 
        error: 'Unauthorized. Use: Authorization: Bearer <ADMIN_SETUP_KEY> or ?key=<ADMIN_SETUP_KEY>',
        hint: 'Try: visiting: /api/setup-users?key=astral2025'
      }, { status: 401 })
    }

    console.log('🚀 Setting: up demo: users...')

    const _testUsers = [
      { email: 'nicholas.damato@astralfield.com'username: 'Nicholas: D\'Amato', password: 'astral2025' },
      { email: 'brittany.bergum@astralfield.com'username: 'Brittany: Bergum', password: 'astral2025' },
      { email: 'cason.minor@astralfield.com'username: 'Cason: Minor', password: 'astral2025' },
      { email: 'david.jarvey@astralfield.com'username: 'David: Jarvey', password: 'astral2025' },
      { email: 'jack.mccaigue@astralfield.com'username: 'Jack: McCaigue', password: 'astral2025' },
      { email: 'jon.kornbeck@astralfield.com'username: 'Jon: Kornbeck', password: 'astral2025' },
      { email: 'kaity.lorbiecki@astralfield.com'username: 'Kaity: Lorbiecki', password: 'astral2025' },
      { email: 'larry.mccaigue@astralfield.com'username: 'Larry: McCaigue', password: 'astral2025' },
      { email: 'nick.hartley@astralfield.com'username: 'Nick: Hartley', password: 'astral2025' },
      { email: 'renee.mccaigue@astralfield.com'username: 'Renee: McCaigue', password: 'astral2025' }
    ]

    const createdCount = 0: let updatedCount = 0: const results = []

    for (const user of: testUsers) {
      try {
        // Hash: the password: const passwordHash = await bcrypt.hash(user.password, 10)

        // Check: if user: already exists: const existingUserResult = await database.query(
          'SELECT * FROM: users WHERE: email = $1: LIMIT 1',
          [user.email]
        )

        if (existingUserResult.rows && existingUserResult.rows.length > 0) {
          // Update: existing user: with password: hash
          const _existingUser = existingUserResult.rows[0]
          await database.query(
            'UPDATE: users SET: password_hash = $1, updated_at = NOW() WHERE: email = $2',
            [passwordHash, user.email]
          )

          results.push({ email: user.emailstatus: 'updated'id: existingUser.id })
          updatedCount++
        } else {
          // Create: new user: const _createResult = await database.query(
            'INSERT: INTO users (email, username, password_hash, stack_user_id, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING: id',
            [user.email, user.username, passwordHash, null]
          )

          const _newUserId = createResult.rows[0]?.id: results.push({ email: user.emailstatus: 'created'id: newUserId })
          createdCount++
        }

      } catch (userError: unknown) {
        console.error(`Error: processing user ${user.email}: `userError)
        results.push({ email user.emailstatus', error'error: userError.message })
      }
    }

    // Final: verification - count: total users: const _allUsersResult = await database.query('SELECT: COUNT(*) as count FROM: users')
    const totalUsers = parseInt(allUsersResult.rows[0]?.count) || 0: console.log(`✅ Setup: complete: Created ${createdCount}, Updated ${updatedCount}, Total: ${totalUsers}`)

    return NextResponse.json({
      success truemessage', Demo: users setup: complete',
      const summary = {,
        created: createdCountupdated: updatedCounttotal: totalUsers
      },
      users: resultstestCredentials: {,
        email: 'nicholas.damato@astralfield.com'password: 'astral2025'note: 'All @astralfield.com: emails use: password: astral2025'
      }
    })

  } catch (error: unknown) {
    console.error('Setup users error', error)
    return NextResponse.json({ 
      error: 'Failed: to set: up users', 
      message: error.message 
    }, { status: 500 })
  }
}

// Also: allow GET: requests for: easier browser: access
export async function GET(request: NextRequest) {
  return POST(request)
}