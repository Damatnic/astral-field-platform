# Astral Field Component Architecture

## Component Hierarchy & Data Flow

```
App Root
├── Providers (Auth, Theme, WebSocket, Query)
│   └── Layout Components
│       ├── Header (Navigation, User Menu, Notifications)
│       ├── Sidebar (League Navigation, Quick Actions)
│       └── Main Content Area
│           ├── Page Components
│           │   ├── Dashboard
│           │   ├── League Home
│           │   ├── My Team
│           │   ├── Players
│           │   ├── Matchup Center
│           │   ├── Trade Center
│           │   └── Draft Room
│           └── Feature Components
│               ├── Live Scoring
│               ├── Chat/Messages
│               └── Analytics
```

## Core Feature Components

### 1. League Homepage Component
```typescript
// components/features/league/LeagueHome.tsx
interface LeagueHomeProps {
  leagueId: string;
}

export const LeagueHome: React.FC<LeagueHomeProps> = ({ leagueId }) => {
  // Features:
  // - League standings table with win/loss records
  // - Recent transactions feed
  // - League chat/message board
  // - Upcoming matchups preview
  // - Power rankings widget
  // - Commissioner tools (if applicable)
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <StandingsTable leagueId={leagueId} />
        <UpcomingMatchups leagueId={leagueId} />
      </div>
      <div>
        <PowerRankings leagueId={leagueId} />
        <RecentActivity leagueId={leagueId} />
        <LeagueChat leagueId={leagueId} />
      </div>
    </div>
  );
};
```

### 2. My Team Component
```typescript
// components/features/team/MyTeam.tsx
interface MyTeamProps {
  teamId: string;
}

export const MyTeam: React.FC<MyTeamProps> = ({ teamId }) => {
  // Features:
  // - Current roster with player cards
  // - Lineup management (drag & drop)
  // - Team schedule and results
  // - Team statistics and trends
  // - Trophy case / achievements
  // - Trade offers pending
  
  return (
    <div className="space-y-6">
      <TeamHeader teamId={teamId} />
      <Tabs defaultValue="roster">
        <TabsList>
          <TabsTrigger value="roster">Roster</TabsTrigger>
          <TabsTrigger value="lineup">Lineup</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
        </TabsList>
        <TabsContent value="roster">
          <RosterManager teamId={teamId} />
        </TabsContent>
        <TabsContent value="lineup">
          <LineupBuilder teamId={teamId} />
        </TabsContent>
        <TabsContent value="schedule">
          <TeamSchedule teamId={teamId} />
        </TabsContent>
        <TabsContent value="stats">
          <TeamStats teamId={teamId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
```

### 3. Players Hub Component
```typescript
// components/features/players/PlayersHub.tsx
export const PlayersHub: React.FC = () => {
  // Features:
  // - Advanced search and filters
  // - Available players grid/list view
  // - Player comparison tool
  // - Trending players
  // - Research tools (news, stats, projections)
  // - Waiver wire targets
  // - Watch list management
  
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="lg:w-64">
        <PlayerFilters />
        <TrendingPlayers />
      </div>
      <div className="flex-1">
        <PlayerSearch />
        <ViewToggle />
        <PlayerGrid />
      </div>
      <div className="lg:w-80">
        <PlayerComparison />
        <WatchList />
      </div>
    </div>
  );
};
```

### 4. Matchup Center Component
```typescript
// components/features/matchup/MatchupCenter.tsx
interface MatchupCenterProps {
  matchupId: string;
}

export const MatchupCenter: React.FC<MatchupCenterProps> = ({ matchupId }) => {
  // Features:
  // - Live scoring with play-by-play
  // - Head-to-head team comparison
  // - Projected vs actual scores
  // - Player performance tracking
  // - Win probability meter
  // - Optimal lineup analysis
  
  return (
    <div className="space-y-6">
      <MatchupHeader matchupId={matchupId} />
      <LiveScoreBoard matchupId={matchupId} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TeamLineupCard team="home" matchupId={matchupId} />
        <TeamLineupCard team="away" matchupId={matchupId} />
      </div>
      <PlayByPlayFeed matchupId={matchupId} />
    </div>
  );
};
```

### 5. Trade Center Component
```typescript
// components/features/trade/TradeCenter.tsx
export const TradeCenter: React.FC = () => {
  // Features:
  // - Trade proposal builder
  // - AI-powered trade analyzer
  // - Trade impact projections
  // - Counter-offer system
  // - Trade history
  // - Multi-team trade support
  
  return (
    <div className="space-y-6">
      <TradeBuilder />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActiveTrades />
          <TradeHistory />
        </div>
        <div>
          <TradeAnalyzer />
          <TradeSuggestions />
        </div>
      </div>
    </div>
  );
};
```

### 6. Draft Room Component
```typescript
// components/features/draft/DraftRoom.tsx
interface DraftRoomProps {
  draftId: string;
}

export const DraftRoom: React.FC<DraftRoomProps> = ({ draftId }) => {
  // Features:
  // - Real-time draft board
  // - Player queue system
  // - Auto-draft settings
  // - Timer with audio alerts
  // - Chat integration
  // - Best available players
  // - Position needs indicator
  
  return (
    <div className="h-screen flex flex-col">
      <DraftHeader draftId={draftId} />
      <div className="flex-1 grid grid-cols-12 gap-4 p-4">
        <div className="col-span-2">
          <DraftOrder draftId={draftId} />
        </div>
        <div className="col-span-7">
          <DraftBoard draftId={draftId} />
          <PlayerPool draftId={draftId} />
        </div>
        <div className="col-span-3">
          <MyTeamRoster draftId={draftId} />
          <PlayerQueue draftId={draftId} />
          <DraftChat draftId={draftId} />
        </div>
      </div>
    </div>
  );
};
```

## Reusable UI Components

### Player Card Component
```typescript
// components/ui/PlayerCard.tsx
interface PlayerCardProps {
  playerId: string;
  variant?: 'compact' | 'detailed' | 'roster';
  showActions?: boolean;
  isLocked?: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  playerId,
  variant = 'compact',
  showActions = false,
  isLocked = false
}) => {
  const player = usePlayer(playerId);
  
  return (
    <Card className={cn(
      "relative",
      isLocked && "opacity-60",
      variant === 'compact' && "p-2",
      variant === 'detailed' && "p-4"
    )}>
      <div className="flex items-center gap-3">
        <PlayerAvatar player={player} />
        <div className="flex-1">
          <h4 className="font-semibold">{player.name}</h4>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{player.position}</Badge>
            <span>{player.team}</span>
            {player.injuryStatus && (
              <InjuryIndicator status={player.injuryStatus} />
            )}
          </div>
        </div>
        {showActions && (
          <PlayerActions playerId={playerId} />
        )}
      </div>
      {variant === 'detailed' && (
        <PlayerStats playerId={playerId} />
      )}
      {isLocked && (
        <LockedOverlay />
      )}
    </Card>
  );
};
```

### Live Score Ticker Component
```typescript
// components/ui/LiveScoreTicker.tsx
interface LiveScoreTickerProps {
  matchupId: string;
}

export const LiveScoreTicker: React.FC<LiveScoreTickerProps> = ({ matchupId }) => {
  const { homeScore, awayScore, isLive } = useLiveScore(matchupId);
  
  return (
    <div className="flex items-center justify-between p-4 bg-card rounded-lg">
      <TeamScore team="home" score={homeScore} />
      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold">VS</span>
        {isLive && (
          <Badge variant="destructive" className="animate-pulse">
            LIVE
          </Badge>
        )}
      </div>
      <TeamScore team="away" score={awayScore} />
    </div>
  );
};
```

### Standings Table Component
```typescript
// components/ui/StandingsTable.tsx
interface StandingsTableProps {
  leagueId: string;
  variant?: 'full' | 'compact';
}

export const StandingsTable: React.FC<StandingsTableProps> = ({
  leagueId,
  variant = 'full'
}) => {
  const standings = useStandings(leagueId);
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Rank</TableHead>
          <TableHead>Team</TableHead>
          <TableHead>W-L</TableHead>
          {variant === 'full' && (
            <>
              <TableHead>PF</TableHead>
              <TableHead>PA</TableHead>
              <TableHead>Streak</TableHead>
            </>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {standings.map((team, index) => (
          <TableRow key={team.id}>
            <TableCell>{index + 1}</TableCell>
            <TableCell>
              <TeamName team={team} />
            </TableCell>
            <TableCell>{team.wins}-{team.losses}</TableCell>
            {variant === 'full' && (
              <>
                <TableCell>{team.pointsFor}</TableCell>
                <TableCell>{team.pointsAgainst}</TableCell>
                <TableCell>
                  <StreakBadge streak={team.streak} />
                </TableCell>
              </>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
```

## State Management

### League Context
```typescript
// contexts/LeagueContext.tsx
interface LeagueContextValue {
  league: League | null;
  currentWeek: number;
  userTeam: Team | null;
  isCommissioner: boolean;
  updateLeagueSettings: (settings: Partial<LeagueSettings>) => Promise<void>;
}

export const LeagueProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [league, setLeague] = useState<League | null>(null);
  
  // Provide league data to all child components
  return (
    <LeagueContext.Provider value={{
      league,
      currentWeek: league?.currentWeek || 1,
      userTeam: getUserTeam(),
      isCommissioner: checkCommissioner(),
      updateLeagueSettings
    }}>
      {children}
    </LeagueContext.Provider>
  );
};
```

### Real-time Updates with WebSocket
```typescript
// hooks/useWebSocket.ts
export const useWebSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  
  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_WS_URL);
    
    newSocket.on('score:update', handleScoreUpdate);
    newSocket.on('trade:proposed', handleTradeProposed);
    newSocket.on('draft:pick', handleDraftPick);
    
    setSocket(newSocket);
    
    return () => {
      newSocket.close();
    };
  }, []);
  
  return socket;
};
```

## Performance Optimizations

### 1. Virtual Scrolling for Large Lists
```typescript
// components/ui/VirtualList.tsx
import { FixedSizeList } from 'react-window';

export const VirtualPlayerList: React.FC<{ players: Player[] }> = ({ players }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <PlayerCard playerId={players[index].id} />
    </div>
  );
  
  return (
    <FixedSizeList
      height={600}
      itemCount={players.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
};
```

### 2. Optimistic UI Updates
```typescript
// hooks/useOptimisticUpdate.ts
export const useOptimisticLineup = () => {
  const queryClient = useQueryClient();
  
  const updateLineup = useMutation({
    mutationFn: api.updateLineup,
    onMutate: async (newLineup) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(['lineup']);
      
      // Snapshot previous value
      const previousLineup = queryClient.getQueryData(['lineup']);
      
      // Optimistically update
      queryClient.setQueryData(['lineup'], newLineup);
      
      return { previousLineup };
    },
    onError: (err, newLineup, context) => {
      // Rollback on error
      queryClient.setQueryData(['lineup'], context.previousLineup);
    },
    onSettled: () => {
      // Refetch after error or success
      queryClient.invalidateQueries(['lineup']);
    }
  });
  
  return updateLineup;
};
```

### 3. Code Splitting by Route
```typescript
// app/league/[id]/page.tsx
import dynamic from 'next/dynamic';

const LeagueHome = dynamic(
  () => import('@/components/features/league/LeagueHome'),
  { 
    loading: () => <LeagueSkeleton />,
    ssr: false 
  }
);

export default function LeaguePage({ params }) {
  return <LeagueHome leagueId={params.id} />;
}
```

## Mobile-First Responsive Design

### Responsive Layout Component
```typescript
// components/layout/ResponsiveLayout.tsx
export const ResponsiveLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col">
        <MobileHeader />
        <main className="flex-1 pb-16">
          {children}
        </main>
        <MobileBottomNav />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
```

## Testing Strategy

### Component Testing Example
```typescript
// __tests__/components/PlayerCard.test.tsx
import { render, screen } from '@testing-library/react';
import { PlayerCard } from '@/components/ui/PlayerCard';

describe('PlayerCard', () => {
  it('renders player information correctly', () => {
    const mockPlayer = {
      id: '1',
      name: 'Patrick Mahomes',
      position: 'QB',
      team: 'KC'
    };
    
    render(<PlayerCard playerId={mockPlayer.id} />);
    
    expect(screen.getByText('Patrick Mahomes')).toBeInTheDocument();
    expect(screen.getByText('QB')).toBeInTheDocument();
    expect(screen.getByText('KC')).toBeInTheDocument();
  });
  
  it('shows injury indicator when player is injured', () => {
    const injuredPlayer = {
      id: '2',
      name: 'Test Player',
      injuryStatus: 'questionable'
    };
    
    render(<PlayerCard playerId={injuredPlayer.id} />);
    
    expect(screen.getByTestId('injury-indicator')).toHaveClass('text-yellow-500');
  });
});
```

## Accessibility Guidelines

### ARIA Labels and Keyboard Navigation
```typescript
// components/ui/DraggablePlayer.tsx
export const DraggablePlayer: React.FC<{ player: Player }> = ({ player }) => {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${player.name}, ${player.position} for ${player.team}`}
      aria-grabbed={isDragging}
      onKeyDown={handleKeyDown}
      className="focus:ring-2 focus:ring-primary"
    >
      <PlayerCard playerId={player.id} />
    </div>
  );
};
```

## Conclusion

This component architecture provides:
- **Modularity**: Each component has a single responsibility
- **Reusability**: Common UI patterns are abstracted into shared components
- **Performance**: Optimizations for large datasets and real-time updates
- **Accessibility**: WCAG 2.1 compliance built-in
- **Testability**: Components are easily testable in isolation
- **Scalability**: Architecture supports growth to thousands of users

Focus on building core components first, then enhance with advanced features and optimizations.