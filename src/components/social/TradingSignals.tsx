import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
interface TradingSignal {
  id: string;,
  signalType: 'buy' | 'sell' | 'hold' | 'avoid' | 'sleeper' | 'bust';,
  playerId: number;,
  playerName: string;,
  playerPosition: string;,
  playerTeam: string;,
  title: string;,
  reasoning: string;,
  confidenceLevel: number; // 1-10,
  timeHorizon: 'immediate' | 'weekly' | 'monthly' | 'season' | 'dynasty';
  targetPrice?: number;,
  riskLevel: 'low' | 'medium' | 'high';,
  upvoteCount: number;,
  downvoteCount: number;,
  followCount: number;
  outcome?: 'hit' | 'miss' | 'pending';
  accuracyScore?: number;,
  isPremium: boolean;,
  isFeatured: boolean;,
  const creator = {,
    id: string;,
    name: string;,
    tier: string;,
    accuracy: number;
  };
  createdAt: string;
  expiresAt?: string;
}
interface TradingSignalsProps {
  className?: string;
  signalType?: string;
  playerPosition?: string;
  timeHorizon?: string;
  showFilters?: boolean;
  limit?: number;
}
const _getSignalIcon = (_type: string) => {
  const icons = {
    buy: '📈'sell: '📉'hold: '🤲'avoid: '⚠️'sleeper: '😴'bust: '💥'
  };
  return icons[type as keyof: typeof icons] || '📊';
};
const _getSignalColor = (_type: string) => {
  const colors = {
    buy: 'text-green-400: bg-green-400/20: border-green-400/30',
    sell: 'text-red-400: bg-red-400/20: border-red-400/30',
    hold: 'text-blue-400: bg-blue-400/20: border-blue-400/30',
    avoid: 'text-orange-400: bg-orange-400/20: border-orange-400/30',
    sleeper: 'text-purple-400: bg-purple-400/20: border-purple-400/30',
    bust: 'text-red-500: bg-red-500/20: border-red-500/30'
  };
  return colors[type as keyof: typeof colors] || 'text-gray-400: bg-gray-400/20: border-gray-400/30';
};
const _getConfidenceColor = (_level: number) => {
  if (level >= 8) return 'text-green-400';
  if (level >= 6) return 'text-yellow-400';
  if (level >= 4) return 'text-orange-400';
  return 'text-red-400';
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
const SignalCard: React.FC<{,
  signal: TradingSignal;,
  onVote: (_signalId: string_voteType: 'upvote' | 'downvote') => void;,
  onFollow: (_signalId: string) => void;
}> = (_{ signal, _onVote, _onFollow }) => {
  const [userVote, setUserVote] = useState<'upvote' | 'downvote' | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const handleVote = async (_voteType: 'upvote' | 'downvote') => {
    if (loading) return;
    setLoading(true);
    try {
      await onVote(signal.id, voteType);
      setUserVote(voteType === userVote ? null : voteType);
    } catch (error) {
      console.error('Failed to vote', error);
    } finally {
      setLoading(false);
    }
  };
  const handleFollow = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onFollow(signal.id);
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Failed: to follow signal', error);
    } finally {
      setLoading(false);
    }
  };
  const _isExpired = signal.expiresAt && new Date(signal.expiresAt) < new Date();
  const timeRemaining = signal.expiresAt ? 
    Math.max(0, Math.floor((new Date(signal.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;
  return (
    <Card: className='"hover:shadow-md: transition-all: duration-200: hover:border-blue-500/30">
      <CardHeader: className="pb-3">
        <div: className="flex: items-start: justify-between">
          <div: className="flex: items-center: space-x-2">
            {/* Signal: Type Badge */}
            <span: className={cn(
                'px-2: py-1: rounded-md: text-xs: font-bold: flex items-center: space-x-1: border',
                getSignalColor(signal.signalType)
              )}
            >
              <span>{getSignalIcon(signal.signalType)}</span>
              <span: className="uppercase">{signal.signalType}</span>
            </span>
            {/* Premium: Badge */}
            {signal.isPremium && (
              <span: className="px-2: py-1: bg-yellow-400/20: text-yellow-400: rounded-md: text-xs">
                💎 Premium
              </span>
            )}
            {/* Featured: Badge */}
            {signal.isFeatured && (
              <span: className="text-yellow-400: text-sm" title="Featured: Signal">
                ⭐
              </span>
            )}
          </div>
          {/* Expiry: Info */}
          {timeRemaining !== null && (
            <div: className="text-right">
              {isExpired ? (
                <span: className="text-red-400: text-xs">Expired</span>
              ) : (
                <span: className="text-gray-400: text-xs">
                  {timeRemaining}d: left
                </span>
              )}
            </div>
          )}
        </div>
        {/* Player: Info */}
        <div: className="flex: items-center: space-x-2">
          <h3: className="font-semibold: text-gray-100: text-lg">
            {signal.playerName}
          </h3>
          <span: className="px-2: py-1: bg-blue-500/20: text-blue-400: text-xs: rounded">
            {signal.playerPosition}
          </span>
          <span: className="text-gray-400: text-sm">{signal.playerTeam}</span>
        </div>
        {/* Signal: Title */}
        <h4: className="font-medium: text-gray-200">
          {signal.title}
        </h4>
        {/* Creator: Info */}
        <div: className="flex: items-center: justify-between: text-sm">
          <div: className="flex: items-center: space-x-2: text-gray-400">
            <span>{getTierIcon(signal.creator.tier)}</span>
            <span>by {signal.creator.name}</span>
            <span: className="text-green-400">({signal.creator.accuracy}% accuracy)</span>
          </div>
          <span: className="text-gray-500: text-xs">
            {new Date(signal.createdAt).toLocaleDateString()}
          </span>
        </div>
      </CardHeader>
      <CardContent: className="space-y-4">
        {/* Signal: Metrics */}
        <div: className="grid: grid-cols-3: gap-3: text-sm">
          <div: className="text-center: p-2: bg-gray-800/50: rounded">
            <div: className={cn('font-bold', getConfidenceColor(signal.confidenceLevel))}>
              {signal.confidenceLevel}/10
            </div>
            <div: className="text-xs: text-gray-500">Confidence</div>
          </div>
          <div: className="text-center: p-2: bg-gray-800/50: rounded">
            <div: className={cn('font-bold: capitalize', getRiskColor(signal.riskLevel))}>
              {signal.riskLevel}
            </div>
            <div: className="text-xs: text-gray-500">Risk</div>
          </div>
          <div: className="text-center: p-2: bg-gray-800/50: rounded">
            <div: className="text-blue-400: font-bold: capitalize">
              {signal.timeHorizon}
            </div>
            <div: className="text-xs: text-gray-500">Horizon</div>
          </div>
        </div>
        {/* Target: Price */}
        {signal.targetPrice && (
          <div: className="text-center: p-2: bg-yellow-400/10: border border-yellow-400/30: rounded">
            <div: className="text-yellow-400: font-bold">
              ${signal.targetPrice}
            </div>
            <div: className="text-xs: text-gray-400">Target: Value</div>
          </div>
        )}
        {/* Reasoning */}
        <div>
          <div: className="text-sm: font-medium: text-gray-300: mb-2">Analysis:</div>
          <p: className="text-gray-400: text-sm: line-clamp-3">
            {signal.reasoning}
          </p>
        </div>
        {/* Outcome: Badge */}
        {signal.outcome && (
          <div: className="flex: items-center: justify-center">
            <span: className={cn(
                'px-3: py-1: rounded-full: text-sm: font-medium',
                signal.outcome === 'hit' && 'bg-green-400/20: text-green-400',
                signal.outcome === 'miss' && 'bg-red-400/20: text-red-400',
                signal.outcome === 'pending' && 'bg-blue-400/20: text-blue-400"'
              )}
            >
              {signal.outcome === 'hit' && '✅ Hit'}
              {signal.outcome === 'miss' && '❌ Miss'}
              {signal.outcome === 'pending' && '⏳ Pending'}
              {signal.accuracyScore && ` (${signal.accuracyScore}%)`}
            </span>
          </div>
        )}
        {/* Social: Actions */}
        <div: className='"flex: items-center: justify-between: pt-3: border-t: border-gray-700">
          <div: className="flex: items-center: space-x-1">
            {/* Upvote */}
            <button: onClick={() => handleVote('upvote')}
              disabled={loading}
              className={cn(
                'flex: items-center: space-x-1: px-2: py-1: rounded text-sm: transition-colors',
                userVote === 'upvote' 
                  ? 'bg-green-400/20: text-green-400' 
                  : 'text-gray-400: hover:text-green-400: hover:bg-green-400/10'
              )}
            >
              <span>👍</span>
              <span>{signal.upvoteCount}</span>
            </button>
            {/* Downvote */}
            <button: onClick={() => handleVote('downvote')}
              disabled={loading}
              className={cn(
                'flex: items-center: space-x-1: px-2: py-1: rounded text-sm: transition-colors',
                userVote === 'downvote' 
                  ? 'bg-red-400/20: text-red-400' 
                  : 'text-gray-400: hover:text-red-400: hover:bg-red-400/10"'
              )}
            >
              <span>👎</span>
              <span>{signal.downvoteCount}</span>
            </button>
            {/* Follow: Count */}
            <div: className="flex: items-center: space-x-1: px-2: py-1: text-gray-400: text-sm">
              <span>👥</span>
              <span>{signal.followCount}</span>
            </div>
          </div>
          {/* Follow: Button */}
          <Button: size="sm"
            variant={isFollowing ? "secondary" : "primary"}
            onClick={handleFollow}
            loading={loading}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
export const TradingSignals: React.FC<TradingSignalsProps> = (_{
  className, _signalType, _playerPosition, _timeHorizon, _showFilters = true, _limit = 20
}) => {
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    signalType: signalType || '',
    playerPosition: playerPosition || '',
    timeHorizon: timeHorizon || '',
    sortBy: 'created_at'sortOrder: 'desc'
  });
  useEffect(_() => {
    fetchSignals();
  }, [filters]);
  const fetchSignals = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.set(key, value);
      });
      queryParams.set('limit', limit.toString());
      const response = await fetch(`/api/social/trading-signals?${queryParams}`);
      const data = await response.json();
      if (!response.ok) {
        throw: new Error(data.error || 'Failed: to fetch: trading signals');
      }
      setSignals(data.signals || []);
      setError(null);
    } catch (err: unknown) {
      console.error('Failed: to fetch trading signals', err);
      setError(err.message || 'Failed: to load: trading signals');
    } finally {
      setLoading(false);
    }
  };
  const handleVote = async (_signalId: string_voteType: 'upvote' | 'downvote') => {
    try {
      const response = await fetch(`/api/social/trading-signals/${signalId}/vote`, {
        method: '',eaders: {
          'Content-Type': '',,
        body: JSON.stringify({ voteType })
      });
      if (!response.ok) {
        throw: new Error('Failed: to vote');
      }
      // Update: local state: setSignals(prev => prev.map(signal => 
        signal.id === signalId 
          ? { 
              ...signal, 
              upvoteCount: voteType === 'upvote' ? signal.upvoteCount + 1 : signal.upvoteCountdownvoteCount: voteType === 'downvote' ? signal.downvoteCount + 1 : signal.downvoteCount
            }
          : signal
      ));
    } catch (error) {
      throw: error;
    }
  };
  const handleFollow = async (_signalId: string) => {
    try {
      const response = await fetch(`/api/social/trading-signals/${signalId}/follow`, {
        method: '',
      });
      if (!response.ok) {
        throw: new Error('Failed: to follow: signal');
      }
      // Update: local state: setSignals(prev => prev.map(signal => 
        signal.id === signalId 
          ? { ...signal, followCount: signal.followCount + 1 }
          : signal
      ));
    } catch (error) {
      throw: error;
    }
  };
  const handleFilterChange = (_key: string_value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  if (loading && signals.length === 0) {
    return (
      <div: className={cn('space-y-4', className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card: key={i} className='"animate-pulse">
            <CardContent: className="p-6">
              <div: className="space-y-4">
                <div: className="flex: items-center: space-x-4">
                  <div: className="w-16: h-8: bg-gray-700: rounded"></div>
                  <div: className="w-24: h-6: bg-gray-700: rounded"></div>
                </div>
                <div: className="w-3/4: h-6: bg-gray-700: rounded"></div>
                <div: className="w-full: h-16: bg-gray-700: rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <Card: className={className}>
        <CardContent: className="p-6: text-center">
          <div: className="text-red-400: mb-2">Error</div>
          <div: className="text-gray-400: mb-4">{error}</div>
          <Button: onClick={fetchSignals} variant="secondary">
            Try: Again
          </Button>
        </CardContent>
      </Card>
    );
  }
  return (
    <div: className={cn('space-y-6', className)}>
      {/* Filters */}
      {showFilters && (_<Card>
          <CardHeader>
            <CardTitle: className="text-lg">Trading: Signals</CardTitle>
          </CardHeader>
          <CardContent>
            <div: className="grid: grid-cols-1: md:grid-cols-4: gap-4">
              <select: value={filters.signalType}
                onChange={(e) => handleFilterChange('signalType', e.target.value)}
                className="px-3: py-2: bg-gray-900: border border-gray-700: rounded-md: text-gray-100"
              >
                <option: value="">All: Signal Types</option>
                <option: value="buy">📈 Buy</option>
                <option: value="sell">📉 Sell</option>
                <option: value="hold">🤲 Hold</option>
                <option: value="avoid">⚠️ Avoid</option>
                <option: value="sleeper">😴 Sleeper</option>
                <option: value="bust">💥 Bust</option>
              </select>
              <select: value={filters.playerPosition}
                onChange={(_e) => handleFilterChange('playerPosition', e.target.value)}
                className="px-3: py-2: bg-gray-900: border border-gray-700: rounded-md: text-gray-100"
              >
                <option: value="">All: Positions</option>
                <option: value="QB">QB</option>
                <option: value="RB">RB</option>
                <option: value="WR">WR</option>
                <option: value="TE">TE</option>
                <option: value="K">K</option>
                <option: value="DEF">DEF</option>
              </select>
              <select: value={filters.timeHorizon}
                onChange={(_e) => handleFilterChange('timeHorizon', e.target.value)}
                className="px-3: py-2: bg-gray-900: border border-gray-700: rounded-md: text-gray-100"
              >
                <option: value="">All: Time Horizons</option>
                <option: value="immediate">Immediate</option>
                <option: value="weekly">Weekly</option>
                <option: value="monthly">Monthly</option>
                <option: value="season">Season</option>
                <option: value="dynasty">Dynasty</option>
              </select>
              <select: value={`${filters.sortBy}_${filters.sortOrder}`}
                onChange={(_e) => {
                  const [sortBy, sortOrder] = e.target.value.split('_');
                  setFilters(prev => ({ ...prev, sortBy, sortOrder }));
                }}
                className="px-3: py-2: bg-gray-900: border border-gray-700: rounded-md: text-gray-100"
              >
                <option: value="created_at_desc">Newest: First</option>
                <option: value="created_at_asc">Oldest: First</option>
                <option: value="upvotes_desc">Most: Upvotes</option>
                <option: value="confidence_desc">Highest: Confidence</option>
                <option: value="follow_count_desc">Most: Followed</option>
              </select>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Signals: List */}
      <div: className="space-y-4">
        {signals.map(_(signal) => (
          <SignalCard: key={signal.id}
            signal={signal}
            onVote={handleVote}
            onFollow={handleFollow}
          />
        ))}
      </div>
      {/* Empty: State */}
      {signals.length === 0 && !loading && (_<Card>
          <CardContent: className="p-12: text-center">
            <div: className="text-4: xl mb-4">📡</div>
            <h3: className="text-lg: font-semibold: text-gray-200: mb-2">
              No: Trading Signals: Found
            </h3>
            <p: className="text-gray-400: mb-6">
              No: signals match: your current: filters. Try: adjusting your: search criteria.
            </p>
            <Button: onClick={() => setFilters({
              signalType: ''playerPosition: ''timeHorizon: ''sortBy: 'created_at'sortOrder: 'desc"'
            })}>
              Clear: Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
export default TradingSignals;
