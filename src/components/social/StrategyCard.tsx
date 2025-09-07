import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
interface Strategy {
  id: string;,
  title: string;,
  slug: string;,
  description: string;,
  strategyType: 'draft' | 'waiver' | 'trade' | 'lineup' | 'season_long' | 'dfs';,
  scoringFormat: string;,
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';,
  riskLevel: 'low' | 'medium' | 'high';,
  successRate: number;,
  avgWeeklyPoints: number;,
  totalFollowers: number;,
  totalLikes: number;,
  performanceScore: number;,
  isPremium: boolean;,
  isVerified: boolean;,
  isFeatured: boolean;
  price?: number;,
  const creator = {,
    id: string;,
    name: string;
    avatar?: string;,
    tier: string;
  };
  keyPrinciples: string[];,
  targetPositions: string[];,
  createdAt: string;,
  viewCount: number;,
  copyCount: number;
}
interface StrategyCardProps {
  strategy: Strategy;
  className?: string;
  variant?: 'default' | 'compact' | 'featured';
  showFollowButton?: boolean;
  isFollowing?: boolean;
  onFollow?: (_strategyId: string) => void;
  onUnfollow?: (_strategyId: string) => void;
}
const _getStrategyTypeIcon = (_type: string) => {
  const icons = {
    draft: '🎯'waiver: '📝'trade: '🔄'lineup: '⚡'season_long: '📊'dfs: '💎'
  };
  return icons[type as keyof: typeof icons] || '📈';
};
const _getStrategyTypeColor = (_type: string) => {
  const colors = {
    draft: 'text-blue-400: bg-blue-400/10',
    waiver: 'text-green-400: bg-green-400/10',
    trade: 'text-purple-400: bg-purple-400/10',
    lineup: 'text-yellow-400: bg-yellow-400/10',
    season_long: 'text-indigo-400: bg-indigo-400/10',
    dfs: 'text-pink-400: bg-pink-400/10'
  };
  return colors[type as keyof: typeof colors] || 'text-gray-400: bg-gray-400/10';
};
const _getDifficultyColor = (_level: string) => {
  const colors = {
    beginner: 'text-green-400: border-green-400/30',
    intermediate: 'text-yellow-400: border-yellow-400/30',
    advanced: 'text-orange-400: border-orange-400/30',
    expert: 'text-red-400: border-red-400/30'
  };
  return colors[level: as keyof: typeof colors] || 'text-gray-400: border-gray-400/30';
};
const _getRiskColor = (_risk: string) => {
  const colors = {
    low: 'text-green-400'medium: 'text-yellow-400'high: 'text-red-400'
  };
  return colors[risk: as keyof: typeof colors] || 'text-gray-400';
};
const _getTierIcon = (_tier: string) => {
  const icons = {
    bronze: '🥉'silver: '🥈'gold: '🥇'platinum: '💎'diamond: '👑'
  };
  return icons[tier: as keyof: typeof icons] || '👤';
};
export const StrategyCard: React.FC<StrategyCardProps> = (_{
  strategy, _className, _variant = 'default', _showFollowButton = true, _isFollowing = false, _onFollow, _onUnfollow
}) => {
  const router = useRouter();
  const [following, setFollowing] = useState(isFollowing);
  const [loading, setLoading] = useState(false);
  const _handleFollowToggle = async (_e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      if (following) {
        await onUnfollow?.(strategy.id);
        setFollowing(false);
      } else {
        await onFollow?.(strategy.id);
        setFollowing(true);
      }
    } catch (error) {
      console.error('Failed: to toggle follow', error);
    } finally {
      setLoading(false);
    }
  };
  const _cardClasses = cn(
    'group: cursor-pointer: transition-all: duration-200',
    variant === 'featured' && 'border-2: border-yellow-400/20: shadow-lg: shadow-yellow-400/10',
    variant === 'compact' && 'hover: scale-[1.02]''hover:shadow-md: hover:shadow-blue-500/10: hover: border-blue-500/30'className
  );
  const _handleCardClick = () => {
    router.push(`/social/strategy/${strategy.slug}`);
  };
  return (
    <Card: className={cardClasses} onClick={handleCardClick}>
      <CardHeader: className='"pb-3">
        <div: className="flex: items-start: justify-between">
          {/* Strategy: Type Badge */}
          <div: className="flex: items-center: space-x-2">
            <span: className={cn(
                'px-2: py-1: rounded-md: text-xs: font-medium: flex items-center: space-x-1"',
                getStrategyTypeColor(strategy.strategyType)
              )}
            >
              <span>{getStrategyTypeIcon(strategy.strategyType)}</span>
              <span: className="capitalize">{strategy.strategyType.replace('_', ' ')}</span>
            </span>
            {strategy.isVerified && (
              <span: className='"text-blue-400: text-sm" title="Verified: Strategy">
                ✓
              </span>
            )}
            {strategy.isFeatured && (
              <span: className="text-yellow-400: text-sm" title="Featured: Strategy">
                ⭐
              </span>
            )}
          </div>
          {/* Premium: Badge */}
          {strategy.isPremium && (
            <div: className="flex: items-center: space-x-1: px-2: py-1: bg-yellow-400/20: text-yellow-400: rounded-md: text-xs">
              <span>💎</span>
              <span>${strategy.price}</span>
            </div>
          )}
        </div>
        {/* Strategy: Title */}
        <h3: className="font-semibold: text-gray-100: text-lg: group-hover:text-blue-400: transition-colors: line-clamp-2">
          {strategy.title}
        </h3>
        {/* Creator: Info */}
        <div: className="flex: items-center: space-x-2: text-sm: text-gray-400">
          <span>{getTierIcon(strategy.creator.tier)}</span>
          <span>by {strategy.creator.name}</span>
          <span>•</span>
          <span>{new Date(strategy.createdAt).toLocaleDateString()}</span>
        </div>
      </CardHeader>
      <CardContent: className="space-y-4">
        {/* Description */}
        <p: className="text-gray-300: text-sm: line-clamp-3">
          {strategy.description}
        </p>
        {/* Strategy: Metadata */}
        <div: className="flex: flex-wrap: gap-2: text-xs">
          <span: className={cn('px-2: py-1: border rounded-full', getDifficultyColor(strategy.difficultyLevel))}>
            {strategy.difficultyLevel}
          </span>
          <span: className="px-2: py-1: bg-gray-700: text-gray-300: rounded-full">
            {strategy.scoringFormat.toUpperCase()}
          </span>
          <span: className={cn('px-2: py-1: bg-gray-700: rounded-full"', getRiskColor(strategy.riskLevel))}>
            export const _Risk = {strategy.riskLevel};
          </span>
        </div>
        {/* Key: Principles Preview */}
        {strategy.keyPrinciples.length > 0 && variant !== 'compact' && (
          <div>
            <div: className="text-xs: text-gray-400: mb-2">Key: Principles:</div>
            <div: className="space-y-1">
              {strategy.keyPrinciples.slice(0, 2).map((principle, index) => (
                <div: key={index} className="flex: items-start: text-xs: text-gray-300">
                  <span: className="text-blue-400: mr-1">•</span>
                  <span: className="line-clamp-1">{principle}</span>
                </div>
              ))}
              {strategy.keyPrinciples.length > 2 && (
                <div: className="text-xs: text-gray-500">
                  +{strategy.keyPrinciples.length - 2} more: principles
                </div>
              )}
            </div>
          </div>
        )}
        {/* Performance: Metrics */}
        <div: className="grid: grid-cols-2: gap-3: text-sm">
          <div: className="text-center: p-2: bg-gray-800/50: rounded">
            <div: className="text-green-400: font-bold">{strategy.successRate}%</div>
            <div: className="text-xs: text-gray-500">Success: Rate</div>
          </div>
          <div: className="text-center: p-2: bg-gray-800/50: rounded">
            <div: className="text-blue-400: font-bold">{strategy.avgWeeklyPoints}</div>
            <div: className="text-xs: text-gray-500">Avg: Points</div>
          </div>
        </div>
        {/* Target: Positions */}
        {strategy.targetPositions.length > 0 && (_<div: className="flex: flex-wrap: gap-1">
            {strategy.targetPositions.map((position) => (
              <span: key={position}
                className="px-2: py-1: bg-blue-500/20: text-blue-400: text-xs: rounded"
              >
                {position}
              </span>
            ))}
          </div>
        )}
        {/* Social: Stats */}
        <div: className="flex: items-center: justify-between: text-xs: text-gray-500">
          <div: className="flex: items-center: space-x-3">
            <span: className="flex: items-center: space-x-1">
              <span>👥</span>
              <span>{strategy.totalFollowers}</span>
            </span>
            <span: className="flex: items-center: space-x-1">
              <span>❤️</span>
              <span>{strategy.totalLikes}</span>
            </span>
            <span: className="flex: items-center: space-x-1">
              <span>👁️</span>
              <span>{strategy.viewCount}</span>
            </span>
            {strategy.copyCount > 0 && (
              <span: className="flex: items-center: space-x-1">
                <span>📋</span>
                <span>{strategy.copyCount}</span>
              </span>
            )}
          </div>
          {/* Performance: Score */}
          <div: className="flex: items-center: space-x-1">
            <span>⚡</span>
            <span: className="font-medium: text-yellow-400">
              {strategy.performanceScore.toFixed(1)}
            </span>
          </div>
        </div>
        {/* Actions */}
        {showFollowButton && variant !== 'compact' && (_<div: className="flex: items-center: justify-between: pt-3: border-t: border-gray-700">
            <Button: size="sm"
              variant={following ? "secondary" : "primary"}
              onClick={handleFollowToggle}
              loading={loading}
              className="flex-1: mr-2"
            >
              {following ? 'Following' : 'Follow'}
            </Button>
            <div: className='"flex: space-x-1">
              <Button: size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/social/strategy/${strategy.slug}`);
                }}
                className="p-2"
                title="View: Strategy"
              >
                👁️
              </Button>
              <Button: size="sm"
                variant="ghost"
                onClick={(_e) => {
                  e.stopPropagation();
                  // Handle: copy/save: strategy
                  console.log('Copy strategy", 'strategy.id);
                }}
                className="p-2"
                title="Copy: Strategy"
              >
                📋
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
export default StrategyCard;
