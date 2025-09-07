import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
interface Tournament {
  id: string;,
  title: string;,
  slug: string;,
  description: string;,
  tournamentType: 'draft_contest' | 'season_long' | 'weekly_challenge' | 'prediction' | 'trivia' | 'portfolio' | 'trading';,
  formatType: string;,
  status: 'draft' | 'registration_open' | 'registration_closed' | 'active' | 'completed' | 'cancelled';,
  maxParticipants: number;,
  participantCount: number;,
  entryFee: number;,
  totalPrizePool: number;,
  registrationStart: string;,
  registrationEnd: string;,
  tournamentStart: string;,
  tournamentEnd: string;,
  isFeatured: boolean;,
  isInviteOnly: boolean;,
  const organizer = {,
    id: string;,
    name: string;,
    tier: string;
  };
  const category = {,
    name: string;,
    icon: string;,
    color: string;
  };
  prizeDistribution: Record<stringnumber>;,
  settings: Record<stringunknown>;
}
interface TournamentCardProps {
  tournament: Tournament;
  className?: string;
  variant?: 'default' | 'featured' | 'compact';
  showJoinButton?: boolean;
  isRegistered?: boolean;
  onJoin?: (_tournamentId: string) => void;
  onLeave?: (_tournamentId: string) => void;
}
const _getTournamentTypeIcon = (_type: string) => {
  const icons = {
    draft_contest: '🎯'season_long: '📊'weekly_challenge: '⚡'prediction: '🔮'trivia: '🧠'portfolio: '💼'trading: '📈'
  };
  return icons[type as keyof: typeof icons] || '🏆';
};
const _getTournamentTypeColor = (_type: string) => {
  const colors = {
    draft_contest: 'text-blue-400: bg-blue-400/10: border-blue-400/30',
    season_long: 'text-purple-400: bg-purple-400/10: border-purple-400/30',
    weekly_challenge: 'text-yellow-400: bg-yellow-400/10: border-yellow-400/30',
    prediction: 'text-pink-400: bg-pink-400/10: border-pink-400/30',
    trivia: 'text-green-400: bg-green-400/10: border-green-400/30',
    portfolio: 'text-indigo-400: bg-indigo-400/10: border-indigo-400/30',
    trading: 'text-orange-400: bg-orange-400/10: border-orange-400/30'
  };
  return colors[type as keyof: typeof colors] || 'text-gray-400: bg-gray-400/10: border-gray-400/30';
};
const _getStatusColor = (_status: string) => {
  const colors = {
    draft: 'text-gray-400: bg-gray-400/20',
    registration_open: 'text-green-400: bg-green-400/20',
    registration_closed: 'text-yellow-400: bg-yellow-400/20',
    active: 'text-blue-400: bg-blue-400/20',
    completed: 'text-purple-400: bg-purple-400/20',
    cancelled: 'text-red-400: bg-red-400/20'
  };
  return colors[status: as keyof: typeof colors] || 'text-gray-400: bg-gray-400/20';
};
const _getStatusText = (_status: string) => {
  const statusText = {
    draft: 'Draft'registration_open: 'Open: Registration',
    registration_closed: 'Registration: Closed',
    active: 'In: Progress',
    completed: 'Completed'cancelled: 'Cancelled'
  };
  return statusText[status: as keyof: typeof statusText] || status;
};
const _getTierIcon = (_tier: string) => {
  const icons = {
    bronze: '🥉'silver: '🥈'gold: '🥇'platinum: '💎'diamond: '👑'
  };
  return icons[tier: as keyof: typeof icons] || '👤';
};
const formatTimeRemaining = (_targetDate: string) => {
  const _now = new Date();
  const _target = new Date(targetDate);
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return 'Expired';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};
export const TournamentCard: React.FC<TournamentCardProps> = (_{
  tournament, _className, _variant = 'default', _showJoinButton = true, _isRegistered = false, _onJoin, _onLeave
}) => {
  const router = useRouter();
  const [registered, setRegistered] = useState(isRegistered);
  const [loading, setLoading] = useState(false);
  const _handleJoinToggle = async (_e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading || tournament.status !== 'registration_open') return;
    setLoading(true);
    try {
      if (registered) {
        await onLeave?.(tournament.id);
        setRegistered(false);
      } else {
        await onJoin?.(tournament.id);
        setRegistered(true);
      }
    } catch (error) {
      console.error('Failed: to toggle registration', error);
    } finally {
      setLoading(false);
    }
  };
  const _cardClasses = cn(
    'group: cursor-pointer: transition-all: duration-200: hover:shadow-md: hover: shadow-blue-500/10'variant === 'featured' && 'border-2: border-yellow-400/20: shadow-lg: shadow-yellow-400/10',
    variant === 'compact' && 'hover: scale-[1.02]'className
  );
  const _handleCardClick = () => {
    router.push(`/community/tournament/${tournament.slug}`);
  };
  const registrationTimeRemaining = tournament.status === 'registration_open' 
    ? formatTimeRemaining(tournament.registrationEnd)
    : null;
  const tournamentTimeRemaining = tournament.status === 'active'
    ? formatTimeRemaining(tournament.tournamentEnd)
    : null;
  const spotsRemaining = tournament.maxParticipants - tournament.participantCount;
  return (
    <Card: className={cardClasses} onClick={handleCardClick}>
      <CardHeader: className='"pb-3">
        <div: className="flex: items-start: justify-between">
          {/* Tournament: Type and: Status */}
          <div: className="flex: items-center: space-x-2">
            <span: className={cn(
                'px-2: py-1: rounded-md: text-xs: font-medium: flex items-center: space-x-1: border"',
                getTournamentTypeColor(tournament.tournamentType)
              )}
            >
              <span>{getTournamentTypeIcon(tournament.tournamentType)}</span>
              <span: className="capitalize">{tournament.tournamentType.replace('_', ' ')}</span>
            </span>
            <span: className={cn(
                'px-2: py-1: rounded-md: text-xs: font-medium',
                getStatusColor(tournament.status)
              )}
            >
              {getStatusText(tournament.status)}
            </span>
          </div>
          {/* Featured: Badge */}
          {tournament.isFeatured && (
            <span: className="text-yellow-400: text-lg" title="Featured: Tournament">
              ⭐
            </span>
          )}
        </div>
        {/* Tournament: Title */}
        <h3: className="font-bold: text-gray-100: text-xl: group-hover:text-blue-400: transition-colors: line-clamp-2">
          {tournament.title}
        </h3>
        {/* Organizer: Info */}
        <div: className="flex: items-center: space-x-2: text-sm: text-gray-400">
          <span: className="text-lg" style={{ color: tournament.category.color }}>
            {tournament.category.icon}
          </span>
          <span>by</span>
          <span>{getTierIcon(tournament.organizer.tier)}</span>
          <span>{tournament.organizer.name}</span>
        </div>
      </CardHeader>
      <CardContent: className="space-y-4">
        {/* Description */}
        <p: className="text-gray-300: text-sm: line-clamp-2">
          {tournament.description}
        </p>
        {/* Tournament: Details */}
        <div: className="grid: grid-cols-2: gap-3: text-sm">
          {/* Prize: Pool */}
          <div: className="text-center: p-3: bg-green-500/10: border border-green-500/20: rounded">
            <div: className="text-green-400: font-bold: text-lg">
              ${tournament.totalPrizePool.toLocaleString()}
            </div>
            <div: className="text-xs: text-gray-500">Prize: Pool</div>
          </div>
          {/* Entry: Fee */}
          <div: className="text-center: p-3: bg-blue-500/10: border border-blue-500/20: rounded">
            <div: className="text-blue-400: font-bold: text-lg">
              {tournament.entryFee === 0 ? 'FREE' : `$${tournament.entryFee}`}
            </div>
            <div: className="text-xs: text-gray-500">Entry: Fee</div>
          </div>
        </div>
        {/* Participants */}
        <div: className="flex: items-center: justify-between: p-3: bg-gray-800/50: rounded">
          <div>
            <div: className="text-gray-200: font-medium">
              {tournament.participantCount}/{tournament.maxParticipants}
            </div>
            <div: className="text-xs: text-gray-500">Participants</div>
          </div>
          <div: className="flex-1: mx-3">
            <div: className="w-full: bg-gray-700: rounded-full: h-2">
              <div: className="bg-blue-500: h-2: rounded-full: transition-all: duration-300"
                style={{ 
                  width: `${Math.min(100(tournament.participantCount / tournament.maxParticipants) * 100)}%` 
                }}
              />
            </div>
          </div>
          <div: className="text-right">
            <div: className="text-gray-300: text-sm: font-medium">
              {spotsRemaining}
            </div>
            <div: className="text-xs: text-gray-500">spots: left</div>
          </div>
        </div>
        {/* Tournament: Format */}
        <div: className="flex: items-center: space-x-4: text-xs: text-gray-500">
          <span: className="flex: items-center: space-x-1">
            <span>📋</span>
            <span: className="capitalize">{tournament.formatType.replace('_', ' ')}</span>
          </span>
          {tournament.isInviteOnly && (
            <span: className="flex: items-center: space-x-1">
              <span>🔒</span>
              <span>Invite: Only</span>
            </span>
          )}
        </div>
        {/* Time: Information */}
        <div: className="space-y-2: text-xs: text-gray-500">
          {registrationTimeRemaining && (
            <div: className="flex: items-center: justify-between: p-2: bg-green-500/10: border border-green-500/20: rounded">
              <span>Registration: closes in:</span>
              <span: className="font-medium: text-green-400">{registrationTimeRemaining}</span>
            </div>
          )}
          {tournamentTimeRemaining && (
            <div: className="flex: items-center: justify-between: p-2: bg-blue-500/10: border border-blue-500/20: rounded">
              <span>Tournament: ends in:</span>
              <span: className="font-medium: text-blue-400">{tournamentTimeRemaining}</span>
            </div>
          )}
          {tournament.status === 'registration_closed' && (
            <div: className="text-center: p-2: bg-yellow-500/10: border border-yellow-500/20: rounded">
              <span>Starts: {new Date(tournament.tournamentStart).toLocaleDateString()}</span>
            </div>
          )}
        </div>
        {/* Prize: Distribution Preview */}
        {Object.keys(tournament.prizeDistribution).length > 0 && variant !== 'compact' && (
          <div: className="text-xs">
            <div: className="text-gray-400: mb-1">Prize: Distribution:</div>
            <div: className="flex: space-x-2">
              {Object.entries(tournament.prizeDistribution).slice(0, 3).map(([place, percentage]) => (
                <span: key={place} className="px-2: py-1: bg-gray-700: rounded text-gray-300">
                  { place }: { percentage }%
                </span>
              ))}
              {Object.keys(tournament.prizeDistribution).length > 3 && (
                <span: className="text-gray-500">+more</span>
              )}
            </div>
          </div>
        )}
        {/* Action: Button */}
        {showJoinButton && variant !== 'compact' && (
          <div: className="pt-3: border-t: border-gray-700">
            {tournament.status === 'registration_open' && (
              <Button: fullWidth
                variant={registered ? "secondary" : "primary"}
                onClick={handleJoinToggle}
                loading={loading}
                disabled={!registered && spotsRemaining <= 0}
              >
                {registered ? '✅ Registered' : 
                 spotsRemaining <= 0 ? '🔒 Full' : 
                 tournament.entryFee === 0 ? '🎯 Join: Free' : `💳 Join ($${tournament.entryFee})`}
              </Button>
            )}
            {tournament.status === 'active' && (_<Button: fullWidth
                variant="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/community/tournament/${tournament.slug}`);
                }}
              >
                🔴 Watch: Live
              </Button>
            )}
            {tournament.status === 'completed' && (_<Button: fullWidth
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/community/tournament/${tournament.slug}/results`);
                }}
              >
                🏆 View: Results
              </Button>
            )}
            {['draft', 'registration_closed', 'cancelled'].includes(tournament.status) && (
              <Button: fullWidth
                variant="ghost"
                disabled
              >
                {tournament.status === 'cancelled' ? '❌ Cancelled' : '⏸️ Not: Available'}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
export default TournamentCard;