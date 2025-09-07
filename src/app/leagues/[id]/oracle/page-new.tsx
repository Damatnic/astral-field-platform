'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, TrendingUp, Target } from 'lucide-react';

interface OraclePageProps {
  params: Promise<{ id: string }>;
}

interface Prediction {
  id: string;
  type: string;
  prediction: string;
  confidence: number;
  factors: string[];
}

interface Insight {
  id: string;
  title: string;
  description: string;
  action: string;
  priority: string;
}

export default function OraclePage({ params }: OraclePageProps) {
  const router = useRouter();
  const [leagueId, setLeagueId] = useState<string>('');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);

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
      // Mock oracle data
      setPredictions([
        {
          id: '1',
          type: 'weekly_winner',
          prediction: 'Your team has 78% chance to win this week',
          confidence: 78,
          factors: ['Strong QB matchup', 'Favorable weather']
        },
        {
          id: '2',
          type: 'playoff_odds',
          prediction: 'Current playoff probability: 85%',
          confidence: 85,
          factors: ['Strong record', 'Easy remaining schedule']
        }
      ]);

      setInsights([
        {
          id: '1',
          title: 'Waiver Wire Opportunity',
          description: 'Tank Dell has high upside potential this week',
          action: 'Consider adding to your roster',
          priority: 'high'
        },
        {
          id: '2',
          title: 'Trade Suggestion',
          description: 'Your RB depth could use improvement',
          action: 'Look for RB trade opportunities',
          priority: 'medium'
        }
      ]);
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
          <div className="flex items-center mb-6">
            <Brain className="w-8 h-8 text-purple-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">
              Fantasy Oracle
            </h1>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-4">
                <TrendingUp className="w-6 h-6 text-blue-500 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">
                  AI Predictions
                </h2>
              </div>
              <div className="space-y-4">
                {predictions.map((prediction) => (
                  <div key={prediction.id} className="border rounded-lg p-4">
                    <p className="font-medium text-gray-900 mb-2">
                      {prediction.prediction}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2 mr-3">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${prediction.confidence}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">
                          {prediction.confidence}%
                        </span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="flex flex-wrap gap-1">
                        {prediction.factors.map((factor, index) => (
                          <span
                            key={index}
                            className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                          >
                            {factor}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Target className="w-6 h-6 text-green-500 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Strategic Insights
                </h2>
              </div>
              <div className="space-y-4">
                {insights.map((insight) => (
                  <div key={insight.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">
                          {insight.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {insight.description}
                        </p>
                        <p className="text-sm font-medium text-blue-600">
                          {insight.action}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          insight.priority === 'high'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {insight.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
