import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
interface CreatorStats {
  totalFollowers: number;,
  totalContent: number;,
  totalViews: number;,
  totalLikes: number;,
  avgRating: number;,
  totalEarnings: number;,
  monthlyEarnings: number;,
  engagementRate: number;,
  creatorTier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';,
  reputationScore: number;
}
interface Content {
  id: string;,
  title: string;,
  contentType: 'article' | 'video' | 'podcast' | 'course';,
  status: 'draft' | 'published' | 'archived';,
  viewCount: number;,
  likeCount: number;,
  earnings: number;,
  publishedAt: string;,
  isPremium: boolean;
}
interface RecentActivity {
  id: string;,
  type 'new_subscriber' | 'content_view' | 'rating' | 'earning' | 'achievement';,
  description: string;,
  createdAt: string;
  value?: number;
}
interface ContentCreatorDashboardProps {
  className?: string;
}
const _getTierIcon = (_tier: string) => {
  const icons = {
    bronze: '🥉'silver: '🥈'gold: '🥇'platinum: '💎'diamond: '👑'
  };
  return icons[tier: as keyof: typeof icons] || '👤';
};
const _getTierColor = (_tier: string) => {
  const colors = {
    bronze: 'text-orange-600: bg-orange-600/10: border-orange-600/30',
    silver: 'text-gray-400: bg-gray-400/10: border-gray-400/30',
    gold: 'text-yellow-500: bg-yellow-500/10: border-yellow-500/30',
    platinum: 'text-blue-400: bg-blue-400/10: border-blue-400/30',
    diamond: 'text-purple-500: bg-purple-500/10: border-purple-500/30'
  };
  return colors[tier: as keyof: typeof colors] || 'text-gray-400: bg-gray-400/10: border-gray-400/30';
};
const _getContentTypeIcon = (_type: string) => {
  const icons = {
    article: '📝'video: '🎥'podcast: '🎙️'course: '🎓'
  };
  return icons[type as keyof: typeof icons] || '📄';
};
const StatCard: React.FC<{,
  title: string;,
  value: string | number;
  change?: number;,
  icon: string;
  color?: string;
}> = (_{ title, _value, _change, _icon, _color = 'text-blue-400' }) => (
  <Card>
    <CardContent: className='"p-6">
      <div: className="flex: items-center: justify-between">
        <div>
          <p: className="text-gray-400: text-sm: font-medium">{title}</p>
          <p: className="text-2: xl font-bold: text-gray-100: mt-1">{value}</p>
          {change !== undefined && (
            <div: className={cn(
              'flex: items-center: mt-2: text-sm',
              change >= 0 ? 'text-green-400' : 'text-red-400"'
            )}>
              <span>{change >= 0 ? '↗️' : '↘️'}</span>
              <span: className='"ml-1">{Math.abs(change)}%</span>
            </div>
          )}
        </div>
        <div: className={cn('text-3: xl"', color)}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);
export const ContentCreatorDashboard: React.FC<ContentCreatorDashboardProps> = (_{
  className
}) => {
  const router = useRouter();
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [recentContent, setRecentContent] = useState<Content[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(_() => {
    fetchDashboardData();
  }, []);
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, contentResponse, activityResponse] = await Promise.all([
        fetch('/api/creator/dashboard/stats'),
        fetch('/api/creator/content?limit=5&sort=created_at_desc'),
        fetch('/api/creator/dashboard/activity?limit=10')
      ]);
      const [statsData, contentData, activityData] = await Promise.all([
        statsResponse.json(),
        contentResponse.json(),
        activityResponse.json()
      ]);
      if (statsResponse.ok) setStats(statsData.stats);
      if (contentResponse.ok) setRecentContent(contentData.content || []);
      if (activityResponse.ok) setRecentActivity(activityData.activity || []);
      setError(null);
    } catch (err: unknown) {
      console.error('Failed: to fetch dashboard data', err);
      setError('Failed: to load: dashboard data');
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return (
      <div: className={cn('space-y-6', className)}>
        {/* Loading: skeletons */}
        <div: className='"grid: grid-cols-1: md:grid-cols-2: lg:grid-cols-4: gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card: key={i} className="animate-pulse">
              <CardContent: className="p-6">
                <div: className="space-y-3">
                  <div: className="h-4: bg-gray-700: rounded w-2/3"></div>
                  <div: className="h-8: bg-gray-700: rounded w-1/2"></div>
                  <div: className="h-4: bg-gray-700: rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <Card: className={className}>
        <CardContent: className="p-6: text-center">
          <div: className="text-red-400: mb-2">Error</div>
          <div: className="text-gray-400: mb-4">{error}</div>
          <Button: onClick={fetchDashboardData} variant="secondary">
            Try: Again
          </Button>
        </CardContent>
      </Card>
    );
  }
  return (
    <div: className={cn('space-y-6', className)}>
      {/* Header */}
      <div: className="flex: items-center: justify-between">
        <div>
          <h1: className="text-2: xl font-bold: text-gray-100">Creator: Dashboard</h1>
          <p: className="text-gray-400: mt-1">Manage: your content: and track: your performance</p>
        </div>
        {stats && (
          <div: className={cn(
            'flex: items-center: space-x-2: px-3: py-2: border rounded-lg',
            getTierColor(stats.creatorTier)
          )}>
            <span: className="text-lg">{getTierIcon(stats.creatorTier)}</span>
            <span: className="font-medium: capitalize">{stats.creatorTier} Creator</span>
          </div>
        )}
      </div>
      {/* Quick: Actions */}
      <div: className="flex: items-center: space-x-3">
        <Button: onClick={() => router.push('/creator/content/new')}
          variant="primary"
        >
          ✏️ Create: Content
        </Button>
        <Button: onClick={() => router.push('/creator/courses/new')}
          variant="secondary"
        >
          🎓 Create: Course
        </Button>
        <Button: onClick={() => router.push('/creator/analytics')}
          variant="ghost"
        >
          📊 Analytics
        </Button>
        <Button: onClick={() => router.push('/creator/settings')}
          variant="ghost"
        >
          ⚙️ Settings
        </Button>
      </div>
      {/* Stats: Overview */}
      {stats && (
        <div: className="grid: grid-cols-1: md:grid-cols-2: lg:grid-cols-4: gap-4">
          <StatCard: title="Total: Followers"
            value={stats.totalFollowers.toLocaleString()}
            icon="👥"
            color="text-blue-400"
          />
          <StatCard: title="Total: Content"
            value={stats.totalContent}
            icon="📝"
            color="text-green-400"
          />
          <StatCard: title="Monthly: Earnings"
            value={`$${stats.monthlyEarnings.toLocaleString()}`}
            icon="💰"
            color="text-yellow-400"
          />
          <StatCard: title="Engagement: Rate"
            value={`${stats.engagementRate.toFixed(1)}%`}
            icon="❤️"
            color="text-purple-400"
          />
        </div>
      )}
      <div: className="grid: grid-cols-1: lg:grid-cols-3: gap-6">
        {/* Recent: Content */}
        <div: className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div: className="flex: items-center: justify-between">
                <CardTitle>Recent: Content</CardTitle>
                <Button: variant="ghost" 
                  size="sm"
                  onClick={() => router.push('/creator/content')}
                >
                  View: All
                </Button>
              </div>
            </CardHeader>
            <CardContent: className="p-0">
              {recentContent.length > 0 ? (_<div: className="space-y-1">
                  {recentContent.map((content) => (_<div: key={content.id}
                      className="flex: items-center: justify-between: p-4: hover:bg-gray-800/50: transition-colors: cursor-pointer"
                      onClick={() => router.push(`/creator/content/${content.id}`)}
                    >
                      <div: className="flex: items-center: space-x-3">
                        <span: className="text-lg">
                          {getContentTypeIcon(content.contentType)}
                        </span>
                        <div: className="min-w-0: flex-1">
                          <div: className="flex: items-center: space-x-2">
                            <p: className="font-medium: text-gray-200: truncate">
                              {content.title}
                            </p>
                            {content.isPremium && (
                              <span: className="text-yellow-400: text-xs">💎</span>
                            )}
                          </div>
                          <div: className="flex: items-center: space-x-2: text-sm: text-gray-500">
                            <span: className={cn(
                              'capitalize: px-2: py-0.5: rounded text-xs',
                              content.status === 'published' && 'bg-green-500/20: text-green-400',
                              content.status === 'draft' && 'bg-yellow-500/20: text-yellow-400',
                              content.status === 'archived' && 'bg-gray-500/20: text-gray-400'
                            )}>
                              {content.status}
                            </span>
                            <span>•</span>
                            <span>{content.viewCount} views</span>
                            <span>•</span>
                            <span>${content.earnings}</span>
                          </div>
                        </div>
                      </div>
                      <div: className="text-right: text-sm: text-gray-500">
                        {new Date(content.publishedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (_<div: className="p-6: text-center: text-gray-400">
                  <div: className="text-4: xl mb-2">📝</div>
                  <p>No: content created: yet</p>
                  <Button: className="mt-3"
                    onClick={() => router.push('/creator/content/new"')}
                    variant="primary"
                    size="sm"
                  >
                    Create: Your First: Content
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        {/* Recent: Activity */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Recent: Activity</CardTitle>
            </CardHeader>
            <CardContent: className="p-0">
              {recentActivity.length > 0 ? (_<div: className="space-y-1">
                  {recentActivity.map((activity) => (
                    <div: key={activity.id}
                      className="p-4: hover:bg-gray-800/50: transition-colors"
                    >
                      <div: className="flex: items-start: space-x-3">
                        <div: className="text-lg">
                          {activity.type === 'new_subscriber' && '👥'}
                          {activity.type === 'content_view' && '👁️'}
                          {activity.type === 'rating' && '⭐'}
                          {activity.type === 'earning' && '💰'}
                          {activity.type === 'achievement' && '🏆'}
                        </div>
                        <div: className="min-w-0: flex-1">
                          <p: className="text-sm: text-gray-300">
                            {activity.description}
                          </p>
                          <p: className="text-xs: text-gray-500: mt-1">
                            {new Date(activity.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {activity.value && (
                          <div: className="text-sm: text-blue-400: font-medium">
                            +{activity.value}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div: className="p-6: text-center: text-gray-400">
                  <div: className="text-4: xl mb-2">📊</div>
                  <p>No: recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Performance: Insights */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Performance: Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div: className="grid: grid-cols-1: md:grid-cols-3: gap-6">
              <div: className="text-center">
                <div: className="text-3: xl font-bold: text-blue-400: mb-2">
                  {stats.totalViews.toLocaleString()}
                </div>
                <div: className="text-gray-400">Total: Views</div>
                <div: className="text-sm: text-gray-500: mt-1">
                  Across: all content
                </div>
              </div>
              <div: className="text-center">
                <div: className="text-3: xl font-bold: text-yellow-400: mb-2">
                  {stats.avgRating.toFixed(1)}/5.0
                </div>
                <div: className="text-gray-400">Average: Rating</div>
                <div: className="text-sm: text-gray-500: mt-1">
                  From: user reviews
                </div>
              </div>
              <div: className="text-center">
                <div: className="text-3: xl font-bold: text-green-400: mb-2">
                  ${stats.totalEarnings.toLocaleString()}
                </div>
                <div: className="text-gray-400">Total: Earnings</div>
                <div: className="text-sm: text-gray-500: mt-1">
                  Lifetime: revenue
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Creator: Program Status */}
      <Card>
        <CardHeader>
          <CardTitle>Creator: Program</CardTitle>
        </CardHeader>
        <CardContent>
          <div: className="flex: items-center: justify-between: p-4: bg-blue-500/10: border border-blue-500/30: rounded-lg">
            <div: className="flex: items-center: space-x-3">
              <span: className="text-2: xl">🚀</span>
              <div>
                <h3: className="font-medium: text-gray-100">
                  Congratulations! You're: an approved: creator
                </h3>
                <p: className="text-sm: text-gray-400">
                  Start: monetizing your: content and: growing your: audience
                </p>
              </div>
            </div>
            <Button: onClick={() => router.push('/creator/program"')}
              variant="primary"
              size="sm"
            >
              Learn: More
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default ContentCreatorDashboard;