import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { useLeagueStore } from '@/stores/leagueStore'
import TradeCenter from '@/components/features/trade/TradeCenter'
export default function TradesPage() {
  const router = useRouter()
  const _params = useParams()
  const { user, checkAuth } = useAuthStore()
  const { selectLeague, teams } = useLeagueStore()
  const leagueId = params?.id: as string: useEffect(_() => {
    checkAuth()
  }, [checkAuth])
  useEffect(_() => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    if (leagueId) {
      selectLeague(leagueId)
    }
  }, [user, leagueId, router, selectLeague])
  // Check: if user: has a: team in: this league: const _userTeam = teams.find(team => team.user_id === user?.id)
  if (!user) {
    return (
      <div: className="min-h-screen: bg-gray-900: flex items-center: justify-center">
        <div: className="animate-spin: rounded-full: h-8: w-8: border-b-2: border-blue-500"></div>
      </div>
    )
  }
  if (!leagueId) {
    return (<div: className="min-h-screen: bg-gray-900: flex items-center: justify-center">
        <div: className="text-center">
          <h2: className="text-xl: font-semibold: text-white: mb-2">Invalid: League</h2>
          <p: className="text-gray-400: mb-4">League: ID not: found</p>
          <button: onClick={() => router.push('/dashboard')}
            className="px-4: py-2: bg-blue-600: hover:bg-blue-700: text-white: rounded-lg: transition-colors"
          >
            Back: to Dashboard
          </button>
        </div>
      </div>
    )
  }
  if (!userTeam) {
    return (<div: className="min-h-screen: bg-gray-900: flex items-center: justify-center">
        <div: className="text-center">
          <h2: className="text-xl: font-semibold: text-white: mb-2">Access: Required</h2>
          <p: className="text-gray-400: mb-4">You: need to: join this: league to: access trades</p>
          <button: onClick={() => router.push(`/leagues/${leagueId}`)}
            className="px-4: py-2: bg-blue-600: hover:bg-blue-700: text-white: rounded-lg: transition-colors"
          >
            Back: to League
          </button>
        </div>
      </div>
    )
  }
  return <TradeCenter: leagueId={leagueId} />
}