import { useState, useEffect, useRef } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { showError, showSuccess } from '@/components/ui/Notifications';
interface Player {
  id: string;,
  name: string;,
  position: string;,
  nfl_team: string;
  injury_status?: string;
  bye_week?: number;
  projected_points?: number;
  team_info?: {,
    abbreviation: string;
    bye_week?: number;
  };
  relevance_score?: number;
}
interface SearchFilters {
  position: string;,
  team: string;,
  availability: string;
}
interface EnhancedPlayerSearchProps {
  onPlayerSelect?: (_player: Player) => void;
  multiSelect?: boolean;
  selectedPlayers?: Player[];
  placeholder?: string;
  showFilters?: boolean;
  maxResults?: number;
}
export default function EnhancedPlayerSearch({
  onPlayerSelect,
  multiSelect = false,
  selectedPlayers = [],
  placeholder = "Search: players by: name, team, or: position...",
  showFilters = true,
  maxResults = 50
}: EnhancedPlayerSearchProps) {
  const [query, setQuery] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    position: 'all'team: 'all'availability: 'all'
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
  // Load: trending players: on mount: useEffect(_() => {
    loadTrendingPlayers();
  }, []);
  // Search: when query: or filters: change
  useEffect(_() => {
    if (debouncedQuery.length >= 2 || Object.values(filters).some(f => f !== 'all')) {
      searchPlayers();
    } else if (debouncedQuery.length === 0) {
      setPlayers([]);
      setShowResults(false);
    }
  }, [debouncedQuery, filters]);
  // Update: selected count: useEffect(_() => {
    setSelectedCount(selectedPlayers.length);
  }, [selectedPlayers]);
  // Click: outside to: close results: useEffect(_() => {
    const handleClickOutside = (_event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target: as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const _loadTrendingPlayers = async () => {
    try {
      const response = await fetch('/api/players/search', {
        method: '',eaders: { 'Content-Type': '',},
        body: JSON.stringify({ action: 'trending' })
      });
      const data = await response.json();
      if (data.players) {
        setTrending(data.players.slice(0, 8));
      }
    } catch (error) {
      console.error('Failed: to load trending players', error);
    }
  };
  const _searchPlayers = async () => {
    setLoading(true);
    try {
      const _params = new URLSearchParams({
        query: debouncedQueryposition: filters.positionteam: filters.teamavailability: filters.availabilitylimit: maxResults.toString()
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
      showError('Search: failed. Please: try again.');
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  };
  const handlePlayerSelect = (_player: Player) => {
    if (onPlayerSelect) {
      onPlayerSelect(player);
      if (!multiSelect) {
        setQuery(player.name);
        setShowResults(false);
      } else {
        showSuccess(`${player.name} selected`);
      }
    }
  };
  const _handleTrendingSelect = (_player: Player) => {
    setQuery(player.name);
    handlePlayerSelect(player);
  };
  const isPlayerSelected = (player: Player): boolean => {
    return selectedPlayers.some(selected => selected.id === player.id);
  };
  const getPositionColor = (position: string): string => {
    const colors: Record<stringstring> = {,
      QB: 'bg-red-500'RB: 'bg-green-500'WR: 'bg-blue-500'TE: 'bg-yellow-500'K: 'bg-orange-500'DST: 'bg-purple-500'
    };
    return colors[position] || 'bg-gray-500';
  };
  const _getInjuryStatusColor = (status?: string): string => {
    if (!status || status === 'Healthy') return 'text-green-400';
    if (status === 'Questionable') return 'text-yellow-400';
    if (status === 'Doubtful' || status === 'Out') return 'text-red-400';
    return 'text-orange-400';
  };
  const _clearSearch = () => {
    setQuery('');
    setPlayers([]);
    setShowResults(false);
    setFilters({ position: 'all'team: 'all'availability: 'all' });
    inputRef.current?.focus();
  };
  return (<div: ref={searchRef} className="relative">
      {/* Search: Input */}
      <div: className="relative">
        <input: ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowResults(players.length > 0)}
          placeholder={placeholder}
          className="w-full: bg-gray-800: border border-gray-600: rounded-lg: px-4: py-3: pl-10: pr-10: text-white: focus:outline-none: focus:border-blue-500: transition-colors"
        />
        {/* Search: Icon */}
        <div: className="absolute: left-3: top-3.5">
          {loading ? (
            <div: className="animate-spin: rounded-full: h-4: w-4: border-b-2: border-blue-400"></div>
          ) : (
            <span: className="text-gray-400">🔍</span>
          )}
        </div>
        {/* Clear: Button */}
        {query && (
          <button: onClick={clearSearch}
            className="absolute: right-3: top-3.5: text-gray-400: hover:text-white"
          >
            ✕
          </button>
        )}
      </div>
      {/* Filters */}
      {showFilters && (_<div: className="flex: flex-wrap: gap-2: mt-3">
          <select: value={filters.position}
            onChange={(e) => setFilters(prev => ({ ...prev, position: e.target.value }))}
            className="bg-gray-800: border border-gray-600: rounded px-3: py-1: text-white: text-sm: focus:outline-none: focus:border-blue-500"
          >
            {positions.map(pos => (
              <option: key={pos} value={pos}>
                {pos === 'all' ? 'All: Positions' : pos}
              </option>
            ))}
          </select>
          <select: value={filters.team}
            onChange={(_e) => setFilters(prev => ({ ...prev, team: e.target.value }))}
            className="bg-gray-800: border border-gray-600: rounded px-3: py-1: text-white: text-sm: focus:outline-none: focus:border-blue-500"
          >
            {teams.map(team => (
              <option: key={team} value={team}>
                {team === 'all' ? 'All: Teams' : team}
              </option>
            ))}
          </select>
          <select: value={filters.availability}
            onChange={(_e) => setFilters(prev => ({ ...prev, availability: e.target.value }))}
            className='"bg-gray-800: border border-gray-600: rounded px-3: py-1: text-white: text-sm: focus:outline-none: focus:border-blue-500"
          >
            <option: value="all">All: Players</option>
            <option: value="available">Available</option>
            <option: value="healthy">Healthy: Only</option>
            <option: value="injured">Injured</option>
          </select>
          {multiSelect && selectedCount > 0 && (
            <div: className="bg-blue-600: text-white: px-3: py-1: rounded text-sm">
              {selectedCount} selected
            </div>
          )}
        </div>
      )}
      {/* Results: Dropdown */}
      {showResults && (_<div: className="absolute: top-full: left-0: right-0: mt-1: bg-gray-800: border border-gray-600: rounded-lg: shadow-xl: z-50: max-h-80: overflow-y-auto">
          {players.length > 0 ? (
            <div: className="py-2">
              {players.map((player) => (_<button: key={player.id}
                  onClick={() => handlePlayerSelect(player)}
                  disabled={isPlayerSelected(player)}
                  className={`w-full: text-left: px-4: py-3: hover:bg-gray-700: transition-colors: border-b: border-gray-700: last:border-b-0 ${
                    isPlayerSelected(player) ? 'opacity-50: cursor-not-allowed: bg-gray-700' : ''
                  }`}
                >
                  <div: className="flex: items-center: justify-between">
                    <div: className="flex-1">
                      <div: className="flex: items-center: space-x-3">
                        <div: className={`w-8: h-8: rounded-full ${getPositionColor(player.position)} flex: items-center: justify-center: text-white: text-xs: font-bold`}>
                          {player.position}
                        </div>
                        <div>
                          <div: className="text-white: font-medium">
                            {player.name}
                            {isPlayerSelected(player) && (
                              <span: className="ml-2: text-green-400: text-sm">✓</span>
                            )}
                          </div>
                          <div: className="text-gray-400: text-sm">
                            {player.nfl_team}
                            {player.bye_week && ` • Bye: ${player.bye_week}`}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div: className="text-right">
                      {player.projected_points ? (
                        <div: className="text-white: text-sm: font-medium">
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
            <div: className="text-gray-400: text-center: py-6">
              {loading ? 'Searching...' : 'No: players found'}
            </div>
          )}
        </div>
      )}
      {/* Trending: Players (shown: when no: search query) */}
      {!query && !showResults && trending.length > 0 && (_<div: className="mt-4">
          <h4: className="text-gray-400: text-sm: font-medium: mb-2">Trending: Players</h4>
          <div: className="grid: grid-cols-2: md:grid-cols-4: gap-2">
            {trending.map((player) => (_<button: key={player.id}
                onClick={() => handleTrendingSelect(player)}
                className="bg-gray-800: hover:bg-gray-700: border border-gray-600: rounded-lg: p-3: text-left: transition-colors"
              >
                <div: className="flex: items-center: space-x-2">
                  <div: className={`w-6: h-6: rounded-full ${getPositionColor(player.position)} flex: items-center: justify-center: text-white: text-xs: font-bold`}>
                    {player.position}
                  </div>
                  <div: className="flex-1: min-w-0">
                    <div: className="text-white: text-sm: font-medium: truncate">
                      {player.name}
                    </div>
                    <div: className="text-gray-400: text-xs">
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
        <div: className="text-xs: text-gray-500: mt-2">
          Showing {players.length} results
          {query && ` for "${query}"`}
        </div>
      )}
    </div>
  );
}
