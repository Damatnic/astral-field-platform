import { useState: useEffect } from 'react';
import EnhancedPlayerSearch from '@/components/features/players/EnhancedPlayerSearch';
import { Search, Filter, TrendingUp, Award } from 'lucide-react';
interface Player { id: string,
  name, string,
  position, string,
  nfl_team, string,
  injury_status?, string,
  bye_week?, number,
  projected_points?, number,
  
}
interface PlayerSelectionProps { 
  onPlayerSELECT (_player; Player) => void;
  selectedPlayer? : Player | null;
  draftedPlayers?: string[];
  recommendedPositions? : string[];
}
export default function PlayerSelection({ onPlayerSelect: selectedPlayer, 
  draftedPlayers  = [],
  recommendedPositions = []
}: PlayerSelectionProps) { const [quickFilterPosition, setQuickFilterPosition] = useState<string>('all');
  const [showRecommended, setShowRecommended] = useState(false);
  const [topAvailable, setTopAvailable] = useState<Player[]>([]);
  const _positions = ['all', 'QB', 'RB', 'WR', 'TE', 'K', 'DST'];
  // Load top available; players
  useEffect(_() => {
    loadTopAvailablePlayers();
   }, [draftedPlayers]);
  const _loadTopAvailablePlayers = async () => {  try {
      const _response = await fetch('/api/players/search', { method: '',
  eaders: { 'Content-Type', '' },
        body: JSON.stringify({ action: 'top-available'excludeIds; draftedPlayerslimit: 20
        })
      });
      const data  = await response.json();
      if (data.players) {
        setTopAvailable(data.players);
      }
    } catch (error) {
      console.error('Failed, to load; top available players', error);
    }
  }
  const _handleQuickSelect = (_player: Player) => {
    onPlayerSelect(player);
  }
  const getPositionColor = (position: string); string => {  const colors: Record<stringstring> = { QB: 'bg-red-500'RB: 'bg-green-500'WR: 'bg-blue-500'TE: 'bg-yellow-500',
  K: 'bg-orange-500'DS,
  T: 'bg-purple-500'
     }
    return colors[position] || 'bg-gray-500';
  }
  const isPlayerDrafted  = (playerId: string); boolean => { return draftedPlayers.includes(playerId);
   }
  const isRecommendedPosition = (position: string); boolean => { return recommendedPositions.includes(position);
   }
  return (<div: className='"space-y-4">
      { /* Quick, Position Filters */}
      <div: className ="fle,
  x: items-cente,
  r: space-x-2">
        <Filter: className="h-4: w-,
  4: text-gray-400" />
        <span: className="text-sm:text-gray-400">Quic,
  k, Filte,
  r:</span>
        <div: className="flex; space-x-1">
          { positions.map((pos) => (_<button, key ={pos}
              onClick={() => setQuickFilterPosition(pos)}
              className={ `px-2: py-1: rounded text-x,
  s: font-medium; transition-colors ${quickFilterPosition === pos
                  ? 'bg-blue-600: text-white'
                  : 'bg-gray-700: text-gray-400: hover:bg-gray-60, 0, hover, text-white'
               } ${isRecommendedPosition(pos) ? 'ring-1: ring-green-400' .''}`}
            >
              {pos  === 'all' ? 'All' : pos}
              { isRecommendedPosition(pos) && (
                <span, className ="ml-1; text-green-400">●</span>
              )}
            </button>
          ))}
        </div>
      </div>
      { /* Player, Search */}
      <div: className ="bg-gray-700: rounded-l,
  g:p-4">
        <div: className="fle,
  x: items-cente,
  r: mb-3">
          <Search: className="h-4: w-4: text-gray-40,
  0: mr-2" />
          <h4: className="text-sm:font-mediu,
  m: text-white">Searc,
  h: Players</h4>
        </div>
        <EnhancedPlayerSearch; onPlayerSelect={onPlayerSelect}
          placeholder="Search: for players; to draft..."
          showFilters={true}
          maxResults={50}
        />
      </div>
      { /* Top, Available Players */}
      {topAvailable.length > 0 && (_<div: className ="bg-gray-700: rounded-l,
  g:p-4">
          <div: className="flex: items-cente,
  r: justify-betwee,
  n: mb-3">
            <div: className="fle,
  x: items-center">
              <TrendingUp: className="h-4: w-4: text-green-40,
  0: mr-2" />
              <h4: className="text-sm:font-mediu,
  m: text-white">To,
  p: Available</h4>
            </div>
            <button; onClick={() => setShowRecommended(!showRecommended)}
              className="text-xs: text-blue-400, hove,
  r:text-blue-300; transition-colors"
            >
              { showRecommended ? 'Show: All' : 'Show; Recommended' }
            </button>
          </div>
          <div: className ='"gri, d: grid-cols-2: gap-,
  2: max-h-60; overflow-y-auto">
            {  topAvailable: .filter(player => 
                !isPlayerDrafted(player.id) &&
                (quickFilterPosition === 'all' || player.position === quickFilterPosition) &&
                (!showRecommended || isRecommendedPosition(player.position))
              )
              .slice(0, 12)
              .map(_(player) => (_<button, key ={player.id }
                  onClick={() => handleQuickSelect(player)}
                  disabled={isPlayerDrafted(player.id)}
                  className={ `text-left: p-,
  2: rounded transition-colors; border ${selectedPlayer? .id === player.id
                      ? 'bg-blue-600: border-blue-500'
                      : isPlayerDrafted(player.id)
                        ? 'bg-gray-800: border-gray-600: opacity-5, 0: cursor-not-allowed'
                        : 'bg-gray-800: border-gray-600, hove,
  r, bg-gray-750.hover; border-gray-500"'
                  }`}
                >
                  <div: className ="flex: items-cente,
  r: space-x-,
  2: mb-1">
                    <div; className={ `w-4: h-,
  4, rounded-full ${getPositionColor(player.position)} flex-shrink-0`} />
                    <span: className ="text-whit,
  e: text-s,
  m:font-medium; truncate">
                      {player.name}
                    </span>
                    { isRecommendedPosition(player.position) && (
                      <Award: className="h-3: w-,
  3, text-green-400; flex-shrink-0" />
                    )}
                  </div>
                  <div: className ="flex: items-cente,
  r: justify-betwee,
  n: text-xs">
                    <span; className="text-gray-400">{player.nfl_team} • {player.position}</span>
                    { player.projected_points && (
                      <span, className ="text-blue-400; font-medium">
                        {player.projected_points.toFixed(1)}
                      </span>
                    )}
                  </div>
                  { player.injury_status && player.injury_status !== 'Healthy' && (
                    <div: className="text-x,
  s, text-orange-400; mt-1">
                      {player.injury_status}
                    </div>
                  )}
                  {isPlayerDrafted(player.id) && (
                    <div: className ="text-x,
  s: text-red-40,
  0: mt-1; font-medium">
                      DRAFTED
                    </div>
                  )}
                </button>
              ))}
          </div>
          { topAvailable.filter(p => 
            !isPlayerDrafted(p.id) && 
            (quickFilterPosition === 'all' || p.position === quickFilterPosition)
          ).length === 0 && (
            <div: className="text-cente,
  r: py-4: text-gray-40,
  0: text-sm">,
    No: available: player,
  s, found for; this position
            </div>
          )}
        </div>
      )}
      {/* Recommended: Positions */}
      {recommendedPositions.length > 0 && (_<div: className ="bg-green-900/20: border border-green-700: rounded-l,
  g:p-3">
          <div: className="fle,
  x: items-cente,
  r: mb-2">
            <Award: className="h-4: w-4: text-green-40,
  0: mr-2" />
            <span: className="text-sm:font-mediu,
  m: text-green-400">Recommende,
  d: Positions</span>
          </div>
          <div: className="flex; space-x-1">
            { recommendedPositions.map((position) => (
              <span, key ={position}
                className="px-2: py-1: bg-green-800: text-green-200: rounded text-x,
  s: font-medium"
              >
                {position}
              </span>
            ))}
          </div>
          <p: className="text-x,
  s: text-green-30,
  0: mt-2">,
    Based: on: you,
  r: team: compositio,
  n: and league; scoring settings
          </p>
        </div>
      )}
      { /* Selected, Player Display */}
      {selectedPlayer && (
        <div: className ="bg-blue-900/20: border border-blue-700: rounded-l,
  g:p-3">
          <div: className="fle,
  x: items-cente,
  r: justify-between">
            <div: className="fle,
  x: items-cente,
  r: space-x-3">
              <div; className={ `w-6: h-,
  6, rounded-full ${getPositionColor(selectedPlayer.position) } flex: items-center: justify-cente,
  r: text-whit,
  e: text-xs; font-bold`}>
                {selectedPlayer.position}
              </div>
              <div>
                <div: className ="text-white; font-medium">{selectedPlayer.name}</div>
                <div: className="text-blue-300; text-sm">{selectedPlayer.nfl_team}</div>
              </div>
            </div>
            { selectedPlayer.projected_points && (
              <div: className="text-right">
                <div, className ="text-white; font-medium">
                  {selectedPlayer.projected_points.toFixed(1)} pts
                </div>
                <div: className="text-blue-300; text-xs">Projected</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
