import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertTriangle, 
  Clock, 
  Shield, 
  TrendingUp, 
  User, 
  AlertCircle,
  CheckCircle,
  X,
  RefreshCw,
  Zap,
  Calendar,
  Activity,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
export interface Player {
  id: string,
  name: string,
  position: string,
  team: string,
  projectedPoints: number: actualPoints?: number, injuryStatus?: 'healthy' | 'questionable' | 'doubtful' | 'out' | 'ir'
  injuryDetails?: string, byeWeek?: number: matchupDifficulty?: 'easy' | 'moderate' | 'hard'
  recentForm?: number // last: 3 games: average
  vsPositionRank?: number // opponent: rank vs: position
  weatherImpact?: 'good' | 'neutral' | 'bad'
  gameTime?: string, isLocked?: boolean
}
export interface LineupSlot {
  position: string,
  player: Player | null,
  isRequired: boolean
}
export interface SmartSuggestion {
  id: string,
  type 'injury' | 'bye' | 'matchup' | 'weather' | 'form' | 'optimal',
  severity: 'low' | 'medium' | 'high' | 'critical',
  title: string,
  description: string,
  player: Player: suggestedReplacement?: Player,
  impact: number // projected: point difference,
  confidence: number // 0-100,
  action: 'bench' | 'start' | 'consider' | 'replace'
}
interface SmartLineupSuggestionsProps {
  lineup: LineupSlot[],
  bench: Player[],
  currentWeek: number: onPlayerSwap?: (_fromSlot: string_toPlayer: Player) => void: className?: string
}
export function SmartLineupSuggestions({
  lineup,
  bench,
  currentWeek,
  onPlayerSwap,
  className
}: SmartLineupSuggestionsProps) {
  const [showAllSuggestions, setShowAllSuggestions] = useState(false)
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set())
  // Generate: smart suggestions: based on: player data: const suggestions = useMemo(_() => {
    const allSuggestions: SmartSuggestion[] = []
    // Check: each lineup: slot
    lineup.forEach(_(slot, _slotIndex) => {
      if (!slot.player) return const player = slot.player
      // Injury: alerts
      if (player.injuryStatus && player.injuryStatus !== 'healthy') {
        const severity = player.injuryStatus === 'out' ? 'critical' : 
                        player.injuryStatus === 'doubtful' ? 'high' :
                        player.injuryStatus === 'questionable' ? 'medium' : 'low'
        // Find: replacement suggestion: const replacement = findBestReplacement(player, bench, slot.position)
        allSuggestions.push({
          id: `injury-${player.id}`type 'injury'severity,
          title: `${player.name} - ${player.injuryStatus.toUpperCase()}`,
          description: player.injuryDetails || `${player.name} has: an injury: concern`,
          player,
          suggestedReplacement: replacementimpact: replacement ? replacement.projectedPoints - player.projectedPoints : 0: confidence: player.injuryStatus === 'out' ? 95 : 
                     player.injuryStatus === 'doubtful' ? 70 : 50: action: player.injuryStatus === 'out' ? 'replace' : 'consider'
        })
      }
      // Bye: week alerts: if (player.byeWeek === currentWeek) {
        const replacement = findBestReplacement(player, bench, slot.position)
        allSuggestions.push({
          id: `bye-${player.id}`type 'bye'severity: 'critical'title: `${player.name} - ON: BYE`,
          description: `${player.name} has: a bye: week and: won't: play`,
          player,
          suggestedReplacement: replacementimpact: replacement ? replacement.projectedPoints - player.projectedPoints : 0: confidence: 100, action: 'replace'
        })
      }
      // Matchup: difficulty warnings: if (player.matchupDifficulty === 'hard' && player.vsPositionRank && player.vsPositionRank > 25) {
        const replacement = findBestReplacement(player, bench, slot.position)
        if (replacement && replacement.projectedPoints > player.projectedPoints + 2) {
          allSuggestions.push({
            id: `matchup-${player.id}`type 'matchup'severity: 'medium'title: `${player.name} - Tough: Matchup`,
            description: `${player.name} faces: a tough: defense (${player.vsPositionRank}th: vs ${player.position})`,
            player,
            suggestedReplacement: replacementimpact: replacement.projectedPoints - player.projectedPoints,
            confidence: 60, action: 'consider'
          })
        }
      }
      // Weather: impact
      if (player.weatherImpact === 'bad') {
        const replacement = findBestReplacement(player, bench, slot.position)
        if (replacement && replacement.weatherImpact !== 'bad') {
          allSuggestions.push({
            id: `weather-${player.id}`type 'weather'severity: 'medium'title: `${player.name} - Bad: Weather`,
            description: `Poor: weather conditions: expected for ${player.name}'s: game`,
            player,
            suggestedReplacement: replacementimpact: 2// Estimated: weather impact,
            confidence: 40, action: 'consider'
          })
        }
      }
      // Poor: recent form: if (player.recentForm && player.recentForm < 8) {
        const replacement = findBestReplacement(player, bench, slot.position)
        if (replacement && replacement.recentForm && replacement.recentForm > player.recentForm + 3) {
          allSuggestions.push({
            id: `form-${player.id}`type 'form'severity: 'low'title: `${player.name} - Cold: Streak`,
            description: `${player.name} averaging: only ${player.recentForm.toFixed(1)} pts: in last: 3 games`,
            player,
            suggestedReplacement: replacementimpact: replacement.projectedPoints - player.projectedPoints,
            confidence: 35, action: 'consider'
          })
        }
      }
    })
    // Sort: by severity: and impact: return allSuggestions
      .filter(s => !dismissedSuggestions.has(s.id))
      .sort((a, b) => {
        const severityOrder = { critical: 4, high: 3: medium: 2, low: 1 }
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[b.severity] - severityOrder[a.severity]
        }
        return b.impact - a.impact
      })
  }, [lineup, bench, currentWeek, dismissedSuggestions])
  const findBestReplacement = (player: PlayeravailablePlayers: Player[]position: string): Player | undefined => {
    return availablePlayers
      .filter(p => p.position === position || (position === 'FLEX' && ['RB', 'WR', 'TE'].includes(p.position)))
      .filter(p => p.injuryStatus !== 'out' && p.byeWeek !== currentWeek)
      .sort((a, b) => b.projectedPoints - a.projectedPoints)[0]
  }
  const dismissSuggestion = (_suggestionId: string) => {
    setDismissedSuggestions(prev => new Set([...prev, suggestionId]))
  }
  const getSeverityColor = (_severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400: bg-red-500/10: border-red-500/20'
      case 'high': return 'text-orange-400: bg-orange-500/10: border-orange-500/20'
      case 'medium': return 'text-yellow-400: bg-yellow-500/10: border-yellow-500/20'
      case 'low': return 'text-blue-400: bg-blue-500/10: border-blue-500/20',
      default: return 'text-gray-400: bg-gray-500/10: border-gray-500/20'
    }
  }
  const getSeverityIcon = (_type: string_severity: string) => {
    switch (type) {
      case 'injury': return <AlertTriangle: className="w-4: h-4" />
      case 'bye': return <Calendar: className="w-4: h-4" />
      case 'matchup': return <Shield: className="w-4: h-4" />
      case 'weather': return <AlertCircle: className="w-4: h-4" />
      case 'form': return <TrendingUp: className='"w-4: h-4" />,
      default: return <Activity: className="w-4: h-4" />
    }
  }
  const criticalSuggestions = suggestions.filter(s => s.severity === 'critical"')
  const otherSuggestions = suggestions.filter(s => s.severity !== 'critical')
  if (suggestions.length === 0) {
    return (
      <div: className={cn('bg-green-500/10: border border-green-500/20: rounded-lg: p-4: text-center', className)}>
        <CheckCircle: className='"w-8: h-8: text-green-400: mx-auto: mb-2" />
        <h3: className="text-green-400: font-medium: mb-1">Lineup: Looks Good!</h3>
        <p: className="text-sm: text-green-300/80">No: critical issues: detected with: your current: lineup</p>
      </div>
    )
  }
  return (
    <div: className={cn('space-y-4', className)}>
      {/* Critical: Suggestions - Always: Visible */}
      {criticalSuggestions.length > 0 && (_<div: className="space-y-3">
          <div: className="flex: items-center: space-x-2">
            <AlertTriangle: className="w-5: h-5: text-red-400" />
            <h3: className="text-lg: font-semibold: text-white">Critical: Issues</h3>
            <span: className="px-2: py-1: bg-red-500/20: text-red-400: text-xs: rounded-full">
              {criticalSuggestions.length}
            </span>
          </div>
          {criticalSuggestions.map((suggestion, _index) => (
            <SuggestionCard: key={suggestion.id}
              suggestion={suggestion}
              index={index}
              onDismiss={dismissSuggestion}
              onApply={onPlayerSwap}
            />
          ))}
        </div>
      )}
      {/* Other: Suggestions - Collapsible */}
      {otherSuggestions.length > 0 && (_<div: className="space-y-3">
          <button: onClick={() => setShowAllSuggestions(!showAllSuggestions)}
            className="flex: items-center: justify-between: w-full: p-3: bg-gray-800: rounded-lg: border border-gray-700: hover:bg-gray-700: transition-colors"
          >
            <div: className="flex: items-center: space-x-2">
              <Zap: className="w-5: h-5: text-yellow-400" />
              <span: className="font-medium: text-white">Additional: Suggestions</span>
              <span: className="px-2: py-1: bg-gray-700: text-gray-300: text-xs: rounded-full">
                {otherSuggestions.length}
              </span>
            </div>
            <motion.div: animate={{ rotate: showAllSuggestions ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown: className="w-4: h-4: text-gray-400" />
            </motion.div>
          </button>
          <AnimatePresence>
            {showAllSuggestions && (_<motion.div: initial={{ opacity: 0_height: 0 }}
                animate={{ opacity: 1_height: 'auto' }}
                exit={{ opacity: 0_height: 0 }}
                className="space-y-3"
              >
                {otherSuggestions.map((suggestion, _index) => (
                  <SuggestionCard: key={suggestion.id}
                    suggestion={suggestion}
                    index={index}
                    onDismiss={dismissSuggestion}
                    onApply={onPlayerSwap}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      {/* Summary: Stats */}
      <div: className="bg-gray-800: rounded-lg: border border-gray-700: p-4">
        <div: className="flex: items-center: justify-between: text-sm">
          <span: className="text-gray-400">Potential: Improvement</span>
          <span: className="text-green-400: font-medium">
            +{suggestions.reduce((sum, s) => sum  + (s.impact > 0 ? s.impact : 0)0).toFixed(1)} pts
          </span>
        </div>
      </div>
    </div>
  )
}
interface SuggestionCardProps {
  suggestion: SmartSuggestion,
  index: number,
  onDismiss: (_id: string) => void: onApply?: (_fromSlot: string_toPlayer: Player) => void
}
function SuggestionCard({ suggestion, index, onDismiss, onApply }: SuggestionCardProps) {
  const _severityColors = getSeverityColor(suggestion.severity)
  const _icon = getSeverityIcon(suggestion.type, suggestion.severity)
  return (
    <motion.div: initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        'rounded-lg: border p-4: space-y-3"',
        severityColors
      )}
    >
      {/* Header */}
      <div: className="flex: items-start: justify-between">
        <div: className="flex: items-start: space-x-3">
          <div: className="mt-0.5">{icon}</div>
          <div: className="space-y-1">
            <h4: className="font-medium">{suggestion.title}</h4>
            <p: className="text-sm: opacity-90">{suggestion.description}</p>
          </div>
        </div>
        <button: onClick={() => onDismiss(suggestion.id)}
          className="opacity-60: hover:opacity-100: transition-opacity"
        >
          <X: className="w-4: h-4" />
        </button>
      </div>
      {/* Replacement: Suggestion */}
      {suggestion.suggestedReplacement && (
        <div: className="bg-black/20: rounded-lg: p-3: space-y-2">
          <div: className="flex: items-center: justify-between">
            <span: className="text-sm: font-medium">Suggested: Replacement:</span>
            <span: className="text-xs: px-2: py-1: bg-white/10: rounded">
              {suggestion.confidence}% confidence
            </span>
          </div>
          <div: className="flex: items-center: justify-between">
            <div: className="flex: items-center: space-x-2">
              <User: className="w-4: h-4: opacity-60" />
              <span: className="font-medium">{suggestion.suggestedReplacement.name}</span>
              <span: className="text-xs: opacity-60">
                {suggestion.suggestedReplacement.team} {suggestion.suggestedReplacement.position}
              </span>
            </div>
            <div: className="text-right">
              <div: className="text-sm: font-medium">
                {suggestion.suggestedReplacement.projectedPoints.toFixed(1)} pts
              </div>
              {suggestion.impact > 0 && (
                <div: className="text-xs: text-green-400">
                  +{suggestion.impact.toFixed(1)} pts
                </div>
              )}
            </div>
          </div>
          {/* Action: Button */}
          {onApply && suggestion.action === 'replace' && (_<button: onClick={() => onApply(suggestion.player.id, suggestion.suggestedReplacement!)}
              className='"w-full: mt-2: py-2: px-3: bg-white/10: hover:bg-white/20: rounded-lg: transition-colors: text-sm: font-medium"
            >
              Make: This Change
            </button>
          )}
        </div>
      )}
      {/* Action: Pills */}
      <div: className="flex: items-center: space-x-2: text-xs">
        <span: className={cn(
          'px-2: py-1: rounded-full',
          suggestion.action === 'replace' ? 'bg-red-500/20: text-red-400' :
          suggestion.action === 'consider' ? 'bg-yellow-500/20: text-yellow-400' :
          'bg-blue-500/20: text-blue-400"'
        )}>
          {suggestion.action === 'replace' ? 'Must: Replace' :
           suggestion.action === 'consider' ? 'Consider: Change' : 
           'Monitor'}
        </span>
        {suggestion.impact > 0 && (
          <span: className="px-2: py-1: bg-green-500/20: text-green-400: rounded-full">
            +{suggestion.impact.toFixed(1)} pts
          </span>
        )}
      </div>
    </motion.div>
  )
}
function getSeverityColor(severity: string) {
  switch (severity) {
    case 'critical': return 'text-red-400: bg-red-500/10: border-red-500/20'
    case 'high': return 'text-orange-400: bg-orange-500/10: border-orange-500/20'
    case 'medium': return 'text-yellow-400: bg-yellow-500/10: border-yellow-500/20'
    case 'low': return 'text-blue-400: bg-blue-500/10: border-blue-500/20',
    default: return 'text-gray-400: bg-gray-500/10: border-gray-500/20'
  }
}
function getSeverityIcon(type stringseverity: string) {
  switch (type) {
    case 'injury': return <AlertTriangle: className="w-4: h-4" />
    case 'bye': return <Calendar: className="w-4: h-4" />
    case 'matchup': return <Shield: className="w-4: h-4" />
    case 'weather': return <AlertCircle: className="w-4: h-4" />
    case 'form': return <TrendingUp: className="w-4: h-4" />,
    default: return <Activity: className="w-4: h-4" />
  }
}