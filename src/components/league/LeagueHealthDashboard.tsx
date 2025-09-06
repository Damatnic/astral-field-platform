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
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'
import {
  Activity,
  AlertCircle,
  BarChart3,
  Brain,
  CheckCircle,
  Clock,
  Heart,
  Shield,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
  Target,
  RefreshCw,
  Settings,
} from 'lucide-react'

interface HealthMetrics {
  overallScore: number
  competitiveBalance: number
  userEngagement: number
  activityLevel: number
  tradeVolume: number
  waiverParticipation: number
  contentInteraction: number
  retentionRate: number
  satisfactionScore: number
}

interface HealthAlert {
  id: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  type: string
  message: string
  affectedUsers?: string[]
  suggestedActions: string[]
  automated: boolean
  created_at: string
}

interface EngagementTrend {
  date: string
  score: number
  activeUsers: number
  transactions: number
  messageVolume: number
}

interface LeagueHealthDashboardProps {
  leagueId: string
  userId?: string
  isCommissioner?: boolean
}

export default function LeagueHealthDashboard({
  leagueId,
  userId,
  isCommissioner = false,
}: LeagueHealthDashboardProps) {
  const [loading, setLoading] = useState(true)
  const [health, setHealth] = useState<HealthMetrics | null>(null)
  const [trends, setTrends] = useState<EngagementTrend[]>([])
  const [alerts, setAlerts] = useState<HealthAlert[]>([])
  const [recommendations, setRecommendations] = useState<string[]>([])
  const [atRiskUsers, setAtRiskUsers] = useState<any[]>([])
  const [balanceData, setBalanceData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadHealthData()
  }, [leagueId, userId])

  const loadHealthData = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/league/health?leagueId=${leagueId}&userId=${userId}&action=dashboard`
      )
      const data = await response.json()

      setHealth(data.health)
      setTrends(data.trends || [])
      setAlerts(data.alerts || [])
      setRecommendations(data.recommendations || [])

      // Load additional data for commissioners
      if (isCommissioner) {
        await Promise.all([
          loadAtRiskUsers(),
          loadBalanceData(),
          loadTrends()
        ])
      }
    } catch (error) {
      console.error('Error loading health data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAtRiskUsers = async () => {
    try {
      const response = await fetch(
        `/api/league/health?leagueId=${leagueId}&userId=${userId}&action=at-risk`
      )
      const data = await response.json()
      setAtRiskUsers(data.atRiskUsers || [])
    } catch (error) {
      console.error('Error loading at-risk users:', error)
    }
  }

  const loadBalanceData = async () => {
    try {
      const response = await fetch(
        `/api/league/health?leagueId=${leagueId}&userId=${userId}&action=balance`
      )
      const data = await response.json()
      setBalanceData(data)
    } catch (error) {
      console.error('Error loading balance data:', error)
    }
  }

  const loadTrends = async () => {
    try {
      const response = await fetch(
        `/api/league/health?leagueId=${leagueId}&userId=${userId}&action=trends&days=14`
      )
      const data = await response.json()
      setTrends(data.trends || [])
    } catch (error) {
      console.error('Error loading trends:', error)
    }
  }

  const triggerHealthCheck = async () => {
    try {
      const response = await fetch('/api/league/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'manual-health-check',
          leagueId,
          userId
        })
      })
      const result = await response.json()
      if (result.success) {
        await loadHealthData()
      }
    } catch (error) {
      console.error('Error triggering health check:', error)
    }
  }

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch('/api/league/health', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertId,
          leagueId,
          userId
        })
      })
      const result = await response.json()
      if (result.success) {
        await loadHealthData()
      }
    } catch (error) {
      console.error('Error resolving alert:', error)
    }
  }

  const sendEngagementBoost = async (targetUsers: string[]) => {
    try {
      const response = await fetch('/api/league/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send-engagement-boost',
          leagueId,
          userId,
          targetUsers,
          messageType: 'reengagement'
        })
      })
      const result = await response.json()
      if (result.success) {
        await loadHealthData()
      }
    } catch (error) {
      console.error('Error sending engagement boost:', error)
    }
  }

  const getHealthColor = (score: number): string => {
    if (score >= 0.8) return 'text-green-500'
    if (score >= 0.6) return 'text-blue-500'
    if (score >= 0.4) return 'text-yellow-500'
    if (score >= 0.2) return 'text-orange-500'
    return 'text-red-500'
  }

  const getHealthStatus = (score: number): string => {
    if (score >= 0.8) return 'Excellent'
    if (score >= 0.6) return 'Good'
    if (score >= 0.4) return 'Fair'
    if (score >= 0.2) return 'Poor'
    return 'Critical'
  }

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'destructive'
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'default'
    }
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
            <Heart className="h-8 w-8 text-primary" />
            League Health Dashboard
          </h2>
          <p className="text-muted-foreground mt-1">
            Monitor engagement, balance, and overall league vitality
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadHealthData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {isCommissioner && (
            <Button onClick={triggerHealthCheck} size="sm">
              <Zap className="mr-2 h-4 w-4" />
              Health Check
            </Button>
          )}
        </div>
      </div>

      {/* Overall Health Score */}
      {health && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Overall League Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className={`text-4xl font-bold ${getHealthColor(health.overallScore)}`}>
                  {Math.round(health.overallScore * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  {getHealthStatus(health.overallScore)}
                </div>
              </div>
              <div className="w-32 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={[
                    { metric: 'Engagement', value: health.userEngagement * 100 },
                    { metric: 'Activity', value: health.activityLevel * 100 },
                    { metric: 'Balance', value: health.competitiveBalance * 100 },
                    { metric: 'Trading', value: health.tradeVolume * 100 },
                    { metric: 'Waivers', value: health.waiverParticipation * 100 },
                    { metric: 'Retention', value: health.retentionRate * 100 }
                  ]}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                    <Radar dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-secondary rounded">
                <div className="font-semibold">User Engagement</div>
                <div className={`text-2xl font-bold ${getHealthColor(health.userEngagement)}`}>
                  {Math.round(health.userEngagement * 100)}%
                </div>
              </div>
              <div className="text-center p-3 bg-secondary rounded">
                <div className="font-semibold">Activity Level</div>
                <div className={`text-2xl font-bold ${getHealthColor(health.activityLevel)}`}>
                  {Math.round(health.activityLevel * 100)}%
                </div>
              </div>
              <div className="text-center p-3 bg-secondary rounded">
                <div className="font-semibold">Competitive Balance</div>
                <div className={`text-2xl font-bold ${getHealthColor(health.competitiveBalance)}`}>
                  {Math.round(health.competitiveBalance * 100)}%
                </div>
              </div>
              <div className="text-center p-3 bg-secondary rounded">
                <div className="font-semibold">Retention Rate</div>
                <div className={`text-2xl font-bold ${getHealthColor(health.retentionRate)}`}>
                  {Math.round(health.retentionRate * 100)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for detailed views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          {isCommissioner && <TabsTrigger value="users">At-Risk Users</TabsTrigger>}
          {isCommissioner && <TabsTrigger value="balance">Balance</TabsTrigger>}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Trade Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className={`text-2xl font-bold ${getHealthColor(health?.tradeVolume || 0)}`}>
                    {Math.round((health?.tradeVolume || 0) * 100)}%
                  </div>
                  <Activity className="h-6 w-6 text-muted-foreground" />
                </div>
                <Progress value={(health?.tradeVolume || 0) * 100} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Waiver Participation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className={`text-2xl font-bold ${getHealthColor(health?.waiverParticipation || 0)}`}>
                    {Math.round((health?.waiverParticipation || 0) * 100)}%
                  </div>
                  <Users className="h-6 w-6 text-muted-foreground" />
                </div>
                <Progress value={(health?.waiverParticipation || 0) * 100} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Content Interaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className={`text-2xl font-bold ${getHealthColor(health?.contentInteraction || 0)}`}>
                    {Math.round((health?.contentInteraction || 0) * 100)}%
                  </div>
                  <Brain className="h-6 w-6 text-muted-foreground" />
                </div>
                <Progress value={(health?.contentInteraction || 0) * 100} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>AI Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recommendations.map((rec, index) => (
                    <Alert key={index}>
                      <Target className="h-4 w-4" />
                      <AlertDescription>{rec}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Health Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length > 0 ? (
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <Alert key={alert.id}>
                      <AlertCircle className="h-4 w-4" />
                      <div className="flex justify-between items-start w-full">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={getSeverityColor(alert.severity) as any}>
                              {alert.severity.toUpperCase()}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {alert.type.replace('_', ' ')}
                            </span>
                          </div>
                          <AlertDescription>{alert.message}</AlertDescription>
                          
                          {alert.suggestedActions.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm font-medium">Suggested Actions:</p>
                              <ul className="list-disc list-inside text-sm text-muted-foreground">
                                {alert.suggestedActions.map((action, index) => (
                                  <li key={index}>{action}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        
                        {isCommissioner && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resolveAlert(alert.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Resolve
                          </Button>
                        )}
                      </div>
                    </Alert>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No active health alerts</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 1]} />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        name === 'score' ? `${Math.round(value * 100)}%` : value,
                        name === 'score' ? 'Health Score' : name.charAt(0).toUpperCase() + name.slice(1)
                      ]}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#8884d8" 
                      strokeWidth={3}
                      name="Health Score"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="activeUsers" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      name="Active Users"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* At-Risk Users Tab (Commissioner only) */}
        {isCommissioner && (
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  At-Risk Users
                  {atRiskUsers.length > 0 && (
                    <Button 
                      size="sm"
                      onClick={() => sendEngagementBoost(atRiskUsers.map(u => u.user_id))}
                    >
                      Send Engagement Boost
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {atRiskUsers.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Team</TableHead>
                        <TableHead>Risk Score</TableHead>
                        <TableHead>Days Inactive</TableHead>
                        <TableHead>Risk Factors</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {atRiskUsers.map((user) => (
                        <TableRow key={user.user_id}>
                          <TableCell className="font-medium">{user.team_name}</TableCell>
                          <TableCell>
                            <Badge variant={user.risk_score > 0.7 ? 'destructive' : 'secondary'}>
                              {Math.round(user.risk_score * 100)}%
                            </Badge>
                          </TableCell>
                          <TableCell>{user.days_inactive}</TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {user.risk_factors?.inactivity_level || 'Unknown'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => sendEngagementBoost([user.user_id])}
                            >
                              Engage
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No users at risk detected</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Balance Tab (Commissioner only) */}
        {isCommissioner && balanceData && (
          <TabsContent value="balance">
            <Card>
              <CardHeader>
                <CardTitle>Competitive Balance Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center">
                    <div className={`text-4xl font-bold ${getHealthColor(balanceData.balanceScore)}`}>
                      {Math.round(balanceData.balanceScore * 100)}%
                    </div>
                    <div className="text-muted-foreground">Overall Balance Score</div>
                  </div>

                  {balanceData.teamDetails && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Team</TableHead>
                          <TableHead>Record</TableHead>
                          <TableHead>Win %</TableHead>
                          <TableHead>Points For</TableHead>
                          <TableHead>Avg Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {balanceData.teamDetails.map((team: any) => (
                          <TableRow key={team.team_name}>
                            <TableCell className="font-medium">{team.team_name}</TableCell>
                            <TableCell>{team.wins}-{team.losses}</TableCell>
                            <TableCell>
                              {Math.round(team.win_pct * 100)}%
                            </TableCell>
                            <TableCell>{team.points_for}</TableCell>
                            <TableCell>
                              {team.avg_score ? Math.round(team.avg_score) : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}