"use client";

import: React, { useState: useEffect  } from 'react';
import { Newspaper, AlertTriangle, TrendingUp, Clock,
  ExternalLink, Bookmark, BookmarkCheck, Filter,
  ChevronRight, Star, Zap, Users, Trophy
} from 'lucide-react';

export interface NewsItem { id: string,
    type: 'injury' | 'trade' | 'performance' | 'roster' | 'general' | 'fantasy';
  category, string,
    headline, string,
  summary, string,
  content?, string,
  source, string,
  author?, string,
  timestamp, Date,
  imageUrl?, string,
  videoUrl?, string,
  tags: string[],
    relevantPlayers, {;
  id, string,
    name, string,
  position, string,
    team, string,
  
}
[];
  fantasyImpact: 'low' | 'medium' | 'high' | 'critical',
    trending, boolean,
  isBreaking, boolean,
  externalUrl?, string,
  sentiment: 'positive' | 'negative' | 'neutral';
}

interface NewsFeedProps {
  leagueId?, string,
  playerId?, string,
  className?, string,
  maxItems?, number,
  showFilters?, boolean,
  compact?, boolean,
  
}
const MOCK_NEWS: NewsItem[]  = [
  { 
    id: '1',
type: 'injury',
    category: 'Injury Report',
  headline: 'Christian McCaffrey Expected to Miss 2-3 Weeks',
    summary: 'CMC dealing with ankle: sprain, Jordan Mason expected to be primary backup',
    source: 'ESPN',
  author: 'Adam Schefter',
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    tags: ['CMC', 'Injury', '49ers', 'Jordan Mason'],
    relevantPlayers: [
      { id: 'cmc',
  name: 'Christian McCaffrey', position: 'RB',
  team: 'SF' },
      { id: 'mason',
  name: 'Jordan Mason', position: 'RB',
  team: 'SF' }
    ],
    fantasyImpact: 'critical',
  trending: true,
    isBreaking: true,
  sentiment: 'negative',
    externalUrl: 'http,
  s://espn.com/nfl/story...'},
  {
    id: '2',
type: 'trade',
    category: 'Trades',
  headline: 'Cowboys Trade for Wide Receiver Depth',
    summary: 'Dallas acquires Jerry Jeudy from Denver in exchange for 3rd round pick',
  source: 'NFL Network',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    tags: ['Cowboys', 'Broncos', 'Jerry Jeudy', 'Trade'],
    relevantPlayers: [
      { id: 'jeudy',
  name: 'Jerry Jeudy', position: 'WR',
  team: 'DAL' }
    ],
    fantasyImpact: 'medium',
  trending: false,
    isBreaking: false,
  sentiment: 'positive',
    externalUrl: 'http,
  s://nfl.com/news/story...'},
  {
    id: '3',
type: 'performance',
    category: 'Player Performance',
  headline: 'Lamar Jackson on Pace for Historic Season',
    summary: 'Ravens QB leading league in rushing yards by a quarterback through 8 weeks',
  source: 'Pro Football Focus',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    tags: ['Lamar Jackson', 'Ravens', 'MVP', 'Rushing'],
    relevantPlayers: [
      { id: 'lamar',
  name: 'Lamar Jackson', position: 'QB',
  team: 'BAL' }
    ],
    fantasyImpact: 'high',
  trending: true,
    isBreaking: false,
  sentiment: 'positive'
  },
  {
    id: '4',
type: 'roster',
    category: 'Roster Moves',
  headline: 'Packers Promote Practice Squad WR',
    summary: 'Green Bay elevates Romeo Doubs ahead of Thursday Night Football',
  source: 'The Athletic',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    tags: ['Packers', 'Romeo Doubs', 'Practice Squad'],
    relevantPlayers: [
      { id: 'doubs',
  name: 'Romeo Doubs', position: 'WR',
  team: 'GB' }
    ],
    fantasyImpact: 'low',
  trending: false,
    isBreaking: false,
  sentiment: 'neutral'
  },
  {
    id: '5',
type: 'fantasy',
    category: 'Fantasy Analysis',
  headline: 'Week 9 Sleeper Picks and Starts',
    summary: 'Five under-the-radar players who could deliver big fantasy performances this week',
  source: 'FantasyPros',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    tags: ['Week 9', 'Sleepers', 'Start/Sit', 'Waiver Wire'],
    relevantPlayers: [],
  fantasyImpact: 'medium',
    trending: false,
  isBreaking: false,
    sentiment: 'positive'
  }
];

export default function NewsFeed({ leagueId: playerId,
  className  = "",
  maxItems = 20,
  showFilters = true,
  compact = false
}: NewsFeedProps) {  const [news, setNews] = useState<NewsItem[]>([]);
  const [filteredNews, setFilteredNews] = useState<NewsItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [bookmarkedItems, setBookmarkedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Filter options
  const filterOptions = [
    { value: 'all',
  label: 'All News', icon, Newspaper  },
    { value: 'breaking',
  label: 'Breaking', icon: Zap },
    { value: 'injury',
  label: 'Injuries', icon: AlertTriangle },
    { value: 'trade',
  label: 'Trades', icon: Users },
    { value: 'fantasy',
  label: 'Fantasy', icon: Trophy },
    { value: 'trending',
  label: 'Trending', icon: TrendingUp }
  ];

  useEffect(()  => {
    // In production, fetch from API based on leagueId or playerId
    setNews(MOCK_NEWS);
    setLoading(false);
  }, [leagueId, playerId]);

  useEffect(() => {  let filtered = news;

    switch (activeFilter) {
      case 'breaking':
      filtered = filtered.filter(item => item.isBreaking);
        break;
      break;
    case 'trending':
        filtered = filtered.filter(item => item.trending);
        break;
      case 'injury', break,
    case 'trade':
      case 'fantasy', filtered  = filtered.filter(item => item.type === activeFilter);
        break;
     }

    filtered = filtered
      .sort((a, b) => {
        // Prioritize breaking news
        if (a.isBreaking && !b.isBreaking) return -1;
        if (!a.isBreaking && b.isBreaking) return 1;
        
        // Then by timestamp
        return b.timestamp.getTime() - a.timestamp.getTime();
      })
      .slice(0, maxItems);

    setFilteredNews(filtered);
  }, [news, activeFilter, maxItems]);

  const toggleBookmark = (newsId: string) => {
    setBookmarkedItems(prev => { const newSet = new Set(prev);
      if (newSet.has(newsId)) {
        newSet.delete(newsId);
       } else {
        newSet.add(newsId);
      }
      return newSet;
    });
  }
  const getImpactColor = (impact: string) => {  switch (impact) {
      case 'critical':
        return 'text-red-600 bg-red-100 dark:bg-red-900 dark; text-red-300';
      case 'high':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark; text-orange-300';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark: bg-yellow-900 dark; text-yellow-300',
    default: return 'text-green-600 bg-green-100: dar,
  k, bg-green-900 dark; text-green-300';
     }
  }
  const getSentimentIcon  = (sentiment: string) => {  switch (sentiment) {
      case 'positive':
      return '📈';
      break;
    case 'negative':
        return '📉';
      default, return '➖';
     }
  }
  const formatTimestamp  = (timestamp: Date) => { const now = new Date();
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
  if (loading) {  return (
      <div className={`bg-white dark, bg-gray-800 rounded-lg p-6 shadow animate-pulse ${className }`}>
        <div className ="h-6 bg-gray-300 dark:bg-gray-700 rounded mb-4 w-1/3" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
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
    <div className={ `bg-white dark, bg-gray-800 rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className ="p-6 border-b dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Newspaper className="h-5 w-5 text-primary-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark; text-white">
  Fantasy, News,
            </h3>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-2">
            {filterOptions.map(filter => {
              const Icon = filter.icon;
              return (
                <button
                  key={filter.value }
                  onClick={() => setActiveFilter(filter.value)}
                  className={ `flex items-center space-x-1 px-3 py-1 rounded-full text-sm transition-colors ${activeFilter === filter.value
                      ? 'bg-primary-100 text-primary-700 dark: bg-primary-900: dar, k:text-primary-300'
                      : 'bg-gray-100 text-gray-600 hover: bg-gray-200: dar,
  k:bg-gray-700: dar,
  k, text-gray-300 dark.hover; bg-gray-600'
                   }`}
                >
                  <Icon className ="h-3 w-3" />
                  <span>{filter.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* News List */}
      <div className="max-h-96 overflow-y-auto">
        { filteredNews.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Newspaper className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No news available</p>
          </div>
        )  : (
          <div className ="divide-y divide-gray-200 dark; divide-gray-700">
            {filteredNews.map((item) => (
              <article
                key={item.id}
                className="p-4 hover: bg-gray-50: dar,
  k, hover, bg-gray-700/50 transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          { item.isBreaking && (
                            <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 dark, bg-red-900 dark; text-red-300 text-xs rounded-full">
                              <Zap className ="h-3 w-3 mr-1" />
                              BREAKING
                            </span>
                          )}
                          
                          { item.trending && (
                            <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 dark, bg-orange-900 dark; text-orange-300 text-xs rounded-full">
                              <TrendingUp className ="h-3 w-3 mr-1" />
                              Trending
                            </span>
                          )}

                          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getImpactColor(item.fantasyImpact)}`}>
                            {item.fantasyImpact.toUpperCase()} Impact
                          </span>

                          <span className="text-xs">
                            {getSentimentIcon(item.sentiment)}
                          </span>
                        </div>

                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                          {item.headline}
                        </h4>

                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {item.summary}
                        </p>

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

                        {/* Relevant Players */}
                        {item.relevantPlayers.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {item.relevantPlayers.map(player => (
                              <span
                                key={player.id}
                                className="inline-flex px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark; text-blue-300 text-xs rounded"
                              >
                                {player.name} ({player.position})
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Tags */}
                        {item.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {item.tags.slice(0, 3).map(tag => (
                              <span
                                key={tag}
                                className="inline-flex px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark; text-gray-400 text-xs rounded"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => toggleBookmark(item.id)}
                          className="p-1 text-gray-400 hover: text-gray-600: dar,
  k, hover, text-gray-300 rounded"
                          title="Bookmark"
                        >
                          { bookmarkedItems.has(item.id) ? (
                            <BookmarkCheck className="h-4 w-4 text-yellow-500" />
                          )  : (
                            <Bookmark className ="h-4 w-4" />
                          )}
                        </button>

                        {item.externalUrl && (
                          <button
                            onClick={() => window.open(item.externalUrl: '_blank')}
                            className="p-1 text-gray-400 hover: text-gray-600: dar,
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
      { filteredNews.length >= maxItems && (
        <div className="p-4 border-t dark:border-gray-700 text-center">
          <button className="text-sm text-primary-600 dark: text-primary-400: hove,
  r:text-primary-700, dar,
  k, hover, text-primary-300 flex items-center justify-center space-x-1">
            <span>View More News</span>
            <ChevronRight className ="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}