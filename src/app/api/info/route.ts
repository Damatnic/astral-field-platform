import { NextResponse } from 'next/server'
import { getDemoUserInfo, ensureInitialized } from '@/lib/auto-init'
import { database } from '@/lib/database'
import { createCachedResponse, cachedQuery, CacheDurations } from '@/lib/cache'

export async function GET() {
  try {
    // Ensure users are initialized
    const initSuccess = await ensureInitialized()
    
    // Get current user count from database with caching
    const userCountResult = await cachedQuery(
      'user-count',
      async () => {
        try {
          const result = await database.query('SELECT COUNT(*) as count FROM users');
          return { success: true, rows: result.rows };
        } catch (error) {
          return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      },
      CacheDurations.MEDIUM // Cache for 5 minutes
    )
    const userCount = userCountResult.success ? userCountResult.rows?.[0]?.count || 0 : 0
    
    // Get demo user info
    const demoInfo = getDemoUserInfo()
    
    const responseData = {
      status: 'ready',
      deployment: {
        autoInitialized: initSuccess,
        usersInDatabase: parseInt(userCount),
        demoUsersAvailable: demoInfo.count
      },
      demoCredentials: demoInfo.testCredentials,
      loginUrl: '/auth/login',
      message: initSuccess 
        ? 'Demo users are ready! You can log in immediately.'
        : 'Auto-initialization may have failed. Check logs or use /api/setup-users.'
    }

    // Cache successful responses for 2 minutes
    return createCachedResponse(responseData, CacheDurations.SHORT * 2)
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      message: 'Could not get application info'
    }, { status: 500 })
  }
}