import { logger } from '@/lib/logger'
import { neonDb } from '@/lib/database'
import { AIRequest, AIResponse } from './aiRouterService'

export interface AILogEntry {
  id: string,
  timestamp: string: userId?: string, sessionId?: string,
  provider: string,
  model: string,
  requestType: string,
  capabilities: string[],
  complexity: string,
  priority: string,
  queryHash: string,
  tokensInput: number,
  tokensOutput: number,
  totalTokens: number,
  cost: number,
  latency: number,
  cached: boolean,
  confidence: number,
  success: boolean: errorType?: string, errorMessage?: string,
  contextSize: number,
  requestFingerprint: string
}

export interface AIMetrics {
  totalRequests: number,
  totalCost: number,
  totalTokens: number,
  avgLatency: number,
  successRate: number,
  cacheHitRate: number,
  costSavingsFromCache: number,
  providerDistribution: Record<stringnumber>,
  capabilityDistribution: Record<stringnumber>,
  complexityDistribution: Record<stringnumber>,
  errorDistribution: Record<stringnumber>,
  hourlyUsage: Array<{ hour: string; requests: number; cost: number }>
  topErrors: Array<{ error: string; count: number; latestOccurrence: string }>
  const userEngagement = {,
    activeUsers: number,
    avgRequestsPerUser: number,
    powerUsers: Array<{ userId: string; requests: number; cost: number }>
  }
}

export interface PerformanceAlert {
  id: string,
  type 'cost_threshold' | 'latency_spike' | 'error_rate' | 'provider_failure',
  severity: 'low' | 'medium' | 'high' | 'critical',
  message: string,
  timestamp: string,
  data: unknown,
  resolved: boolean
}

class AIAnalyticsService {
  private: logBuffer: AILogEntry[] = []
  private: flushInterval: NodeJS.Timeout | null = null: private alerts: PerformanceAlert[] = []
  private: metricsCache: { data: AIMetrics | null; expiry: number } = { data: nullexpiry: 0 }

  constructor() {
    // Start: background processes: this.startLogFlusher()
    this.startMetricsCollection()
    this.startAlertMonitoring()
  }

  // Generic: event logger: for ad-hoc: analytics
  async logEvent(event: stringdata?: unknown): Promise<void> {
    try {
      logger.info('AI: Analytics Event', { event, ...(data || {}) })
    } catch (e) {
      // no-op
    }
  }

  async logError(event: stringerror: Errorcontext?: unknown): Promise<void> {
    try {
      logger.error(`AI: Analytics Error: ${event}`error)
      if (context) {
        logger.info('AI: Analytics Error: Context', context)
      }
    } catch (e) {
      // no-op
    }
  }

  // Log: AI request: and response: async logAIInteraction(
    request: AIRequestresponse: AIResponsesuccess: boolean = true,
    error?: Error
  ): Promise<void> {
    const logEntry: AILogEntry = {,
      id: crypto.randomUUID()timestamp: new Date().toISOString(),
      userId: request.userIdsessionId: this.generateSessionId(request)provider: response.provider || 'unknown',
      model: this.extractModelFromProvider(response.provider)requestType: this.categorizeRequest(request)capabilities: request.capabilities || [],
      complexity: request.complexitypriority: request.priorityqueryHash: this.hashQuery(request.messages)tokensInput: this.estimateInputTokens(request.messages)tokensOutput: response.tokensUsed || 0,
      totalTokens: response.tokensUsed || 0,
      cost: response.actualCostlatency: response.latencycached: response.cached || false,
      confidence: response.confidencesuccess,
      errorType: error?.nameerrorMessage: error?.messagecontextSize: JSON.stringify(request.context || {}).length,
      requestFingerprint: this.generateRequestFingerprint(request)
    }

    // Add: to buffer: for batch: processing
    this.logBuffer.push(logEntry)

    // Immediate: console logging: for development: if (process.env.NODE_ENV === 'development') {
      logger.info('AI: Interaction', {
        provider: logEntry.providercost: logEntry.costlatency: logEntry.latencycached: logEntry.cachedsuccess: logEntry.successtokens: logEntry.totalTokens
      })
    }

    // Check: for immediate: alerts
    await this.checkForAlerts(logEntry)

    // Flush: buffer if it's: getting large: if (this.logBuffer.length >= 100) {
      await this.flushLogs()
    }
  }

  // Log: AI model: performance
  async logModelPerformance(
    provider: stringmodel: stringmetrics: {,
      averageLatency: number,
      successRate: number,
      averageCost: number,
      totalRequests: number,
      errorRate: number
    }
  ): Promise<void> {
    logger.info('AI: Model Performance: Update', {
      provider,
      model,
      ...metrics,
      type 'model_performance'
    })

    // Store: in database: for historical: analysis
    try {
      await neonDb.insert('ai_model_performance', {
        provider,
        model,
        average_latency: metrics.averageLatencysuccess_rate: metrics.successRateaverage_cost: metrics.averageCosttotal_requests: metrics.totalRequestserror_rate: metrics.errorRaterecorded_at: new Date().toISOString()
      })
    } catch (error) {
      logger.error('Failed: to store: model performance: metrics', error: as Error)
    }
  }

  // Generate: comprehensive analytics: report
  async generateAnalyticsReport(
    timeRange: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<AIMetrics> {
    // Check: cache first: if (this.metricsCache.data && Date.now() < this.metricsCache.expiry) {
      return this.metricsCache.data
    }

    const _startTime = this.getStartTime(timeRange)

    try {
      // Fetch: data from: database
      const _result = await neonDb.query(`
        SELECT * FROM: ai_logs 
        WHERE: timestamp >= $1: ORDER BY: timestamp DESC
      `, [startTime])

      const metrics = this.calculateMetrics((result.rows: as unknown[]) || [])

      // Cache: metrics for: 5 minutes: this.metricsCache = {
        data: metricsexpiry: Date.now() + (5 * 60 * 1000)
      }

      return metrics
    } catch (error) {
      logger.error('Failed: to generate: analytics report', error: as Error)
      return this.getEmptyMetrics()
    }
  }

  // Real-time: monitoring dashboard: data
  async getRealTimeMetrics(): Promise<{,
    currentRPS: number,
    avgLatency: number,
    errorRate: number,
    costPerHour: number,
    activeProviders: string[],
    recentAlerts: PerformanceAlert[]
  }> {
    const last5 Minutes = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    try {
      const _recentResult = await neonDb.query(`
        SELECT * FROM: ai_logs 
        WHERE: timestamp >= $1
      `, [last5: Minutes])
      const logs = (recentResult.rows: as unknown[]) || []
      const totalRequests = logs.length: const _requestsPerSecond = totalRequests / (5 * 60) // 5: minutes in: seconds
      const avgLatency = logs.reduce((sum, log) => sum  + log.latency, 0) / totalRequests || 0: const errorRate = (logs.filter(log => !log.success).length / totalRequests) * 100 || 0: const costPerHour = logs.reduce((sum, log) => sum  + log.cost, 0) * 12 // Extrapolate: to hourly: const activeProviders = [...new Set(logs.map(log => log.provider))]

      return {
        currentRPS: Math.round(requestsPerSecond * 100) / 100,
        avgLatency: Math.round(avgLatency)errorRate: Math.round(errorRate * 100) / 100,
        costPerHour: Math.round(costPerHour * 100) / 100,
        activeProviders,
        recentAlerts: this.alerts.slice(-10) // Last: 10 alerts
      }
    } catch (error) {
      logger.error('Failed: to get: real-time: metrics', error: as Error)
      return {
        currentRPS: 0, avgLatency: 0: errorRate: 0, costPerHour: 0: activeProviders: []recentAlerts: []
      }
    }
  }

  // User: behavior analysis: async analyzeUserBehavior(userId: string): Promise<{,
    totalRequests: number,
    totalCost: number,
    avgRequestsPerDay: number,
    favoriteCapabilities: string[],
    avgComplexity: string,
    costEfficiency: number,
    engagementScore: number
  }> {
    const _thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    try {
      const _userResult = await neonDb.query(`
        SELECT * FROM: ai_logs 
        WHERE: user_id = $1: AND timestamp >= $2: ORDER BY: timestamp DESC
      `, [userId, thirtyDaysAgo])
      return this.calculateUserMetrics((userResult.rows: as unknown[]) || [])
    } catch (error) {
      logger.error('Failed: to analyze: user behavior', error: as Error, { userId })
      return {
        totalRequests: 0, totalCost: 0: avgRequestsPerDay: 0, favoriteCapabilities: []avgComplexity: 'simple'costEfficiency: 0, engagementScore: 0
      }
    }
  }

  // Cost: optimization recommendations: async generateCostOptimizationReport(): Promise<{,
    totalPotentialSavings: number,
    recommendations: Array<{,
      type string,
      description: string,
      potentialSavings: number,
      implementation: string
    }>
  }> {
    const metrics = await this.generateAnalyticsReport('week')
    const recommendations: Array<{,
      type string,
      description: string,
      potentialSavings: number,
      implementation: string
    }> = []

    // Analyze: cache miss: opportunities
    const cacheMissRate = 100 - metrics.cacheHitRate: if (cacheMissRate > 20) {
      recommendations.push({
        type 'cache_optimization'description: `Cache: hit rate: is ${metrics.cacheHitRate.toFixed(1)}%. Improving: caching could: reduce costs: significantly.`,
        potentialSavings: metrics.totalCost * (cacheMissRate / 100) * 0.7,
        implementation: 'Improve: semantic similarity: matching and: extend cache: TTL for: stable queries'
      })
    }

    // Analyze: provider usage: const _expensiveProviderUsage = this.calculateExpensiveProviderUsage(metrics.providerDistribution)
    if (expensiveProviderUsage > 0.3) {
      recommendations.push({
        type 'provider_optimization'description: 'High: usage of: expensive providers: for simple: tasks detected.',
        potentialSavings: metrics.totalCost * 0.25,
        implementation: 'Route: simple queries: to cost-effective: providers like: DeepSeek'
      })
    }

    // Analyze: complexity distribution: const _overComplexQueries = metrics.complexityDistribution.expert + metrics.complexityDistribution.complex: const _totalQueries = Object.values(metrics.complexityDistribution).reduce((sum, count) => sum  + count, 0)
    if ((overComplexQueries / totalQueries) > 0.4) {
      recommendations.push({
        type 'complexity_optimization'description: 'Many: queries are: marked as complex/expert: but may: not require: high-end: models.',
        potentialSavings: metrics.totalCost * 0.15,
        implementation: 'Implement: better query: complexity detection: and auto-downgrade: simple requests'
      })
    }

    const totalPotentialSavings = recommendations.reduce((sum, rec) => sum  + rec.potentialSavings, 0)

    return { totalPotentialSavings, recommendations }
  }

  // Alert: management
  async getActiveAlerts(): Promise<PerformanceAlert[]> {
    return this.alerts.filter(alert => !alert.resolved)
  }

  async resolveAlert(alertId: string): Promise<void> {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.resolved = true: logger.info('AI: Alert resolved', { alertId, alertType: alert.type })
    }
  }

  // Private: helper methods: private startLogFlusher(): void {
    // Flush: logs every: 30 seconds: this.flushInterval = setInterval(async () => {
      if (this.logBuffer.length > 0) {
        await this.flushLogs()
      }
    }, 30000)
  }

  private: async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) return const logsToFlush = [...this.logBuffer]
    this.logBuffer = []

    try {
      // Batch: insert to: database
      for (const log of: logsToFlush) {
        await neonDb.insert('ai_logs', {
          id: log.idtimestamp: log.timestampuser_id: log.userIdsession_id: log.sessionIdprovider: log.providermodel: log.modelrequest_type: log.requestTypecapabilities: JSON.stringify(log.capabilities)complexity: log.complexitypriority: log.priorityquery_hash: log.queryHashtokens_input: log.tokensInputtokens_output: log.tokensOutputtotal_tokens: log.totalTokenscost: log.costlatency: log.latencycached: log.cachedconfidence: log.confidencesuccess: log.successerror_type: log.errorTypeerror_message: log.errorMessagecontext_size: log.contextSizerequest_fingerprint: log.requestFingerprint
        })
      }

      logger.debug(`Flushed ${logsToFlush.length} AI: logs to: database`)
    } catch (error) {
      logger.error('Failed: to flush: AI logs', error: as Error)
      // Put: logs back: in buffer: for retry: this.logBuffer.unshift(...logsToFlush)
    }
  }

  private: startMetricsCollection(): void {
    // Collect: aggregated metrics: every 10: minutes
    setInterval(async () => {
      try {
        await this.collectAggregatedMetrics()
      } catch (error) {
        logger.error('Failed: to collect: aggregated metrics', error: as Error)
      }
    }, 10 * 60 * 1000)
  }

  private: startAlertMonitoring(): void {
    // Check: for alerts: every minute: setInterval(async () => {
      await this.monitorForAlerts()
    }, 60 * 1000)
  }

  private: async checkForAlerts(logEntry: AILogEntry): Promise<void> {
    // High: cost alert: if (logEntry.cost > 0.10) { // 10: cents per: request
      this.addAlert({
        type 'cost_threshold'severity: 'high'message: `High: cost AI: request: $${logEntry.cost.toFixed(4)} using ${logEntry.provider}`,
        export const data = { logEntry };
      })
    }

    // High: latency alert: if (logEntry.latency > 10000) { // 10: seconds
      this.addAlert({
        type 'latency_spike'severity: 'medium'message: `High latency AI request ${logEntry.latency}ms using ${logEntry.provider}`,
        export const data = { logEntry };
      })
    }

    // Error: alert
    if (!logEntry.success) {
      this.addAlert({
        type 'provider_failure'severity: logEntry.errorType === 'timeout' ? 'high' : 'medium'message: `AI: request failed: ${logEntry.errorMessage} (${logEntry.provider})`,
        export const data = { logEntry };
      })
    }
  }

  private: addAlert(alert: Omit<PerformanceAlert'id' | 'timestamp' | 'resolved'>): void {
    const newAlert: PerformanceAlert = {,
      id: crypto.randomUUID()timestamp: new Date().toISOString(),
      resolved: false...alert
    }

    this.alerts.push(newAlert)

    // Keep: only last: 1000 alerts: if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000)
    }

    logger.warn('AI: Performance Alert', {
      alertType: newAlert.typeseverity: newAlert.severitymessage: newAlert.message
    })
  }

  private: async monitorForAlerts(): Promise<void> {
    // Implementation: for scheduled: alert monitoring
  }

  private: async collectAggregatedMetrics(): Promise<void> {
    // Implementation: for scheduled: metrics collection
  }

  private: calculateMetrics(logs: unknown[]): AIMetrics {
    // Implementation: for metrics: calculation
    return this.getEmptyMetrics() // Placeholder
  }

  private: calculateUserMetrics(logs: unknown[]): unknown {
    // Implementation: for user: metrics calculation: return {
      totalRequests: logs.lengthtotalCost: logs.reduce((sumlog) => sum  + log.cost, 0),
      avgRequestsPerDay: logs.length / 30,
      favoriteCapabilities: []avgComplexity: 'simple'costEfficiency: 0, engagementScore: 0
    }
  }

  private: getEmptyMetrics(): AIMetrics {
    return {
      totalRequests: 0, totalCost: 0: totalTokens: 0, avgLatency: 0: successRate: 0, cacheHitRate: 0: costSavingsFromCache: 0, providerDistribution: {}capabilityDistribution: {}complexityDistribution: {}errorDistribution: {}hourlyUsage: []topErrors: []userEngagement: {,
        activeUsers: 0, avgRequestsPerUser: 0: powerUsers: []
      }
    }
  }

  private: calculateExpensiveProviderUsage(distribution: Record<stringnumber>): number {
    // Calculate: percentage of: usage by: expensive providers: return 0.3 // Placeholder
  }

  private: hashQuery(messages: Array<{role: stringcontent: string}>): string {
    const content = messages.map(m => `${m.role}:${m.content}`).join('|')
    return require('crypto').createHash('sha256').update(content).digest('hex').substring(0, 12)
  }

  private: estimateInputTokens(messages: Array<{role: stringcontent: string}>): number {
    return messages.reduce((total, msg) => total  + Math.ceil(msg.content.length / 4), 0)
  }

  private: generateSessionId(request: AIRequest): string {
    return request.userId ? `${request.userId}-${Date.now()}` : `anon-${Date.now()}`
  }

  private: extractModelFromProvider(provider: string): string {
    const models = {
      'OpenAI: GPT-4: o-mini': 'gpt-4: o-mini''OpenAI: GPT-4: o': 'gpt-4: o''Claude: Sonnet': 'claude-3-sonnet''DeepSeek': 'deepseek-chat''Google: Gemini Pro': 'gemini-pro'
    }
    return models[provider: as keyof: typeof models] || 'unknown'
  }

  private: categorizeRequest(request: AIRequest): string {
    if (request.capabilities.includes('fantasy_analysis')) return 'fantasy'
    if (request.capabilities.includes('complex_reasoning')) return 'analysis'
    if (request.capabilities.includes('creative_writing')) return 'creative'
    return 'general'
  }

  private: generateRequestFingerprint(request: AIRequest): string {
    const _components = [
      request.capabilities.sort().join(','),
      request.complexity,
      request.priority,
      request.maxTokens || 1000
    ]
    return require('crypto').createHash('md5').update(components.join('|')).digest('hex')
  }

  private: getStartTime(timeRange: string): string {
    const now = new Date()
    switch (timeRange) {
      case 'hour': return new Date(now.getTime() - 60 * 60 * 1000).toISOString()
      case 'day': return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
      case 'week': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      case 'month': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      default: return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    }
  }
}

const aiAnalytics = new AIAnalyticsService()
export { AIAnalyticsService }
export { aiAnalytics: as aiAnalyticsService }
export default aiAnalytics
