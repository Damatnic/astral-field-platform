import { AIServiceRouter } from './aiServiceRouter';
import { GPT4oProvider } from './providers/gpt4oProvider';
import { Claude35SonnetProvider } from './providers/claude35SonnetProvider';
import { DeepSeekProvider } from './providers/deepSeekProvider';
import { GeminiProvider } from './providers/geminiProvider';
import { AIRequest, AIResponse } from './types';

interface ProviderCapabilities {
  provider: string;
  strengths: string[];
  optimalUseCases: string[];
  costMultiplier: number;
  accuracyScore: number;
  responseTimeTarget: number;
}

interface RoutingDecision {
  selectedProvider: string;
  reasoning: string;
  confidence: number;
  fallbackProviders: string[];
  expectedCost: number;
}

export class EnhancedAIRouter extends AIServiceRouter {
  private advancedProviders: Map<string, any> = new Map();
  private providerCapabilities: Map<string, ProviderCapabilities> = new Map();
  private routingHistory: Array<{
    request: AIRequest;
    decision: RoutingDecision;
    outcome: AIResponse;
    timestamp: Date;
  }> = [];

  constructor() {
    super();
    this.initializeAdvancedProviders();
    this.setupProviderCapabilities();
  }

  private initializeAdvancedProviders() {
    try {
      // Initialize advanced providers
      this.advancedProviders.set('gpt-4o', new GPT4oProvider());
      this.advancedProviders.set('claude-3.5-sonnet', new Claude35SonnetProvider());
      
      // Keep existing providers for fallback
      this.advancedProviders.set('deepseek', new DeepSeekProvider());
      this.advancedProviders.set('gemini', new GeminiProvider());
      
      console.log('Enhanced AI Router initialized with 4 providers');
    } catch (error) {
      console.error('Error initializing enhanced providers:', error);
    }
  }

  private setupProviderCapabilities() {
    this.providerCapabilities.set('gpt-4o', {
      provider: 'gpt-4o',
      strengths: [
        'advanced_reasoning',
        'mathematical_analysis',
        'pattern_recognition',
        'strategic_optimization',
        'complex_problem_solving'
      ],
      optimalUseCases: [
        'complex_trade_analysis',
        'portfolio_optimization',
        'advanced_statistical_modeling',
        'game_theory_applications',
        'multi_factor_analysis'
      ],
      costMultiplier: 3.0,
      accuracyScore: 0.95,
      responseTimeTarget: 2000
    });

    this.providerCapabilities.set('claude-3.5-sonnet', {
      provider: 'claude-3.5-sonnet',
      strengths: [
        'detailed_analysis',
        'logical_reasoning',
        'comprehensive_explanations',
        'nuanced_understanding',
        'research_synthesis'
      ],
      optimalUseCases: [
        'detailed_player_analysis',
        'strategic_planning',
        'explanation_generation',
        'comparative_analysis',
        'research_reports'
      ],
      costMultiplier: 2.5,
      accuracyScore: 0.92,
      responseTimeTarget: 2500
    });

    this.providerCapabilities.set('deepseek', {
      provider: 'deepseek',
      strengths: [
        'cost_efficiency',
        'fast_responses',
        'basic_analysis',
        'quick_summaries'
      ],
      optimalUseCases: [
        'simple_questions',
        'basic_projections',
        'quick_summaries',
        'routine_tasks'
      ],
      costMultiplier: 1.0,
      accuracyScore: 0.82,
      responseTimeTarget: 1000
    });

    this.providerCapabilities.set('gemini', {
      provider: 'gemini',
      strengths: [
        'balanced_performance',
        'consistent_quality',
        'reliable_responses'
      ],
      optimalUseCases: [
        'general_analysis',
        'standard_projections',
        'consistent_tasks'
      ],
      costMultiplier: 1.5,
      accuracyScore: 0.85,
      responseTimeTarget: 1500
    });
  }

  async routeRequest(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      // Input validation and sanitization
      if (!request || !request.text) {
        throw new Error('Invalid request: text is required');
      }
      
      if (request.text.length > 50000) {
        throw new Error('Request text too long (max 50,000 characters)');
      }
      
      // Sanitize input to prevent injection attacks
      const sanitizedRequest = this.sanitizeRequest(request);
      // Make intelligent routing decision
      const routingDecision = await this.makeRoutingDecision(sanitizedRequest);
      
      // Get the selected provider
      const provider = this.advancedProviders.get(routingDecision.selectedProvider);
      if (!provider) {
        throw new Error(`Provider not found: ${routingDecision.selectedProvider}`);
      }

      // Make the request with enhanced error handling
      let response: AIResponse;
      try {
        response = await provider.makeRequest(sanitizedRequest);
        
        // Enhance response with routing metadata
        response.routingInfo = {
          selectedProvider: routingDecision.selectedProvider,
          routingReasoning: routingDecision.reasoning,
          routingConfidence: routingDecision.confidence,
          actualCost: response.cost,
          expectedCost: routingDecision.expectedCost
        };
        
      } catch (primaryError) {
        // Try fallback providers
        response = await this.handleFallback(sanitizedRequest, routingDecision, primaryError);
      }

      // Record routing history for learning (exclude sensitive data)
      this.recordRoutingDecision(this.sanitizeForLogging(sanitizedRequest), routingDecision, response);
      
      // Update routing intelligence
      await this.updateRoutingIntelligence(routingDecision, response, Date.now() - startTime);
      
      return response;
      
    } catch (error) {
      console.error('Enhanced routing failed:', error);
      
      // Ultimate fallback to basic router
      return await super.routeRequest(sanitizedRequest);
    }
  }

  private async makeRoutingDecision(request: AIRequest): Promise<RoutingDecision> {
    const taskComplexity = this.assessTaskComplexity(request);
    const taskType = request.taskType;
    const priority = request.priority || 'medium';
    const userPreferences = await this.getUserPreferences(request.userId);

    // Scoring system for provider selection
    const providerScores = new Map<string, number>();
    const fallbackProviders: string[] = [];

    for (const [providerName, capabilities] of this.providerCapabilities) {
      let score = 0;
      
      // Base accuracy score (40% weight)
      score += capabilities.accuracyScore * 40;
      
      // Task-specific capability matching (35% weight)
      const capabilityMatch = this.calculateCapabilityMatch(request, capabilities);
      score += capabilityMatch * 35;
      
      // Cost efficiency (15% weight)
      const costEfficiency = 1 / capabilities.costMultiplier;
      score += costEfficiency * 15;
      
      // Response time (10% weight)
      const responseTimeScore = Math.max(0, (3000 - capabilities.responseTimeTarget) / 3000);
      score += responseTimeScore * 10;
      
      // Priority adjustments
      if (priority === 'high' && capabilities.accuracyScore > 0.9) {
        score += 10; // Boost high-accuracy providers for high-priority tasks
      }
      
      // Complexity adjustments
      if (taskComplexity > 0.7 && capabilities.strengths.includes('advanced_reasoning')) {
        score += 15; // Boost advanced providers for complex tasks
      }
      
      // User preference adjustments
      if (userPreferences?.preferredProviders?.includes(providerName)) {
        score += 5;
      }
      
      providerScores.set(providerName, score);
      
      // Add to fallback list if reasonable score
      if (score > 50) {
        fallbackProviders.push(providerName);
      }
    }

    // Select highest scoring provider
    const selectedProvider = Array.from(providerScores.entries())
      .sort(([,a], [,b]) => b - a)[0][0];
    
    // Calculate expected cost
    const selectedCapabilities = this.providerCapabilities.get(selectedProvider)!;
    const expectedCost = selectedCapabilities.costMultiplier * this.estimateBaseCost(request);
    
    // Generate routing reasoning
    const reasoning = this.generateRoutingReasoning(
      selectedProvider, 
      selectedCapabilities, 
      taskComplexity, 
      taskType
    );

    // Sort fallback providers by score
    const sortedFallbacks = fallbackProviders
      .filter(p => p !== selectedProvider)
      .sort((a, b) => (providerScores.get(b) || 0) - (providerScores.get(a) || 0))
      .slice(0, 2); // Keep top 2 fallbacks

    return {
      selectedProvider,
      reasoning,
      confidence: Math.min(providerScores.get(selectedProvider)! / 100, 0.95),
      fallbackProviders: sortedFallbacks,
      expectedCost
    };
  }

  private assessTaskComplexity(request: AIRequest): number {
    let complexity = 0;
    
    // Prompt length factor
    complexity += Math.min(request.prompt.length / 2000, 0.3);
    
    // Context complexity
    if (request.context?.length) {
      complexity += Math.min(request.context.length * 0.1, 0.2);
    }
    
    // Task type complexity
    const complexTasks = [
      'complex_trade_analysis',
      'portfolio_optimization', 
      'advanced_statistical_modeling',
      'strategic_planning',
      'multi_factor_analysis'
    ];
    
    if (complexTasks.includes(request.taskType)) {
      complexity += 0.4;
    }
    
    // Keywords indicating complexity
    const complexKeywords = [
      'analyze', 'optimize', 'compare', 'evaluate', 'strategy',
      'correlation', 'probability', 'risk', 'model', 'forecast'
    ];
    
    const keywordMatches = complexKeywords.filter(keyword => 
      request.prompt.toLowerCase().includes(keyword)
    ).length;
    
    complexity += Math.min(keywordMatches * 0.05, 0.1);
    
    return Math.min(complexity, 1.0);
  }

  private calculateCapabilityMatch(request: AIRequest, capabilities: ProviderCapabilities): number {
    let matchScore = 0;
    
    // Check if task type matches optimal use cases
    if (capabilities.optimalUseCases.includes(request.taskType)) {
      matchScore += 0.8;
    }
    
    // Check keyword matches in prompt
    const promptLower = request.prompt.toLowerCase();
    let keywordMatches = 0;
    
    capabilities.strengths.forEach(strength => {
      const strengthKeywords: Record<string, string[]> = {
        'advanced_reasoning': ['analyze', 'reason', 'logic', 'complex'],
        'mathematical_analysis': ['calculate', 'math', 'statistical', 'probability'],
        'detailed_analysis': ['detailed', 'comprehensive', 'thorough', 'in-depth'],
        'strategic_optimization': ['strategy', 'optimize', 'plan', 'approach'],
        'pattern_recognition': ['pattern', 'trend', 'identify', 'detect']
      };
      
      const keywords = strengthKeywords[strength] || [];
      keywords.forEach(keyword => {
        if (promptLower.includes(keyword)) {
          keywordMatches++;
        }
      });
    });
    
    matchScore += Math.min(keywordMatches * 0.05, 0.2);
    
    return matchScore;
  }

  private generateRoutingReasoning(
    provider: string, 
    capabilities: ProviderCapabilities,
    complexity: number,
    taskType: string
  ): string {
    const reasons = [];
    
    if (capabilities.accuracyScore > 0.9) {
      reasons.push('high accuracy requirements');
    }
    
    if (complexity > 0.7) {
      reasons.push('complex analytical task');
    }
    
    if (capabilities.optimalUseCases.includes(taskType)) {
      reasons.push('optimal use case match');
    }
    
    if (capabilities.strengths.includes('advanced_reasoning') && complexity > 0.5) {
      reasons.push('advanced reasoning capabilities needed');
    }
    
    return `Selected ${provider} for ${reasons.join(', ')}. Task complexity: ${(complexity * 100).toFixed(0)}%`;
  }

  private async handleFallback(
    request: AIRequest, 
    decision: RoutingDecision, 
    primaryError: any
  ): Promise<AIResponse> {
    console.warn(`Primary provider ${decision.selectedProvider} failed:`, primaryError);
    
    for (const fallbackProvider of decision.fallbackProviders) {
      try {
        const provider = this.advancedProviders.get(fallbackProvider);
        if (provider) {
          const response = await provider.makeRequest(request);
          
          response.routingInfo = {
            selectedProvider: fallbackProvider,
            routingReasoning: `Fallback from ${decision.selectedProvider}: ${primaryError.message}`,
            routingConfidence: decision.confidence * 0.8, // Reduced confidence for fallback
            actualCost: response.cost,
            expectedCost: decision.expectedCost,
            fallbackUsed: true
          };
          
          return response;
        }
      } catch (fallbackError) {
        console.warn(`Fallback provider ${fallbackProvider} also failed:`, fallbackError);
        continue;
      }
    }
    
    throw new Error(`All providers failed. Primary: ${primaryError.message}`);
  }

  private recordRoutingDecision(
    request: AIRequest, 
    decision: RoutingDecision, 
    response: AIResponse
  ) {
    this.routingHistory.push({
      request,
      decision,
      outcome: response,
      timestamp: new Date()
    });
    
    // Keep only last 1000 routing decisions
    if (this.routingHistory.length > 1000) {
      this.routingHistory = this.routingHistory.slice(-1000);
    }
  }

  private async updateRoutingIntelligence(
    decision: RoutingDecision, 
    response: AIResponse, 
    actualResponseTime: number
  ) {
    // Update provider performance metrics
    const capabilities = this.providerCapabilities.get(decision.selectedProvider);
    if (capabilities) {
      // Adjust accuracy score based on confidence and success
      if (response.confidence) {
        const newAccuracy = (capabilities.accuracyScore * 0.95) + (response.confidence * 0.05);
        capabilities.accuracyScore = Math.min(newAccuracy, 1.0);
      }
      
      // Update response time target
      capabilities.responseTimeTarget = (capabilities.responseTimeTarget * 0.9) + (actualResponseTime * 0.1);
      
      // Store updated capabilities
      this.providerCapabilities.set(decision.selectedProvider, capabilities);
    }
  }

  private async getUserPreferences(userId?: string): Promise<any> {
    if (!userId) return null;
    
    try {
      // This would integrate with the user preferences system
      // For now, return default preferences
      return {
        preferredProviders: [],
        costSensitivity: 'medium',
        accuracyImportance: 'high'
      };
    } catch (error) {
      return null;
    }
  }

  private estimateBaseCost(request: AIRequest): number {
    // Base cost estimation (in dollars)
    const promptLength = request.prompt.length;
    const expectedResponseLength = request.maxTokens || 2000;
    const totalTokens = (promptLength / 4) + expectedResponseLength;
    
    return (totalTokens / 1000000) * 5.0; // $5 per million tokens as baseline
  }

  // Public methods for monitoring and analytics
  
  async getRoutingAnalytics(days: number = 7): Promise<{
    totalRequests: number;
    providerUsage: Record<string, number>;
    averageAccuracy: number;
    averageCost: number;
    fallbackRate: number;
  }> {
    const cutoff = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
    const recentHistory = this.routingHistory.filter(h => h.timestamp >= cutoff);
    
    const providerUsage: Record<string, number> = {};
    let totalAccuracy = 0;
    let totalCost = 0;
    let fallbackCount = 0;
    
    recentHistory.forEach(h => {
      const provider = h.outcome.routingInfo?.selectedProvider || 'unknown';
      providerUsage[provider] = (providerUsage[provider] || 0) + 1;
      
      if (h.outcome.confidence) {
        totalAccuracy += h.outcome.confidence;
      }
      
      if (h.outcome.cost) {
        totalCost += h.outcome.cost;
      }
      
      if (h.outcome.routingInfo?.fallbackUsed) {
        fallbackCount++;
      }
    });
    
    return {
      totalRequests: recentHistory.length,
      providerUsage,
      averageAccuracy: totalAccuracy / recentHistory.length || 0,
      averageCost: totalCost / recentHistory.length || 0,
      fallbackRate: fallbackCount / recentHistory.length || 0
    };
  }

  async getProviderHealthStatus(): Promise<Record<string, boolean>> {
    const healthStatus: Record<string, boolean> = {};
    
    for (const [providerName, provider] of this.advancedProviders) {
      try {
        healthStatus[providerName] = await provider.validateHealth();
      } catch (error) {
        healthStatus[providerName] = false;
      }
    }
    
    return healthStatus;
  }

  getProviderCapabilities(): Map<string, ProviderCapabilities> {
    return new Map(this.providerCapabilities);
  }

  // Security and validation methods
  private sanitizeRequest(request: AIRequest): AIRequest {
    // Create a sanitized copy of the request
    const sanitized = { ...request };
    
    // Remove potentially harmful content
    sanitized.text = this.sanitizeText(request.text);
    if (sanitized.context) {
      sanitized.context = sanitized.context.map(ctx => this.sanitizeText(ctx));
    }
    
    // Validate and sanitize other fields
    sanitized.userId = request.userId?.replace(/[^a-zA-Z0-9-_]/g, '');
    sanitized.maxTokens = Math.min(request.maxTokens || 2000, 8000);
    
    return sanitized;
  }

  private sanitizeText(text: string): string {
    if (!text || typeof text !== 'string') return '';
    
    // Remove potentially harmful patterns
    return text
      .replace(/javascript:/gi, '')
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/data:/gi, '')
      .trim();
  }

  private sanitizeForLogging(request: AIRequest): AIRequest {
    // Remove sensitive information before logging
    const logSafe = { ...request };
    
    // Remove or mask sensitive fields
    if (logSafe.userId) {
      logSafe.userId = this.maskUserId(logSafe.userId);
    }
    
    // Truncate long text for logs
    if (logSafe.text && logSafe.text.length > 500) {
      logSafe.text = logSafe.text.substring(0, 500) + '... [truncated]';
    }
    
    return logSafe;
  }

  private maskUserId(userId: string): string {
    if (userId.length <= 4) return '***';
    return userId.substring(0, 2) + '***' + userId.substring(userId.length - 2);
  }

  // Memory management methods
  private cleanupResources(): void {
    // Clean up routing history if it gets too large
    if (this.routingHistory.length > 10000) {
      this.routingHistory = this.routingHistory.slice(-5000);
      console.log('Cleaned up routing history to prevent memory leaks');
    }
  }

  // Performance monitoring
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: {
      memoryUsage: number;
      routingHistorySize: number;
      providerHealth: Record<string, boolean>;
      averageResponseTime: number;
    };
    issues?: string[];
  }> {
    const issues: string[] = [];
    const providerHealth = await this.getProviderHealthStatus();
    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB

    // Check for issues
    const healthyProviders = Object.values(providerHealth).filter(Boolean).length;
    if (healthyProviders < 2) {
      issues.push('Less than 2 healthy providers available');
    }

    if (memoryUsage > 500) {
      issues.push('High memory usage detected');
      this.cleanupResources();
    }

    if (this.routingHistory.length > 8000) {
      issues.push('Large routing history may affect performance');
    }

    // Calculate average response time from recent history
    const recentHistory = this.routingHistory.slice(-100);
    const avgResponseTime = recentHistory.length > 0 
      ? recentHistory.reduce((sum, h) => sum + (h.outcome.processingTime || 0), 0) / recentHistory.length
      : 0;

    const status = issues.length === 0 ? 'healthy' : 
                  issues.length <= 2 ? 'degraded' : 'unhealthy';

    return {
      status,
      metrics: {
        memoryUsage: Math.round(memoryUsage),
        routingHistorySize: this.routingHistory.length,
        providerHealth,
        averageResponseTime: Math.round(avgResponseTime)
      },
      issues: issues.length > 0 ? issues : undefined
    };
  }
}