"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Brain, TrendingUp, Target } from "lucide-react";

interface OraclePageProps {
  params: Promise<{ id: string }>;
}

type Insight = {
  id: string;
  title: string;
  description: string;
  action: string;
  priority: "low" | "medium" | "high";
};

export default function OraclePage({ params }: OraclePageProps) {
  const router = useRouter();
  const [leagueId, setLeagueId] = useState<string>("");
  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    params.then((resolved) => setLeagueId(resolved.id));
  }, [params]);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.push("/auth/login");
    }
  }, [router]);

  useEffect(() => {
    if (leagueId) {
      setInsights([
        {
          id: "1",
          title: "Waiver Wire Opportunity",
          description: "Tank Dell has high upside potential this week",
          action: "Consider adding to your roster",
          priority: "high",
        },
        {
          id: "2",
          title: "Trade Suggestion",
          description: "Your RB depth could use improvement",
          action: "Explore RB trade opportunities",
          priority: "medium",
        },
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
            <h1 className="text-3xl font-bold text-gray-900">Fantasy Oracle</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-4">
                <TrendingUp className="w-6 h-6 text-blue-500 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">AI Predictions</h2>
              </div>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <p className="font-medium text-gray-900 mb-2">
                    Your team has 78% chance to win this week
                  </p>
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2 mr-3">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `78%` }} />
                    </div>
                    <span className="text-sm text-gray-600">78%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Target className="w-6 h-6 text-green-500 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Strategic Insights</h2>
              </div>
              <div className="space-y-4">
                {insights.map((insight) => (
                  <div key={insight.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{insight.title}</h3>
                        <p className="text-sm text-gray-600">{insight.description}</p>
                        <p className="text-sm text-gray-500 mt-1">{insight.action}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
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

