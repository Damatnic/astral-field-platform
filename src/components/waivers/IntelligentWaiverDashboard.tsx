'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  Activity,
  Shield,
  Zap,
  Target,
  BarChart3,
  Info,
} from 'lucide-react'

interface IntelligentWaiverDashboardProps {
  leagueId: string
  teamId?: string
  isCommissioner?: boolean
}

export default function IntelligentWaiverDashboard({
  leagueId,
  teamId,
  isCommissioner = false,
}: IntelligentWaiverDashboardProps) {
  const [loading, setLoading] = useState(true)
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [fairnessMetrics, setFairnessMetrics] = useState<any>(null)
  const [topPlayers, setTopPlayers] = useState<any[]>([])
  const [processingHistory, setProcessingHistory] = useState<any[]>([])
  const [budget, setBudget] = useState({ current: 100, spent: 0 })
  const [activeTab, setActiveTab] = useState('recommendations')

  useEffect(() => {
    loadDashboardData()
  }, [leagueId, teamId])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Load recommendations if team is specified
      if (teamId) {
        const recResponse = await fetch(
          `/api/waivers/intelligent/recommendations?teamId=${teamId}&leagueId=${leagueId}`
        )
        const recData = await recResponse.json()
        setRecommendations(recData.recommendations || [])
        setBudget({ current: recData.budget, spent: 100 - recData.budget })
      }

      // Load fairness metrics
      const fairnessResponse = await fetch(
        `/api/waivers/intelligent/fairness?leagueId=${leagueId}`
      )
      const fairnessData = await fairnessResponse.json()
      setFairnessMetrics(fairnessData)

      // Load top valued players
      const valueResponse = await fetch(
        `/api/waivers/intelligent/value?leagueId=${leagueId}&limit=10`
      )
      const valueData = await valueResponse.json()
      setTopPlayers(valueData.players || [])

      // Load processing history if commissioner
      if (isCommissioner) {
        const historyResponse = await fetch(
          `/api/waivers/intelligent/process?leagueId=${leagueId}`
        )
        const historyData = await historyResponse.json()
        setProcessingHistory(historyData || [])
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const processWaivers = async () => {
    try {
      const response = await fetch('/api/waivers/intelligent/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leagueId, mode: 'auto' }),
      })
      const result = await response.json()
      if (result.success) {
        loadDashboardData()
      }
    } catch (error) {
      console.error('Error processing waivers:', error)
    }
  }

  const submitClaim = async (playerId: string, bidAmount: number) => {
    // Implementation for submitting a claim
    console.log('Submitting claim for', playerId, 'with bid', bidAmount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            Intelligent Waiver System
          </h2>
          <p className="text-muted-foreground mt-1">
            AI-powered recommendations and fairness-driven processing
          </p>
        </div>
        {isCommissioner && (
          <Button onClick={processWaivers} size="lg">
            <Zap className="mr-2 h-4 w-4" />
            Process Waivers
          </Button>
        )}
      </div>

      {/* Budget Overview (if team specified) */}
      {teamId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              FAAB Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Remaining Budget</span>
                <span className="text-2xl font-bold">${budget.current}</span>
              </div>
              <Progress value={(budget.current / 100) * 100} className="h-3" />
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-semibold">$100</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Spent</p>
                  <p className="font-semibold">${budget.spent}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Available</p>
                  <p className="font-semibold text-green-600">${budget.current}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="top-players">Top Players</TabsTrigger>
          <TabsTrigger value="fairness">Fairness</TabsTrigger>
          {isCommissioner && <TabsTrigger value="history">History</TabsTrigger>}
        </TabsList>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          {recommendations.length > 0 ? (
            recommendations.map((rec, index) => (
              <Card key={rec.playerId}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold">#{index + 1}</span>
                        <div>
                          <h3 className="text-lg font-semibold">{rec.playerName}</h3>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline">{rec.position}</Badge>
                            <Badge variant="outline">{rec.team}</Badge>
                            {rec.timing === 'immediate' && (
                              <Badge className="bg-red-500">Urgent</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{rec.reasoning}</p>
                      
                      {/* Value Metrics */}
                      <div className="grid grid-cols-4 gap-2 mt-3">
                        <div className="text-center p-2 bg-secondary rounded">
                          <p className="text-xs text-muted-foreground">Score</p>
                          <p className="font-bold">{rec.recommendationScore.toFixed(1)}</p>
                        </div>
                        <div className="text-center p-2 bg-secondary rounded">
                          <p className="text-xs text-muted-foreground">Bid</p>
                          <p className="font-bold">${rec.bidSuggestion}</p>
                        </div>
                        <div className="text-center p-2 bg-secondary rounded">
                          <p className="text-xs text-muted-foreground">Timing</p>
                          <p className="font-bold capitalize">{rec.timing}</p>
                        </div>
                        <div className="text-center p-2 bg-secondary rounded">
                          <p className="text-xs text-muted-foreground">Confidence</p>
                          <p className="font-bold">{(rec.confidence * 100).toFixed(0)}%</p>
                        </div>
                      </div>

                      {/* Drop Candidates */}
                      {rec.dropCandidates?.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-1">Drop candidates:</p>
                          <div className="flex gap-2">
                            {rec.dropCandidates.map((player: string) => (
                              <Badge key={player} variant="destructive">
                                {player}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      onClick={() => submitClaim(rec.playerId, rec.bidSuggestion)}
                      disabled={budget.current < rec.bidSuggestion}
                    >
                      Submit Claim
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No recommendations available. Check back after waivers are processed.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Top Players Tab */}
        <TabsContent value="top-players">
          <Card>
            <CardHeader>
              <CardTitle>Top Valued Waiver Players</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Overall Value</TableHead>
                    <TableHead>Breakout Score</TableHead>
                    <TableHead>Dynasty Value</TableHead>
                    <TableHead>Streaming Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topPlayers.map((player) => (
                    <TableRow key={player.id}>
                      <TableCell className="font-medium">{player.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{player.position}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">
                            {player.waiverValue?.overallValue.toFixed(1)}
                          </span>
                          {player.waiverValue?.overallValue > 15 && (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Progress 
                          value={player.waiverValue?.breakoutScore || 0} 
                          className="h-2 w-20"
                        />
                      </TableCell>
                      <TableCell>{player.waiverValue?.dynastyValue.toFixed(1)}</TableCell>
                      <TableCell>{player.waiverValue?.streamingValue.toFixed(1)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fairness Tab */}
        <TabsContent value="fairness" className="space-y-4">
          {fairnessMetrics && (
            <>
              {/* League Fairness Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    League Fairness Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-secondary rounded">
                      <p className="text-sm text-muted-foreground mb-1">Competitive Balance</p>
                      <p className="text-2xl font-bold">
                        {(fairnessMetrics.competitiveBalance * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="text-center p-4 bg-secondary rounded">
                      <p className="text-sm text-muted-foreground mb-1">Fairness Score</p>
                      <p className="text-2xl font-bold">
                        {(fairnessMetrics.leagueStats?.fairnessScore * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="text-center p-4 bg-secondary rounded">
                      <p className="text-sm text-muted-foreground mb-1">Monopolization Risk</p>
                      <p className="text-2xl font-bold">
                        {fairnessMetrics.monopolizationRisk?.length || 0} teams
                      </p>
                    </div>
                  </div>

                  {/* Team Fairness Chart */}
                  <div className="mt-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={fairnessMetrics.teams}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="teamName" angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <ChartTooltip />
                        <Legend />
                        <Bar dataKey="successRate" fill="#8884d8" name="Success Rate" />
                        <Bar dataKey="fairnessMultiplier" fill="#82ca9d" name="Fairness Multiplier" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Monopolization Warnings */}
                  {fairnessMetrics.monopolizationRisk?.length > 0 && (
                    <Alert className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Monopolization Warning:</strong> The following teams have high waiver success rates:
                        <ul className="mt-2">
                          {fairnessMetrics.monopolizationRisk.map((team: any) => (
                            <li key={team.teamId}>
                              {team.teamName} - {(team.successRate * 100).toFixed(0)}% success rate
                            </li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* History Tab (Commissioner Only) */}
        {isCommissioner && (
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Processing History</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Total Claims</TableHead>
                      <TableHead>Successful</TableHead>
                      <TableHead>Failed</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processingHistory.map((batch) => (
                      <TableRow key={batch.id}>
                        <TableCell>
                          {new Date(batch.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{batch.processing_type}</Badge>
                        </TableCell>
                        <TableCell>{batch.total_claims}</TableCell>
                        <TableCell className="text-green-600">
                          {batch.successful_claims}
                        </TableCell>
                        <TableCell className="text-red-600">
                          {batch.failed_claims}
                        </TableCell>
                        <TableCell>
                          {batch.completed_at ? (
                            <Badge className="bg-green-500">Complete</Badge>
                          ) : (
                            <Badge className="bg-yellow-500">Processing</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}