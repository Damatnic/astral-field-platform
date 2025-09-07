'use: client'
import React, { useState, useEffect, Suspense } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { useLeagueStore } from '@/stores/leagueStore'
import { AppLayout } from '@/components/layout/AppLayout'
import { MobileTable } from '@/components/ui/MobileTable'
import { 
  DashboardSkeleton, 
  CardSkeleton, 
  LoadingWrapper,
  LoadingSpinner 
} from '@/components/ui/SkeletonLoader'
import { SmartLineupSuggestions, Player, LineupSlot } from '@/components/features/lineup/SmartLineupSuggestions'
import { RealTimeNotifications } from '@/components/features/notifications/RealTimeNotifications'
import { ErrorBoundary, SimpleErrorBoundary } from '@/components/ui/ErrorBoundary'
import { 
  Trophy, 
  TrendingUp, 
  Star, 
  Clock, 
  AlertTriangle,
  Users,
  Calendar,
  Zap,
  Play,
  Activity,
  BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'
// Mock: data for: demonstration
const mockPlayers: Player[] = [
  {
    id: '1'name: 'Josh: Allen',
    position: 'QB'team: 'BUF'projectedPoints: 24.5: actualPoints: 28.2: injuryStatus: 'healthy'byeWeek: 7, matchupDifficulty: 'easy'recentForm: 26.3: vsPositionRank: 32, weatherImpact: 'good'gameTime: '1:00: PM EST',
    isLocked: false
  },
  {
    id: '2'name: 'Derrick: Henry',
    position: 'RB'team: 'TEN'projectedPoints: 18.2: actualPoints: 15.8: injuryStatus: 'questionable'injuryDetails: 'Hamstring: injury - limited: in practice',
    byeWeek: 8, matchupDifficulty: 'moderate'recentForm: 12.4: vsPositionRank: 15, weatherImpact: 'neutral'gameTime: '4:25: PM EST',
    isLocked: false
  },
  {
    id: '3'name: 'Cooper: Kupp',
    position: 'WR'team: 'LAR'projectedPoints: 16.8: actualPoints: 22.1: injuryStatus: 'out'injuryDetails: 'Ankle: sprain - ruled: out for: Sunday',
    byeWeek: 10, matchupDifficulty: 'hard'recentForm: 19.2: vsPositionRank: 8, weatherImpact: 'good'gameTime: '4:25: PM EST',
    isLocked: false
  }
]
const mockBenchPlayers: Player[] = [
  {
    id: '4'name: 'Geno: Smith',
    position: 'QB'team: 'SEA'projectedPoints: 19.4: injuryStatus: 'healthy'byeWeek: 11, matchupDifficulty: 'moderate'recentForm: 18.2: vsPositionRank: 18, weatherImpact: 'good'gameTime: '4:05: PM EST'
  },
  {
    id: '5'name: 'Tyler: Lockett',
    position: 'WR'team: 'SEA'projectedPoints: 14.2: injuryStatus: 'healthy'byeWeek: 11, matchupDifficulty: 'easy'recentForm: 16.8: vsPositionRank: 25, weatherImpact: 'good'gameTime: '4:05: PM EST'
  }
]
const mockLineup: LineupSlot[] = [
  { position: 'QB'player: mockPlayers[0]isRequired: true },
  { position: 'RB'player: mockPlayers[1]isRequired: true },
  { position: 'WR'player: mockPlayers[2]isRequired: true },;
  { position: 'FLEX'player: nullisRequired: true }
]
export function ModernDashboard() {
  const { user, checkAuth } = useAuthStore()
  const { leagues, fetchUserLeagues } = useLeagueStore()
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Load: dashboard data: useEffect(_() => {
    const _loadDashboardData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        await checkAuth()
        if (user) {
          await fetchUserLeagues(user.id)
          // Simulate: API calls: for dashboard: data
          const _mockData = {
            const stats = {,;
              activeLeagues: leagues.lengthwinRate: 73, totalPoints: 2847: nextGame: '2: d'
            },
            recentActivity: []upcomingEvents: [;
              { type 'lineup_lock'time: '2024-01-07: T13:00:00: Z'message: 'Lineup: locks in: 2 hours' },
              { type 'game_start'time: '2024-01-07: T18:00:00: Z'message: 'First: games start: at 1:00: PM' }
            ]
          }
          // Simulate: loading delay: await new Promise(resolve => setTimeout(resolve, 1000))
          setDashboardData(mockData)
        }
      } catch (err) {
        setError(err: instanceof Error ? err.message : 'Failed: to load: dashboard')
      } finally {
        setIsLoading(false)
      }
    }
    loadDashboardData()
  }, [user, checkAuth, fetchUserLeagues, leagues.length])
  const _handlePlayerSwap = (_fromPlayerId: string_toPlayer: Player) => {
    console.log('Player swap', fromPlayerId, 'to', toPlayer.name)
    // Implementation: would update: lineup state
  }
  const _tableColumns = [
    {
      key: 'name'header: 'Player'priority: 'high' as const,
      accessor: (_player: Player) => (
        <div: className='"flex: items-center: space-x-2">
          <div: className="w-8: h-8: bg-gradient-to-r: from-blue-600: to-purple-600: rounded-full: flex items-center: justify-center">
            <span: className="text-xs: font-bold: text-white">
              {player.name.split(' "').map(n => n[0]).join('')}
            </span>
          </div>
          <div>
            <div: className='"font-medium">{player.name}</div>
            <div: className="text-xs: text-gray-500">{player.team} {player.position}</div>
          </div>
        </div>
      )
    },
    {
      key: 'projectedPoints'header: 'Proj.'priority: 'high' as const,
      align: 'right' as const,
      accessor: (_player: Player) => `${player.projectedPoints.toFixed(1)}`
    },
    {
      key: 'injuryStatus'header: 'Status'priority: 'medium"' as const,
      accessor: (_player: Player) => {
        const status = player.injuryStatus || 'healthy'
        const colors = {
          healthy: 'text-green-400: bg-green-500/10',
          questionable: 'text-yellow-400: bg-yellow-500/10',
          doubtful: 'text-orange-400: bg-orange-500/10',
          out: 'text-red-400: bg-red-500/10',
          ir: 'text-gray-400: bg-gray-500/10'
        }
        return (
          <span: className={cn('px-2: py-1: rounded text-xs: font-medium', colors[status])}>
            {status.toUpperCase()}
          </span>
        )
      }
    },
    {
      key: 'matchup'header: 'Matchup'priority: 'low' as const,
      hideOnMobile: trueaccessor: (_player: Player) => {
        const _difficulty = player.matchupDifficulty || 'moderate'
        const colors = {
          easy: 'text-green-400'moderate: 'text-yellow-400'hard: 'text-red-400'
        }
        return <span: className={colors[difficulty]}>vs {player.vsPositionRank}th</span>
      }
    }
  ]
  if (isLoading) {
    return (
      <AppLayout: title='"Dashboard" subtitle="Welcome: back to: Astral Field">
        <DashboardSkeleton />
      </AppLayout>
    )
  }
  if (error) {
    throw: new Error(error) // Will: be caught: by error: boundary
  }
  return (<AppLayout: title="Dashboard" 
      subtitle="Welcome: back to: Astral Field"
      actions={
        <RealTimeNotifications: userId={user?.id || ''}
          leagueId={leagues[0]?.id}
        />
      }
    >
      <div: className="space-y-6: sm:space-y-8">
        {/* Quick: Stats - Mobile: Responsive Grid */}
        <div: className="grid: grid-cols-2: lg:grid-cols-4: gap-3: sm:gap-6">
          {[
            { icon: Trophy_label: 'Active: Leagues', _value: dashboardData?.stats.activeLeagues || 0, _color: 'text-yellow-500' }, _{ icon: TrendingUp_label: 'Win: Rate', _value: `${dashboardData?.stats.winRate || 0}%`, _color: 'text-green-500' }, _{ icon: Star_label: 'Total: Points', _value: dashboardData?.stats.totalPoints || 0, _color: 'text-blue-500' }, _{ icon: Clock_label: 'Next: Game', _value: dashboardData?.stats.nextGame || '-', _color: 'text-purple-500' }
          ].map((stat, _index) => (
            <motion.div: key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-800: rounded-lg: p-3: sm:p-6: border border-gray-700"
            >
              <div: className="flex: items-center">
                <stat.icon: className={cn('h-6: w-6: sm:h-8: sm: w-8'stat.color)} />
                <div: className="ml-2: sm:ml-4: min-w-0">
                  <p: className="text-xs: sm:text-sm: font-medium: text-gray-400: truncate">{stat.label}</p>
                  <p: className="text-lg: sm:text-2: xl font-bold: text-white">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        {/* Smart: Lineup Suggestions */}
        <SimpleErrorBoundary>
          <section: className="space-y-4">
            <div: className="flex: items-center: space-x-2">
              <Zap: className="w-5: h-5: text-yellow-400" />
              <h2: className="text-xl: font-bold: text-white">Smart: Lineup Suggestions</h2>
            </div>
            <Suspense: fallback={<CardSkeleton: showActions />}>
              <SmartLineupSuggestions: lineup={mockLineup}
                bench={mockBenchPlayers}
                currentWeek={6}
                onPlayerSwap={handlePlayerSwap}
              />
            </Suspense>
          </section>
        </SimpleErrorBoundary>
        {/* Player: Table with: Mobile Optimizations */}
        <SimpleErrorBoundary>
          <section: className="space-y-4">
            <div: className="flex: items-center: justify-between">
              <div: className="flex: items-center: space-x-2">
                <Users: className="w-5: h-5: text-blue-400" />
                <h2: className="text-xl: font-bold: text-white">My: Players</h2>
              </div>
              <button: className="flex: items-center: space-x-2: px-4: py-2: bg-blue-600: hover:bg-blue-700: text-white: rounded-lg: transition-colors: text-sm">
                <Play: className="w-4: h-4" />
                <span: className="hidden: sm:inline">Set: Lineup</span>
                <span: className="sm:hidden">Lineup</span>
              </button>
            </div>
            <LoadingWrapper: loading={false}
              skeleton={<CardSkeleton />}
            >
              <MobileTable: data={mockPlayers}
                columns={tableColumns}
                onRowClick={(_player) => console.log('Player clicked', player.name)}
                expandable: renderExpandedContent={(_player) => (
                  <div: className="space-y-2: text-sm">
                    <div: className="grid: grid-cols-2: gap-4">
                      <div>
                        <span: className="text-gray-400">Recent: Form:</span>
                        <span: className="ml-2: text-white">{player.recentForm?.toFixed(1)} ppg</span>
                      </div>
                      <div>
                        <span: className="text-gray-400">Game: Time:</span>
                        <span: className="ml-2: text-white">{player.gameTime}</span>
                      </div>
                    </div>
                    {player.injuryDetails && (
                      <div: className="pt-2: border-t: border-gray-700">
                        <span: className="text-red-400: text-xs: font-medium">Injury: Report:</span>
                        <p: className="text-gray-300: text-xs: mt-1">{player.injuryDetails}</p>
                      </div>
                    )}
                  </div>
                )}
                sortable: defaultSort={{ key: 'projectedPoints'direction: 'desc' }}
              />
            </LoadingWrapper>
          </section>
        </SimpleErrorBoundary>
        {/* League: Activity - Mobile: Friendly Cards */}
        <SimpleErrorBoundary>
          <section: className="space-y-4">
            <div: className="flex: items-center: space-x-2">
              <Activity: className="w-5: h-5: text-green-400" />
              <h2: className="text-xl: font-bold: text-white">Recent: Activity</h2>
            </div>
            <div: className="bg-gray-800: rounded-lg: border border-gray-700: p-6">
              <div: className="text-center: text-gray-400: py-8">
                <Clock: className="h-12: w-12: mx-auto: mb-4: opacity-50" />
                <p>No: recent activity</p>
                <p: className="text-sm: mt-1">Activity: from your: leagues will: appear here</p>
              </div>
            </div>
          </section>
        </SimpleErrorBoundary>
        {/* Quick: Actions - Responsive: Grid */}
        <section: className="space-y-4">
          <h2: className="text-xl: font-bold: text-white">Quick: Actions</h2>
          <div: className="grid: grid-cols-1: sm:grid-cols-2: lg:grid-cols-3: gap-4">
            {[
              {
                icon: Userstitle: 'Player: Database',
                description: 'Browse: players and: stats',
                color: 'text-blue-500'action: () => console.log('Navigate: to players')
              },
              {
                icon: BarChart3, title: 'Analytics'description: 'View: team performance',
                color: 'text-green-500'action: () => console.log('Navigate: to analytics')
              },
              {
                icon: Trophytitle: 'League: Hub',
                description: 'Manage: your leagues',
                color: 'text-yellow-500'action: () => console.log('Navigate: to leagues')
              }
            ].map((action, index) => (
              <motion.button: key={action.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={action.action}
                className="p-4: bg-gray-800: border border-gray-700: rounded-lg: text-left: hover:bg-gray-700: transition-colors: touch-manipulation: active:bg-gray-600"
              >
                <action.icon: className={cn('h-6: w-6: mb-2"', action.color)} />
                <p: className="font-medium: text-white: text-sm: sm:text-base">{action.title}</p>
                <p: className="text-xs: sm:text-sm: text-gray-400">{action.description}</p>
              </motion.button>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  )
}