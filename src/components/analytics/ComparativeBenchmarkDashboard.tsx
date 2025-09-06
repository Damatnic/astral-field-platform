'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Trophy, 
  Users, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight,
  Target,
  Lightbulb,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

interface ComparativeMetrics {
  userLeague: {
    leagueName: string;
    size: number;
    overallHealthScore: number;
    competitiveBalance: number;
    managerEngagement: number;
    tradingFrequency: number;
    waiverActivity: number;
    playoffCompetitiveness: number;
  };
  industryAverages: {
    overallHealthScore: number;
    competitiveBalance: number;
    managerEngagement: number;
    tradingFrequency: number;
    waiverActivity: number;
    playoffCompetitiveness: number;
  };
  topPercentile: {
    overallHealthScore: number;
    competitiveBalance: number;
    managerEngagement: number;
    tradingFrequency: number;
    waiverActivity: number;
    playoffCompetitiveness: number;
  };
  percentileRankings: {
    overallHealthScore: number;
    competitiveBalance: number;
    managerEngagement: number;
    tradingFrequency: number;
    waiverActivity: number;
    playoffCompetitiveness: number;
  };
  rankingsOutOf: number;
}

interface DetailedComparison {
  metric: string;
  userValue: number;
  industryAverage: number;
  topPercentile: number;
  userPercentile: number;
  trend: 'improving' | 'declining' | 'stable';
  recommendation: string;
  impact: 'high' | 'medium' | 'low';
}

interface BenchmarkingInsights {
  strengths: string[];
  improvementAreas: string[];
  actionableRecommendations: string[];
  seasonalTrends: string[];
  competitiveAdvantages: string[];
  riskFactors: string[];
}

interface BenchmarkData {
  comparativeMetrics: ComparativeMetrics;
  benchmarkingInsights: BenchmarkingInsights;
  detailedComparisons: DetailedComparison[];
  industryPositioning: string[];
  competitiveAnalysis: string[];
}

interface QuickBenchmark {
  overallRank: string;
  keyStrengths: string[];
  primaryConcerns: string[];
  quickWins: string[];
}

export default function ComparativeBenchmarkDashboard({ leagueId }: { leagueId: string }) {
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkData | null>(null);
  const [quickBenchmark, setQuickBenchmark] = useState<QuickBenchmark | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const loadQuickBenchmark = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/comparative-analysis?leagueId=${leagueId}&type=quick`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      setQuickBenchmark(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadFullBenchmark = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/comparative-analysis?leagueId=${leagueId}&type=full`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      setBenchmarkData(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuickBenchmark();
  }, [leagueId]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'declining': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (percentile >= 75) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (percentile >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (percentile >= 25) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'medium': return <Target className="w-4 h-4 text-yellow-500" />;
      default: return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    }
  };

  if (loading && !quickBenchmark) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">Error loading benchmark data: {error}</p>
            <Button onClick={loadQuickBenchmark} className="mt-4" variant="outline">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Overview */}
      {quickBenchmark && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              League Benchmark Overview
              <Button 
                onClick={loadFullBenchmark} 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Loading...' : 'Load Full Analysis'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <p className="font-semibold">{quickBenchmark.overallRank}</p>
                <p className="text-sm text-gray-600">Overall Position</p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="font-semibold">Key Strengths</span>
                </div>
                <ul className="text-sm space-y-1">
                  {quickBenchmark.keyStrengths.map((strength, index) => (
                    <li key={index} className="text-green-700">• {strength}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span className="font-semibold">Primary Concerns</span>
                </div>
                <ul className="text-sm space-y-1">
                  {quickBenchmark.primaryConcerns.map((concern, index) => (
                    <li key={index} className="text-red-700">• {concern}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-5 h-5 text-blue-500" />
                  <span className="font-semibold">Quick Wins</span>
                </div>
                <ul className="text-sm space-y-1">
                  {quickBenchmark.quickWins.map((win, index) => (
                    <li key={index} className="text-blue-700">• {win}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full Benchmark Analysis */}
      {benchmarkData && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="metrics">Detailed Metrics</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="positioning">Positioning</TabsTrigger>
            <TabsTrigger value="competitive">Competitive</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Overall Health Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">
                        {benchmarkData.comparativeMetrics.userLeague.overallHealthScore.toFixed(1)}
                      </span>
                      <Badge className={getPercentileColor(benchmarkData.comparativeMetrics.percentileRankings.overallHealthScore)}>
                        {benchmarkData.comparativeMetrics.percentileRankings.overallHealthScore.toFixed(0)}th percentile
                      </Badge>
                    </div>
                    <Progress 
                      value={benchmarkData.comparativeMetrics.userLeague.overallHealthScore} 
                      className="h-2"
                    />
                    <div className="text-sm text-gray-600">
                      Industry avg: {benchmarkData.comparativeMetrics.industryAverages.overallHealthScore.toFixed(1)} | 
                      Top 10%: {benchmarkData.comparativeMetrics.topPercentile.overallHealthScore.toFixed(1)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Manager Engagement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">
                        {benchmarkData.comparativeMetrics.userLeague.managerEngagement.toFixed(1)}%
                      </span>
                      <Badge className={getPercentileColor(benchmarkData.comparativeMetrics.percentileRankings.managerEngagement)}>
                        {benchmarkData.comparativeMetrics.percentileRankings.managerEngagement.toFixed(0)}th percentile
                      </Badge>
                    </div>
                    <Progress 
                      value={benchmarkData.comparativeMetrics.userLeague.managerEngagement} 
                      className="h-2"
                    />
                    <div className="text-sm text-gray-600">
                      Industry avg: {benchmarkData.comparativeMetrics.industryAverages.managerEngagement.toFixed(1)}% | 
                      Top 10%: {benchmarkData.comparativeMetrics.topPercentile.managerEngagement.toFixed(1)}%
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Competitive Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">
                        {benchmarkData.comparativeMetrics.userLeague.competitiveBalance.toFixed(2)}
                      </span>
                      <Badge className={getPercentileColor(benchmarkData.comparativeMetrics.percentileRankings.competitiveBalance)}>
                        {benchmarkData.comparativeMetrics.percentileRankings.competitiveBalance.toFixed(0)}th percentile
                      </Badge>
                    </div>
                    <Progress 
                      value={benchmarkData.comparativeMetrics.userLeague.competitiveBalance * 100} 
                      className="h-2"
                    />
                    <div className="text-sm text-gray-600">
                      Industry avg: {benchmarkData.comparativeMetrics.industryAverages.competitiveBalance.toFixed(2)} | 
                      Top 10%: {benchmarkData.comparativeMetrics.topPercentile.competitiveBalance.toFixed(2)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <div className="grid gap-4">
              {benchmarkData.detailedComparisons.map((comparison, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-lg">
                      <span className="flex items-center gap-2">
                        {comparison.metric}
                        {getTrendIcon(comparison.trend)}
                      </span>
                      <div className="flex items-center gap-2">
                        {getImpactIcon(comparison.impact)}
                        <Badge className={getPercentileColor(comparison.userPercentile)}>
                          {comparison.userPercentile.toFixed(0)}th percentile
                        </Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 border rounded">
                        <p className="text-sm text-gray-600">Your League</p>
                        <p className="text-xl font-bold">{comparison.userValue.toFixed(1)}</p>
                      </div>
                      <div className="text-center p-3 border rounded">
                        <p className="text-sm text-gray-600">Industry Average</p>
                        <p className="text-xl font-bold">{comparison.industryAverage.toFixed(1)}</p>
                      </div>
                      <div className="text-center p-3 border rounded">
                        <p className="text-sm text-gray-600">Top 10%</p>
                        <p className="text-xl font-bold">{comparison.topPercentile.toFixed(1)}</p>
                      </div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                      <p className="text-sm font-medium text-blue-800 mb-1">Recommendation:</p>
                      <p className="text-sm text-blue-700">{comparison.recommendation}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <CheckCircle2 className="w-5 h-5" />
                    Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {benchmarkData.benchmarkingInsights.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="w-5 h-5" />
                    Improvement Areas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {benchmarkData.benchmarkingInsights.improvementAreas.map((area, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm">{area}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <Lightbulb className="w-5 h-5" />
                    Actionable Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {benchmarkData.benchmarkingInsights.actionableRecommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-700">
                    <Target className="w-5 h-5" />
                    Competitive Advantages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {benchmarkData.benchmarkingInsights.competitiveAdvantages.map((advantage, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm">{advantage}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="positioning" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Industry Positioning Analysis</CardTitle>
                <p className="text-sm text-gray-600">
                  How your league compares to {benchmarkData.comparativeMetrics.rankingsOutOf.toLocaleString()} leagues in our database
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {benchmarkData.industryPositioning.map((insight, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded border">
                      <ArrowUpRight className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{insight}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="competitive" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Competitive Analysis</CardTitle>
                <p className="text-sm text-gray-600">
                  Analysis against leagues with similar characteristics
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {benchmarkData.competitiveAnalysis.map((analysis, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded border border-blue-200">
                      <Target className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{analysis}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}