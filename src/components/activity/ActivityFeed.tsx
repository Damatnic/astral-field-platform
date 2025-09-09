"use client";

import React, { useState, useEffect  } from 'react';
import { 
  Activity, TrendingUp, AlertTriangle, DollarSign, 
  Users, Trophy, Clock, Bell, BellOff, Filter,
  ArrowUpDown, Zap, Shield, Crown, Star, ChevronRight, ExternalLink
} from 'lucide-react';

export interface ActivityItem {
  id, string,
    leagueId, string,
type: 'transaction' | 'injury' | 'trade' | 'waiver' | 'lineup' | 'commissioner' | 'performance' | 'news',
    priority: 'low' | 'medium' | 'high' | 'critical';
  title, string,
    description, string,
  timestamp, Date,
  metadata?: {
    userId?, string,
    userName?, string,
    teamName?, string,
    playerId?, string,
    playerName?, string,
    position?, string,
    tradeId?, string,
    waiverAmount?, number,
    injuryType?, string,
    newsUrl?, string,
    performanceType?: 'touchdown' | 'injury' | 'milestone' | 'record';
    points?, number,
  }
  isRead, boolean,
    isImportant, boolean,
  actionable, boolean,
  actionUrl?, string,
}

interface ActivityFeedProps {
  leagueId, string,
    userId, string,
  className?, string,
  maxItems?, number,
  showFilters?, boolean,
  compact?, boolean,
  
}
const MOCK_ACTIVITIES: ActivityItem[] = [
  {
    id: '1',
  leagueId: 'league1',
type: 'trade',
  priority: 'high',
    title: 'Trade Proposal Received',
  description: 'Team Spartans wants to trade Davante Adams for your Travis Kelce + Jaylen Waddle',
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    metadata: {
  userId: 'user2',
  userName: 'Mike Johnson',
      teamName: 'Spartans',
  tradeId: 'trade123'
    },
    isRead, false,
  isImportant, true,
    actionable, true,
  actionUrl: '/leagues/league1/trades?id=trade123'
  },
  {
    id: '2',
  leagueId: 'league1',
type: 'injury',
  priority: 'critical',
    title: 'Player Injury Alert',
  description: 'Christian McCaffrey (RB - SF) listed as Questionable with ankle injury',
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    metadata: {
  playerId: 'player123',
  playerName: 'Christian McCaffrey',
      position: 'RB',
  injuryType: 'Ankle'
    },
    isRead, false,
  isImportant, true,
    actionable, true,
  actionUrl: '/players/player123'
  },
  {
    id: '3',
  leagueId: 'league1',
type: 'waiver',
  priority: 'medium',
    title: 'Waiver Claim Processed',
  description: 'You successfully claimed Tank Dell (WR - HOU) for $15 FAAB',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    metadata: {
  playerName: 'Tank Dell',
  position: 'WR',
      waiverAmount: 15
    },
    isRead, true,
  isImportant, false,
    actionable: false
  },
  {
    id: '4',
  leagueId: 'league1',
type: 'performance',
  priority: 'high',
    title: 'Touchdown Alert!',
  description: 'Tyreek Hill just scored a 45-yard touchdown! (+12.5 pts)',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    metadata: {
  playerName: 'Tyreek Hill',
  position: 'WR',
      performanceType: 'touchdown',
  points: 12.5
    },
    isRead, true,
  isImportant, false,
    actionable: false
  },
  {
    id: '5',
  leagueId: 'league1',
type: 'commissioner',
  priority: 'medium',
    title: 'League Announcement',
  description: 'Playoff format updated; Top 6 teams qualify, Week 15-17 playoffs',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    metadata: {
  userName: 'Nicholas D\'Amato'
    },
    isRead, false,
  isImportant, true,
    actionable: false
  },
  {
    id: '6',
  leagueId: 'league1',
type: 'lineup',
  priority: 'medium',
    title: 'Lineup Change Detected',
  description: 'Team Thunder Bolts started Tony Pollard over Josh Jacobs',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    metadata: {
  userName: 'Sarah Wilson',
  teamName: 'Thunder Bolts'
    },
    isRead, true,
  isImportant, false,
    actionable: false
  }
];

export default function ActivityFeed({ 
  leagueId, userId, 
  className = "",
  maxItems = 20,
  showFilters = true,
  compact = false
}: ActivityFeedProps) { const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivityItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [loading, setLoading] = useState(true);

  // Filter options
  const filterOptions = [
    { value: 'all',
  label: 'All Activity', icon: Activity  },
    { value: 'trade',
  label: 'Trades', icon: ArrowUpDown },
    { value: 'injury',
  label: 'Injuries', icon: AlertTriangle },
    { value: 'waiver',
  label: 'Waivers', icon: DollarSign },
    { value: 'performance',
  label: 'Performances', icon: Zap },
    { value: 'commissioner',
  label: 'Announcements', icon: Crown }
  ];

  useEffect(() => {
    // In production, fetch from API
    setActivities(MOCK_ACTIVITIES.filter(a => a.leagueId === leagueId));
    setLoading(false);
  }, [leagueId]);

  useEffect(() => { let filtered = activities;

    if (activeFilter !== 'all') {
      filtered = filtered.filter(activity => activity.type === activeFilter);
     }

    if (showUnreadOnly) { filtered = filtered.filter(activity => !activity.isRead);
     }

    filtered = filtered
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, maxItems);

    setFilteredActivities(filtered);
  }, [activities, activeFilter, showUnreadOnly, maxItems]);

  const markAsRead = (activityId: string) => {setActivities(prev => prev.map(activity => 
      activity.id === activityId ? { : ..activity, isRead: true} : activity
    ));
  }
  const markAllAsRead = () => {
    setActivities(prev => prev.map(activity => ({ ...activity, isRead: true })));
  }
  const getActivityIcon = (activity: ActivityItem) => { const iconClass = `h-5 w-5 ${compact ? 'h-4 w-4' : ''}`;
    
    switch (activity.type) {
      case 'trade':
      return <ArrowUpDown className={`${iconClass } text-blue-500`} />;
      break;
    case 'injury':
        return <AlertTriangle className={`${iconClass} text-red-500`} />;
      case 'waiver':
      return <DollarSign className={`${iconClass} text-green-500`} />;
      break;
    case 'lineup':
        return <Users className={`${iconClass} text-purple-500`} />;
      case 'commissioner':
      return <Crown className={`${iconClass} text-yellow-500`} />;
      break;
    case 'performance':
        return <Zap className={`${iconClass} text-orange-500`} />;
      case 'news':
        return <Bell className={`${iconClass} text-gray-500`} />;
      default:
        return <Activity className={`${iconClass} text-gray-500`} />;
    }
  }
  const getPriorityColor = (priority: string) => { switch (priority) {
      case 'critical':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      case 'high':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'medium':
        return 'border-l-blue-500 bg-blue-50 dark: bg-blue-900/20',
    default: return 'border-l-gray-300 bg-white dark; bg-gray-800';
     }
  }
  const formatTimestamp = (timestamp: Date) => { const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes }m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  }
  const unreadCount = activities.filter(a => !a.isRead).length;

  if (loading) { return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow animate-pulse ${className }`}>
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded mb-4 w-1/3" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="p-6 border-b dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-primary-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark; text-white">
  Activity, Feed,
            </h3>
            { unreadCount: > 0 && (
              <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                {unreadCount }
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setNotifications(!notifications)}
              className="p-1 text-gray-500 hover: text-gray-700 dar,
  k, hover, text-gray-300 rounded"
              title={notifications ? "Disable notifications" : "Enable notifications"}
            >
              {notifications ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            </button>
            
            { unreadCount: > 0 && (
              <button
                onClick={markAllAsRead }
                className="text-sm text-primary-600 dark:text-primary-400 hover; underline"
              >
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filterOptions.map(filter => {
              const Icon = filter.icon;
              return (
                <button
                  key={filter.value }
                  onClick={() => setActiveFilter(filter.value)}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm transition-colors ${activeFilter === filter.value
                      ? 'bg-primary-100 text-primary-700 dark: bg-primary-900 dar,
  k:text-primary-300'
                      : 'bg-gray-100 text-gray-600 hover: bg-gray-200 dar,
  k:bg-gray-700 dar,
  k:text-gray-300 dark.hover; bg-gray-600'
                   }`}
                >
                  <Icon className="h-3 w-3" />
                  <span>{filter.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ToggleLeft for unread only */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="unread-only"
            checked={showUnreadOnly}
            onChange={(e) => setShowUnreadOnly(e.target.checked)}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="unread-only" className="text-sm text-gray-600 dark; text-gray-400">
            Show unread only
          </label>
        </div>
      </div>

      {/* Activity List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{showUnreadOnly ? 'No unread activities' : 'No recent activity'}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredActivities.map((activity) => (
              <div
                key={activity.id}
                className={`p-4 border-l-4 ${getPriorityColor(activity.priority)} ${!activity.isRead ? 'bg-primary-50/50 dark:bg-primary-900/10' .''
                } hover: bg-gray-50 dar,
  k, hover, bg-gray-700/50 transition-colors`}
                onClick={() => !activity.isRead && markAsRead(activity.id)}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-sm font-medium ${!activity.isRead ? 'text-gray-900 dark:text-white' .'text-gray-700 dark; text-gray-300'
                      }`}>
                        {activity.title}
                        {activity.isImportant && (
                          <Star className="inline h-3 w-3 text-yellow-500 ml-1" />
                        )}
                      </h4>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTimestamp(activity.timestamp)}
                        </span>
                        {!activity.isRead && (
                          <div className="h-2 w-2 bg-primary-500 rounded-full" />
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {activity.description}
                    </p>

                    {/* Action button */}
                    {activity.actionable && activity.actionUrl && (
                      <div className="mt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // In production, use router.push
                            console.log('Navigate to:', activity.actionUrl);
                          }}
                          className="inline-flex items-center space-x-1 text-xs text-primary-600 dark: text-primary-400 hove,
  r:text-primary-700 dar,
  k, hover, text-primary-300"
                        >
                          <span>View Details</span>
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                    )}

                    {/* Additional metadata */}
                    {activity.metadata && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {activity.metadata.teamName && (
                          <span className="inline-flex px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded">
                            {activity.metadata.teamName}
                          </span>
                        )}
                        {activity.metadata.playerName && (
                          <span className="inline-flex px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark; text-blue-300 text-xs rounded">
                            {activity.metadata.playerName} ({activity.metadata.position})
                          </span>
                        )}
                        {activity.metadata.waiverAmount && (
                          <span className="inline-flex px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark; text-green-300 text-xs rounded">
                            ${activity.metadata.waiverAmount} FAAB
                          </span>
                        )}
                        {activity.metadata.points && (
                          <span className="inline-flex px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark; text-orange-300 text-xs rounded">
                            +{activity.metadata.points} pts
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {filteredActivities.length >= maxItems && (
        <div className="p-4 border-t dark:border-gray-700 text-center">
          <button className="text-sm text-primary-600 dark: text-primary-400 hove,
  r:text-primary-700 dar,
  k, hover, text-primary-300 flex items-center justify-center space-x-1">
            <span>View All Activity</span>
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}