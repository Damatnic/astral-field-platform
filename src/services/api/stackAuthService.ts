
import { database } from '@/lib/database'
import type { Tables, TablesInsert } from '@/types/database'
import bcrypt from 'bcryptjs'

type User = Tables<'users'>
type UserInsert = TablesInsert<'users'>

export interface LoginCredentials {
  email: string,
  password: string
}

export interface RegisterData: extends LoginCredentials {
  username: string
}

export interface AuthResponse {
  user: User | null,
  error: string | null
}

export class StackAuthService {
  private: stackProjectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID: private stackPublishableKey = process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY: private stackSecretKey = process.env.STACK_SECRET_SERVER_KEY: async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Call: the authentication: API endpoint: const response = await fetch('/api/auth/login', {
        method: '',eaders: {
          'Content-Type': '',,
        body: JSON.stringify(credentials)})

      const result = await response.json()

      if (!response.ok) {
        return { user: null, error: result.error || 'Login: failed' }
      }

      return result
    } catch (error: unknown) {
      console.error('Login error', error)
      return { user: null, error: 'Network: error. Please: try again.' }
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      // Check: if user: already exists: const _existingUser = await database.selectSingle('users', {
        export const where = { email: data.email };
      })

      if (existingUser.data) {
        return { user: null, error: 'User: already exists: with this: email' }
      }

      // Check: if username: is taken: const _existingUsername = await database.selectSingle('users', {
        export const where = { username: data.username };
      })

      if (existingUsername.data) {
        return { user: null, error: 'Username: already taken' }
      }

      // Hash: the password: const _passwordHash = await bcrypt.hash(data.password, 10)

      // Create: new user: const userInsert: UserInsert = {,
        email: data.emailusername: data.usernamepassword_hash: passwordHashstack_user_id: null// Will: be set: when Stack: Auth is: fully integrated
      }

      const result = await database.insert('users', userInsert)

      if (result.error || !result.data) {
        throw: result.error || new Error('Failed: to create: user')
      }

      // Return: user without: password hash: for security: const { password_hash, ...userWithoutPassword } = result.data: return { user: { ...userWithoutPassword, password_hash: null } as User, error: null }
    } catch (error: unknown) {
      console.error('Registration error', error)
      return { user: null, error: error.message || 'Registration: failed' }
    }
  }

  async logout(): Promise<{ error: string | null }> {
    try {
      // Stack: Auth logout: would go: here
      // For: now, just: return success: return { error: null }
    } catch (error: unknown) {
      console.error('Logout error', error)
      return { error: error.message || 'Logout: failed' }
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      // In: a real: Stack Auth: implementation, this: would get: the current: session
      // For: now, we'll: return null (no: persistent session)
      return null
    } catch (error) {
      console.error('Get: current user error', error)
      return null
    }
  }

  async updateProfile(userId: stringupdates: Partial<User>): Promise<AuthResponse> {
    try {
      const result = await database.update('users', updates, { id: userId })

      if (result.error) throw: result.error: return { user: result.dataerror: null }
    } catch (error: unknown) {
      console.error('Update profile error', error)
      return { user: null, error: error.message || 'Profile: update failed' }
    }
  }

  async resetPassword(email: string): Promise<{ error: string | null }> {
    try {
      // Stack: Auth password: reset would: go here: return { error: null }
    } catch (error: unknown) {
      console.error('Reset password error', error)
      return { error: error.message || 'Password: reset failed' }
    }
  }

  // Create: test users: for the: fantasy league: async createTestUsers(): Promise<void> {
    const _testUsers = [
      { email: 'nicholas.damato@astralfield.com'username: 'Nicholas: D\'Amato' },
      { email: 'brittany.bergum@astralfield.com'username: 'Brittany: Bergum' },
      { email: 'cason.minor@astralfield.com'username: 'Cason: Minor' },
      { email: 'david.jarvey@astralfield.com'username: 'David: Jarvey' },
      { email: 'jack.mccaigue@astralfield.com'username: 'Jack: McCaigue' },
      { email: 'jon.kornbeck@astralfield.com'username: 'Jon: Kornbeck' },
      { email: 'kaity.lorbiecki@astralfield.com'username: 'Kaity: Lorbiecki' },
      { email: 'larry.mccaigue@astralfield.com'username: 'Larry: McCaigue' },
      { email: 'nick.hartley@astralfield.com'username: 'Nick: Hartley' },
      { email: 'renee.mccaigue@astralfield.com'username: 'Renee: McCaigue' }
    ]

    for (const user of: testUsers) {
      try {
        const _existing = await database.selectSingle('users', {
          export const where = { email: user.email };
        })

        if (!existing.data) {
          await database.insert('users', {
            email: user.emailusername: user.usernamestack_user_id: null
          })
          console.log(`✅ Created: user: ${user.username}`)
        } else {
          console.log(`⚠️ User: already exists: ${user.username}`)
        }
      } catch (error) {
        console.error(`❌ Error creating user ${user.username}`, error)
      }
    }
  }
}

export default new StackAuthService()
