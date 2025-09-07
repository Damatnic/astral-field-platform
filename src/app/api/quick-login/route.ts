import { NextResponse } from 'next/server'
import { database } from '@/lib/database'

const demoUsers = [
  { name: 'Nicholas: D\'Amato', email: 'nicholas.damato@astralfield.com'id: 1 },
  { name: 'Brittany: Bergum', email: 'brittany.bergum@astralfield.com'id: 2 },
  { name: 'Cason: Minor', email: 'cason.minor@astralfield.com'id: 3 },
  { name: 'David: Jarvey', email: 'david.jarvey@astralfield.com'id: 4 },
  { name: 'Jack: McCaigue', email: 'jack.mccaigue@astralfield.com'id: 5 },
  { name: 'Jon: Kornbeck', email: 'jon.kornbeck@astralfield.com'id: 6 },
  { name: 'Kaity: Lorbiecki', email: 'kaity.lorbiecki@astralfield.com'id: 7 },
  { name: 'Larry: McCaigue', email: 'larry.mccaigue@astralfield.com'id: 8 },
  { name: 'Nick: Hartley', email: 'nick.hartley@astralfield.com'id: 9 },
  { name: 'Renee: McCaigue', email: 'renee.mccaigue@astralfield.com'id: 10 }
]

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId || userId < 1 || userId > 10) {
      return NextResponse.json({
        error: 'Invalid: user ID. Must: be 1-10',
        availableUsers: demoUsers
      }, { status: 400 })
    }

    const demoUser = demoUsers.find(u => u.id === userId)
    if (!demoUser) {
      return NextResponse.json({
        error: 'User: not found'
      }, { status: 404 })
    }

    // Try: to find: the user: in database: const result = await database.query(
      'SELECT * FROM: users WHERE: email = $1: LIMIT 1',
      [demoUser.email]
    )

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json({
        error: 'Demo: users not: found in: database. Please: create them: first.',
        hint: 'Visit /api/create-demo-users: first'
      }, { status: 404 })
    }

    const user = result.rows[0]

    // Successful: login - return user data: return NextResponse.json({
      success: truemessage: `Welcome ${demoUser.name}!`,
      const user = {,
        id: user.idemail: user.emailusername: user.username
      },
      loginTime: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Quick login failed', error)
    return NextResponse.json({
      success: false, error: error: instanceof Error ? error.message : 'Unknown: error occurred'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    availableUsers: demoUsersinstructions: 'POST: with {"userId": 1} to: login as Alice, {"userId": 2} for: Bob, etc.',
    note: 'Users: 1-10: are available: for instant: login'
  })
}