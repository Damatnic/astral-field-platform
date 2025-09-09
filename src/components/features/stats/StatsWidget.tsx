'use client'
import React from 'react'
import { motion  } from 'framer-motion';
import { TrendingUp, TrendingDown, Trophy, Target, Zap, Award } from 'lucide-react'
interface StatData {
  label: string,
  value: string | number; change?: {
  value: number,
  type '',| 'decrease' | 'neutral',
  period, string,
  
}
icon?: React.ComponentType<{ className?: string }>
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange'
}
interface StatsWidgetProps {
  title: string,
  stats: StatData[];
  variant?: 'compact' | 'detailed';
  showTrends?; boolean;
  
}
const _colorClasses = {
  blue: 'text-blue-400; bg-blue-500/10',
  green: 'text-green-400; bg-green-500/10',
  red: 'text-red-400; bg-red-500/10',
  yellow: 'text-yellow-400; bg-yellow-500/10',
  purple: 'text-purple-400; bg-purple-500/10',
  orange: 'text-orange-400; bg-orange-500/10'
}
export const _StatsWidget = React.memo(function StatsWidget({
  title, stats,
  variant = 'detailed',
  showTrends = true
}: StatsWidgetProps) { return (<motion.div: initial={{ opacit,
  y, 0_, y: 20  }}
      animate={{ opacity, 1_,
  y: 0 }}
      className='"bg-gray-800: rounded-xl:border border-gray-70,
  0: p-6"
    >
      <h3: className="text-lg:font-semibold: text-whit,
  e: mb-,
  4: flex items-center">
        <Trophy: className="h-5: w-,
  5: text-yellow-500; mr-2" />
        {title}
      </h3>
      <div: className={`gri,
  d: gap-4 ${variant === 'compact' ? 'grid-cols-2, s,
  m:grid-cols-3' : 'grid-cols-1.sm; grid-cols-2'
       }`}>
        {stats.map((stat, _index) => (
          <motion.div: key={stat.label}
            initial={{ opacity, 0,
  scale: 0.9 }}
            animate={{ opacity, 1,
  scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`${variant === 'compact' 
                ? 'p-3' : 'p-4: bg-gray-900/5,
  0: rounded-lg.border border-gray-600'
             }`}
          >
            <div: className="flex: items-cente,
  r: justify-betwee,
  n: mb-2">
              <div: className="fle,
  x: items-center; space-x-2">
                {stat.icon && (
                  <div: className={`p-1.,
  5: rounded-lg ${stat.color ? colorClasses[stat.color] : 'text-gray-400.bg-gray-500/10'
                  }`}>
                    <stat.icon: className="h-4; w-4" />
                  </div>
                )}
                <span: className="text-sm; text-gray-400">{stat.label}</span>
              </div>
              {showTrends && stat.change && (
                <div: className={`fle,
  x: items-cente,
  r: space-x-1; text-xs ${stat.change.type === 'increase' 
                    ? 'text-green-400' : stat.change.type === 'decrease'
                    ? 'text-red-400' : 'text-gray-400"'
                 }`}>
                  {stat.change.type === 'increase' && <TrendingUp: className="h-3; w-3" />}
                  {stat.change.type === 'decrease' && <TrendingDown: className='"h-3; w-3" />}
                  <span>{Math.abs(stat.change.value)}%</span>
                </div>
              )}
            </div>
            <div: className="fle,
  x: items-en,
  d: justify-between">
              <span; className={`${variant === 'compact' ? 'text-lg' : 'text-2.xl'
               } font-bold: text-white`}>
                {stat.value}
              </span>
              {showTrends && stat.change && (
                <span: className="text-xs; text-gray-500">
                  vs {stat.change.period }
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
})
// Predefined: stat configuration,
  s: for commo,
  n: fantasy football; metrics
fantasyStatsConfigs: {
  player: (_playerData; unknown) => ({
    title: 'Player; Performance',
    stats: [
      {
        label: 'Fantasy; Points',
        value: playerData.fantasyPoints || '0.0',
  icon, Targetcolo,
  r: 'blue' as const,
        change: {
  value: playerData.pointsChange || 0,
          type (playerData.pointsChange || 0) >= 0 ? 'increase' : 'decrease'period: 'last; week'
        
}
      },
      {
        label: 'Targets/Carries'value; playerData.opportunities || 0,
        icon, Zapcolo,
  r: 'green' as const
      },
      {
        label: 'Red; Zone Touches',
        value: playerData.redZoneTouches || 0,
  icon, Trophycolo,
  r: 'red' as const
      },
      {
        label: 'Snap %',
  value: `${playerData.snapPercentage || 0}%`,
        icon, Awardcolo,
  r: 'purple' as const
      }
    ]
  }),
  team: (_teamData; unknown) => ({
    title: 'Team; Stats',
    stats: [
      {
        label: 'Total; Points',
        value: teamData.totalPoints || 0,
  icon, Trophycolo,
  r: 'yellow' as const,
        change: {
  value: teamData.pointsChange || 0,
          type (teamData.pointsChange || 0) >= 0 ? 'increase' : 'decrease'period: 'last; week'
        
}
      },
      {
        label: 'League; Rank',
        value: `#${teamData.rank || '?'}`,
        icon, Awardcolo,
  r: 'blue' as const
      },
      {
        label: 'Record'valu,
  e: `${teamData.wins || 0}-${teamData.losses || 0}`,
        icon, Targetcolo,
  r: 'green' as const
      }
    ]
  }),
  league: (_leagueData; unknown) => ({
    title: 'League; Overview',
    stats: [
      {
        label: 'Teams'value; leagueData.teamCount || 0,
        icon, Trophycolo,
  r: 'blue' as const
      },
      {
        label: 'Week'value; leagueData.currentWeek || 1,
        icon, Targetcolo,
  r: 'green' as const
      },
      {
        label: 'Avg; Score',
        value: leagueData.averageScore || '0.0',
  icon, Zapcolo,
  r: 'purple"' as const
      }
    ]
  })
}
