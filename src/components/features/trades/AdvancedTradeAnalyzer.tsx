'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card/Card';
import { Button } from '@/components/ui/button/Button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  BarChart3,
  Users,
  Trophy,
  Activity,
  ArrowRight,
  ArrowLeft,
  Scale,
  Zap,
  Target,
  Shield,
  Clock,
  Calendar
} from 'lucide-react';

interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  rank: number;
  projectedPoints: number;
  avgPoints: number;
  consistency: number;
  upside: number;
  injury_risk: number;
  age: number;
  contract?: {
    years: number;
    value: number;
  };
}

interface Team {
  id: string;
  name: string;
  owner: string;
  record: string;
  rank: number;
  rosterStrength: number;
  needs: string[];
  surplus: string[];
}

interface TradeOffer {
  teamGiving: Team;
  teamReceiving: Team;
  playersGiving: Player[];
  playersReceiving: Player[];
  draftPicksGiving?: string[];
  draftPicksReceiving?: string[];
  faabGiving?: number;
  faabReceiving?: number;
}

interface TradeAnalysis {
  overallScore: number;
  fairnessScore: number;
  teamAImprovement: number;
  teamBImprovement: number;
  immediateImpact: number;
  futureValue: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendation: 'accept' | 'decline' | 'negotiate';
  insights: string[];
  warnings: string[];
  positionalImpact: {
    position: string;
    before: number;
    after: number;
    change: number;
  }[];
}

interface AdvancedTradeAnalyzerProps {
  currentTeam: Team;
  otherTeams: Team[];
  allPlayers: Player[];
  onTradePropose?: (trade: TradeOffer) => void;
  leagueSettings?: {
    scoringSystem: string;
    rosterSize: number;
    tradeDeadline: Date;
  };
}

export function AdvancedTradeAnalyzer({
  currentTeam,
  otherTeams,
  allPlayers,
  onTradePropose,
  leagueSettings
}: AdvancedTradeAnalyzerProps) {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [playersToGive, setPlayersToGive] = useState<Player[]>([]);
  const [playersToReceive, setPlayersToReceive] = useState<Player[]>([]);
  const [draftPicksToGive, setDraftPicksToGive] = useState<string[]>([]);
  const [draftPicksToReceive, setDraftPicksToReceive] = useState<string[]>([]);
  const [faabToGive, setFaabToGive] = useState(0);
  const [faabToReceive, setFaabToReceive] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Calculate trade analysis
  const tradeAnalysis = useMemo((): TradeAnalysis | null => {
    if (!selectedTeam || (playersToGive.length === 0 && playersToReceive.length === 0)) {
      return null;
    }

    // Calculate total values
    const valueGiving = playersToGive.reduce((sum, p) => sum + p.projectedPoints * 16, 0) + 
                       draftPicksToGive.length * 50 + faabToGive;
    const valueReceiving = playersToReceive.reduce((sum, p) => sum + p.projectedPoints * 16, 0) + 
                          draftPicksToReceive.length * 50 + faabToReceive;

    // Calculate fairness
    const fairnessScore = 100 - Math.abs(valueGiving - valueReceiving) / Math.max(valueGiving, valueReceiving) * 100;

    // Calculate team improvements
    const teamAImprovement = calculateTeamImprovement(currentTeam, playersToGive, playersToReceive);
    const teamBImprovement = calculateTeamImprovement(selectedTeam, playersToReceive, playersToGive);

    // Calculate immediate vs future impact
    const immediateImpact = calculateImmediateImpact(playersToReceive, playersToGive);
    const futureValue = calculateFutureValue(playersToReceive, playersToGive, draftPicksToReceive, draftPicksToGive);

    // Determine risk level
    const injuryRisk = [...playersToReceive].reduce((sum, p) => sum + p.injury_risk, 0) / playersToReceive.length;
    const riskLevel = injuryRisk > 0.7 ? 'high' : injuryRisk > 0.4 ? 'medium' : 'low';

    // Generate insights
    const insights = generateTradeInsights(
      currentTeam, 
      selectedTeam, 
      playersToGive, 
      playersToReceive,
      teamAImprovement,
      teamBImprovement
    );

    // Generate warnings
    const warnings = generateTradeWarnings(
      playersToGive,
      playersToReceive,
      fairnessScore,
      riskLevel
    );

    // Calculate positional impact
    const positionalImpact = calculatePositionalImpact(
      currentTeam,
      playersToGive,
      playersToReceive
    );

    // Determine recommendation
    const overallScore = (fairnessScore * 0.3 + teamAImprovement * 0.4 + immediateImpact * 0.2 + futureValue * 0.1);
    const recommendation = overallScore > 70 ? 'accept' : overallScore > 50 ? 'negotiate' : 'decline';

    return {
      overallScore,
      fairnessScore,
      teamAImprovement,
      teamBImprovement,
      immediateImpact,
      futureValue,
      riskLevel,
      recommendation,
      insights,
      warnings,
      positionalImpact
    };
  }, [selectedTeam, playersToGive, playersToReceive, draftPicksToGive, draftPicksToReceive, faabToGive, faabToReceive, currentTeam]);

  // Helper functions
  const calculateTeamImprovement = (team: Team, playersOut: Player[], playersIn: Player[]): number => {
    const currentStrength = team.rosterStrength;
    const outValue = playersOut.reduce((sum, p) => sum + p.projectedPoints, 0);
    const inValue = playersIn.reduce((sum, p) => sum + p.projectedPoints, 0);
    const improvement = ((inValue - outValue) / Math.max(currentStrength, 1)) * 100;
    return Math.max(0, Math.min(100, 50 + improvement));
  };

  const calculateImmediateImpact = (playersIn: Player[], playersOut: Player[]): number => {
    const inPoints = playersIn.reduce((sum, p) => sum + p.projectedPoints, 0);
    const outPoints = playersOut.reduce((sum, p) => sum + p.projectedPoints, 0);
    return Math.max(0, Math.min(100, 50 + (inPoints - outPoints)));
  };

  const calculateFutureValue = (
    playersIn: Player[], 
    playersOut: Player[], 
    picksIn: string[], 
    picksOut: string[]
  ): number => {
    const ageFactor = playersIn.reduce((sum, p) => sum + (30 - p.age), 0) - 
                     playersOut.reduce((sum, p) => sum + (30 - p.age), 0);
    const pickFactor = (picksIn.length - picksOut.length) * 20;
    return Math.max(0, Math.min(100, 50 + ageFactor + pickFactor));
  };

  const generateTradeInsights = (
    teamA: Team,
    teamB: Team,
    playersOut: Player[],
    playersIn: Player[],
    improvementA: number,
    improvementB: number
  ): string[] => {
    const insights: string[] = [];

    // Check if trade addresses team needs
    const addressesNeeds = playersIn.some(p => teamA.needs.includes(p.position));
    if (addressesNeeds) {
      insights.push(`This trade addresses your team's need at ${teamA.needs.join(', ')}`);
    }

    // Check if trading from surplus
    const tradingFromSurplus = playersOut.some(p => teamA.surplus.includes(p.position));
    if (tradingFromSurplus) {
      insights.push(`You're trading from positions of depth (${teamA.surplus.join(', ')})`);
    }

    // Win-win analysis
    if (improvementA > 60 && improvementB > 60) {
      insights.push('This appears to be a win-win trade for both teams');
    }

    // Playoff implications
    if (teamA.rank <= 4) {
      insights.push('As a playoff contender, consider prioritizing immediate impact');
    }

    // Age and dynasty implications
    const avgAgeIn = playersIn.reduce((sum, p) => sum + p.age, 0) / playersIn.length;
    const avgAgeOut = playersOut.reduce((sum, p) => sum + p.age, 0) / playersOut.length;
    if (avgAgeIn < avgAgeOut - 2) {
      insights.push('You're getting younger talent, good for long-term outlook');
    }

    return insights;
  };

  const generateTradeWarnings = (
    playersOut: Player[],
    playersIn: Player[],
    fairness: number,
    risk: string
  ): string[] => {
    const warnings: string[] = [];

    if (fairness < 60) {
      warnings.push('This trade appears to be unbalanced');
    }

    if (risk === 'high') {
      warnings.push('High injury risk among incoming players');
    }

    const losingTopPlayer = playersOut.some(p => p.rank <= 10);
    if (losingTopPlayer) {
      warnings.push('You're trading away an elite player - ensure adequate return');
    }

    const consistencyDrop = playersIn.reduce((sum, p) => sum + p.consistency, 0) / playersIn.length <
                           playersOut.reduce((sum, p) => sum + p.consistency, 0) / playersOut.length - 0.1;
    if (consistencyDrop) {
      warnings.push('Incoming players have lower consistency ratings');
    }

    return warnings;
  };

  const calculatePositionalImpact = (
    team: Team,
    playersOut: Player[],
    playersIn: Player[]
  ): { position: string; before: number; after: number; change: number }[] => {
    const positions = ['QB', 'RB', 'WR', 'TE'];
    return positions.map(pos => {
      const currentPlayers = allPlayers.filter(p => p.position === pos);
      const before = currentPlayers.reduce((sum, p) => sum + p.projectedPoints, 0);
      const outPoints = playersOut.filter(p => p.position === pos).reduce((sum, p) => sum + p.projectedPoints, 0);
      const inPoints = playersIn.filter(p => p.position === pos).reduce((sum, p) => sum + p.projectedPoints, 0);
      const after = before - outPoints + inPoints;
      return {
        position: pos,
        before,
        after,
        change: after - before
      };
    });
  };

  // Get trade suggestions using AI
  const getTradeSuggestions = useCallback(() => {
    // This would call the AI service to get smart trade suggestions
    // For now, returning mock suggestions
    return [
      {
        partner: otherTeams[0],
        give: [allPlayers[0]],
        receive: [allPlayers[1]],
        score: 85,
        reason: 'Addresses your RB need while trading from WR depth'
      },
      {
        partner: otherTeams[1],
        give: [allPlayers[2]],
        receive: [allPlayers[3], allPlayers[4]],
        score: 78,
        reason: 'Two-for-one deal that improves overall roster depth'
      }
    ];
  }, [otherTeams, allPlayers]);

  const suggestions = useMemo(() => {
    if (showSuggestions) {
      return getTradeSuggestions();
    }
    return [];
  }, [showSuggestions, getTradeSuggestions]);

  return (
    <div className="space-y-6">
      {/* Trade Builder Header */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-blue-400" />
              Advanced Trade Analyzer
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSuggestions(!showSuggestions)}
              >
                <Zap className="w-4 h-4 mr-1" />
                AI Suggestions
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!tradeAnalysis}
                onClick={() => {
                  if (selectedTeam && tradeAnalysis) {
                    onTradePropose?.({
                      teamGiving: currentTeam,
                      teamReceiving: selectedTeam,
                      playersGiving: playersToGive,
                      playersReceiving: playersToReceive,
                      draftPicksGiving: draftPicksToGive,
                      draftPicksReceiving: draftPicksToReceive,
                      faabGiving: faabToGive,
                      faabReceiving: faabToReceive
                    });
                  }
                }}
              >
                Propose Trade
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Team Selection */}
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Select Trading Partner
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {otherTeams.map(team => (
                <button
                  key={team.id}
                  className={`
                    p-3 rounded-lg border transition-all
                    ${selectedTeam?.id === team.id 
                      ? 'bg-blue-500/20 border-blue-500 text-blue-400' 
                      : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'}
                  `}
                  onClick={() => setSelectedTeam(team)}
                >
                  <div className="text-sm font-medium">{team.name}</div>
                  <div className="text-xs text-gray-500">{team.record}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Trade Configuration */}
          {selectedTeam && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Your Side */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-red-400" />
                  You Give
                </h3>
                <div className="space-y-2">
                  {playersToGive.map(player => (
                    <div key={player.id} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                      <span className="text-sm">{player.name}</span>
                      <Badge className="text-xs">{player.position}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Their Side */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4 text-green-400" />
                  You Receive
                </h3>
                <div className="space-y-2">
                  {playersToReceive.map(player => (
                    <div key={player.id} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                      <span className="text-sm">{player.name}</span>
                      <Badge className="text-xs">{player.position}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trade Analysis */}
      {tradeAnalysis && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-yellow-400" />
              Trade Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="impact">Impact</TabsTrigger>
                <TabsTrigger value="fairness">Fairness</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                {/* Overall Score */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-300">Overall Score</span>
                    <span className="text-2xl font-bold text-blue-400">
                      {tradeAnalysis.overallScore.toFixed(0)}
                    </span>
                  </div>
                  <Progress value={tradeAnalysis.overallScore} className="h-2" />
                </div>

                {/* Recommendation */}
                <div className={`
                  p-4 rounded-lg border
                  ${tradeAnalysis.recommendation === 'accept' 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : tradeAnalysis.recommendation === 'negotiate'
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : 'bg-red-500/10 border-red-500/30'}
                `}>
                  <div className="flex items-center gap-2">
                    {tradeAnalysis.recommendation === 'accept' ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : tradeAnalysis.recommendation === 'negotiate' ? (
                      <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                    <span className="font-semibold capitalize">
                      Recommendation: {tradeAnalysis.recommendation}
                    </span>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Your Improvement</div>
                    <div className="flex items-center gap-2">
                      {tradeAnalysis.teamAImprovement > 50 ? (
                        <TrendingUp className="w-4 h-4 text-green-400" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      )}
                      <span className="text-lg font-semibold">
                        {tradeAnalysis.teamAImprovement > 50 ? '+' : ''}{(tradeAnalysis.teamAImprovement - 50).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Risk Level</div>
                    <div className="flex items-center gap-2">
                      <Shield className={`w-4 h-4 ${
                        tradeAnalysis.riskLevel === 'low' ? 'text-green-400' :
                        tradeAnalysis.riskLevel === 'medium' ? 'text-yellow-400' :
                        'text-red-400'
                      }`} />
                      <span className="text-lg font-semibold capitalize">
                        {tradeAnalysis.riskLevel}
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="impact" className="space-y-4 mt-4">
                {/* Positional Impact */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-300">Positional Impact</h4>
                  {tradeAnalysis.positionalImpact.map(impact => (
                    <div key={impact.position} className="bg-gray-800 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{impact.position}</span>
                        <span className={`text-sm font-semibold ${
                          impact.change > 0 ? 'text-green-400' : impact.change < 0 ? 'text-red-400' : 'text-gray-400'
                        }`}>
                          {impact.change > 0 ? '+' : ''}{impact.change.toFixed(1)} pts
                        </span>
                      </div>
                      <div className="flex gap-2 text-xs text-gray-500">
                        <span>Before: {impact.before.toFixed(1)}</span>
                        <span>→</span>
                        <span>After: {impact.after.toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Timeline Impact */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium">Immediate Impact</span>
                    </div>
                    <div className="text-2xl font-bold">{tradeAnalysis.immediateImpact.toFixed(0)}%</div>
                    <Progress value={tradeAnalysis.immediateImpact} className="h-1 mt-2" />
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-medium">Future Value</span>
                    </div>
                    <div className="text-2xl font-bold">{tradeAnalysis.futureValue.toFixed(0)}%</div>
                    <Progress value={tradeAnalysis.futureValue} className="h-1 mt-2" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="fairness" className="space-y-4 mt-4">
                {/* Fairness Score */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-300">Trade Fairness</span>
                    <span className="text-2xl font-bold text-yellow-400">
                      {tradeAnalysis.fairnessScore.toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={tradeAnalysis.fairnessScore} className="h-2" />
                  <p className="text-xs text-gray-500 mt-2">
                    {tradeAnalysis.fairnessScore > 80 
                      ? 'This trade is very balanced'
                      : tradeAnalysis.fairnessScore > 60
                      ? 'This trade is reasonably fair'
                      : 'This trade may be unbalanced'}
                  </p>
                </div>

                {/* Team Improvements */}
                <div className="space-y-3">
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Your Team</span>
                      <span className={`font-semibold ${
                        tradeAnalysis.teamAImprovement > 50 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {tradeAnalysis.teamAImprovement > 50 ? '+' : ''}{(tradeAnalysis.teamAImprovement - 50).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={tradeAnalysis.teamAImprovement} className="h-1 mt-2" />
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{selectedTeam?.name}</span>
                      <span className={`font-semibold ${
                        tradeAnalysis.teamBImprovement > 50 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {tradeAnalysis.teamBImprovement > 50 ? '+' : ''}{(tradeAnalysis.teamBImprovement - 50).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={tradeAnalysis.teamBImprovement} className="h-1 mt-2" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="insights" className="space-y-4 mt-4">
                {/* Insights */}
                {tradeAnalysis.insights.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-400" />
                      Key Insights
                    </h4>
                    {tradeAnalysis.insights.map((insight, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-3 bg-gray-800 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                        <span className="text-sm text-gray-300">{insight}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Warnings */}
                {tradeAnalysis.warnings.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      Warnings
                    </h4>
                    {tradeAnalysis.warnings.map((warning, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5" />
                        <span className="text-sm text-gray-300">{warning}</span>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* AI Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-400" />
              AI-Powered Trade Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {suggestions.map((suggestion, idx) => (
                <div key={idx} className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{suggestion.partner.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm font-semibold text-yellow-400">{suggestion.score}%</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">You Give</div>
                      {suggestion.give.map(p => (
                        <div key={p.id} className="text-sm">{p.name}</div>
                      ))}
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">You Receive</div>
                      {suggestion.receive.map(p => (
                        <div key={p.id} className="text-sm">{p.name}</div>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">{suggestion.reason}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => {
                      setSelectedTeam(suggestion.partner);
                      setPlayersToGive(suggestion.give);
                      setPlayersToReceive(suggestion.receive);
                    }}
                  >
                    <Activity className="w-4 h-4 mr-1" />
                    Analyze This Trade
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}