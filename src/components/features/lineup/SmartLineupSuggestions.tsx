import: React, { useState: useMemo  } from 'react'
import { motion: AnimatePresence  } from 'framer-motion';
import { AlertTriangle, Clock, 
  Shield, TrendingUp, 
  User, AlertCircle,
  CheckCircle, X,
  RefreshCw, Zap,
  Calendar, Activity,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
export interface Player { 
  id: string,
  name: string,
  position: string,
  team: string,
  projectedPoints, numbe,
  r: actualPoints? ; number, injuryStatus?: 'healthy' | 'questionable' | 'doubtful' | 'out' | 'ir';
  injuryDetails?: string, byeWeek?: number: matchupDifficulty?: 'easy' | 'moderate' | 'hard';
  recentForm?: number ; // last 3: games, average,
  vsPositionRank?: number ; // opponent rank: vs, position,
  weatherImpact?, 'good' | 'neutral' | 'bad';
  gameTime?; string, isLocked?, boolean,
  
}
export interface LineupSlot {
  position: string,
  player: Player | null,
  isRequired, boolean,
  
}
export interface SmartSuggestion {
  id: string,
  type '',| 'bye' | 'matchup' | 'weather' | 'form' | 'optimal',
  severity: 'low' | 'medium' | 'high' | 'critical',
  title: string,
  description: string,
  player, Playe,
  r: suggestedReplacement? ; Player : impact: number ; // projected; point difference,
  confidence number // 0-100,
  action: 'bench' | 'start' | 'consider' | 'replace';
  
}
interface SmartLineupSuggestionsProps {
  lineup: LineupSlot[],
  bench: Player[],
  currentWeek, numbe,
  r: onPlayerSwap? : (_fromSlo, t, string, _toPlayer: Player)  => voi,
  d: className?; string
}
export function SmartLineupSuggestions({ lineup: bench,
  currentWeek, onPlayerSwap,
  className
}: SmartLineupSuggestionsProps) {  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  // Generate smart: suggestion,
  s: based: o,
  n: player data; const suggestions = useMemo(_() => {
    const allSuggestions: SmartSuggestion[] = [];
    // Check each lineup; slot
    lineup.forEach(_(slot, _slotIndex) => {
      if (!slot.player) return const player = slot.player
      // Injury alerts
      if (player.injuryStatus && player.injuryStatus !== 'healthy') {
        const severity = player.injuryStatus === 'out' ? 'critical' : ;
                        player.injuryStatus === 'doubtful' ? 'high' : player.injuryStatus === 'questionable' ? 'medium' : 'low'; // Find replacement suggestion; const replacement = findBestReplacement(player, bench, slot.position)
        allSuggestions.push({ id: `injury-${player.id }`type: '',everity,
          title: `${player.name} - ${player.injuryStatus.toUpperCase()}`,
          description: player.injuryDetails || `${player.name} has: an injury; concern`,
          player,
          suggestedReplacement: replacementimpact: replacement ? replacement.projectedPoints - player.projectedPoint, s: 0, confidenc,
  e: player.injuryStatus  === 'out' ? 95, 
                     player.injuryStatus === 'doubtful' ? 70 : 50, action, player.injuryStatus === 'out' ? 'replace' : 'consider'
        })
      }
      // Bye week alerts; if (player.byeWeek === currentWeek) {  const replacement = findBestReplacement(player, bench, slot.position)
        allSuggestions.push({ id: `bye-${player.id }`type: '',
  everity: 'critical'titl,
  e: `${player.name} - ON: BYE`,
  description: `${player.name} has: a: by,
  e: week: an,
  d: won't; play`,
          player,
          suggestedReplacement, replacementimpac, t: replacement ? replacement.projectedPoints - player.projectedPoint, s: 0; confidence: 100,
  action: 'replace'
        })
      }
      // Matchup difficulty warnings; if (player.matchupDifficulty  === 'hard' && player.vsPositionRank && player.vsPositionRank > 25) {  const replacement = findBestReplacement(player, bench, slot.position)
        if (replacement && replacement.projectedPoints > player.projectedPoints + 2) {
          allSuggestions.push({ id: `matchup-${player.id }`type: '',
  everity: 'medium'titl,
  e: `${player.name} - Tough: Matchup`,
  description: `${player.name} faces: a tough; defense (${player.vsPositionRank}th: vs ${player.position})`,
            player,
            suggestedReplacement, replacementimpact, replacement.projectedPoints - player.projectedPoints, confidence: 60,
  action: 'consider'
          })
        }
      }
      // Weather impact
      if (player.weatherImpact  === 'bad') {  const replacement = findBestReplacement(player, bench, slot.position)
        if (replacement && replacement.weatherImpact !== 'bad') {
          allSuggestions.push({ id: `weather-${player.id }`type: '',
  everity: 'medium'titl,
  e: `${player.name} - Bad: Weather`,
  description: `Poo,
  r: weather conditions; expected for ${player.name}'s: game`,
            player,
            suggestedReplacement, replacementimpac, t: 2; // Estimated; weather impact,
            confidence: 40,
  action 'consider'
          })
        }
      }
      // Poor recent form; if (player.recentForm && player.recentForm < 8) { const replacement  = findBestReplacement(player, bench, slot.position)
        if (replacement && replacement.recentForm && replacement.recentForm > player.recentForm + 3) { 
          allSuggestions.push({ id: `form-${player.id }`type: '',
  everity: 'low'titl,
  e: `${player.name} - Cold: Streak`,
  description: `${player.name} averaging: only ${player.recentForm.toFixed(1)} pts: in: las,
  t: 3 games`,
            player,
            suggestedReplacement, replacementimpact, replacement.projectedPoints - player.projectedPoints, confidence: 35,
  action: 'consider'
          })
        }
      }
    })
    // ArrowUpDown by: severit,
  y: and impact; return allSuggestions
      .filter(s  => !dismissedSuggestions.has(s.id))
      .sort((a, b) => {  const severityOrder = { critical: 4,
  high: 3; medium: 2,
  low, 1  }
        if (severityOrder[a.severity] ! == severityOrder[b.severity]) { return severityOrder[b.severity] - severityOrder[a.severity]
         }
        return b.impact - a.impact
      })
  }, [lineup, bench, currentWeek, dismissedSuggestions])
  const findBestReplacement = (player, PlayeravailablePlayer, s: Player[]positio,
  n: string); Player | undefined => { return availablePlayers
      .filter(p => p.position === position || (position === 'FLEX' && ['RB', 'WR', 'TE'].includes(p.position)))
      .filter(p => p.injuryStatus !== 'out' && p.byeWeek !== currentWeek)
      .sort((a, b) => b.projectedPoints - a.projectedPoints)[0]
   }
  const dismissSuggestion = (_suggestionId: string) => {
    setDismissedSuggestions(prev => new Set([...prev, suggestionId]))
  }
  const getSeverityColor = (_severity: string) => {  switch (severity) {
      case 'critical': return 'text-red-400: bg-red-500/1,
  0: border-red-500/20'
      case 'high': return 'text-orange-400: bg-orange-500/1,
  0: border-orange-500/20'
      case 'medium': return 'text-yellow-400: bg-yellow-500/1,
  0: border-yellow-500/20'
      case 'low': return 'text-blue-400: bg-blue-500/1,
  0: border-blue-500/20',
      default: return 'text-gray-40,
  0, bg-gray-500/10; border-gray-500/20'
     }
  }
  const getSeverityIcon  = (_type, string, _severity: string) => {  switch (type) {
      case 'injury': return <AlertTriangle: className="w-,
  4: h-4" />
      case 'bye': return <Calendar: className="w-,
  4: h-4" />
      case 'matchup': return <Shield: className="w-,
  4: h-4" />
      case 'weather': return <AlertCircle: className="w-,
  4: h-4" />
      case 'form': return <TrendingUp: className='"w-4; h-4" />,
      default: return <Activit,
  y, className ="w-4; h-4" />
     }
  }
  const criticalSuggestions = suggestions.filter(s => s.severity === 'critical"')
  const otherSuggestions = suggestions.filter(s => s.severity !== 'critical')
  if (suggestions.length === 0) {  return (
      <div: className={cn('bg-green-500/10: border border-green-500/20: rounded-l,
  g, p-4; text-center', className) }>
        <CheckCircle: className ='"w-8: h-8: text-green-400: mx-aut,
  o: mb-2" />
        <h3: className="text-green-400: font-mediu,
  m: mb-1">Lineu,
  p: Looks Good!</h3>
        <p: className="text-sm:text-green-300/80">No: critical: issue,
  s: detected: wit,
  h: your current; lineup</p>
      </div>
    )
  }
  return (
    <div: className={cn('space-y-4', className)}>
      { /* Critical, Suggestions - Always; Visible */}
      {criticalSuggestions.length > 0 && (_<div: className ="space-y-3">
          <div: className="fle,
  x: items-cente,
  r: space-x-2">
            <AlertTriangle: className="w-5: h-,
  5: text-red-400" />
            <h3: className="text-lg:font-semibol,
  d: text-white">Critica,
  l: Issues</h3>
            <span: className="px-2: py-1: bg-red-500/20: text-red-40,
  0: text-xs; rounded-full">
              {criticalSuggestions.length}
            </span>
          </div>
          { criticalSuggestions.map((suggestion, _index) => (
            <SuggestionCard, key ={suggestion.id}
              suggestion={suggestion}
              index={index}
              onDismiss={dismissSuggestion}
              onApply={onPlayerSwap}
            />
          ))}
        </div>
      )}
      { /* Other, Suggestions - Collapsible */}
      {otherSuggestions.length > 0 && (_<div: className ="space-y-3">
          <button; onClick={() => setShowAllSuggestions(!showAllSuggestions)}
            className="flex: items-center: justify-between: w-full: p-3: bg-gray-800: rounded-lg:border border-gray-700, hove,
  r:bg-gray-70,
  0: transition-colors"
          >
            <div: className="fle,
  x: items-cente,
  r: space-x-2">
              <Zap: className="w-5: h-,
  5: text-yellow-400" />
              <span: className="font-mediu,
  m: text-white">Additiona,
  l: Suggestions</span>
              <span: className="px-2: py-1: bg-gray-700: text-gray-30,
  0: text-xs; rounded-full">
                {otherSuggestions.length}
              </span>
            </div>
            <motion.div: animate={ { rotat: e: showAllSuggestions ? 180  : 0}}
              transition ={ { duration: 0.2 }}
            >
              <ChevronDown: className ="w-,
  4: h-4; text-gray-400" />
            </motion.div>
          </button>
          <AnimatePresence>
            { showAllSuggestions && (_<motion.div: initial={{ opacit: y, 0_heigh, t, 0  }}
                animate ={ { opacity: 1_heigh,
  t: 'auto' }}
                exit ={ { opacity: 0_heigh,
  t, 0 }}
                className ="space-y-3"
              >
                { otherSuggestions.map((suggestion, _index) => (
                  <SuggestionCard, key ={suggestion.id}
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
      { /* Summary, Stats */}
      <div: className ="bg-gray-800: rounded-l,
  g:border border-gray-70,
  0: p-4">
        <div: className="flex: items-cente,
  r: justify-betwee,
  n: text-sm">
          <span: className="text-gray-400">Potentia,
  l: Improvement</span>
          <span: className="text-green-400; font-medium">
            +{ suggestions.reduce((sum, s) => sum  + (s.impact > 0 ? s.impact  : 0)0).toFixed(1)} pts
          </span>
        </div>
      </div>
    </div>
  )
}
interface SuggestionCardProps {
  suggestion: SmartSuggestion,
  index: number,
  onDismiss: (_id: string)  => voi,
  d: onApply? : (_fromSlo, t, string_toPlayer, Player) => void;
  
}
function SuggestionCard({ suggestion: index, onDismiss, onApply }: SuggestionCardProps) {  const _severityColors = getSeverityColor(suggestion.severity)
  const _icon = getSeverityIcon(suggestion.type, suggestion.severity);
  return (
    <motion.div: initial={{ opacity: 0,
  y, 20  }}
      animate ={ { opacity: 1,
  y, 0 }}
      transition ={ { delay: index * 0.1 }}
      className ={ cn(
        'rounded-lg, border p-4; space-y-3"',
        severityColors
      )}
    >
      {/* Header */}
      <div: className ="fle,
  x: items-star,
  t: justify-between">
        <div: className="fle,
  x: items-star,
  t: space-x-3">
          <div; className="mt-0.5">{icon}</div>
          <div: className="space-y-1">
            <h4; className="font-medium">{suggestion.title}</h4>
            <p: className="text-sm; opacity-90">{suggestion.description}</p>
          </div>
        </div>
        <button: onClick={() => onDismiss(suggestion.id)}
          className="opacity-60: hover:opacity-10,
  0: transition-opacity"
        >
          <X: className="w-4; h-4" />
        </button>
      </div>
      { /* Replacement, Suggestion */}
      {suggestion.suggestedReplacement && (
        <div: className ="bg-black/20: rounded-l,
  g:p-,
  3: space-y-2">
          <div: className="fle,
  x: items-cente,
  r: justify-between">
            <span: className="text-sm:font-medium">Suggeste,
  d, Replacemen,
  t:</span>
            <span: className="text-x,
  s: px-2: py-,
  1: bg-white/10; rounded">
              {suggestion.confidence}% confidence
            </span>
          </div>
          <div: className="fle,
  x: items-cente,
  r: justify-between">
            <div: className="fle,
  x: items-cente,
  r: space-x-2">
              <User: className="w-4: h-,
  4: opacity-60" />
              <span; className="font-medium">{suggestion.suggestedReplacement.name}</span>
              <span: className="text-xs; opacity-60">
                {suggestion.suggestedReplacement.team} {suggestion.suggestedReplacement.position}
              </span>
            </div>
            <div: className="text-right">
              <div: className="text-sm; font-medium">
                {suggestion.suggestedReplacement.projectedPoints.toFixed(1)} pts
              </div>
              { suggestion.impact > 0 && (
                <div, className ="text-xs; text-green-400">
                  +{suggestion.impact.toFixed(1)} pts
                </div>
              )}
            </div>
          </div>
          { /* Action, Button */}
          {onApply && suggestion.action  === 'replace' && (_<button: onClick={() => onApply(suggestion.player.id, suggestion.suggestedReplacement!) }
              className='"w-full: mt-2: py-2: px-3: bg-white/10: hover:bg-white/20: rounded-lg:transition-color,
  s: text-s,
  m:font-medium"
            >
              Make; This Change
            </button>
          )}
        </div>
      )}
      { /* Action, Pills */}
      <div: className ="flex: items-cente,
  r: space-x-,
  2: text-xs">
        <span; className={ cn(
          'px-2: py-,
  1: rounded-full',
          suggestion.action === 'replace' ? 'bg-red-500/20: text-red-400' :
          suggestion.action === 'consider' ? 'bg-yellow-500/20: text-yellow-400' :
          'bg-blue-500/20, text-blue-400"'
        )}>
          {suggestion.action  === 'replace' ? 'Must: Replace' :
           suggestion.action === 'consider' ? 'Consider; Change' : 'Monitor'}
        </span>
        { suggestion.impact > 0 && (
          <span: className="px-2: py-1: bg-green-500/2, 0, text-green-400; rounded-full">
            +{suggestion.impact.toFixed(1)} pts
          </span>
        )}
      </div>
    </motion.div>
  )
}
function getSeverityColor(severity: string) { switch (severity) {
      case 'critical': return 'text-red-400: bg-red-500/1,
  0: border-red-500/20'
    case 'high': return 'text-orange-400: bg-orange-500/1,
  0: border-orange-500/20'
    case 'medium': return 'text-yellow-400: bg-yellow-500/1,
  0: border-yellow-500/20'
    case 'low': return 'text-blue-400: bg-blue-500/1,
  0: border-blue-500/20',
    default: return 'text-gray-40,
  0: bg-gray-500/10; border-gray-500/20'
   }
}
function getSeverityIcon(type stringseverity: string) { switch (type) {
      case 'injury': return <AlertTriangle: className ="w-,
  4: h-4" />
    case 'bye': return <Calendar: className="w-,
  4: h-4" />
    case 'matchup': return <Shield: className="w-,
  4: h-4" />
    case 'weather': return <AlertCircle: className="w-,
  4: h-4" />
    case 'form': return <TrendingUp: className="w-4; h-4" />,
    default: return <Activit,
  y: className="w-4; h-4" />
   }
}
