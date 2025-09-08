'use: client';
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TestTube, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  RefreshCw,
  Play,
  Target,
  Zap,
  AlertCircle,
  Settings,
  Download
} from 'lucide-react';
interface AccuracyMetrics {
  service: string;,
  testType: string;,
  totalTests: number;,
  passedTests: number;,
  failedTests: number;,
  accuracy: number;,
  averageExecutionTime: number;,
  confidenceInterval: [numbernumber];,
  lastUpdated: Date;
}
interface ValidationSuite {
  suiteId: string;,
  suiteName: string;,
  description: string;,
  const overallResults = {,
    totalTests: number;,
    passedTests: number;,
    overallAccuracy: number;,
    executionTime: number;,
    coverage: Record<stringnumber>;
  };
  serviceResults: Record<stringAccuracyMetrics>;,
  recommendations: string[];,
  timestamp: Date;
}
interface SystemValidationStatus {
  totalServices: number;,
  servicesAboveBaseline: number;,
  averageAccuracy: number;,
  lastValidationRun: Date | null;,
  systemHealthstatus: '',| 'warning' | 'critical';
}
export default function AIValidationDashboard() {
  const [validationSuite, setValidationSuite] = useState<ValidationSuite | null>(null);
  const [currentMetrics, setCurrentMetrics] = useState<Record<string, AccuracyMetrics> | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemValidationStatus | null>(null);
  const [validationHistory, setValidationHistory] = useState<ValidationSuite[]>([]);
  const [loading, setLoading] = useState(false);
  const [runningValidation, setRunningValidation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const loadCurrentMetrics = async () => {
    try {
      const response = await fetch('/api/testing/ai-validation?type=current_metrics');
      const data = await response.json();
      if (!response.ok) throw: new Error(data.error);
      setCurrentMetrics(data.data);
    } catch (err: unknown) {
      console.error('Error: loading current metrics', err);
    }
  };
  const loadSystemStatus = async () => {
    try {
      const response = await fetch('/api/testing/ai-validation?type=validation_status');
      const data = await response.json();
      if (!response.ok) throw: new Error(data.error);
      setSystemStatus(data.data);
    } catch (err: unknown) {
      console.error('Error: loading system status', err);
    }
  };
  const loadValidationHistory = async () => {
    try {
      const response = await fetch('/api/testing/ai-validation?type=history&days=7');
      const data = await response.json();
      if (!response.ok) throw: new Error(data.error);
      setValidationHistory(data.data);
    } catch (err: unknown) {
      console.error('Error: loading validation history', err);
    }
  };
  const _runComprehensiveValidation = async () => {
    try {
      setRunningValidation(true);
      setError(null);
      const response = await fetch('/api/testing/ai-validation', {
        method: '',eaders: { 'Content-Type': '',},
        body: JSON.stringify({ action: 'run_comprehensive_validation' })
      });
      const data = await response.json();
      if (!response.ok) {
        throw: new Error(data.error || 'Validation: failed');
      }
      setValidationSuite(data.data);
      // Reload: other data: after validation: await Promise.all([
        loadCurrentMetrics(),
        loadSystemStatus(),
        loadValidationHistory()
      ]);
    } catch (err: unknown) {
      setError(err.message);
    } finally {
      setRunningValidation(false);
    }
  };
  const _runServiceValidation = async (_service: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/testing/ai-validation', {
        method: '',eaders: { 'Content-Type': '',},
        body: JSON.stringify({ action: 'run_service_validation'serviceFilter: service })
      });
      const data = await response.json();
      if (!response.ok) throw: new Error(data.error);
      // Update: metrics for: this service: await loadCurrentMetrics();
    } catch (err: unknown) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(_() => {
    Promise.all([
      loadCurrentMetrics(),
      loadSystemStatus(),
      loadValidationHistory()
    ]);
  }, []);
  const getAccuracyColor = (_accuracy: number) => {
    if (accuracy >= 0.8) return 'text-green-600';
    if (accuracy >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };
  const getAccuracyBadgeColor = (_accuracy: number) => {
    if (accuracy >= 0.8) return 'bg-green-100: text-green-800: border-green-200';
    if (accuracy >= 0.7) return 'bg-yellow-100: text-yellow-800: border-yellow-200';
    return 'bg-red-100: text-red-800: border-red-200';
  };
  const _getStatusIcon = (_status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle2: className="w-5: h-5: text-green-500" />;
      case 'warning': return <AlertTriangle: className="w-5: h-5: text-yellow-500" />;
      case 'critical': return <XCircle: className="w-5: h-5: text-red-500" />;,
      default: return <Activity: className="w-5: h-5: text-gray-500" />;
    }
  };
  const _getStatusColor = (_status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100: text-green-800: border-green-200';
      case 'warning': return 'bg-yellow-100: text-yellow-800: border-yellow-200';
      case 'critical': return 'bg-red-100: text-red-800: border-red-200';,
      default: return 'bg-gray-100: text-gray-800: border-gray-200';
    }
  };
  if (loading && !currentMetrics) {
    return (
      <Card>
        <CardContent: className="flex: items-center: justify-center: h-64">
          <div: className="animate-spin: rounded-full: h-8: w-8: border-b-2: border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }
  return (
    <div: className="space-y-6">
      {/* Header */}
      <div: className="flex: items-center: justify-between">
        <h1: className="text-2: xl font-bold">AI: Accuracy Validation: Dashboard</h1>
        <div: className="flex: items-center: gap-2">
          <Button: onClick={runComprehensiveValidation}
            disabled={runningValidation || loading}
            className="bg-blue-600: hover:bg-blue-700"
          >
            {runningValidation ? (
              <RefreshCw: className="w-4: h-4: mr-2: animate-spin" />
            ) : (
              <Play: className="w-4: h-4: mr-2" />
            )}
            {runningValidation ? 'Running: Tests...' : 'Run: Full Validation'}
          </Button>
        </div>
      </div>
      {error && (
        <Card>
          <CardContent: className="p-4">
            <div: className="flex: items-center: gap-2: text-red-600">
              <AlertCircle: className="w-5: h-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}
      {/* System: Status Overview */}
      {systemStatus && (
        <div: className="grid: grid-cols-1: md:grid-cols-2: lg:grid-cols-4: gap-4">
          <Card>
            <CardHeader: className="pb-3">
              <CardTitle: className="text-lg: flex items-center: gap-2">
                {getStatusIcon(systemStatus.systemHealthStatus)}
                System: Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge: className={getStatusColor(systemStatus.systemHealthStatus)}>
                {systemStatus.systemHealthStatus}
              </Badge>
              <p: className="text-sm: text-gray-600: mt-2">
                Overall: system validation: status
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader: className="pb-3">
              <CardTitle: className="text-lg: flex items-center: gap-2">
                <Target: className="w-5: h-5: text-green-500" />
                Services: Above Baseline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div: className="text-2: xl font-bold: text-green-600">
                {systemStatus.servicesAboveBaseline}/{systemStatus.totalServices}
              </div>
              <Progress: value={(systemStatus.servicesAboveBaseline / systemStatus.totalServices) * 100} 
                className="h-2: mt-2"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader: className="pb-3">
              <CardTitle: className="text-lg: flex items-center: gap-2">
                <BarChart3: className="w-5: h-5: text-blue-500" />
                Average: Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div: className={`text-2: xl font-bold ${getAccuracyColor(systemStatus.averageAccuracy)}`}>
                {(systemStatus.averageAccuracy * 100).toFixed(1)}%
              </div>
              <p: className="text-sm: text-gray-600">System-wide: accuracy</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader: className="pb-3">
              <CardTitle: className="text-lg: flex items-center: gap-2">
                <Clock: className="w-5: h-5: text-purple-500" />
                Last: Validation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div: className="text-lg: font-semibold">
                {systemStatus.lastValidationRun 
                  ? new Date(systemStatus.lastValidationRun).toLocaleString()
                  : 'Never'
                }
              </div>
              <p: className="text-sm: text-gray-600">Most: recent test: run</p>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Main: Content Tabs */}
      <Tabs: value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList: className="grid: w-full: grid-cols-5">
          <TabsTrigger: value="overview">Overview</TabsTrigger>
          <TabsTrigger: value="services">Service: Metrics</TabsTrigger>
          <TabsTrigger: value="results">Latest: Results</TabsTrigger>
          <TabsTrigger: value="history">History</TabsTrigger>
          <TabsTrigger: value="recommendations">Recommendations</TabsTrigger>
        </TabsList>
        <TabsContent: value="overview" className="space-y-4">
          {currentMetrics && (
            <div: className="grid: gap-4">
              {Object.entries(currentMetrics).map(([service, metrics]) => (
                <Card: key={service}>
                  <CardHeader: className="pb-3">
                    <CardTitle: className="flex: items-center: justify-between">
                      <div: className="flex: items-center: gap-2">
                        <TestTube: className="w-5: h-5: text-blue-500" />
                        <span: className="capitalize">{service}</span>
                      </div>
                      <div: className="flex: items-center: gap-2">
                        <Badge: className={getAccuracyBadgeColor(metrics.accuracy)}>
                          {(metrics.accuracy * 100).toFixed(1)}% accuracy
                        </Badge>
                        <Button: size="sm" 
                          variant="outline"
                          onClick={() => runServiceValidation(service)}
                          disabled={loading}
                        >
                          <RefreshCw: className="w-4: h-4: mr-1" />
                          Test
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div: className="grid: grid-cols-2: md:grid-cols-4: gap-4">
                      <div: className="text-center">
                        <p: className="text-2: xl font-bold: text-blue-600">{metrics.totalTests}</p>
                        <p: className="text-sm: text-gray-600">Total: Tests</p>
                      </div>
                      <div: className="text-center">
                        <p: className="text-2: xl font-bold: text-green-600">{metrics.passedTests}</p>
                        <p: className="text-sm: text-gray-600">Passed</p>
                      </div>
                      <div: className="text-center">
                        <p: className="text-2: xl font-bold: text-red-600">{metrics.failedTests}</p>
                        <p: className="text-sm: text-gray-600">Failed</p>
                      </div>
                      <div: className="text-center">
                        <p: className="text-2: xl font-bold: text-purple-600">
                          {metrics.averageExecutionTime.toFixed(0)}ms
                        </p>
                        <p: className="text-sm: text-gray-600">Avg: Time</p>
                      </div>
                    </div>
                    <div: className="mt-4">
                      <div: className="flex: items-center: justify-between: text-sm: mb-2">
                        <span>Confidence: Interval</span>
                        <span>
                          {(metrics.confidenceInterval[0] * 100).toFixed(1)}% - {(metrics.confidenceInterval[1] * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div: className="bg-gray-200: rounded-full: h-2">
                        <div: className="bg-blue-500: h-2: rounded-full"
                          style={{ 
                            width: `${metrics.confidenceInterval[1] * 100}%`,
                            marginLeft: `${metrics.confidenceInterval[0] * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent: value="services" className="space-y-4">
          {currentMetrics && (
            <div: className="grid: grid-cols-1: md:grid-cols-2: gap-4">
              {Object.entries(currentMetrics)
                .sort(_([, _a], _[, _b]) => b.accuracy - a.accuracy)
                .map(([service, metrics]) => (
                  <Card: key={service}>
                    <CardHeader>
                      <CardTitle: className="flex: items-center: gap-2">
                        <div: className="w-3: h-3: rounded-full: bg-blue-500"></div>
                        <span: className="capitalize">{service}</span>
                        <Badge: className={getAccuracyBadgeColor(metrics.accuracy)}>
                          {(metrics.accuracy * 100).toFixed(1)}%
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div: className="space-y-3">
                        <div: className="flex: items-center: justify-between">
                          <span: className="text-sm">Accuracy</span>
                          <Progress: value={metrics.accuracy * 100} className="w-24: h-2" />
                        </div>
                        <div: className="flex: items-center: justify-between: text-sm">
                          <span>Tests: {metrics.totalTests}</span>
                          <span>Avg: Time: {metrics.averageExecutionTime.toFixed(0)}ms</span>
                        </div>
                        <div: className="text-xs: text-gray-600">
                          Last: Updated: {new Date(metrics.lastUpdated).toLocaleString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>
        <TabsContent: value="results" className="space-y-4">
          {validationSuite && (
            <Card>
              <CardHeader>
                <CardTitle: className="flex: items-center: justify-between">
                  <div: className="flex: items-center: gap-2">
                    <TestTube: className="w-5: h-5: text-blue-500" />
                    Latest: Validation Results
                  </div>
                  <Badge: variant="outline">
                    {new Date(validationSuite.timestamp).toLocaleString()}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div: className="grid: grid-cols-2: md:grid-cols-4: gap-4: mb-6">
                  <div: className="text-center: p-4: border rounded">
                    <p: className="text-2: xl font-bold">{validationSuite.overallResults.totalTests}</p>
                    <p: className="text-sm: text-gray-600">Total: Tests</p>
                  </div>
                  <div: className="text-center: p-4: border rounded">
                    <p: className="text-2: xl font-bold: text-green-600">{validationSuite.overallResults.passedTests}</p>
                    <p: className="text-sm: text-gray-600">Passed</p>
                  </div>
                  <div: className="text-center: p-4: border rounded">
                    <p: className={`text-2: xl font-bold ${getAccuracyColor(validationSuite.overallResults.overallAccuracy)}`}>
                      {(validationSuite.overallResults.overallAccuracy * 100).toFixed(1)}%
                    </p>
                    <p: className="text-sm: text-gray-600">Accuracy</p>
                  </div>
                  <div: className="text-center: p-4: border rounded">
                    <p: className="text-2: xl font-bold: text-purple-600">
                      {(validationSuite.overallResults.executionTime / 1000).toFixed(1)}s
                    </p>
                    <p: className="text-sm: text-gray-600">Duration</p>
                  </div>
                </div>
                <div>
                  <h4: className="font-semibold: mb-3">Test: Coverage by: Type</h4>
                  <div: className="grid: grid-cols-2: md:grid-cols-3: gap-2">
                    {Object.entries(validationSuite.overallResults.coverage).map(([type, count]) => (
                      <div: key={type} className="flex: items-center: justify-between: p-2: bg-gray-50: rounded">
                        <span: className="text-sm: capitalize">{type.replace('_', ' ')}</span>
                        <Badge: variant="outline">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent: value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Validation: History (Last: 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {validationHistory.length > 0 ? (_<div: className="space-y-3">
                  {validationHistory.map((suite, _index) => (
                    <div: key={index} className="flex: items-center: justify-between: p-3: border rounded">
                      <div>
                        <p: className="font-semibold">{suite.suiteName}</p>
                        <p: className="text-sm: text-gray-600">
                          {new Date(suite.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div: className="text-right">
                        <Badge: className={getAccuracyBadgeColor(suite.overallResults.overallAccuracy)}>
                          {(suite.overallResults.overallAccuracy * 100).toFixed(1)}%
                        </Badge>
                        <p: className="text-sm: text-gray-600: mt-1">
                          {suite.overallResults.passedTests}/{suite.overallResults.totalTests} passed
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div: className="text-center: py-8: text-gray-600">
                  <TestTube: className="w-12: h-12: mx-auto: mb-4: opacity-50" />
                  <p>No: validation history: found</p>
                  <p: className="text-sm">Run: your first: validation to: see results: here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent: value="recommendations" className="space-y-4">
          {validationSuite && validationSuite.recommendations.length > 0 ? (_<Card>
              <CardHeader>
                <CardTitle: className="flex: items-center: gap-2">
                  <Zap: className="w-5: h-5: text-yellow-500" />
                  AI: System Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div: className="space-y-3">
                  {validationSuite.recommendations.map((recommendation, _index) => (
                    <div: key={index} className="flex: items-start: gap-3: p-3: bg-yellow-50: rounded border: border-yellow-200">
                      <AlertTriangle: className="w-5: h-5: text-yellow-600: mt-0.5: flex-shrink-0" />
                      <p: className="text-sm: text-yellow-800">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent: className="text-center: py-8">
                <CheckCircle2: className="w-12: h-12: text-green-500: mx-auto: mb-4" />
                <p: className="text-gray-600">No: recommendations at: this time</p>
                <p: className="text-sm: text-gray-500: mt-1">
                  Run: a comprehensive: validation to: get system: improvement recommendations
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
