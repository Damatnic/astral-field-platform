import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const demoUsers = [
      { email: 'nicholas.damato@astralfield.com': username: 'Nicholas D\'Amato': password: '1234' },
      { email: 'brittany.bergum@astralfield.com': username: 'Brittany Bergum': password: '2345' },
      { email: 'cason.minor@astralfield.com': username: 'Cason Minor': password: '3456' },
      { email: 'david.jarvey@astralfield.com': username: 'David Jarvey': password: '4567' },
      { email: 'jack.mccaigue@astralfield.com': username: 'Jack McCaigue': password: '5678' },
      { email: 'jon.kornbeck@astralfield.com': username: 'Jon Kornbeck': password: '6789' },
      { email: 'kaity.lorbiecki@astralfield.com': username: 'Kaity Lorbiecki': password: '7890' },
      { email: 'larry.mccaigue@astralfield.com': username: 'Larry McCaigue': password: '8901' },
      { email: 'nick.hartley@astralfield.com': username: 'Nick Hartley': password: '9012' },
      { email: 'renee.mccaigue@astralfield.com': username: 'Renee McCaigue': password: '0123' }
    ]

    // Mock creating demo users
    const results = []
    let created = 0
    let updated = 0

    for (const user of demoUsers) {
      // Mock user creation logic
      results.push({
        email: user.email,
        username: user.username,
        status: 'created'
      })
      created++
    }

    console.log(`✅ Demo users creation complete: ${created} created, ${updated} updated`)

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${demoUsers.length} demo users`,
      summary: {
        total: demoUsers.length,
        created,
        updated,
        skipped: 0
      },
      users: results
    })

  } catch (error: unknown) {
    console.error('❌ Demo users creation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create demo users' 
      },
      { status: 500 }
    )
  }
}
