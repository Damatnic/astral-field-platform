'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { motion } from 'framer-motion'
import { Loader2, User, AlertCircle, Shield, ArrowLeft } from 'lucide-react'

const demoUsers = [
  { name: 'Nicholas D\'Amato', email: 'nicholas.damato@astralfield.com', id: 1, password: '1234' },
  { name: 'Brittany Bergum', email: 'brittany.bergum@astralfield.com', id: 2, password: '2345' },
  { name: 'Cason Minor', email: 'cason.minor@astralfield.com', id: 3, password: '3456' },
  { name: 'David Jarvey', email: 'david.jarvey@astralfield.com', id: 4, password: '4567' },
  { name: 'Jack McCaigue', email: 'jack.mccaigue@astralfield.com', id: 5, password: '5678' },
  { name: 'Jon Kornbeck', email: 'jon.kornbeck@astralfield.com', id: 6, password: '6789' },
  { name: 'Kaity Lorbiecki', email: 'kaity.lorbiecki@astralfield.com', id: 7, password: '7890' },
  { name: 'Larry McCaigue', email: 'larry.mccaigue@astralfield.com', id: 8, password: '8901' },
  { name: 'Nick Hartley', email: 'nick.hartley@astralfield.com', id: 9, password: '9012' },
  { name: 'Renee McCaigue', email: 'renee.mccaigue@astralfield.com', id: 10, password: '0123' }
]

export default function LoginForm() {
  const router = useRouter()
  const { setUser } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingUserId, setLoadingUserId] = useState<number | null>(null)
  const [showMFA, setShowMFA] = useState(false)
  const [pendingUser, setPendingUser] = useState<typeof demoUsers[0] | null>(null)
  const [mfaToken, setMfaToken] = useState('')
  const [mfaAttempts, setMfaAttempts] = useState(0)

  const handleQuickLogin = async (user: typeof demoUsers[0]) => {
    setIsLoading(true)
    setLoadingUserId(user.id)
    setError(null)
    
    try {
      // First, check if user has MFA enabled
      const mfaCheck = await fetch('/api/auth/mfa', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id.toString(),
          'x-user-email': user.email,
        },
      })

      const mfaData = await mfaCheck.json()

      if (mfaData.success && mfaData.data.requiresMFA) {
        if (mfaData.data.isLocked) {
          setError('Account is temporarily locked due to too many failed MFA attempts. Please try again later.')
          return
        }

        // Show MFA verification step
        setPendingUser(user)
        setShowMFA(true)
        setMfaToken('')
        setMfaAttempts(0)
        return
      }

      // No MFA required, proceed with login
      const response = await fetch('/api/quick-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      })

      const data = await response.json()

      if (data.success) {
        setUser(data.user)
        router.push('/dashboard')
      } else {
        setError(data.error || 'Login failed')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
      setLoadingUserId(null)
    }
  }

  const handleMFAVerification = async () => {
    if (!pendingUser || !mfaToken.trim()) {
      setError('Please enter your 6-digit code')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/mfa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': pendingUser.id.toString(),
          'x-user-email': pendingUser.email,
        },
        body: JSON.stringify({
          action: 'verify',
          token: mfaToken,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // MFA verified, proceed with login
        const loginResponse = await fetch('/api/quick-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: pendingUser.id }),
        })

        const loginData = await loginResponse.json()

        if (loginData.success) {
          setUser(loginData.user)
          router.push('/dashboard')
        } else {
          setError(loginData.error || 'Login failed after MFA verification')
        }
      } else {
        setError(data.error || 'Invalid verification code')
        setMfaAttempts(prev => prev + 1)
        
        if (data.isLocked) {
          setError('Too many failed attempts. Account temporarily locked.')
          setShowMFA(false)
          setPendingUser(null)
          setMfaToken('')
        } else {
          setMfaToken('')
        }
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToLogin = () => {
    setShowMFA(false)
    setPendingUser(null)
    setMfaToken('')
    setMfaAttempts(0)
    setError(null)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl"
    >
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20">
        {/* Header Section */}
        {showMFA ? (
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <Shield className="h-12 w-12 text-blue-400 mr-3" />
              <div>
                <h2 className="text-3xl font-bold text-white mb-1">Two-Factor Authentication</h2>
                <p className="text-gray-300">Enter your 6-digit verification code</p>
              </div>
            </div>

            {pendingUser && (
              <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4 mb-6">
                <p className="text-blue-300 mb-2">
                  <strong>Logging in as:</strong> {pendingUser.name}
                </p>
                <p className="text-blue-400 text-sm">{pendingUser.email}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Choose Your Account</h2>
            <p className="text-gray-300">Click any button to instantly log in</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-center space-x-2 mb-6"
          >
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </motion.div>
        )}

        {/* Main Content Section */}
        {showMFA ? (
          <div className="max-w-md mx-auto space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Enter code from your authenticator app
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={mfaToken}
                  onChange={(e) => setMfaToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="flex-1 bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white text-center font-mono text-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm"
                  maxLength={6}
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && mfaToken.length === 6) {
                      handleMFAVerification();
                    }
                  }}
                />
                <button
                  onClick={handleMFAVerification}
                  disabled={isLoading || mfaToken.length !== 6}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    'Verify'
                  )}
                </button>
              </div>
            </div>

            <div className="text-center space-y-4">
              <p className="text-gray-400 text-sm">
                Can't access your authenticator? Use a backup code instead
              </p>
              
              <button
                onClick={handleBackToLogin}
                className="flex items-center space-x-2 text-gray-400 hover:text-white mx-auto transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to login</span>
              </button>
            </div>

            {mfaAttempts > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <p className="text-yellow-300 text-sm text-center">
                  {5 - mfaAttempts} attempts remaining
                </p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* User Login Buttons Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
              {demoUsers.map((user) => (
                <motion.button
                  key={user.id}
                  onClick={() => handleQuickLogin(user)}
                  disabled={isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    relative p-4 rounded-xl border transition-all duration-200
                    ${loadingUserId === user.id
                      ? 'bg-blue-600/30 border-blue-400/50 text-blue-200'
                      : 'bg-gray-800/50 border-gray-600 text-white hover:bg-gray-700/60 hover:border-gray-500'
                    }
                    ${isLoading && loadingUserId !== user.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      ${loadingUserId === user.id
                        ? 'bg-blue-500/30 border-blue-400/50'
                        : 'bg-gradient-to-br from-blue-500 to-purple-600'
                      }
                    `}>
                      {loadingUserId === user.id ? (
                        <Loader2 className="h-5 w-5 animate-spin text-blue-300" />
                      ) : (
                        <User className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="font-semibold text-lg">{user.name}</h3>
                      <div className="flex items-center space-x-2 text-sm opacity-75">
                        <span>Code: {user.password}</span>
                        <span className="text-xs px-2 py-1 bg-white/10 rounded">
                          ID #{user.id}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Help Text */}
            <div className="mt-8 text-center">
              <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4">
                <p className="text-sm text-blue-300 mb-2">
                  <strong>Quick Login:</strong> One-click access to your fantasy team
                </p>
                <p className="text-xs text-blue-400">
                  Each user has a unique 4-digit code for easy testing. All your teams, leagues, and data are saved permanently.
                </p>
              </div>
            </div>

            {/* Traditional Login Link */}
            <div className="text-center text-sm mt-6 pt-6 border-t border-gray-600">
              <span className="text-gray-400">Need traditional login? </span>
              <button 
                onClick={() => setError('Traditional login coming soon - use quick login for now')}
                className="font-medium text-blue-400 hover:text-blue-300"
              >
                Email & Password
              </button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}