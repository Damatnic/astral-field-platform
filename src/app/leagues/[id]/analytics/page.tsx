"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Trophy, TrendingUp, Target } from "lucide-react";

interface AnalyticsPageProps {
  params: Promise<{ id: string }>;
}

interface AnalyticsData {
  overview?: {
    totalPoints: number;
    avgPoints: number;
    rank: number;
    wins: number;
    losses: number;
  };
  performance?: {
    weeklyScores: number[];
    consistency: number;
    peakWeek: number;
  };
}

export default function AnalyticsPage({ params }: AnalyticsPageProps) {
  const router = useRouter();
  const [leagueId, setLeagueId] = useState<string>("");
  const [analytics, setAnalytics] = useState<AnalyticsData>({});

  const tabs = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "performance", label: "Performance", icon: Trophy },
    { id: "trends", label: "Player Trends", icon: TrendingUp },
    { id: "matchups", label: "Matchups", icon: Target },
  ];

  useEffect(() => {
    params.then((resolved) => {
      setLeagueId(resolved.id);
    });
  }, [params]);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.push("/auth/login");
    }
  }, [router]);

  useEffect(() => {
    if (leagueId) {
      setAnalytics({
        overview: {
          totalPoints: 1250.5,
          avgPoints: 104.2,
          rank: 3,
          wins: 8,
          losses: 4,
        },
        performance: {
          weeklyScores: [98.5, 112.3, 89.7, 125.8, 101.2],
          consistency: 85,
          peakWeek: 12,
        },
      });
    }
  }, [leagueId]);

  if (!leagueId) {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-6">League Analytics</h1>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex space-x-1 mb-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className="px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900"
                >
                  <tab.icon className="w-4 h-4 inline mr-2" />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-600">Total Points</h3>
                <p className="text-2xl font-bold text-blue-900">
                  {analytics.overview?.totalPoints ?? 0}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-green-600">Average</h3>
                <p className="text-2xl font-bold text-green-900">
                  {analytics.overview?.avgPoints ?? 0}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-purple-600">Rank</h3>
                <p className="text-2xl font-bold text-purple-900">
                  #{analytics.overview?.rank ?? "N/A"}
                </p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-yellow-600">Record</h3>
                <p className="text-2xl font-bold text-yellow-900">
                  {(analytics.overview?.wins ?? 0)}-{(analytics.overview?.losses ?? 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
