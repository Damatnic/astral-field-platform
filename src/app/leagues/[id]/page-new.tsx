'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Trophy, TrendingUp, Settings } from 'lucide-react';

interface LeaguePageProps {
  params: Promise<{ id: string }>;
}

interface LeagueData {
  id: string;
  name: string;
  teams: number;
  currentWeek: number;
  season: number;
}

export default function LeaguePage({ params }: LeaguePageProps) {
  const router = useRouter();
  const [leagueId, setLeagueId] = useState<string>('');
  const [league, setLeague] = useState<LeagueData | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (leagueId) {
      // Mock league data loading
      setTimeout(() => {
        setLeague({
          id: leagueId,
          name: 'Demo Fantasy League',
          teams: 12,
          currentWeek: 14,
          season: 2024
        });
        setLoading(false);
      }, 1000);
    }
  }, [leagueId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading league...</div>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">League not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              {league.name}
            </h1>
            <p className="text-gray-600">
              {league.season} Season • Week {league.currentWeek} • {league.teams} Teams
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <button
              onClick={() => router.push(`/leagues/${leagueId}/live`)}
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <TrendingUp className="h-8 w-8 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">Live Scoring</h3>
              <p className="text-sm text-gray-600">Real-time game updates</p>
            </button>

            <button
              onClick={() => router.push(`/leagues/${leagueId}/draft`)}
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <Users className="h-8 w-8 text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">Draft Center</h3>
              <p className="text-sm text-gray-600">Manage your draft</p>
            </button>

            <button
              onClick={() => router.push(`/leagues/${leagueId}/analytics`)}
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <Trophy className="h-8 w-8 text-purple-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">Analytics</h3>
              <p className="text-sm text-gray-600">Performance insights</p>
            </button>

            <button
              onClick={() => router.push(`/leagues/${leagueId}/oracle`)}
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <Settings className="h-8 w-8 text-orange-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">Oracle</h3>
              <p className="text-sm text-gray-600">AI predictions</p>
            </button>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              League Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{league.teams}</p>
                <p className="text-sm text-gray-600">Teams</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{league.currentWeek}</p>
                <p className="text-sm text-gray-600">Current Week</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{league.season}</p>
                <p className="text-sm text-gray-600">Season</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
