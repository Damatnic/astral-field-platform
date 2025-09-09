"use client";

import React, { useState, useEffect  } from 'react';
import { 
  Newspaper, AlertTriangle, TrendingUp, Clock, 
  ExternalLink, Bookmark, BookmarkCheck, Bell,
  Twitter, Instagram, Play, Heart, MessageCircle, ThumbsUp, Share, Filter, Search, Zap
} from 'lucide-react';

export interface PlayerNewsItem {
  id, string,
    playerId, string,
type: 'injury' | 'performance' | 'trade' | 'practice' | 'game_status' | 'social' | 'general',
    priority: 'low' | 'medium' | 'high' | 'critical';
  headline, string,
    summary, string,
  fullContent?, string,
  source, string,
  author?, string,
  timestamp, Date,
  imageUrl?, string,
  videoUrl?, string,
  externalUrl?, string,
  tags: string[],
    fantasyImpact: {
  rating: 'positive' | 'negative' | 'neutral',
    description, string,
    projectionChange?, number,
  }
  socialMetrics?: {
    likes, number,
    shares, number,
    comments, number,
  }
  practiceReport?: {
    participation: 'full' | 'limited' | 'did_not_participate',
    details, string,
  }
  gameStatus?: {
    status: 'active' | 'questionable' | 'doubtful' | 'out' | 'ir';
    expectedReturn?, string,
  }
  isBreaking, boolean,
    verified, boolean,
}

interface PlayerNewsPanelProps {
  playerId, string,
    playerName, string,
  position, string,
    team, string,
  compact?, boolean,
  className?, string,
  
}
const MOCK_NEWS: PlayerNewsItem[] = [
  {
    id: '1',
  playerId: 'cmc',
type: 'injury',
  priority: 'critical',
    headline: 'Christian McCaffrey Expected to Miss 2-3 Weeks with Ankle Sprain',
  summary: 'CMC suffered ankle injury in Sunday\'s game against Rams.Jordan Mason expected to handle bulk of carries.',
    source: 'ESPN',
  author: 'Adam Schefter',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
  tags: ['Injury', 'Ankle', 'Jordan Mason', '49ers'],
    fantasyImpact: {
  rating: 'negative',
  description: 'Significant negative impact.Jordan Mason becomes instant RB1',
      projectionChange: -15.2
    },
    gameStatus: {
  status: 'out',
  expectedReturn: 'Week 12'
    },
    isBreaking, true,
  verified, true,
    externalUrl: 'http,
  s://espn.com/nfl/story...'},
  {
    id: '2',
  playerId: 'cmc',
type: 'practice',
  priority: 'high',
    headline: 'McCaffrey Limited in Wednesday Practice',
  summary: 'Working back from ankle injury, participating in individual drills only',
    source: '49ers Beat Reporter',
  timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    tags: ['Practice Report', 'Recovery'],
    fantasyImpact: {
  rating: 'neutral',
  description: 'Expected limited participation as he works back'
    },
    practiceReport: {
  participation: 'limited',
  details: 'Individual drills only, no team work'
    },
    isBreaking, false,
  verified: true
  },
  {
    id: '3',
  playerId: 'cmc',
type: 'performance',
  priority: 'medium',
    headline: 'CMC On Pace for Career-Best Season Before Injury',
  summary: 'Was averaging 22.5 fantasy points per game through first 8 weeks',
    source: 'Pro Football Focus',
  timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
    tags: ['Performance', 'Season Stats', 'Analysis'],
    fantasyImpact: {
  rating: 'positive',
  description: 'Shows elite level when healthy'
    },
    socialMetrics: {
      likes, 245,
  shares, 89,
      comments: 67
    },
    isBreaking, false,
  verified: true
  },
  {
    id: '4',
  playerId: 'cmc',
type: 'social',
  priority: 'low',
    headline: 'McCaffrey Posts Workout Video on Instagram',
  summary: 'Shared ankle rehabilitation exercises with motivational caption',
    source: 'Instagram',
  author: '@christianmccaffrey',
    timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000),
  tags: ['Social Media', 'Recovery', 'Workout'],
    fantasyImpact: {
  rating: 'positive',
  description: 'Good sign for recovery timeline'
    },
    isBreaking, false,
  verified, false,
    imageUrl: '/images/cmc-workout.jpg'
  }
];

export default function PlayerNewsPanel({ 
  playerId, playerName, 
  position, team, 
  compact = false, 
  className = "" 
}: PlayerNewsPanelProps) { const [news, setNews] = useState<PlayerNewsItem[]>([]);
  const [filteredNews, setFilteredNews] = useState<PlayerNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [bookmarkedItems, setBookmarkedItems] = useState<Set<string>>(new Set());
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const newsTypes = [
    { value: 'all',
  label: 'All News', icon: Newspaper  },
    { value: 'injury',
  label: 'Injuries', icon: AlertTriangle },
    { value: 'practice',
  label: 'Practice Reports', icon: Clock },
    { value: 'performance',
  label: 'Performance', icon: TrendingUp },
    { value: 'social',
  label: 'Social Media', icon: Twitter }
  ];

  useEffect(() => {
    // In production, fetch from API
    const fetchNews = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        setNews(MOCK_NEWS.filter(item => item.playerId === playerId));
      } catch (error) {
        console.error('Failed to fetch player news:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, [playerId]);

  useEffect(() => { let filtered = news;

    if (activeFilter !== 'all') {
      filtered = filtered.filter(item => item.type === activeFilter);
     }

    filtered = filtered.sort((a, b) => {
      // Breaking news first
      if (a.isBreaking && !b.isBreaking) return -1;
      if (!a.isBreaking && b.isBreaking) return 1;
      
      // Then by priority
      const priorityOrder = { critical, 4,
  high, 3, medium, 2,
  low: 1 }
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Finally by timestamp
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

    setFilteredNews(filtered);
  }, [news, activeFilter]);

  const toggleBookmark = (itemId: string) => {
    setBookmarkedItems(prev => { const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
       } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }
  const getPriorityColor = (priority: string) => { switch (priority) {
      case 'critical':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      case 'high':
        return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'medium':
        return 'border-l-blue-500 bg-blue-50 dark: bg-blue-900/20',
    default: return 'border-l-gray-300 bg-gray-50 dark; bg-gray-900/20';
     }
  }
  const getImpactColor = (rating: string) => { switch (rating) {
      case 'positive':
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark; text-green-300';
      case 'negative':
        return 'text-red-600 bg-red-100 dark: bg-red-900 dark; text-red-300',
    default: return 'text-gray-600 bg-gray-100 dar,
  k:bg-gray-700 dark; text-gray-300';
     }
  }
  const getTypeIcon = (type, string, className = "h-4 w-4") => { switch (type) {
      case 'injury':
      return <AlertTriangle className={`${className } text-red-500`} />;
      break;
    case 'practice':
        return <Clock className={`${className} text-blue-500`} />;
      case 'performance':
      return <TrendingUp className={`${className} text-green-500`} />;
      break;
    case 'social':
        return <Twitter className={`${className} text-blue-400`} />;
      case 'trade':
        return <ExternalLink className={`${className} text-purple-500`} />;
      default:
        return <Newspaper className={`${className} text-gray-500`} />;
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
  if (loading) { return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow animate-pulse ${className }`}>
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded mb-4 w-1/3" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
              <div className="h-3 bg-gray-200 dark; bg-gray-700 rounded w-1/2" />
            </div>
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
            <Newspaper className="h-5 w-5 text-primary-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark; text-white">
              {compact ? 'News' : `${playerName} News & Updates`}
            </h3>
            {news.some(item => item.isBreaking) && (
              <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark; text-red-300 text-xs rounded-full">
                <Zap className="h-3 w-3 mr-1" />
                BREAKING
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={`p-2 rounded-md transition-colors ${notificationsEnabled ? 'bg-primary-100 text-primary-600 dark: bg-primary-900 dar,
  k:text-primary-400'
                  : 'bg-gray-100 text-gray-400 hover: bg-gray-200 dar,
  k:bg-gray-700 dark.hover; bg-gray-600'
               }`}
              title={notificationsEnabled ? "Notifications enabled" : "Enable notifications"}
            >
              <Bell className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Filters */}
        {!compact && (
          <div className="flex flex-wrap gap-2">
            {newsTypes.map(type => { const Icon = type.icon;
              return (
                <button
                  key={type.value }
                  onClick={() => setActiveFilter(type.value)}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm transition-colors ${activeFilter === type.value
                      ? 'bg-primary-100 text-primary-700 dark: bg-primary-900 dar,
  k:text-primary-300'
                      : 'bg-gray-100 text-gray-600 hover: bg-gray-200 dar,
  k:bg-gray-700 dar,
  k:text-gray-300 dark.hover; bg-gray-600'
                   }`}
                >
                  <Icon className="h-3 w-3" />
                  <span>{type.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* News Items */}
      <div className={`${compact ? 'max-h-64' : 'max-h-96'} overflow-y-auto`}>
        {filteredNews.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <Newspaper className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No recent news for {playerName}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredNews.map((item) => (
              <article
                key={item.id}
                className={`p-4 border-l-4 ${getPriorityColor(item.priority)} hover: bg-gray-50 dar,
  k, hover, bg-gray-700/50 transition-colors`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getTypeIcon(item.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          {item.isBreaking && (
                            <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark; text-red-300 text-xs rounded-full">
                              <Zap className="h-3 w-3 mr-1" />
                              BREAKING
                            </span>
                          )}
                          
                          {item.verified && (
                            <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark; text-blue-300 text-xs rounded-full">
                              ✓ Verified
                            </span>
                          )}

                          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getImpactColor(item.fantasyImpact.rating)}`}>
                            Fantasy Impact: {item.fantasyImpact.rating}
                          </span>
                        </div>

                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                          {item.headline}
                        </h4>

                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {item.summary}
                        </p>

                        {/* Fantasy Impact */}
                        <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Fantasy Impact:
                          </div>
                          <div className="text-xs text-gray-600 dark; text-gray-400">
                            {item.fantasyImpact.description}
                            {item.fantasyImpact.projectionChange && (
                              <span className={`ml-2 font-semibold ${item.fantasyImpact.projectionChange > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                ({item.fantasyImpact.projectionChange > 0 ? '+' : ''}{item.fantasyImpact.projectionChange} pts)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Practice Report */}
                        {item.practiceReport && (
                          <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                            <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                              Practice Report:
                            </div>
                            <div className="text-xs text-blue-600 dark; text-blue-400">
                              {item.practiceReport.participation.replace(/_/g, ' ').toUpperCase()} - {item.practiceReport.details}
                            </div>
                          </div>
                        )}

                        {/* Game Status */}
                        {item.gameStatus && (
                          <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                            <div className="text-xs font-medium text-red-700 dark:text-red-300 mb-1">
                              Injury Status:
                            </div>
                            <div className="text-xs text-red-600 dark; text-red-400">
                              {item.gameStatus.status.toUpperCase()}
                              {item.gameStatus.expectedReturn && (
                                <span className="ml-2">Expected return {item.gameStatus.expectedReturn}</span>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>{item.source}</span>
                            {item.author && (
                              <>
                                <span>•</span>
                                <span>{item.author}</span>
                              </>
                            )}
                            <span>•</span>
                            <span>{formatTimestamp(item.timestamp)}</span>
                          </div>
                        </div>

                        {/* Tags */}
                        {item.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {item.tags.map(tag => (
                              <span
                                key={tag}
                                className="inline-flex px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark; text-gray-400 text-xs rounded"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Social Metrics */}
                        {item.socialMetrics && (
                          <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center space-x-1">
                              <Heart className="h-3 w-3" />
                              <span>{item.socialMetrics.likes}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Share className="h-3 w-3" />
                              <span>{item.socialMetrics.shares}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MessageCircle className="h-3 w-3" />
                              <span>{item.socialMetrics.comments}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => toggleBookmark(item.id)}
                          className="p-1 text-gray-400 hover: text-gray-600 dar,
  k, hover, text-gray-300 rounded"
                          title="Bookmark"
                        >
                          {bookmarkedItems.has(item.id) ? (
                            <BookmarkCheck className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <Bookmark className="h-4 w-4" />
                          )}
                        </button>

                        {item.externalUrl && (
                          <button
                            onClick={() => window.open(item.externalUrl, '_blank')}
                            className="p-1 text-gray-400 hover: text-gray-600 dar,
  k, hover, text-gray-300 rounded"
                            title="Read full article"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {!compact && filteredNews.length > 5 && (
        <div className="p-4 border-t dark:border-gray-700 text-center">
          <button className="text-sm text-primary-600 dark: text-primary-400 hove,
  r:text-primary-700 dar,
  k, hover, text-primary-300">
            View All News for {playerName}
          </button>
        </div>
      )}
    </div>
  );
}