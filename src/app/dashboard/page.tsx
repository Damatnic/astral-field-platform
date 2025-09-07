'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [leagues, setLeagues] = useState<{ id: string; name: string; teams: number }[]>([]);
  const [leaguesLoaded, setLeaguesLoaded] = useState(false);
  const [insights, setInsights] = useState<{ id: string; type: string; message: string }[]>([]);
  const [insightsLoaded, setInsightsLoaded] = useState(false);

  useEffect(() => {
    // Mock auth check
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
      } else {
        setUser({ name: 'Demo User' });
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    // Mock data loading
    const loadData = async () => {
      setLeagues([
        { id: '1', name: 'Demo League', teams: 12 },
        { id: '2', name: 'Friends League', teams: 10 }
      ]);
      setLeaguesLoaded(true);

      setInsights([
        { id: '1', type: 'waiver', message: 'Consider picking up Tank Dell' },
        { id: '2', type: 'trade', message: 'Good trade opportunity available' }
      ]);
      setInsightsLoaded(true);
    };

    if (user) {
      loadData();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Welcome to Astral Field, {user.name}!
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Your Leagues</h2>
                {leaguesLoaded ? (
                  leagues.length > 0 ? (
                    <ul className="space-y-2">
                      {leagues.map((league) => (
                        <li key={league.id} className="p-2 border rounded">
                          {league.name} - {league.teams} teams
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">No leagues yet</p>
                  )
                ) : (
                  <p>Loading leagues...</p>
                )}
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Fantasy Insights</h2>
                {insightsLoaded ? (
                  insights.length > 0 ? (
                    <ul className="space-y-2">
                      {insights.map((insight) => (
                        <li key={insight.id} className="p-2 border rounded">
                          <span className="text-sm text-blue-600">{insight.type}</span>
                          <p>{insight.message}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">No insights available</p>
                  )
                ) : (
                  <p>Loading insights...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
