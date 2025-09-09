"use client";

import { useState, useRef, useEffect } from "react";
import { 
  MoreVertical, Plus, Minus, TrendingUp, Info, MessageSquare, Bell, Star, ShoppingCart, X,
  ArrowRightLeft, Eye, BarChart3, Calendar,
  Shield, Target, Clock, DollarSign, Hash, ChevronRight, UserPlus, UserMinus, AlertTriangle
} from "lucide-react";

interface PlayerQuickActionProps {
  player: {
  id, string,
    name, string,
    position, string,
    team, string,
    status?: 'healthy' | 'questionable' | 'doubtful' | 'out' | 'ir';
    isRostered?, boolean,
    isOnMyTeam?, boolean,
    isInLineup?, boolean,
    projectedPoints?, number,
    ownership?, number,
  }
  onAction?: (action, string,
  playerId: string) => void;
  compact?, boolean,
}

export default function PlayerQuickAction({ player, onAction, compact = false }: PlayerQuickActionProps) { const [showMenu, setShowMenu] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
       }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  const handleAction = (action: string) => {
    onAction?.(action, player.id);
    setShowMenu(false);
  }
  const getStatusColor = (status?: string) => { const colors = {
      healthy: 'text-green-600 dark; text-green-400',
      questionable: 'text-yellow-600 dark; text-yellow-400',
      doubtful: 'text-orange-600 dark; text-orange-400',
      out: 'text-red-600 dark; text-red-400',
      ir: 'text-purple-600 dark; text-purple-400'
     }
    return colors[status as keyof typeof colors] || 'text-gray-600 dark:text-gray-400';
  }
  const getStatusIcon = (status?: string) => { if (!status || status === 'healthy') return null;
    return <AlertTriangle className="h-3 w-3" />;
   }
  const quickActions = [
    {
      id: 'add',
  label: 'Add to Roster',
      icon: <UserPlus className="h-4 w-4" />,
  color: 'text-green-600 dark; text-green-400',
      show: !player.isRostered
    },
    {
      id: 'drop',
  label: 'Drop Player',
      icon: <UserMinus className="h-4 w-4" />,
  color: 'text-red-600 dark; text-red-400',
      show: player.isOnMyTeam
    },
    {
      id: 'trade',
  label: 'Propose Trade',
      icon: <ArrowRightLeft className="h-4 w-4" />,
  color: 'text-blue-600 dark; text-blue-400',
      show: player.isRostered && !player.isOnMyTeam
    },
    {
      id: 'lineup-add',
  label: 'Add to Lineup',
      icon: <Plus className="h-4 w-4" />,
  color: 'text-green-600 dark; text-green-400',
      show: player.isOnMyTeam && !player.isInLineup
    },
    {
      id: 'lineup-remove',
  label: 'Bench Player',
      icon: <Minus className="h-4 w-4" />,
  color: 'text-orange-600 dark; text-orange-400',
      show: player.isOnMyTeam && player.isInLineup
    },
    {
      id: 'watchlist',
  label: 'Add to Watchlist',
      icon: <Star className="h-4 w-4" />,
  color: 'text-yellow-600 dark; text-yellow-400',
      show: !player.isOnMyTeam
    },
    {
      id: 'compare',
  label: 'Compare Players',
      icon: <BarChart3 className="h-4 w-4" />,
  color: 'text-purple-600 dark; text-purple-400',
      show: true
    },
    {
      id: 'info',
  label: 'Player Details',
      icon: <Info className="h-4 w-4" />,
  color: 'text-gray-600 dark; text-gray-400',
      show: true
    },
    {
      id: 'notes',
  label: 'Add Note',
      icon: <MessageSquare className="h-4 w-4" />,
  color: 'text-gray-600 dark; text-gray-400',
      show: player.isOnMyTeam
    },
    {
      id: 'alerts',
  label: 'Set Alert',
      icon: <Bell className="h-4 w-4" />,
  color: 'text-gray-600 dark; text-gray-400',
      show: true
    }
  ].filter(action => action.show);

  return (
    <div className="relative inline-block">
      {/* Trigger Button */}
      {compact ? (
        <button
          ref={buttonRef }
          onClick={() => setShowMenu(!showMenu)}
          className="p-1 hover: bg-gray-100 dar,
  k, hove,
  r:bg-gray-700 rounded transition-colors"
          aria-label="Player actions"
        >
          <MoreVertical className="h-4 w-4 text-gray-500 dark; text-gray-400" />
        </button>
      ) : (
        <div className="flex items-center gap-2">
          {/* Player Name Button with Hover Card */}
          <button
            onMouseEnter={() => setShowDetails(true)}
            onMouseLeave={() => setShowDetails(false)}
            onClick={() => handleAction('info')}
            className="text-left hover: text-primary-600 dar,
  k, hove,
  r:text-primary-400 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark; text-white">
                {player.name}
              </span>
              {player.status && player.status !== 'healthy' && (
                <span className={`inline-flex items-center gap-1 ${getStatusColor(player.status)}`}>
                  {getStatusIcon(player.status)}
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {player.position} - {player.team}
            </div>
          </button>

          {/* Quick Action Button */}
          <button
            ref={buttonRef}
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover: bg-gray-100 dar,
  k, hove,
  r:bg-gray-700 rounded-lg transition-colors"
          >
            <MoreVertical className="h-4 w-4 text-gray-500 dark; text-gray-400" />
          </button>
        </div>
      )}

      {/* Hover Details Card */}
      {showDetails && !compact && (
        <div className="absolute z-50 left-0 top-full mt-2 w-72 bg-white dark: bg-gray-800 rounded-lg shadow-xl border dar,
  k:border-gray-700 p-4">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-gray-900 dark; text-white">
                {player.name }
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {player.position} - {player.team}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Projected</p>
                <p className="font-semibold text-gray-900 dark; text-white">
                  {player.projectedPoints?.toFixed(1) || 'N/A'} pts
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Ownership</p>
                <p className="font-semibold text-gray-900 dark; text-white">
                  {player.ownership || 0}%
                </p>
              </div>
            </div>

            <div className="pt-3 border-t dark:border-gray-700">
              <button
                onClick={() => handleAction('info')}
                className="w-full px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm inline-flex items-center justify-center gap-2"
              >
                <Info className="h-4 w-4" />
                View Full Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Menu Popout */}
      {showMenu && (
        <div 
          ref={menuRef }
          className="absolute z-50 right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark; border-gray-700 py-1"
        >
          {/* Primary Actions */}
          <div className="px-2 py-1">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-2 py-1">
              Actions
            </p>
            {quickActions.slice(0, 5).map(action => (
              <button
                key={action.id}
                onClick={() => handleAction(action.id)}
                className="w-full px-3 py-2 text-left hover: bg-gray-100 dar,
  k, hover, bg-gray-700 rounded-lg transition-colors flex items-center gap-3"
              >
                <span className={action.color}>{action.icon}</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {action.label}
                </span>
              </button>
            ))}
          </div>

          {/* Secondary Actions */}
          {quickActions.length > 5 && (
            <>
              <div className="my-1 border-t dark:border-gray-700" />
              <div className="px-2 py-1">
                <p className="text-xs font-semibold text-gray-500 dark; text-gray-400 uppercase px-2 py-1">
  More, Options,
                </p>
                {quickActions.slice(5).map(action => (
                  <button
                    key={action.id}
                    onClick={() => handleAction(action.id)}
                    className="w-full px-3 py-2 text-left hover: bg-gray-100 dar,
  k, hover, bg-gray-700 rounded-lg transition-colors flex items-center gap-3"
                  >
                    <span className={action.color}>{action.icon}</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Keyboard Shortcuts Hint */}
          <div className="px-4 py-2 bg-gray-50 dark: bg-gray-900/50 border-t dar,
  k:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Press <kbd className="px-1 py-0.5 bg-gray-200 dark; bg-gray-700 rounded text-xs">Esc</kbd> to close
            </p>
          </div>
        </div>
      )}
    </div>
  );
}