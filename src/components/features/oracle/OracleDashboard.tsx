'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, TrendingDown, Activity, Brain, AlertTriangle, Target, BarChart3 } from 'lucide-react';
import { oracleService, type PlayerPrediction, type PlayerComparison } from '@/services/ai/oracleService';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
}

const mockPlayers: Player[] = [
  { id: 'p1', name: 'Patrick Mahomes', position: 'QB', team: 'KC' },
  { id: 'p2', name: 'Josh Allen', position: 'QB', team: 'BUF' },
  { id: 'p3', name: 'Christian McCaffrey', position: 'RB', team: 'SF' },
  { id: 'p4', name: 'Austin Ekeler', position: 'RB', team: 'LAC' },
  { id: 'p5', name: 'Tyreek Hill', position: 'WR', team: 'MIA' },
  { id: 'p6', name: 'Justin Jefferson', position: 'WR', team: 'MIN' },
  { id: 'p7', name: 'Travis Kelce', position: 'TE', team: 'KC' },
  { id: 'p8', name: 'Mark Andrews', position: 'TE', team: 'BAL' }
];

export default function OracleDashboard() {
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [predictions, setPredictions] = useState<PlayerPrediction[]>([]);
  const [comparisons, setComparisons] = useState<PlayerComparison[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<string>('ALL');
  const [serviceStatus, setServiceStatus] = useState<any>(null);

  useEffect(() => {
    loadPredictions();
    checkServiceStatus();
  }, [selectedWeek, selectedPosition]);

  const checkServiceStatus = () => {
    const status = oracleService.getServiceStatus();
    setServiceStatus(status);
  };

  const loadPredictions = async () => {
    setLoading(true);
    try {
      const playersToPredict = selectedPosition === 'ALL' 
        ? mockPlayers 
        : mockPlayers.filter(p => p.position === selectedPosition);

      const preds = await Promise.all(
        playersToPredict.map(player =>
          oracleService.generatePlayerPrediction(
            player.id,
            player.name,
            player.position,
            player.team,
            selectedWeek
          )
        )
      );

      setPredictions(preds.sort((a, b) => b.fantasyPoints.expected - a.fantasyPoints.expected));

      // Generate some comparisons
      if (preds.length >= 2) {
        const comp1 = await oracleService.comparePlayerPredictions(
          playersToPredict[0],
          playersToPredict[1],
          selectedWeek
        );
        setComparisons([comp1]);
      }
    } catch (error) {
      console.error('Failed to load predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-500';
    if (confidence >= 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === 'declining') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-purple-500" />
            AI Oracle Predictions
          </h1>
          <p className="text-muted-foreground mt-1">
            ML-powered player projections with ensemble models
          </p>
        </div>
        {serviceStatus && (
          <Card className="p-3">
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <span>Oracle Active</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {serviceStatus.modelsLoaded} models loaded
              </div>
              <div className="text-xs text-muted-foreground">
                Cache: {serviceStatus.cacheSize} predictions
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-4">
        <div className="flex gap-2">
          <Button
            variant={selectedPosition === 'ALL' ? 'primary' : 'outline'}
            onClick={() => setSelectedPosition('ALL')}
          >
            All
          </Button>
          <Button
            variant={selectedPosition === 'QB' ? 'primary' : 'outline'}
            onClick={() => setSelectedPosition('QB')}
          >
            QB
          </Button>
          <Button
            variant={selectedPosition === 'RB' ? 'primary' : 'outline'}
            onClick={() => setSelectedPosition('RB')}
          >
            RB
          </Button>
          <Button
            variant={selectedPosition === 'WR' ? 'primary' : 'outline'}
            onClick={() => setSelectedPosition('WR')}
          >
            WR
          </Button>
          <Button
            variant={selectedPosition === 'TE' ? 'primary' : 'outline'}
            onClick={() => setSelectedPosition('TE')}
          >
            TE
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setSelectedWeek(Math.max(1, selectedWeek - 1))}
            disabled={selectedWeek <= 1}
          >
            ← Week {selectedWeek - 1}
          </Button>
          <Button variant="primary">
            Week {selectedWeek}
          </Button>
          <Button
            variant="outline"
            onClick={() => setSelectedWeek(Math.min(17, selectedWeek + 1))}
            disabled={selectedWeek >= 17}
          >
            Week {selectedWeek + 1} →
          </Button>
        </div>
        <Button onClick={loadPredictions} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
        </Button>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="predictions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="predictions">Player Predictions</TabsTrigger>
          <TabsTrigger value="comparisons">Head-to-Head</TabsTrigger>
          <TabsTrigger value="models">Model Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-4">
          {loading ? (
            <Card className="p-8">
              <div className="flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                <p className="text-muted-foreground">Running ensemble models...</p>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4">
              {predictions.map((prediction, index) => (
                <Card key={prediction.playerId} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl font-bold text-muted-foreground">
                          #{index + 1}
                        </div>
                        <div>
                          <CardTitle className="text-xl">
                            {prediction.playerName}
                          </CardTitle>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="secondary">{prediction.position}</Badge>
                            <Badge variant="outline">{prediction.team}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold">
                          {prediction.fantasyPoints.expected.toFixed(1)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          projected points
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Projection Range */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Floor: {prediction.floor.toFixed(1)}</span>
                        <span className={getConfidenceColor(prediction.confidence)}>
                          {Math.round(prediction.confidence * 100)}% confidence
                        </span>
                        <span>Ceiling: {prediction.ceiling.toFixed(1)}</span>
                      </div>
                      <Progress 
                        value={(prediction.fantasyPoints.expected - prediction.floor) / (prediction.ceiling - prediction.floor) * 100}
                        className="h-2"
                      />
                    </div>

                    {/* Position-specific stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {prediction.passingYards && (
                        <div className="text-center p-2 bg-muted rounded">
                          <div className="text-xs text-muted-foreground">Pass Yds</div>
                          <div className="font-semibold">{prediction.passingYards.expected.toFixed(0)}</div>
                        </div>
                      )}
                      {prediction.passingTDs && (
                        <div className="text-center p-2 bg-muted rounded">
                          <div className="text-xs text-muted-foreground">Pass TDs</div>
                          <div className="font-semibold">{prediction.passingTDs.expected.toFixed(1)}</div>
                        </div>
                      )}
                      {prediction.rushingYards && (
                        <div className="text-center p-2 bg-muted rounded">
                          <div className="text-xs text-muted-foreground">Rush Yds</div>
                          <div className="font-semibold">{prediction.rushingYards.expected.toFixed(0)}</div>
                        </div>
                      )}
                      {prediction.receivingYards && (
                        <div className="text-center p-2 bg-muted rounded">
                          <div className="text-xs text-muted-foreground">Rec Yds</div>
                          <div className="font-semibold">{prediction.receivingYards.expected.toFixed(0)}</div>
                        </div>
                      )}
                      {prediction.receptions && (
                        <div className="text-center p-2 bg-muted rounded">
                          <div className="text-xs text-muted-foreground">Receptions</div>
                          <div className="font-semibold">{prediction.receptions.expected.toFixed(1)}</div>
                        </div>
                      )}
                    </div>

                    {/* Analysis */}
                    <div className="space-y-2">
                      {prediction.keyFactors.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {prediction.keyFactors.map((factor, i) => (
                            <Badge key={i} variant="default" className="bg-green-500/10 text-green-700">
                              <Target className="h-3 w-3 mr-1" />
                              {factor}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {prediction.riskFactors.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {prediction.riskFactors.map((risk, i) => (
                            <Badge key={i} variant="destructive" className="bg-red-500/10 text-red-700">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {risk}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Reasoning */}
                    <Alert>
                      <Brain className="h-4 w-4" />
                      <AlertDescription>{prediction.reasoning}</AlertDescription>
                    </Alert>

                    {/* Volatility indicator */}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Volatility</span>
                      <div className="flex items-center gap-2">
                        <Progress value={prediction.volatility * 50} className="w-20 h-2" />
                        <span className={prediction.volatility > 1.5 ? 'text-red-500' : 'text-green-500'}>
                          {prediction.volatility.toFixed(2)}x
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="comparisons" className="space-y-4">
          {comparisons.map((comp, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>Player Comparison</CardTitle>
                <CardDescription>{comp.reasoning}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className={comp.recommendation === 'player1' ? 'ring-2 ring-green-500 rounded-lg p-4' : 'p-4'}>
                    <h3 className="font-semibold text-lg mb-2">{comp.player1.playerName}</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Projected</span>
                        <span className="font-bold">{comp.player1.fantasyPoints.expected.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Confidence</span>
                        <span>{Math.round(comp.player1.confidence * 100)}%</span>
                      </div>
                      <div className="mt-3">
                        <div className="text-sm font-medium mb-1">Advantages:</div>
                        {comp.advantages.player1.map((adv, i) => (
                          <Badge key={i} variant="outline" className="mr-2 mb-1">
                            {adv}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className={comp.recommendation === 'player2' ? 'ring-2 ring-green-500 rounded-lg p-4' : 'p-4'}>
                    <h3 className="font-semibold text-lg mb-2">{comp.player2.playerName}</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Projected</span>
                        <span className="font-bold">{comp.player2.fantasyPoints.expected.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Confidence</span>
                        <span>{Math.round(comp.player2.confidence * 100)}%</span>
                      </div>
                      <div className="mt-3">
                        <div className="text-sm font-medium mb-1">Advantages:</div>
                        {comp.advantages.player2.map((adv, i) => (
                          <Badge key={i} variant="outline" className="mr-2 mb-1">
                            {adv}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <Alert className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{comp.riskComparison}</AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          {predictions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Model Consensus Analysis</CardTitle>
                <CardDescription>
                  Ensemble predictions from multiple ML models
                </CardDescription>
              </CardHeader>
              <CardContent>
                {predictions.slice(0, 3).map(pred => (
                  <div key={pred.playerId} className="mb-6 last:mb-0">
                    <h3 className="font-semibold mb-3">{pred.playerName}</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Linear Regression</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono">
                            {pred.modelConsensus.linearRegression.prediction.toFixed(1)}
                          </span>
                          <Progress 
                            value={pred.modelConsensus.linearRegression.confidence * 100} 
                            className="w-20 h-2"
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Random Forest</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono">
                            {pred.modelConsensus.randomForest.prediction.toFixed(1)}
                          </span>
                          <Progress 
                            value={pred.modelConsensus.randomForest.confidence * 100} 
                            className="w-20 h-2"
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Gradient Boosting</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono">
                            {pred.modelConsensus.gradientBoosting.prediction.toFixed(1)}
                          </span>
                          <Progress 
                            value={pred.modelConsensus.gradientBoosting.confidence * 100} 
                            className="w-20 h-2"
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Neural Network</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono">
                            {pred.modelConsensus.neuralNetwork.prediction.toFixed(1)}
                          </span>
                          <Progress 
                            value={pred.modelConsensus.neuralNetwork.confidence * 100} 
                            className="w-20 h-2"
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="font-semibold">Ensemble</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold">
                            {pred.modelConsensus.ensemble.prediction.toFixed(1)}
                          </span>
                          <Progress 
                            value={pred.modelConsensus.ensemble.confidence * 100} 
                            className="w-20 h-2"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}