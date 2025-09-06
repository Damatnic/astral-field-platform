'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Zap, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Server,
  Database,
  Network
} from 'lucide-react';

interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
  activeConnections: number;
  status: 'healthy' | 'warning' | 'critical';
  lastUpdated: string;
}

interface LoadTestResult {
  endpoint: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  timestamp: string;
}

interface SystemBottleneck {
  component: string;
  type: 'cpu' | 'memory' | 'network' | 'database' | 'api';
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: string;
  recommendation: string;
  estimatedImprovement: string;
}

interface OptimizationSuggestion {
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  suggestion: string;
  implementation: string;
  expectedBenefit: string;
  estimatedEffort: string;
}

export default function PerformanceDashboard() {
  const [currentMetrics, setCurrentMetrics] = useState<PerformanceMetrics | null>(null);
  const [loadTestResults, setLoadTestResults] = useState<LoadTestResult[]>([]);
  const [bottlenecks, setBottlenecks] = useState<SystemBottleneck[]>([]);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchCurrentMetrics();
    fetchSystemHealth();
  }, []);

  const fetchCurrentMetrics = async () => {
    try {
      const response = await fetch('/api/performance/load-testing?type=current_metrics');
      const data = await response.json();
      if (data.success) {
        setCurrentMetrics(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch current metrics:', error);
    }
  };

  const fetchSystemHealth = async () => {
    try {
      const response = await fetch('/api/performance/load-testing?type=system_health');
      const data = await response.json();
      if (data.success) {
        setBottlenecks(data.data.bottlenecks || []);
      }
    } catch (error) {
      console.error('Failed to fetch system health:', error);
    }
  };

  const runComprehensiveLoadTest = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/performance/load-testing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run_comprehensive_load_test' })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setLoadTestResults(data.data.endpointResults || []);
        setBottlenecks(data.data.bottlenecks || []);
        await fetchOptimizationSuggestions();
      } else {
        setError(data.error || 'Load test failed');
      }
    } catch (error) {
      setError('Failed to run load test');
      console.error('Load test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOptimizationSuggestions = async () => {
    try {
      const response = await fetch('/api/performance/load-testing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_optimization_suggestions' })
      });
      
      const data = await response.json();
      if (data.success) {
        setOptimizationSuggestions(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch optimization suggestions:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Performance Dashboard</h1>
        <Button 
          onClick={runComprehensiveLoadTest}
          disabled={isLoading}
          className="flex items-center space-x-2"
        >
          <Zap className="h-4 w-4" />
          <span>{isLoading ? 'Running Load Test...' : 'Run Load Test'}</span>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {currentMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentMetrics.responseTime}ms</div>
              <div className={`flex items-center text-xs ${getStatusColor(currentMetrics.status)}`}>
                {getStatusIcon(currentMetrics.status)}
                <span className="ml-1">{currentMetrics.status}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Throughput</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentMetrics.throughput}/s</div>
              <div className="text-xs text-muted-foreground">requests per second</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(currentMetrics.errorRate * 100).toFixed(2)}%</div>
              <div className="text-xs text-muted-foreground">of total requests</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentMetrics.cpuUsage}%</div>
              <div className="text-xs text-muted-foreground">system resources</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="load-tests">Load Tests</TabsTrigger>
          <TabsTrigger value="bottlenecks">Bottlenecks</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Health Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {currentMetrics ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Overall Status</span>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(currentMetrics.status)}
                        <span className={`font-medium ${getStatusColor(currentMetrics.status)}`}>
                          {currentMetrics.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Memory Usage</span>
                        <span className="text-sm font-medium">{currentMetrics.memoryUsage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{width: `${currentMetrics.memoryUsage}%`}}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Active Connections</span>
                      <span className="text-sm font-medium">{currentMetrics.activeConnections}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">Loading system metrics...</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {loadTestResults.slice(0, 5).map((result, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b">
                      <div>
                        <div className="font-medium text-sm">{result.endpoint}</div>
                        <div className="text-xs text-gray-500">
                          {result.totalRequests} requests • {result.averageResponseTime}ms avg
                        </div>
                      </div>
                      <Badge variant={result.errorRate < 0.01 ? "default" : "destructive"}>
                        {(result.errorRate * 100).toFixed(1)}% errors
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="load-tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Load Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loadTestResults.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium">{result.endpoint}</h4>
                        <div className="text-sm text-gray-500">
                          {new Date(result.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <Badge variant={result.errorRate < 0.05 ? "default" : "destructive"}>
                        {(result.errorRate * 100).toFixed(2)}% error rate
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">Total Requests</div>
                        <div className="font-medium">{result.totalRequests}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Avg Response</div>
                        <div className="font-medium">{result.averageResponseTime}ms</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Throughput</div>
                        <div className="font-medium">{result.requestsPerSecond}/s</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Success Rate</div>
                        <div className="font-medium">
                          {((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {loadTestResults.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    No load test results available. Run a comprehensive load test to see results.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bottlenecks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Bottlenecks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bottlenecks.map((bottleneck, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          {bottleneck.type === 'cpu' && <Server className="h-4 w-4" />}
                          {bottleneck.type === 'memory' && <Database className="h-4 w-4" />}
                          {bottleneck.type === 'network' && <Network className="h-4 w-4" />}
                          {bottleneck.type === 'database' && <Database className="h-4 w-4" />}
                          {bottleneck.type === 'api' && <Activity className="h-4 w-4" />}
                          <h4 className="font-medium">{bottleneck.component}</h4>
                        </div>
                        <Badge className={getSeverityColor(bottleneck.severity)}>
                          {bottleneck.severity}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Impact:</span> {bottleneck.impact}
                      </div>
                      <div>
                        <span className="font-medium">Recommendation:</span> {bottleneck.recommendation}
                      </div>
                      <div>
                        <span className="font-medium">Expected Improvement:</span> {bottleneck.estimatedImprovement}
                      </div>
                    </div>
                  </div>
                ))}
                {bottlenecks.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    No bottlenecks detected. System is performing optimally.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {optimizationSuggestions.map((suggestion, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium">{suggestion.category}</h4>
                        <div className="text-sm text-gray-600 mt-1">{suggestion.suggestion}</div>
                      </div>
                      <Badge className={getPriorityColor(suggestion.priority)}>
                        {suggestion.priority}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Implementation:</span> {suggestion.implementation}
                      </div>
                      <div>
                        <span className="font-medium">Expected Benefit:</span> {suggestion.expectedBenefit}
                      </div>
                      <div>
                        <span className="font-medium">Estimated Effort:</span> {suggestion.estimatedEffort}
                      </div>
                    </div>
                  </div>
                ))}
                {optimizationSuggestions.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    No optimization suggestions available. Run performance analysis to generate recommendations.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}