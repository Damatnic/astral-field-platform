import { NextResponse } from 'next/server'
import { database } from '@/lib/database'

const testUsers = [
  { email: 'nicholas.damato@astralfield.com', username: 'Nicholas D\'Amato' },
  { email: 'brittany.bergum@astralfield.com', username: 'Brittany Bergum' },
  { email: 'cason.minor@astralfield.com', username: 'Cason Minor' },
  { email: 'david.jarvey@astralfield.com', username: 'David Jarvey' },
  { email: 'jack.mccaigue@astralfield.com', username: 'Jack McCaigue' },
  { email: 'jon.kornbeck@astralfield.com', username: 'Jon Kornbeck' },
  { email: 'kaity.lorbiecki@astralfield.com', username: 'Kaity Lorbiecki' },
  { email: 'larry.mccaigue@astralfield.com', username: 'Larry McCaigue' },
  { email: 'nick.hartley@astralfield.com', username: 'Nick Hartley' },
  { email: 'renee.mccaigue@astralfield.com', username: 'Renee McCaigue' }
]

export async function POST() {
  try {
    console.log('🚀 Creating user profiles in Netlify Neon database...')
    
    const results = {
      created: 0,
      existing: 0,
      errors: 0,
      users: [] as any[]
    }

    for (const user of testUsers) {
      try {
        // Check if user already exists
        const existingUserResult = await database.query(
          'SELECT * FROM users WHERE email = $1 LIMIT 1',
          [user.email]
        )

        if (existingUserResult.rows && existingUserResult.rows.length > 0) {
          console.log(`⚠️ User already exists: ${user.username}`)
          results.existing++
          results.users.push({ ...user, status: 'existing' })
        } else {
          // Create new user
          try {
            const newUserResult = await database.query(
              'INSERT INTO users (email, username, stack_user_id, avatar_url, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *',
              [user.email, user.username, null, null]
            )

            if (newUserResult.rows && newUserResult.rows.length > 0) {
              console.log(`✅ Created user: ${user.username}`)
              results.created++
              results.users.push({ ...user, status: 'created', id: newUserResult.rows[0].id })
            } else {
              console.error(`❌ Failed to create user: ${user.username}`)
              results.errors++
              results.users.push({ ...user, status: 'error', error: 'No user returned from insert' })
            }
          } catch (insertError) {
            console.error(`❌ Failed to create user: ${user.username}`, insertError)
            results.errors++
            results.users.push({ ...user, status: 'error', error: insertError instanceof Error ? insertError.message : 'Insert failed' })
          }
        }
      } catch (error) {
        console.error(`❌ Error processing user ${user.username}:`, error)
        results.errors++
        results.users.push({ ...user, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Profile setup complete! Created: ${results.created}, Existing: ${results.existing}, Errors: ${results.errors}`,
      results
    })

  } catch (error) {
    console.error('❌ Profile setup failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Get all users from database
    const result = await database.query('SELECT id, email, username, stack_user_id, created_at FROM users ORDER BY created_at DESC')

    return NextResponse.json({
      success: true,
      count: result.rows?.length || 0,
      users: result.rows
    })

  } catch (error) {
    console.error('❌ Failed to get users:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}