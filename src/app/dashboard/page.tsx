'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  name: string;
  teamName: string;
  leagueId: number;
  icon: string;
}

interface Team {
  id: number;
  team_name: string;
  abbreviation: string;
  wins: number;
  losses: number;
  ties: number;
  points_for: number;
  owner_name: string;
}

interface League {
  id: number;
  name: string;
  season: number;
  team_count: number;
  teams: Team[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [league, setLeague] = useState<League | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWeek] = useState(1);

  useEffect(() => {
    // Check authentication and get user data
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      const profileId = localStorage.getItem('profileId');
      
      if (!token) {
        router.push('/');
        return;
      }

      // Get user data from localStorage (set during login)
      const userData = {
        id: parseInt(profileId || '1'),
        name: getUserName(parseInt(profileId || '1')),
        teamName: getTeamName(parseInt(profileId || '1')),
        leagueId: 1,
        icon: getIcon(parseInt(profileId || '1'))
      };
      
      setUser(userData);
    };
    
    checkAuth();
  }, [router]);

  useEffect(() => {
    // Load league data
    const loadLeagueData = async () => {
      if (!user) return;
      
      try {
        const response = await fetch('/api/init-league');
        const data = await response.json();
        
        if (data.initialized && data.league) {
          setLeague(data.league);
        } else {
          // Create mock league data if not initialized
          setLeague({
            id: 1,
            name: 'Astral Field Championship League',
            season: 2024,
            team_count: 10,
            teams: getMockStandings()
          });
        }
      } catch (error) {
        console.error('Error loading league:', error);
        // Use mock data on error
        setLeague({
          id: 1,
          name: 'Astral Field Championship League',
          season: 2024,
          team_count: 10,
          teams: getMockStandings()
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadLeagueData();
    }
  }, [user]);

  // Helper functions
  function getUserName(profileId: number): string {
    const names = [
      'Nicholas D\'Amato',
      'Brittany Bergum',
      'Cason Minor',
      'David Jarvey',
      'Demo User 1',
      'Demo User 2',
      'Demo User 3',
      'Demo User 4',
      'Demo User 5',
      'Admin User'
    ];
    return names[profileId - 1] || 'Unknown User';
  }

  function getTeamName(profileId: number): string {
    const teams = [
      'The Commanders',
      'Purple Reign',
      'Minor Threat',
      'Jarvey\'s Giants',
      'Dynasty Builders',
      'Trophy Hunters',
      'Rocket Squad',
      'Fire Starters',
      'Diamond Dogs',
      'Crown Royale'
    ];
    return teams[profileId - 1] || 'Unknown Team';
  }

  function getIcon(profileId: number): string {
    const icons = ['👤', '👥', '🏈', '⭐', '🏆', '🎯', '🚀', '🔥', '💎', '👑'];
    return icons[profileId - 1] || '👤';
  }

  function getMockStandings(): Team[] {
    return [
      { id: 1, team_name: 'The Commanders', abbreviation: 'CMD', wins: 0, losses: 0, ties: 0, points_for: 0, owner_name: 'Nicholas D\'Amato' },
      { id: 2, team_name: 'Purple Reign', abbreviation: 'PRG', wins: 0, losses: 0, ties: 0, points_for: 0, owner_name: 'Brittany Bergum' },
      { id: 3, team_name: 'Minor Threat', abbreviation: 'MTH', wins: 0, losses: 0, ties: 0, points_for: 0, owner_name: 'Cason Minor' },
      { id: 4, team_name: 'Jarvey\'s Giants', abbreviation: 'JGT', wins: 0, losses: 0, ties: 0, points_for: 0, owner_name: 'David Jarvey' },
      { id: 5, team_name: 'Dynasty Builders', abbreviation: 'DYN', wins: 0, losses: 0, ties: 0, points_for: 0, owner_name: 'Demo User 1' },
      { id: 6, team_name: 'Trophy Hunters', abbreviation: 'TPH', wins: 0, losses: 0, ties: 0, points_for: 0, owner_name: 'Demo User 2' },
      { id: 7, team_name: 'Rocket Squad', abbreviation: 'RSQ', wins: 0, losses: 0, ties: 0, points_for: 0, owner_name: 'Demo User 3' },
      { id: 8, team_name: 'Fire Starters', abbreviation: 'FIR', wins: 0, losses: 0, ties: 0, points_for: 0, owner_name: 'Demo User 4' },
      { id: 9, team_name: 'Diamond Dogs', abbreviation: 'DMD', wins: 0, losses: 0, ties: 0, points_for: 0, owner_name: 'Demo User 5' },
      { id: 10, team_name: 'Crown Royale', abbreviation: 'CRN', wins: 0, losses: 0, ties: 0, points_for: 0, owner_name: 'Admin User' }
    ];
  }

  if (!user || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span className="text-3xl">{user.icon}</span>
              <div>
                <h1 className="text-2xl font-bold text-white">{user.teamName}</h1>
                <p className="text-gray-400 text-sm">{user.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-400">Week {currentWeek}</span>
              <button
                onClick={() => {
                  localStorage.clear();
                  router.push('/');
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* League Info Card */}
          <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-sm rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              {league?.name || 'Astral Field Championship League'}
            </h2>
            
            {/* League Standings */}
            <div className="bg-gray-700/30 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-700/50 text-gray-300 text-sm">
                    <th className="text-left px-4 py-2">Rank</th>
                    <th className="text-left px-4 py-2">Team</th>
                    <th className="text-center px-4 py-2">W-L-T</th>
                    <th className="text-right px-4 py-2">PF</th>
                  </tr>
                </thead>
                <tbody>
                  {league?.teams.map((team, index) => (
                    <tr 
                      key={team.id} 
                      className={`border-t border-gray-700 ${
                        team.team_name === user.teamName ? 'bg-blue-600/20' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-gray-400">{index + 1}</td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-white font-medium">{team.team_name}</div>
                          <div className="text-gray-400 text-xs">{team.owner_name}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-300">
                        {team.wins}-{team.losses}-{team.ties}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-300">
                        {team.points_for.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            {/* Team Actions */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push(`/leagues/1/roster`)}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  My Roster
                </button>
                <button
                  onClick={() => router.push(`/leagues/1/waiver`)}
                  className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Waiver Wire
                </button>
                <button
                  onClick={() => router.push(`/leagues/1/trades`)}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Trade Center
                </button>
                <button
                  onClick={() => router.push(`/leagues/1`)}
                  className="w-full py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  League Home
                </button>
              </div>
            </div>

            {/* League Stats */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">League Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Season:</span>
                  <span className="text-white">{league?.season || 2024}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Teams:</span>
                  <span className="text-white">{league?.team_count || 10}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Scoring:</span>
                  <span className="text-white">PPR</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Playoffs:</span>
                  <span className="text-white">6 Teams</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Waiver:</span>
                  <span className="text-white">FAAB ($100)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Actions (only for admin user) */}
        {user.id === 10 && (
          <div className="mt-6 bg-yellow-600/10 border border-yellow-600/30 rounded-xl p-6">
            <h3 className="text-lg font-bold text-yellow-400 mb-4">Commissioner Tools</h3>
            <div className="flex gap-4">
              <button
                onClick={() => router.push('/admin/init')}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
              >
                Initialize League
              </button>
              <button
                onClick={() => router.push('/admin/setup')}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
              >
                League Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}