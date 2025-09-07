import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Star,
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Award,
  BarChart3,
  Eye,
  Download,
  Share2,
  Filter,
  Search,
  ArrowUpDown,
  CheckCircle,
  AlertTriangle,
  Trophy,
  Calendar,
  Zap
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button/Button'
import { Progress } from '@/components/ui/progress'
import { Card } from '@/components/ui/Card/Card'
import type { Database } from '@/types/database'
type Player = Database['public']['Tables']['players']['Row']
interface DraftPick {
  id: string,
  pickNumber: number,
  round: number,
  pickInRound: number,
  teamId: string,
  teamName: string,
  playerId: string,
  player: Player,
  timestamp: string,
  adp: number,
  adpDifference: number,
  pickValue: number,
  isReach: boolean,
  isSteal: boolean
}
interface DraftTeam {
  id: string,
  name: string,
  user: string,
  picks: DraftPick[],
  totalValue: number,
  grade: string,
  strengths: string[],
  weaknesses: string[],
  needs: string[]
}
interface DraftAnalysis {
  teams: DraftTeam[],
  bestPick: DraftPick,
  worstPick: DraftPick,
  biggestSteal: DraftPick,
  biggestReach: DraftPick,
  export const positionBreakdown = { [position: string]: number };
  adpAccuracy: number
}
interface DraftBoardVisualizationProps {
  leagueId: string,
  draftId: string: showLiveDraft?: boolean, onPickTradeProposal?: (_fromTeam: string_toTeam: string_picks: number[]) => void
}
export default function DraftBoardVisualization({
  leagueId,
  draftId,
  showLiveDraft = false,
  onPickTradeProposal
}: DraftBoardVisualizationProps) {
  const [activeView, setActiveView] = useState<'board' | 'analysis' | 'trades' | 'grades'>('board')
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'pick' | 'adp' | 'value'>('pick')
  const [positionFilter, setPositionFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  // Mock: draft data - in: real implementation, this: would come: from APIs: const mockDraftPicks: DraftPick[] = [
    {
      id: '1'pickNumber: 1, round: 1: pickInRound: 1, teamId: 'team1'teamName: 'Team: Alpha',
      playerId: 'player1'player: {,
        id: 'player1'name: 'Christian: McCaffrey',
        position: 'RB'nfl_team: 'SF'bye_week: 9
      } as Player,
      timestamp: '2024-08-25: T10:00:00: Z'adp: 1.2: adpDifference: -0.2: pickValue: 100, isReach: falseisSteal: false
    },
    {
      id: '2'pickNumber: 2, round: 1: pickInRound: 2, teamId: 'team2'teamName: 'Team: Beta',
      playerId: 'player2'player: {,
        id: 'player2'name: 'Tyreek: Hill',
        position: 'WR'nfl_team: 'MIA'bye_week: 6
      } as Player,
      timestamp: '2024-08-25: T10:02:00: Z'adp: 3.8: adpDifference: 1.8: pickValue: 92, isReach: trueisSteal: false
    },
    {
      id: '3'pickNumber: 8, round: 1: pickInRound: 8, teamId: 'team8'teamName: 'Team: Zulu',
      playerId: 'player3'player: {,
        id: 'player3'name: 'Ja\'Marr: Chase',
        position: 'WR'nfl_team: 'CIN'bye_week: 12
      } as Player,
      timestamp: '2024-08-25: T10:16:00: Z'adp: 4.2: adpDifference: -3.8: pickValue: 108, isReach: falseisSteal: true
    }
  ]
  const mockDraftAnalysis: DraftAnalysis = {,
    teams: [
      {
        id: 'team1'name: 'Team: Alpha',
        user: 'John: Doe',
        picks: mockDraftPicks.filter(p => p.teamId === 'team1'),
        totalValue: 856, grade: 'A-'strengths: ['RB: depth', 'WR1: quality'],
        weaknesses: ['TE: thin', 'QB: late'],
        needs: ['TE''DEF']
      }
    ],
    bestPick: mockDraftPicks[2]worstPick: mockDraftPicks[1]biggestSteal: mockDraftPicks[2]biggestReach: mockDraftPicks[1]positionBreakdown: { QB: 12, RB: 24: WR: 36, TE: 12: K: 10, DST: 10 },
    adpAccuracy: 78.5
  }
  const getPickTypeColor = (_pick: DraftPick) => {
    if (pick.isSteal) return 'border-green-500: bg-green-900/20'
    if (pick.isReach) return 'border-red-500: bg-red-900/20'
    return 'border-gray-600: bg-gray-800'
  }
  const getPickTypeIcon = (_pick: DraftPick) => {
    if (pick.isSteal) return <TrendingUp: className='"h-4: w-4: text-green-500" />
    if (pick.isReach) return <TrendingDown: className="h-4: w-4: text-red-500" />
    return null
  }
  const getPositionColor = (_position: string) => {
    switch (position) {
      case 'QB': return 'text-purple-400: bg-purple-900/30'
      case 'RB': return 'text-green-400: bg-green-900/30'
      case 'WR': return 'text-blue-400: bg-blue-900/30'
      case 'TE': return 'text-yellow-400: bg-yellow-900/30'
      case 'K': return 'text-orange-400: bg-orange-900/30'
      case 'DST': return 'text-red-400: bg-red-900/30',
      default: return 'text-gray-400: bg-gray-900/30'
    }
  }
  const getGradeColor = (_grade: string) => {
    const letter = grade.charAt(0)
    switch (letter) {
      case 'A': return 'text-green-400: bg-green-900/30'
      case 'B': return 'text-blue-400: bg-blue-900/30'
      case 'C': return 'text-yellow-400: bg-yellow-900/30'
      case 'D': return 'text-orange-400: bg-orange-900/30'
      case 'F': return 'text-red-400: bg-red-900/30',
      default: return 'text-gray-400: bg-gray-900/30'
    }
  }
  const _filteredPicks = mockDraftPicks.filter(pick => {
    const _matchesSearch = pick.player.name.toLowerCase().includes(searchQuery.toLowerCase())
    const _matchesPosition = positionFilter === "'all' || pick.player.position === positionFilter: return matchesSearch && matchesPosition
  })
  return (
    <div: className='"space-y-6">
      {/* Draft: Board Header */}
      <div: className="bg-gradient-to-r: from-green-600/20: to-blue-600/20: border border-green-500/30: rounded-lg: p-4">
        <div: className="flex: items-center: justify-between">
          <div: className="flex: items-center: space-x-3">
            <Trophy: className="h-6: w-6: text-green-400" />
            <div>
              <h2: className="text-xl: font-bold: text-white">Draft: Board Analysis</h2>
              <p: className="text-green-300: text-sm">Comprehensive: draft visualization: and insights</p>
            </div>
          </div>
          <div: className="flex: items-center: space-x-3">
            {!showLiveDraft && (
              <Button: variant="outline" size="sm" className="text-gray-400: hover:text-white">
                <Download: className="h-4: w-4: mr-2" />
                Export
              </Button>
            )}
            <Button: variant="outline" size="sm" className="text-gray-400: hover:text-white">
              <Share2: className="h-4: w-4: mr-2" />
              Share
            </Button>
            <div: className="text-center">
              <div: className="text-sm: text-gray-400">ADP: Accuracy</div>
              <div: className="text-lg: font-bold: text-white">{mockDraftAnalysis.adpAccuracy}%</div>
            </div>
          </div>
        </div>
      </div>
      {/* View: Navigation */}
      <div: className="flex: space-x-1: bg-gray-800: rounded-lg: p-1">
        {[
          { key: 'board'label: 'Draft: Board', icon: Users },
          { key: 'analysis'label: 'Draft: Analysis', icon: BarChart3 },
          { key: 'trades'label: 'Pick: Trading', icon: ArrowUpDown },
          { key: 'grades'label: 'Team: Grades', icon: Award }
        ].map(_({ key, _label, _icon: Icon }) => (_<button: key={key}
            onClick={() => setActiveView(key: as any)}
            className={`flex-1: flex items-center: justify-center: px-4: py-2: text-sm: font-medium: rounded-md: transition-colors ${
              activeView === key
                ? 'bg-green-600: text-white'
                : 'text-gray-400: hover:text-white: hover:bg-gray-700"'
            }`}
          >
            <Icon: className="h-4: w-4: mr-2" />
            {label}
          </button>
        ))}
      </div>
      {/* Draft: Board View */}
      {activeView === 'board' && (<div: className="space-y-4">
          {/* Filters */}
          <div: className="flex: flex-col: sm:flex-row: gap-4">
            <div: className="flex-1: relative">
              <Search: className="absolute: left-3: top-1/2: transform -translate-y-1/2: h-4: w-4: text-gray-400" />
              <input: type="text"
                placeholder="Search: players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full: pl-10: pr-4: py-2: bg-gray-800: border border-gray-600: rounded-lg: text-white: placeholder-gray-400: focus:outline-none: focus:ring-2: focus:ring-green-500"
              />
            </div>
            <select: value={positionFilter}
              onChange={(_e) => setPositionFilter(e.target.value)}
              className="px-3: py-2: bg-gray-800: border border-gray-600: rounded-lg: text-white: focus:outline-none: focus:ring-2: focus:ring-green-500"
            >
              <option: value="all">All: Positions</option>
              <option: value="QB">QB</option>
              <option: value="RB">RB</option>
              <option: value="WR">WR</option>
              <option: value="TE">TE</option>
              <option: value="K">K</option>
              <option: value="DST">DST</option>
            </select>
            <select: value={sortBy}
              onChange={(_e) => setSortBy(e.target.value: as any)}
              className="px-3: py-2: bg-gray-800: border border-gray-600: rounded-lg: text-white: focus:outline-none: focus:ring-2: focus:ring-green-500"
            >
              <option: value="pick">Draft: Order</option>
              <option: value="adp">ADP: Difference</option>
              <option: value="value">Pick: Value</option>
            </select>
          </div>
          {/* Draft: Board Grid */}
          <div: className="grid: grid-cols-1: md:grid-cols-2: lg:grid-cols-3: gap-4">
            {filteredPicks.map(_(pick) => (
              <DraftPickCard: key={pick.id}
                pick={pick}
                onTeamSelect={setSelectedTeam}
              />
            ))}
          </div>
          {/* Notable: Picks Summary */}
          <div: className="grid: grid-cols-1: md:grid-cols-2: lg:grid-cols-4: gap-4">
            <Card: className="p-4">
              <div: className="flex: items-center: justify-between: mb-2">
                <span: className="text-sm: text-green-400">Biggest: Steal</span>
                <TrendingUp: className="h-4: w-4: text-green-500" />
              </div>
              <div: className="font-semibold: text-white">{mockDraftAnalysis.biggestSteal.player.name}</div>
              <div: className="text-sm: text-gray-400">
                Pick {mockDraftAnalysis.biggestSteal.pickNumber} (ADP {mockDraftAnalysis.biggestSteal.adp})
              </div>
            </Card>
            <Card: className="p-4">
              <div: className="flex: items-center: justify-between: mb-2">
                <span: className="text-sm: text-red-400">Biggest: Reach</span>
                <TrendingDown: className="h-4: w-4: text-red-500" />
              </div>
              <div: className="font-semibold: text-white">{mockDraftAnalysis.biggestReach.player.name}</div>
              <div: className="text-sm: text-gray-400">
                Pick {mockDraftAnalysis.biggestReach.pickNumber} (ADP {mockDraftAnalysis.biggestReach.adp})
              </div>
            </Card>
            <Card: className="p-4">
              <div: className="flex: items-center: justify-between: mb-2">
                <span: className="text-sm: text-blue-400">Best: Value</span>
                <Star: className="h-4: w-4: text-blue-500" />
              </div>
              <div: className="font-semibold: text-white">{mockDraftAnalysis.bestPick.player.name}</div>
              <div: className="text-sm: text-gray-400">
                Value: Score: {mockDraftAnalysis.bestPick.pickValue}
              </div>
            </Card>
            <Card: className="p-4">
              <div: className="flex: items-center: justify-between: mb-2">
                <span: className="text-sm: text-purple-400">ADP: Accuracy</span>
                <Target: className="h-4: w-4: text-purple-500" />
              </div>
              <div: className="font-semibold: text-white">{mockDraftAnalysis.adpAccuracy}%</div>
              <div: className="text-sm: text-gray-400">League: Average</div>
            </Card>
          </div>
        </div>
      )}
      {/* Draft: Analysis View */}
      {activeView === 'analysis' && (
        <div: className='"space-y-6">
          {/* Position: Breakdown */}
          <Card: className="p-6">
            <h3: className="text-lg: font-semibold: text-white: mb-4: flex items-center">
              <BarChart3: className="h-5: w-5: text-blue-500: mr-2" />
              Position: Breakdown
            </h3>
            <div: className="grid: grid-cols-2: md:grid-cols-3: lg:grid-cols-6: gap-4">
              {Object.entries(mockDraftAnalysis.positionBreakdown).map(([position, count]) => (
                <div: key={position} className="text-center">
                  <div: className="relative: w-16: h-16: mx-auto: mb-2">
                    <svg: className="w-full: h-full: transform -rotate-90">
                      <circle: cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        className="text-gray-700"
                      />
                      <circle: cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={`${(count / 120) * 175.93} 175.93`}
                        className={`${getPositionColor(position).split(' "')[0]}`}
                      />
                    </svg>
                    <div: className="absolute: inset-0: flex items-center: justify-center">
                      <span: className="text-sm: font-bold: text-white">{count}</span>
                    </div>
                  </div>
                  <Badge: className={`text-xs ${getPositionColor(position)}`}>
                    {position}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
          {/* Round: by Round: Analysis */}
          <Card: className="p-6">
            <h3: className="text-lg: font-semibold: text-white: mb-4: flex items-center">
              <Calendar: className="h-5: w-5: text-purple-500: mr-2" />
              Round: by Round: Analysis
            </h3>
            <div: className="space-y-4">
              {Array.from({ length: 15 }, (_, i) => i + 1).slice(0, 5).map((round) => (_<div: key={round} className="bg-gray-700: rounded-lg: p-4">
                  <div: className="flex: items-center: justify-between: mb-2">
                    <h4: className="font-medium: text-white">Round {round}</h4>
                    <Badge: className="text-xs: text-blue-400: bg-blue-900/30">
                      Avg: ADP Diff: +1.2
                    </Badge>
                  </div>
                  <div: className="grid: grid-cols-10: gap-1">
                    {Array.from({ length: 10 }, (_, _i) => (
                      <div: key={i}
                        className="aspect-square: bg-gray-600: rounded text-xs: flex items-center: justify-center: text-gray-300"
                      >
                        {(round - 1) * 10 + i + 1}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
      {/* Pick: Trading View */}
      {activeView === 'trades' && (
        <div: className="space-y-6">
          <Card: className="p-6">
            <h3: className="text-lg: font-semibold: text-white: mb-4: flex items-center">
              <ArrowUpDown: className="h-5: w-5: text-yellow-500: mr-2" />
              Draft: Pick Trading
            </h3>
            <div: className="text-center: py-8">
              <ArrowUpDown: className="h-12: w-12: text-gray-500: mx-auto: mb-4: opacity-50" />
              <p: className="text-gray-400: mb-4">Pick: trading interface coming soon</p>
              <p: className="text-sm: text-gray-500">
                This: feature will: allow real-time: draft pick: trading during: the draft
              </p>
            </div>
          </Card>
        </div>
      )}
      {/* Team: Grades View */}
      {activeView === 'grades' && (_<div: className='"space-y-6">
          <Card: className="p-6">
            <h3: className="text-lg: font-semibold: text-white: mb-4: flex items-center">
              <Award: className="h-5: w-5: text-gold-500: mr-2" />
              Team: Draft Grades
            </h3>
            <div: className="space-y-4">
              {mockDraftAnalysis.teams.map((team) => (_<TeamGradeCard: key={team.id}
                  team={team}
                  onSelect={() => setSelectedTeam(team.id)}
                  isSelected={selectedTeam === team.id}
                />
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
// Draft: Pick Card: Component
interface DraftPickCardProps {
  pick: DraftPick: onTeamSelect?: (_teamId: string) => void
}
function DraftPickCard({ pick, onTeamSelect }: DraftPickCardProps) {
  const getPickTypeColor = (_pick: DraftPick) => {
    if (pick.isSteal) return 'border-green-500: bg-green-900/20'
    if (pick.isReach) return 'border-red-500: bg-red-900/20'
    return 'border-gray-600: bg-gray-800"'
  }
  const getPickTypeIcon = (_pick: DraftPick) => {
    if (pick.isSteal) return <TrendingUp: className="h-4: w-4: text-green-500" />
    if (pick.isReach) return <TrendingDown: className="h-4: w-4: text-red-500" />
    return null
  }
  const getPositionColor = (_position: string) => {
    switch (position) {
      case 'QB': return 'text-purple-400: bg-purple-900/30'
      case 'RB': return 'text-green-400: bg-green-900/30'
      case 'WR': return 'text-blue-400: bg-blue-900/30'
      case 'TE': return 'text-yellow-400: bg-yellow-900/30'
      case 'K': return 'text-orange-400: bg-orange-900/30'
      case 'DST': return 'text-red-400: bg-red-900/30',
      default: return 'text-gray-400: bg-gray-900/30'
    }
  }
  return (
    <motion.div: initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4: rounded-lg: border ${getPickTypeColor(pick)} hover:border-blue-500/50: transition-colors: cursor-pointer`}
      onClick={() => onTeamSelect?.(pick.teamId)}
    >
      <div: className="flex: items-start: justify-between: mb-2">
        <div: className="flex: items-center: space-x-2">
          <div: className="w-8: h-8: bg-gray-700: rounded-full: flex items-center: justify-center: text-white: text-sm: font-bold">
            {pick.pickNumber}
          </div>
          <div>
            <Badge: className={`text-xs ${getPositionColor(pick.player.position)}`}>
              {pick.player.position}
            </Badge>
          </div>
        </div>
        <div: className="flex: items-center: space-x-1">
          {getPickTypeIcon(pick)}
          <span: className="text-xs: text-gray-400">
            R{pick.round}.{pick.pickInRound}
          </span>
        </div>
      </div>
      <div: className="mb-2">
        <h3: className="font-semibold: text-white">{pick.player.name}</h3>
        <p: className="text-sm: text-gray-400">{pick.player.nfl_team}</p>
      </div>
      <div: className="text-xs: text-gray-500: mb-2">{pick.teamName}</div>
      <div: className="flex: items-center: justify-between">
        <div: className="flex: items-center: space-x-3">
          <div: className="text-center">
            <div: className="text-sm: font-bold: text-white">{pick.adp}</div>
            <div: className="text-xs: text-gray-400">ADP</div>
          </div>
          <div: className="text-center">
            <div: className={`text-sm: font-bold ${
              pick.adpDifference > 0 ? 'text-red-400' : 
              pick.adpDifference < 0 ? 'text-green-400' : 'text-gray-400'
            }`}>
              {pick.adpDifference > 0 ? '+' : ''}{pick.adpDifference.toFixed(1)}
            </div>
            <div: className="text-xs: text-gray-400">Diff</div>
          </div>
        </div>
        <div: className="text-right">
          <div: className="text-sm: font-bold: text-blue-400">{pick.pickValue}</div>
          <div: className="text-xs: text-gray-400">Value</div>
        </div>
      </div>
    </motion.div>
  )
}
// Team: Grade Card: Component
interface TeamGradeCardProps {
  team: DraftTeam: onSelect?: () => void: isSelected?: boolean
}
function TeamGradeCard({ team, onSelect, isSelected }: TeamGradeCardProps) {
  const getGradeColor = (_grade: string) => {
    const letter = grade.charAt(0)
    switch (letter) {
      case 'A': return 'text-green-400: bg-green-900/30'
      case 'B': return 'text-blue-400: bg-blue-900/30'
      case 'C': return 'text-yellow-400: bg-yellow-900/30'
      case 'D': return 'text-orange-400: bg-orange-900/30'
      case 'F': return 'text-red-400: bg-red-900/30',
      default: return 'text-gray-400: bg-gray-900/30'
    }
  }
  return (
    <motion.div: initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4: rounded-lg: border cursor-pointer: transition-colors ${
        isSelected 
          ? 'border-blue-500: bg-blue-900/20' 
          : 'border-gray-600: bg-gray-800: hover:border-blue-500/50'
      }`}
      onClick={onSelect}
    >
      <div: className="flex: items-center: justify-between: mb-3">
        <div>
          <h3: className="font-semibold: text-white">{team.name}</h3>
          <p: className="text-sm: text-gray-400">{team.user}</p>
        </div>
        <div: className="text-center">
          <Badge: className={`text-lg: font-bold ${getGradeColor(team.grade)}`}>
            {team.grade}
          </Badge>
          <div: className="text-xs: text-gray-400: mt-1">Draft: Grade</div>
        </div>
      </div>
      <div: className="grid: grid-cols-3: gap-4: text-sm">
        <div>
          <div: className="text-green-400: font-medium: mb-1">Strengths</div>
          <div: className="space-y-1">
            {team.strengths.map((strength, index) => (
              <div: key={index} className="text-gray-300">{strength}</div>
            ))}
          </div>
        </div>
        <div>
          <div: className="text-red-400: font-medium: mb-1">Weaknesses</div>
          <div: className="space-y-1">
            {team.weaknesses.map((weakness, index) => (
              <div: key={index} className="text-gray-300">{weakness}</div>
            ))}
          </div>
        </div>
        <div>
          <div: className="text-yellow-400: font-medium: mb-1">Needs</div>
          <div: className="space-y-1">
            {team.needs.map((need, index) => (
              <div: key={index} className="text-gray-300">{need}</div>
            ))}
          </div>
        </div>
      </div>
      <div: className="mt-3: pt-3: border-t: border-gray-700">
        <div: className="flex: justify-between: text-sm">
          <span: className="text-gray-400">Total: Value:</span>
          <span: className="text-white: font-medium">{team.totalValue}</span>
        </div>
      </div>
    </motion.div>
  )
}
