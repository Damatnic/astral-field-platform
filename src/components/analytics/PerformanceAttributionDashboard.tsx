'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Target,
  AlertCircle, 
  CheckCircle2,
  Clock,
  Users,
  Star,
  Zap,
  Brain,
  Calendar,
  Award,
  AlertTriangle,
  Activity,
  Eye
} from 'lucide-react';

interface AttributionAnalysis {
  decisionType: string;
  totalDecisions: number;
  successfulDecisions: number;
  successRate: number;
  averageImpact: number;
  totalPointsImpact: number;
  bestDecision: {
    description: string;
    impact: number;
    reasoning: string;
  };
  worstDecision: {
    description: string;
    impact: number;
    reasoning: string;
  };
}

interface DecisionPatterns {
  preferredStrategies: string[];
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  timingPatterns: Record<string, number>;
  positionBiases: Record<string, number>;
  successFactors: string[];
  improvementAreas: string[];
  behavioralInsights: string[];
}

interface SeasonPerformanceBreakdown {
  totalDecisions: number;
  overallSuccessRate: number;
  pointsFromDecisions: number;
  rankingImpact: number;
  keySuccesses: Array<{
    week: number;
    decision: string;
    impact: number;
    reasoning: string;
  }>;
  keyMisses: Array<{
    week: number;
    decision: string;
    impact: number;
    reasoning: string;
  }>;
  categoryBreakdown: Record<string, AttributionAnalysis>;
  comparedToLeague: {
    decisionFrequency: 'above_average' | 'average' | 'below_average';
    successRate: 'above_average' | 'average' | 'below_average';
    riskTaking: 'above_average' | 'average' | 'below_average';
  };
}

interface DecisionTracking {
  decisionId: string;
  decisionType: 'trade' | 'waiver' | 'lineup' | 'draft' | 'drop';
  description: string;
  weekNumber: number;
  expectedImpact: number;
  actualImpact?: number;
  impactTimeline: 'immediate' | 'short_term' | 'long_term' | 'season_long';
  aiRecommended: boolean;
  reasoning?: string;
  timestamp: Date;
}

export default function PerformanceAttributionDashboard({ leagueId }: { leagueId: string }) {
  const [performanceData, setPerformanceData] = useState<SeasonPerformanceBreakdown | null>(null);
  const [decisionPatterns, setDecisionPatterns] = useState<DecisionPatterns | null>(null);
  const [recentDecisions, setRecentDecisions] = useState<DecisionTracking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [trackingDecision, setTrackingDecision] = useState(false);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/performance-attribution?leagueId=${leagueId}&type=breakdown`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      setPerformanceData(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadDecisionPatterns = async () => {
    try {
      const response = await fetch(`/api/analytics/performance-attribution?leagueId=${leagueId}&type=patterns`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      setDecisionPatterns(data.data);
    } catch (err: any) {
      console.error('Error loading decision patterns:', err);
    }
  };

  const trackNewDecision = async (decisionData: any) => {
    try {
      setTrackingDecision(true);
      const response = await fetch('/api/analytics/performance-attribution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'track_decision',
          leagueId,
          ...decisionData
        })
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      // Reload data after tracking new decision
      await loadPerformanceData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTrackingDecision(false);
    }
  };

  useEffect(() => {
    loadPerformanceData();
    loadDecisionPatterns();
  }, [leagueId]);

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 0.7) return 'text-green-600 bg-green-50 border-green-200';
    if (rate >= 0.5) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getImpactColor = (impact: number) => {
    if (impact > 10) return 'text-green-600';
    if (impact > 0) return 'text-green-500';
    if (impact > -10) return 'text-red-500';
    return 'text-red-600';
  };

  const getRiskToleranceColor = (tolerance: string) => {
    switch (tolerance) {
      case 'aggressive': return 'bg-red-100 text-red-800 border-red-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getComparisonIcon = (comparison: string) => {
    switch (comparison) {
      case 'above_average': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'below_average': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Target className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading && !performanceData) {
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
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">Error loading performance data: {error}</p>
            <Button onClick={loadPerformanceData} className="mt-4" variant="outline">
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
      {performanceData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                Total Decisions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performanceData.totalDecisions}</div>
              <p className="text-sm text-gray-600">This season</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-green-500" />
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(performanceData.overallSuccessRate * 100).toFixed(1)}%
              </div>
              <Progress value={performanceData.overallSuccessRate * 100} className="h-2 mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Points from Decisions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getImpactColor(performanceData.pointsFromDecisions)}`}>
                {performanceData.pointsFromDecisions > 0 ? '+' : ''}{performanceData.pointsFromDecisions.toFixed(1)}
              </div>
              <p className="text-sm text-gray-600">Net impact</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-500" />
                vs League
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-1">
                {getComparisonIcon(performanceData.comparedToLeague.successRate)}
                <span className="text-sm capitalize">
                  {performanceData.comparedToLeague.successRate.replace('_', ' ')} success
                </span>
              </div>
              <div className="flex items-center gap-2">
                {getComparisonIcon(performanceData.comparedToLeague.decisionFrequency)}
                <span className="text-sm capitalize">
                  {performanceData.comparedToLeague.decisionFrequency.replace('_', ' ')} activity
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Attribution Tabs */}
      {performanceData && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="categories">By Category</TabsTrigger>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
            <TabsTrigger value="decisions">Key Decisions</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-700 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Top Performing Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(performanceData.categoryBreakdown)
                      .sort(([,a], [,b]) => b.successRate - a.successRate)
                      .slice(0, 3)
                      .map(([type, data]) => (
                        <div key={type} className="flex items-center justify-between p-3 bg-green-50 rounded border border-green-200">
                          <div>
                            <p className="font-semibold capitalize">{type.replace('_', ' ')}</p>
                            <p className="text-sm text-gray-600">{data.totalDecisions} decisions</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-700">
                              {(data.successRate * 100).toFixed(1)}%
                            </p>
                            <p className="text-sm text-green-600">
                              +{data.totalPointsImpact.toFixed(1)} pts
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-red-700 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Areas for Improvement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(performanceData.categoryBreakdown)
                      .sort(([,a], [,b]) => a.successRate - b.successRate)
                      .slice(0, 3)
                      .map(([type, data]) => (
                        <div key={type} className="flex items-center justify-between p-3 bg-red-50 rounded border border-red-200">
                          <div>
                            <p className="font-semibold capitalize">{type.replace('_', ' ')}</p>
                            <p className="text-sm text-gray-600">{data.totalDecisions} decisions</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-red-700">
                              {(data.successRate * 100).toFixed(1)}%
                            </p>
                            <p className="text-sm text-red-600">
                              {data.totalPointsImpact.toFixed(1)} pts
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {decisionPatterns && (
              <Card>
                <CardHeader>
                  <CardTitle>Decision Making Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded">
                      <h4 className="font-semibold mb-2">Risk Tolerance</h4>
                      <Badge className={getRiskToleranceColor(decisionPatterns.riskTolerance)}>
                        {decisionPatterns.riskTolerance}
                      </Badge>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <h4 className="font-semibold mb-2">Preferred Strategies</h4>
                      <div className="flex flex-wrap gap-1 justify-center">
                        {decisionPatterns.preferredStrategies.slice(0, 2).map((strategy, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {strategy}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <h4 className="font-semibold mb-2">Peak Decision Time</h4>
                      <p className="text-sm text-gray-600">
                        {Object.entries(decisionPatterns.timingPatterns)
                          .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Evening'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <div className="grid gap-4">
              {Object.entries(performanceData.categoryBreakdown).map(([type, data]) => (
                <Card key={type}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="capitalize flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        {type.replace('_', ' ')} Decisions
                      </span>
                      <Badge className={getSuccessRateColor(data.successRate)}>
                        {(data.successRate * 100).toFixed(1)}% success
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{data.totalDecisions}</p>
                        <p className="text-sm text-gray-600">Total</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{data.successfulDecisions}</p>
                        <p className="text-sm text-gray-600">Successful</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-2xl font-bold ${getImpactColor(data.averageImpact)}`}>
                          {data.averageImpact > 0 ? '+' : ''}{data.averageImpact.toFixed(1)}
                        </p>
                        <p className="text-sm text-gray-600">Avg Impact</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-2xl font-bold ${getImpactColor(data.totalPointsImpact)}`}>
                          {data.totalPointsImpact > 0 ? '+' : ''}{data.totalPointsImpact.toFixed(1)}
                        </p>
                        <p className="text-sm text-gray-600">Total Points</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-green-50 rounded border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="w-4 h-4 text-green-600" />
                          <span className="font-semibold text-green-800">Best Decision</span>
                        </div>
                        <p className="text-sm text-green-700 mb-1">{data.bestDecision.description}</p>
                        <p className="text-lg font-bold text-green-600">
                          +{data.bestDecision.impact.toFixed(1)} points
                        </p>
                      </div>

                      <div className="p-3 bg-red-50 rounded border border-red-200">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <span className="font-semibold text-red-800">Learning Opportunity</span>
                        </div>
                        <p className="text-sm text-red-700 mb-1">{data.worstDecision.description}</p>
                        <p className="text-lg font-bold text-red-600">
                          {data.worstDecision.impact.toFixed(1)} points
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="patterns" className="space-y-4">
            {decisionPatterns && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-purple-500" />
                      Behavioral Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {decisionPatterns.behavioralInsights.map((insight, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Eye className="w-4 h-4 text-purple-500 mt-1 flex-shrink-0" />
                          <span className="text-sm">{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      Success Factors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {decisionPatterns.successFactors.map((factor, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm">{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-orange-500" />
                      Improvement Areas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {decisionPatterns.improvementAreas.map((area, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm">{area}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-500" />
                      Timing Patterns
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(decisionPatterns.timingPatterns)
                        .sort(([,a], [,b]) => b - a)
                        .map(([time, count]) => (
                          <div key={time} className="flex items-center justify-between">
                            <span className="text-sm capitalize">{time}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full" 
                                  style={{ 
                                    width: `${(count / Math.max(...Object.values(decisionPatterns.timingPatterns))) * 100}%` 
                                  }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600">{count}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="decisions" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-700 flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Key Successes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {performanceData.keySuccesses.map((success, index) => (
                      <div key={index} className="p-3 bg-green-50 rounded border border-green-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-green-600" />
                            <span className="font-semibold text-green-800">Week {success.week}</span>
                          </div>
                          <span className="font-bold text-green-600">
                            +{success.impact.toFixed(1)} pts
                          </span>
                        </div>
                        <p className="text-sm text-green-700 mb-1">{success.decision}</p>
                        <p className="text-xs text-green-600">{success.reasoning}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-orange-700 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Learning Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {performanceData.keyMisses.map((miss, index) => (
                      <div key={index} className="p-3 bg-orange-50 rounded border border-orange-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-orange-600" />
                            <span className="font-semibold text-orange-800">Week {miss.week}</span>
                          </div>
                          <span className="font-bold text-orange-600">
                            {miss.impact.toFixed(1)} pts
                          </span>
                        </div>
                        <p className="text-sm text-orange-700 mb-1">{miss.decision}</p>
                        <p className="text-xs text-orange-600">{miss.reasoning}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-500" />
                  Performance Attribution Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">Overall Assessment</h4>
                    <p className="text-sm text-blue-700">
                      With {performanceData.totalDecisions} total decisions and a {(performanceData.overallSuccessRate * 100).toFixed(1)}% success rate,
                      your decision making has contributed {performanceData.pointsFromDecisions > 0 ? 'positively' : 'negatively'} to your season performance
                      with a net impact of {performanceData.pointsFromDecisions.toFixed(1)} points.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded">
                      <div className="flex items-center gap-2 mb-2">
                        {getComparisonIcon(performanceData.comparedToLeague.decisionFrequency)}
                        <h5 className="font-semibold">Decision Frequency</h5>
                      </div>
                      <p className="text-sm text-gray-600 capitalize">
                        {performanceData.comparedToLeague.decisionFrequency.replace('_', ' ')} compared to league
                      </p>
                    </div>

                    <div className="p-4 border rounded">
                      <div className="flex items-center gap-2 mb-2">
                        {getComparisonIcon(performanceData.comparedToLeague.successRate)}
                        <h5 className="font-semibold">Success Rate</h5>
                      </div>
                      <p className="text-sm text-gray-600 capitalize">
                        {performanceData.comparedToLeague.successRate.replace('_', ' ')} compared to league
                      </p>
                    </div>

                    <div className="p-4 border rounded">
                      <div className="flex items-center gap-2 mb-2">
                        {getComparisonIcon(performanceData.comparedToLeague.riskTaking)}
                        <h5 className="font-semibold">Risk Taking</h5>
                      </div>
                      <p className="text-sm text-gray-600 capitalize">
                        {performanceData.comparedToLeague.riskTaking.replace('_', ' ')} compared to league
                      </p>
                    </div>
                  </div>

                  {decisionPatterns && (
                    <div className="p-4 bg-gray-50 rounded border border-gray-200">
                      <h4 className="font-semibold text-gray-800 mb-2">Key Recommendations</h4>
                      <ul className="space-y-2">
                        {decisionPatterns.improvementAreas.slice(0, 3).map((area, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Target className="w-4 h-4 text-gray-600 mt-1 flex-shrink-0" />
                            <span className="text-sm text-gray-700">Focus on {area.toLowerCase()}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}