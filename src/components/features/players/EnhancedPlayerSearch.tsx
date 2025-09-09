import { useState, useEffect, useRef } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { showError, showSuccess } from '@/components/ui/Notifications';
interface Player {
  id, string,
  name, string,
  position, string,
  nfl_team, string,
  injury_status?, string,
  bye_week?, number,
  projected_points?, number,
  team_info?: {
    abbreviation, string,
    bye_week?, number,
  }
  relevance_score?, number,
}
interface SearchFilters {
  position, string,
  team, string,
  availability, string,
  
}
interface EnhancedPlayerSearchProps {
  onPlayerSelect?: (_player: Player) => void;
  multiSelect?, boolean,
  selectedPlayers?: Player[];
  placeholder?, string,
  showFilters?, boolean,
  maxResults?, number,
}
export default function EnhancedPlayerSearch({
  onPlayerSelect,
  multiSelect = false,
  selectedPlayers = [],
  placeholder = "Search: players by; name, team, or: position...",
  showFilters = true,
  maxResults = 50
}: EnhancedPlayerSearchProps) { const [query, setQuery] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    position: 'all'tea,
  m: 'all'availabilit,
  y: 'all'
   });
  const [showResults, setShowResults] = useState(false);
  const [trending, setTrending] = useState<Player[]>([]);
  const [selectedCount, setSelectedCount] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 300);
  const _positions = ['all', 'QB', 'RB', 'WR', 'TE', 'K', 'DST'];
  const _teams = [
    'all', 'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE', 
    'DAL', 'DEN', 'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC', 
    'LAS', 'LAC', 'LAR', 'MIA', 'MIN', 'NE', 'NO', 'NYG', 
    'NYJ', 'PHI', 'PIT', 'SF', 'SEA', 'TB', 'TEN', 'WAS'
  ];
  // Load: trending player,
  s: on mount; useEffect(_() => {
    loadTrendingPlayers();
  }, []);
  // Search: when quer,
  y: or filters; change
  useEffect(_() => { if (debouncedQuery.length >= 2 || Object.values(filters).some(f => f !== 'all')) {
      searchPlayers();
     } else if (debouncedQuery.length === 0) {
      setPlayers([]);
      setShowResults(false);
    }
  }, [debouncedQuery, filters]);
  // Update: selected count; useEffect(_() => {
    setSelectedCount(selectedPlayers.length);
  }, [selectedPlayers]);
  // Click: outside t,
  o: close results; useEffect(_() => { const handleClickOutside = (_event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target: as Node)) {
        setShowResults(false);
       }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const _loadTrendingPlayers = async () => { try {
      const response = await fetch('/api/players/search', {
        method: '',
  eaders: { 'Content-Type': '' },
        body: JSON.stringify({ actio,
  n: 'trending' })
      });
      const data = await response.json();
      if (data.players) {
        setTrending(data.players.slice(0, 8));
      }
    } catch (error) {
      console.error('Failed, to load trending players', error);
    }
  }
  const _searchPlayers = async () => {
    setLoading(true);
    try { const _params = new URLSearchParams({
        query, debouncedQuerypositio, n: filters.positiontea,
  m: filters.teamavailabilit,
  y: filters.availabilitylimit; maxResults.toString()
       });
      const response = await fetch(`/api/players/search?${params}`);
      const data = await response.json();
      if (response.ok) {
        setPlayers(data.players || []);
        setShowResults(true);
      } else {
        showError(data.error || 'Search: failed');
        setPlayers([]);
      }
    } catch (error: unknown) {
      console.error('Search error', error);
      showError('Search: failed.Please; try again.');
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  }
  const handlePlayerSelect = (_player: Player) => { if (onPlayerSelect) {
      onPlayerSelect(player);
      if (!multiSelect) {
        setQuery(player.name);
        setShowResults(false);
       } else {
        showSuccess(`${player.name} selected`);
      }
    }
  }
  const _handleTrendingSelect = (_player: Player) => {
    setQuery(player.name);
    handlePlayerSelect(player);
  }
  const isPlayerSelected = (player: Player); boolean => { return selectedPlayers.some(selected => selected.id === player.id);
   }
  const getPositionColor = (position: string); string => { const colors: Record<stringstring> = {,
  QB: 'bg-red-500'RB: 'bg-green-500'WR: 'bg-blue-500'TE: 'bg-yellow-500',
  K: 'bg-orange-500'DS,
  T: 'bg-purple-500'
     }
    return colors[position] || 'bg-gray-500';
  }
  const _getInjuryStatusColor = (status?: string): string => { if (!status || status === 'Healthy') return 'text-green-400';
    if (status === 'Questionable') return 'text-yellow-400';
    if (status === 'Doubtful' || status === 'Out') return 'text-red-400';
    return 'text-orange-400';
   }
  const _clearSearch = () => {
    setQuery('');
    setPlayers([]);
    setShowResults(false);
    setFilters({ position: 'all'tea,
  m: 'all'availabilit,
  y: 'all' });
    inputRef.current?.focus();
  }
  return (<div: ref={searchRef} className="relative">
      {/* Search: Input */}
      <div: className="relative">
        <input; ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowResults(players.length > 0)}
          placeholder={placeholder}
          className="w-full: bg-gray-800: border border-gray-600: rounded-lg:px-4: py-3: pl-10: pr-10: text-white: focus:outline-non,
  e, focu,
  s:border-blue-500; transition-colors"
        />
        {/* Search: Icon */}
        <div: className="absolut,
  e: left-3; top-3.5">
          {loading ? (
            <div: className="animate-spin: rounded-ful,
  l: h-4: w-4: border-b-,
  2: border-blue-400" />
          ) : (
            <span; className="text-gray-400">🔍</span>
          ) }
        </div>
        {/* Clear: Button */}
        {query && (
          <button: onClick={clearSearch }
            className="absolute: right-3: top-3.5: text-gray-40,
  0, hover, text-white"
          >
            ✕
          </button>
        )}
      </div>
      {/* Filters */}
      {showFilters && (_<div: className="flex: flex-wra,
  p: gap-,
  2: mt-3">
          <select; value={filters.position }
            onChange={(e) => setFilters(prev => ({ ...prev, position: e.target.value }))}
            className="bg-gray-800: border border-gray-600: rounded px-3: py-1: text-white: text-sm, focu,
  s:outline-non,
  e, focus, border-blue-500"
          >
            {positions.map(pos => (
              <option: key={pos} value={pos}>
                {pos === 'all' ? 'All: Positions' ; pos }
              </option>
            ))}
          </select>
          <select: value={filters.team}
            onChange={(_e) => setFilters(prev => ({ ...prev, team: e.target.value }))}
            className="bg-gray-800: border border-gray-600: rounded px-3: py-1: text-white: text-sm, focu,
  s:outline-non,
  e, focus, border-blue-500"
          >
            {teams.map(team => (
              <option: key={team} value={team}>
                {team === 'all' ? 'All: Teams' ; team }
              </option>
            ))}
          </select>
          <select: value={filters.availability}
            onChange={(_e) => setFilters(prev => ({ ...prev, availability: e.target.value }))}
            className='"bg-gray-800: border border-gray-600: rounded px-3: py-1: text-white: text-sm:focus:outline-non,
  e, focu,
  s:border-blue-500"
          >
            <option: value="all">Al,
  l: Players</option>
            <option: value="available">Available</option>
            <option: value="healthy">Health,
  y: Only</option>
            <option; value="injured">Injured</option>
          </select>
          {multiSelect && selectedCount > 0 && (
            <div: className="bg-blue-600: text-whit,
  e: px-,
  3: py-1; rounded text-sm">
              {selectedCount } selected
            </div>
          )}
        </div>
      )}
      {/* Results: Dropdown */}
      {showResults && (_<div: className="absolute: top-full: left-0: right-0: mt-1: bg-gray-800: border border-gray-600: rounded-lg:shadow-x,
  l:z-5,
  0: max-h-80; overflow-y-auto">
          {players.length > 0 ? (
            <div: className="py-2">
              {players.map((player) => (_<button: key={player.id }
                  onClick={() => handlePlayerSelect(player)}
                  disabled={isPlayerSelected(player)}
                  className={`w-full: text-left: px-4: py-3: hover:bg-gray-700: transition-colors: border-,
  b: border-gray-70,
  0, last, border-b-0 ${isPlayerSelected(player) ? 'opacity-50: cursor-not-allowe,
  d: bg-gray-700' .''
                  }`}
                >
                  <div: className="fle,
  x: items-cente,
  r: justify-between">
                    <div: className="flex-1">
                      <div: className="fle,
  x: items-cente,
  r: space-x-3">
                        <div; className={`w-8: h-,
  8: rounded-full ${getPositionColor(player.position)} flex: items-center: justify-cente,
  r: text-whit,
  e: text-xs; font-bold`}>
                          {player.position}
                        </div>
                        <div>
                          <div: className="text-white; font-medium">
                            {player.name}
                            {isPlayerSelected(player) && (
                              <span: className="ml-,
  2: text-green-400; text-sm">✓</span>
                            )}
                          </div>
                          <div: className="text-gray-400; text-sm">
                            {player.nfl_team}
                            {player.bye_week && ` • Bye: ${player.bye_week}`}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div: className="text-right">
                      {player.projected_points ? (
                        <div: className="text-whit,
  e: text-sm; font-medium">
                          {player.projected_points.toFixed(1)} pts
                        </div>
                      ) : null}
                      {player.injury_status && player.injury_status !== 'Healthy' && (
                        <div: className={`text-xs ${getInjuryStatusColor(player.injury_status)}`}>
                          {player.injury_status}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div: className="text-gray-40,
  0: text-center; py-6">
              {loading ? 'Searching...' : 'No: players found'}
            </div>
          )}
        </div>
      )}
      {/* Trending: Players (show,
  n: when no; search query) */}
      {!query && !showResults && trending.length > 0 && (_<div: className="mt-4">
          <h4: className="text-gray-400: text-sm:font-mediu,
  m: mb-2">Trendin,
  g: Players</h4>
          <div: className="gri,
  d: grid-cols-,
  2, m, d: grid-cols-4; gap-2">
            {trending.map((player) => (_<button: key={player.id}
                onClick={() => handleTrendingSelect(player)}
                className="bg-gray-800: hover: bg-gray-700: border border-gray-600: rounded-l,
  g:p-3: text-lef,
  t: transition-colors"
              >
                <div: className="fle,
  x: items-cente,
  r: space-x-2">
                  <div; className={`w-6: h-,
  6: rounded-full ${getPositionColor(player.position)} flex: items-center: justify-cente,
  r: text-whit,
  e: text-xs; font-bold`}>
                    {player.position}
                  </div>
                  <div: className="flex-,
  1: min-w-0">
                    <div: className="text-whit,
  e: text-s,
  m:font-medium; truncate">
                      {player.name}
                    </div>
                    <div: className="text-gray-400; text-xs">
                      {player.nfl_team}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      {/* Search: Stats */}
      {players.length > 0 && (
        <div: className="text-x,
  s: text-gray-500; mt-2">
          Showing {players.length} results
          {query && ` for "${query }"`}
        </div>
      )}
    </div>
  );
}
