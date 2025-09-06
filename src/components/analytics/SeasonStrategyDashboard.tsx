'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { 
  Trophy, 
  Target, 
  Calendar, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2,
  Users,
  ArrowRight,
  Clock,
  Star,
  Shield,
  Zap,
  BarChart3,
  Lightbulb
} from 'lucide-react';

interface PlayoffProjection {
  teamId: string;
  teamName: string;
  currentRecord: { wins: number; losses: number };
  projectedWins: number;
  projectedLosses: number;
  playoffProbability: number;
  byeWeekProbability: number;
  championshipProbability: number;
  strengthOfSchedule: number;
  remainingOpponents: string[];
}

interface SeasonPhaseStrategy {
  phase: 'early' | 'mid' | 'late' | 'playoffs';
  weekRange: string;
  primaryGoals: string[];
  strategicFocus: string[];
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  tradingRecommendations: string[];
  waiverPriorities: string[];
  lineupOptimizations: string[];
}

interface StrategicRecommendation {
  type: 'trade' | 'waiver' | 'lineup' | 'long_term' | 'playoff_prep';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  reasoning: string;
  expectedImpact: string;
  timeline: string;
  riskLevel: 'low' | 'medium' | 'high';
  targetPlayers?: string[];
}

interface WeeklyMatchupStrategy {
  week: number;
  opponent: string;
  opponentStrengths: string[];
  opponentWeaknesses: string[];
  recommendedLineup: Record<string, string[]>;
  streamingTargets: string[];
  sitStartAdvice: Array<{
    player: string;
    action: 'start' | 'sit' | 'flex';
    confidence: number;
    reasoning: string;
  }>;
  gameScript: string;
  weatherConsiderations: string[];
}

interface SeasonLongStrategy {
  teamAnalysis: {
    currentStanding: number;
    strengthAreas: string[];
    weaknessAreas: string[];
    rosterConstruction: string;
    competitiveWindow: string;
  };
  playoffProjections: PlayoffProjection;
  phaseStrategies: SeasonPhaseStrategy[];
  strategicRecommendations: StrategicRecommendation[];
  weeklyStrategies: WeeklyMatchupStrategy[];
  contingencyPlans: Array<{
    scenario: string;
    triggers: string[];
    actions: string[];
    timeline: string;
  }>;
  seasonGoals: {
    primary: string;
    secondary: string[];
    fallback: string;
  };
}

interface QuickWeeklyStrategy {
  opponent: string;
  keyMatchups: string[];
  startSitRecommendations: string[];
  streamingTargets: string[];
  winProbability: number;
}

export default function SeasonStrategyDashboard({ leagueId }: { leagueId: string }) {
  const [seasonStrategy, setSeasonStrategy] = useState<SeasonLongStrategy | null>(null);
  const [weeklyStrategy, setWeeklyStrategy] = useState<QuickWeeklyStrategy | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const loadSeasonStrategy = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/season-strategy?leagueId=${leagueId}&type=full`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      setSeasonStrategy(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadWeeklyStrategy = async (week: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/season-strategy?leagueId=${leagueId}&type=weekly&week=${week}`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      setWeeklyStrategy(data.data);
      setSelectedWeek(week);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSeasonStrategy();
    loadWeeklyStrategy(1);
  }, [leagueId]);

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'medium': return <Target className="w-4 h-4 text-yellow-500" />;
      default: return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'high': return <Zap className="w-4 h-4 text-red-500" />;
      case 'medium': return <BarChart3 className="w-4 h-4 text-yellow-500" />;
      default: return <Shield className="w-4 h-4 text-green-500" />;
    }
  };

  const getToleranceColor = (tolerance: string) => {
    switch (tolerance) {
      case 'aggressive': return 'bg-red-100 text-red-800 border-red-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'early': return <Clock className="w-5 h-5 text-blue-500" />;
      case 'mid': return <Target className="w-5 h-5 text-yellow-500" />;
      case 'late': return <TrendingUp className="w-5 h-5 text-orange-500" />;
      case 'playoffs': return <Trophy className="w-5 h-5 text-purple-500" />;
      default: return <Calendar className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading && !seasonStrategy) {
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
            <p className="text-red-600">Error loading strategy: {error}</p>
            <Button onClick={loadSeasonStrategy} className="mt-4" variant="outline">
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
      {seasonStrategy && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Current Standing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                #{seasonStrategy.teamAnalysis.currentStanding}
              </div>
              <p className="text-sm text-gray-600">
                {seasonStrategy.teamAnalysis.competitiveWindow}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-500" />
                Playoff Odds
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(seasonStrategy.playoffProjections.playoffProbability * 100).toFixed(1)}%
              </div>
              <Progress 
                value={seasonStrategy.playoffProjections.playoffProbability * 100} 
                className="h-2 mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" />
                Projected Record
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {seasonStrategy.playoffProjections.projectedWins.toFixed(1)}-{seasonStrategy.playoffProjections.projectedLosses.toFixed(1)}
              </div>
              <p className="text-sm text-gray-600">
                Current: {seasonStrategy.playoffProjections.currentRecord.wins}-{seasonStrategy.playoffProjections.currentRecord.losses}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="w-5 h-5 text-purple-500" />
                Championship Odds
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(seasonStrategy.playoffProjections.championshipProbability * 100).toFixed(1)}%
              </div>
              <p className="text-sm text-gray-600">
                {seasonStrategy.seasonGoals.primary}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Strategy Tabs */}
      {seasonStrategy && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="phases">Phase Strategy</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="weekly">Weekly View</TabsTrigger>
            <TabsTrigger value="contingency">Contingency</TabsTrigger>
            <TabsTrigger value="goals">Season Goals</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-700 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Team Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {seasonStrategy.teamAnalysis.strengthAreas.map((strength, index) => (
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
                  <CardTitle className="text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Areas to Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {seasonStrategy.teamAnalysis.weaknessAreas.map((weakness, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm">{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Roster Construction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">Construction Type</h4>
                    <p className="text-blue-700 capitalize">{seasonStrategy.teamAnalysis.rosterConstruction}</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded border border-purple-200">
                    <h4 className="font-semibold text-purple-800 mb-2">Competitive Window</h4>
                    <p className="text-purple-700 capitalize">{seasonStrategy.teamAnalysis.competitiveWindow}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-2">Remaining Opponents</h4>
                    <p className="text-gray-700 text-sm">{seasonStrategy.playoffProjections.remainingOpponents.slice(0, 3).join(', ')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="phases" className="space-y-4">
            <div className="grid gap-4">
              {seasonStrategy.phaseStrategies.map((phase, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getPhaseIcon(phase.phase)}
                        <span className="capitalize">{phase.phase} Season Strategy</span>
                        <span className="text-sm text-gray-600">({phase.weekRange})</span>
                      </div>
                      <Badge className={getToleranceColor(phase.riskTolerance)}>
                        {phase.riskTolerance} risk
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2 text-blue-700">Primary Goals</h4>
                        <ul className="text-sm space-y-1">
                          {phase.primaryGoals.map((goal, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <ArrowRight className="w-3 h-3 text-blue-500 mt-1 flex-shrink-0" />
                              {goal}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2 text-green-700">Trading Recommendations</h4>
                        <ul className="text-sm space-y-1">
                          {phase.tradingRecommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <ArrowRight className="w-3 h-3 text-green-500 mt-1 flex-shrink-0" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2 text-purple-700">Waiver Priorities</h4>
                        <ul className="text-sm space-y-1">
                          {phase.waiverPriorities.map((priority, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <ArrowRight className="w-3 h-3 text-purple-500 mt-1 flex-shrink-0" />
                              {priority}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <div className="grid gap-4">
              {seasonStrategy.strategicRecommendations.map((rec, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getPriorityIcon(rec.priority)}
                        <span>{rec.title}</span>
                        <Badge variant="outline" className="capitalize">
                          {rec.type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {getRiskIcon(rec.riskLevel)}
                        <span className="text-sm text-gray-600 capitalize">{rec.riskLevel} risk</span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-gray-700">{rec.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="p-3 bg-blue-50 rounded border border-blue-200">
                        <h5 className="font-semibold text-blue-800 mb-1">Reasoning</h5>
                        <p className="text-blue-700">{rec.reasoning}</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded border border-green-200">
                        <h5 className="font-semibold text-green-800 mb-1">Expected Impact</h5>
                        <p className="text-green-700">{rec.expectedImpact}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>Timeline: {rec.timeline}</span>
                      </div>
                      {rec.targetPlayers && rec.targetPlayers.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>Targets: {rec.targetPlayers.slice(0, 2).join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="weekly" className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <label className="font-semibold">Select Week:</label>
              <select 
                value={selectedWeek} 
                onChange={(e) => loadWeeklyStrategy(parseInt(e.target.value))}
                className="px-3 py-1 border rounded"
              >
                {Array.from({length: 17}, (_, i) => i + 1).map(week => (
                  <option key={week} value={week}>Week {week}</option>
                ))}
              </select>
            </div>

            {weeklyStrategy && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Week {selectedWeek} Strategy vs {weeklyStrategy.opponent}
                    <Badge className={
                      weeklyStrategy.winProbability > 0.6 ? 'bg-green-100 text-green-800' :
                      weeklyStrategy.winProbability > 0.4 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }>
                      {(weeklyStrategy.winProbability * 100).toFixed(1)}% win probability
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2 text-blue-700">Key Matchups</h4>
                      <ul className="text-sm space-y-1">
                        {weeklyStrategy.keyMatchups.map((matchup, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <ArrowRight className="w-3 h-3 text-blue-500 mt-1 flex-shrink-0" />
                            {matchup}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 text-green-700">Start/Sit Advice</h4>
                      <ul className="text-sm space-y-1">
                        {weeklyStrategy.startSitRecommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <ArrowRight className="w-3 h-3 text-green-500 mt-1 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 text-purple-700">Streaming Targets</h4>
                      <ul className="text-sm space-y-1">
                        {weeklyStrategy.streamingTargets.map((target, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <ArrowRight className="w-3 h-3 text-purple-500 mt-1 flex-shrink-0" />
                            {target}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {seasonStrategy.weeklyStrategies.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Matchups</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {seasonStrategy.weeklyStrategies.slice(0, 4).map((strategy, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-semibold">Week {strategy.week}</div>
                          <div className="text-sm">vs {strategy.opponent}</div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => loadWeeklyStrategy(strategy.week)}
                        >
                          View Strategy
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="contingency" className="space-y-4">
            <div className="grid gap-4">
              {seasonStrategy.contingencyPlans.map((plan, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-yellow-500" />
                      {plan.scenario}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2 text-red-700">Triggers</h4>
                        <ul className="text-sm space-y-1">
                          {plan.triggers.map((trigger, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <AlertCircle className="w-3 h-3 text-red-500 mt-1 flex-shrink-0" />
                              {trigger}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2 text-blue-700">Actions</h4>
                        <ul className="text-sm space-y-1">
                          {plan.actions.map((action, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <CheckCircle2 className="w-3 h-3 text-blue-500 mt-1 flex-shrink-0" />
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2 text-gray-700">Timeline</h4>
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="w-3 h-3 text-gray-500" />
                          {plan.timeline}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="goals" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-blue-700 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Primary Goal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold">{seasonStrategy.seasonGoals.primary}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-green-700 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Secondary Goals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {seasonStrategy.seasonGoals.secondary.map((goal, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm">{goal}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-gray-700 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Fallback Plan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{seasonStrategy.seasonGoals.fallback}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}