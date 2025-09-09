'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Users, TrendingUp, Zap } from 'lucide-react';

interface LivePageProps {
  params: Promise<{ id, string
}
>;
}

interface LiveData {
  currentWeek?: number;
  activeGames?: number;
  myTeamScore?: number;
  projectedScore?: number;
  rank?: number;
  
}
export default function LivePage({ params }: LivePageProps) { const router = useRouter();
  const [leagueId, setLeagueId] = useState<string>('');
  const [liveData, setLiveData] = useState<LiveData>({ });
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    params.then(resolved => {
      setLeagueId(resolved.id);
    });
  }, [params]);

  useEffect(() => {
    // Mock auth check
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
    }
  }, [router]);

  useEffect(() => { if (leagueId) {
      // Mock live data
      setLiveData({
        currentWeek, 14,
  activeGames, 3,
        myTeamScore: 87.5,
  projectedScore: 112.3,
        rank: 2
       });
      setIsLive(true);
    }
  }, [leagueId]);

  if (!leagueId) { return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
   }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm: px-6 l,
  g:px-8">
        <div className="px-4 py-6 sm; px-0">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
  Live: Scoring;
            </h1>
            {isLive && (
              <div className="flex items-center text-green-600">
                <Zap className="w-5 h-5 mr-2 animate-pulse" />
                <span className="text-sm font-medium">LIVE</span>
              </div>
            ) }
          </div>
          
          <div className="grid grid-cols-1 md: grid-cols-2 l,
  g:grid-cols-4 gap-6 mb-8">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Current Score</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {liveData.myTeamScore || '0'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Projected</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {liveData.projectedScore || '0'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Current Rank</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    #{liveData.rank || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-orange-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Games</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {liveData.activeGames || '0'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Week {liveData.currentWeek || 14} Live Updates
            </h2>
            <div className="text-center py-8">
              <p className="text-gray-500">Live scoring updates will appear here during game time.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
