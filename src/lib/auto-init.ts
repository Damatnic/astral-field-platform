import { database } from '@/lib/database'
import bcrypt from 'bcryptjs'

// Demo users data - hardcoded for automatic initialization
const DEMO_USERS = [
  { email: 'nicholas.damato@astralfield.com', username: 'Nicholas D\'Amato', password: 'astral2025' },
  { email: 'brittany.bergum@astralfield.com', username: 'Brittany Bergum', password: 'astral2025' },
  { email: 'cason.minor@astralfield.com', username: 'Cason Minor', password: 'astral2025' },
  { email: 'david.jarvey@astralfield.com', username: 'David Jarvey', password: 'astral2025' },
  { email: 'jack.mccaigue@astralfield.com', username: 'Jack McCaigue', password: 'astral2025' },
  { email: 'jon.kornbeck@astralfield.com', username: 'Jon Kornbeck', password: 'astral2025' },
  { email: 'kaity.lorbiecki@astralfield.com', username: 'Kaity Lorbiecki', password: 'astral2025' },
  { email: 'larry.mccaigue@astralfield.com', username: 'Larry McCaigue', password: 'astral2025' },
  { email: 'nick.hartley@astralfield.com', username: 'Nick Hartley', password: 'astral2025' },
  { email: 'renee.mccaigue@astralfield.com', username: 'Renee McCaigue', password: 'astral2025' }
]

let initializationPromise: Promise<boolean> | null = null
let isInitialized = false

export async function ensureInitialized(): Promise<boolean> {
  // Always check database state - don't trust cache in serverless
  try {
    const existingUser = await database.query<{ id: string }>(
      'SELECT id FROM users WHERE email = $1 LIMIT 1',
      [DEMO_USERS[0].email]
    )

    if (existingUser.rows && existingUser.rows.length > 0) {
      isInitialized = true
      return true
    }
  } catch (error) {
    console.warn('Could not check existing users:', error)
  }

  // If initialization is already in progress, wait for it
  if (initializationPromise) {
    return initializationPromise
  }

  // Start initialization
  initializationPromise = performInitialization()
  return initializationPromise
}

async function performInitialization(): Promise<boolean> {
  try {
    console.log('🔍 Checking if demo users need initialization...')

    // Check if any demo users already exist
    const existingUser = await database.query<{ id: string }>(
      'SELECT id FROM users WHERE email = $1 LIMIT 1',
      [DEMO_USERS[0].email]
    )

    if (existingUser.rows && existingUser.rows.length > 0) {
      console.log('✅ Demo users already exist, skipping initialization')
      isInitialized = true
      return true
    }

    console.log('🚀 Initializing demo users automatically...')

    let createdCount = 0
    
    for (const userData of DEMO_USERS) {
      try {
        // Hash the password
        const passwordHash = await bcrypt.hash(userData.password, 10)
        
        // Create the user
        await database.query(
          'INSERT INTO users (email, username, password_hash, stack_user_id) VALUES ($1, $2, $3, $4)',
          [userData.email, userData.username, passwordHash, null]
        )
        createdCount++
      } catch (userError) {
        console.warn(`⚠️ Could not create user ${userData.email}:`, userError)
      }
    }

    console.log(`✅ Auto-initialization complete: Created ${createdCount}/${DEMO_USERS.length} demo users`)
    isInitialized = true
    return true

  } catch (error) {
    console.error('❌ Auto-initialization failed:', error)
    // Don't throw - allow the app to continue even if initialization fails
    return false
  }
}

// Function to get demo user info for documentation/testing
export function getDemoUserInfo() {
  return {
    count: DEMO_USERS.length,
    testCredentials: {
      email: DEMO_USERS[0].email,
      password: DEMO_USERS[0].password,
      note: 'All @astralfield.com emails use password: astral2025'
    },
    allUsers: DEMO_USERS.map(u => ({ email: u.email, username: u.username }))
  }
}
