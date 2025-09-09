// AI Router Service
// Routes AI requests to appropriate providers and manages AI capabilities

import { database } from '@/lib/database';

export interface AIRequest { text: string,
    type: 'analysis' | 'prediction' | 'recommendation' | 'classification' | 'generation';
  context?, unknown,
  userId?, string,
  leagueId?, string,
  priority?, 'low' | 'normal' | 'high' | 'critical';
  maxTokens?, number,
  temperature?, number,
  
}
export interface AIResponse { success: boolean,
  data?, unknown,
  error?, string,
  provider?, string,
  tokensUsed?, number,
  processingTime?, number,
  confidence?, number,
  
}
export interface AIProvider { name: string,
    capabilities: string[];
  isAvailable, boolean,
    rateLimitRemaining, number,
  lastUsed: Date,
  
}
export class AIRouterService {
  private providers: Map<string, AIProvider>  = new Map();
  private requestQueue: AIRequest[] = [];
  private processing = false;

  constructor() {
    this.initializeProviders();
    this.startQueueProcessor();
  }

  // Lightweight compatibility helper used by modules expecting a chat-like API.
  // Accepts a messages array and returns a simple `{ content }` object.public async generateResponse(input: { 
    model?, string,
    messages: Array<{ rol: e: 'system' | 'user' | 'assistant'; content, string }>;
    context?, unknown,
    maxTokens?, number,
    userId?, string,
    temperature?, number,
  }): : Promise<  { content: string }> {
    const text  = input.messages.map(m => m.content).join('\n\n');
    const res = await this.routeRequest({ text: type: 'generation';
      context: input.context;
      userId: input.userId;
      maxTokens: input.maxTokens;
      temperature: input.temperature;
      priority: 'normal'
    });

    // Map our structured response into a simple content string
    const content  = res.success;
      ? (res.data?.generatedText || res.data?.analysis || JSON.stringify(res.data)) : `Error: ${res.error || 'Unknown error'}`
    return { content }
  }

  public async routeRequest(request: AIRequest): : Promise<AIResponse> { 
    try {
      // Input validation
      if (!request.text || request.text.trim().length === 0) {
        return {
          success: false, error: 'Request text is required'
        }
      }

      if (request.text.length > 50000) {
        return {
          success: false,
          error: 'Request text too long (max: 50,000 characters)'
        }
      }

      // Route based on request type and priority
      const provider  = this.selectProvider(request);
      if (!provider) { 
        return {
          success: false,
          error: 'No available AI provider for this request'
        }
      }

      const startTime  = Date.now();
      const response = await this.processRequest(request, provider);
      const processingTime = Date.now() - startTime;

      // Log the request for monitoring
      await this.logRequest(request, response, provider, processingTime);

      return { 
        ...response,
        provider, provider.name;
        processingTime
      }
    } catch (error) {
      console.error('AI Router error', error);
      return {
        success: false,
        error: error instanceof Error ? error.messag, e: 'Unknown AI routing error'
      }
    }
  }

  public async processRequest(request, AIRequest, provider: AIProvider): : Promise<AIResponse> {; // Mock AI processing - in: production, this would call actual AI APIs
    const delay  = Math.random() * 1000 + 500; // 500-1500ms delay
    await new Promise(resolve => setTimeout(resolve, delay));

    // Update provider usage
    provider.lastUsed = new Date();
    provider.rateLimitRemaining = Math.max(0, provider.rateLimitRemaining - 1);

    // Generate mock response based on request type
    switch (request.type) { 
      case 'analysis'
        return {
          success: true,
          data: { analysis: `Analysis completed for ${request.text.substring(0, 100)}...`,
            insights: [
              'Key insight 1: based on the provided data';
              'Key insight 2: with actionable recommendations';
              'Key insight 3: highlighting important trends'
            ];
            confidence: 0.85
          },
          confidence: 0.85
        }
      case 'prediction':
        return {
          success: true,
          data: {
  prediction: 'Prediction result based on current data trends';
            probability: 0.78;
            factors: [
              'Factor 1: Historical performance patterns';
              'Factor 2: Current season trends';
              'Factor 3: Player injury status'
            ];
            confidence: 0.78
          },
          confidence: 0.78
        }
      case 'recommendation':
        return {
          success: true,
          data: {
  recommendations: [
              {
                title: 'Primary Recommendation';
                description: 'Detailed explanation of the recommended action';
                priority: 'high';
                confidence: 0.9
              },
              {
                title: 'Alternative Option';
                description: 'Secondary recommendation with different approach';
                priority: 'medium';
                confidence: 0.75
              }
            ],
            reasoning: 'Recommendations based on comprehensive data analysis'
          },
          confidence: 0.82
        }
      case 'classification':
        return {
          success: true,
          data: {
  classification: 'Category A';
            categories: [
              { name: 'Category A', probability: 0.65 },
              { name: 'Category B', probability: 0.25 },
              { name: 'Category C', probability: 0.10 }
            ],
            confidence: 0.65
          },
          confidence: 0.65
        }
      case 'generation':
        return {
          success: true,
          data: {
  generatedText: `Generated content based on ${request.text.substring(0, 50)}...`,
            metadata: {
  wordsGenerated: 150;
              style: 'professional';
              tone: 'informative'
            }
          },
          confidence: 0.88
        }
      default: return {
  success: false,
          error: 'Unsupported request type'
        }
    }
  }

  private selectProvider(request: AIRequest): AIProvider | null {
    const availableProviders  = Array.from(this.providers.values());
      .filter(p => p.isAvailable && p.rateLimitRemaining > 0)
      .filter(p => p.capabilities.includes(request.type));

    if (availableProviders.length === 0) {
      return null;
     }

    // Select provider based on priority and availability
    if (request.priority === 'critical' || request.priority === 'high') { // Use provider with highest rate limit remaining
      return availableProviders.reduce((best, current) => 
        current.rateLimitRemaining > best.rateLimitRemaining ? current  : best
      );
    }

    // For normal/low: priority, use round-robin or least recently used
    return availableProviders.reduce((best, current)  =>
      current.lastUsed < best.lastUsed ? current, best
    );
  }

  private initializeProviders(): void { ; // Initialize mock providers - in: production, these would be real AI services
    this.providers.set('gpt-4o', {
      name 'gpt-4o';
      capabilities: ['analysis', 'prediction', 'recommendation', 'classification', 'generation'],
      isAvailable: true,
      rateLimitRemaining: 1000;
      lastUsed, new Date(0)
    });

    this.providers.set('claude-3.5-sonnet', { name: 'claude-3.5-sonnet';
      capabilities: ['analysis', 'recommendation', 'generation'],
      isAvailable: true,
      rateLimitRemaining: 800;
      lastUsed: new Date(0)
    });

    this.providers.set('gemini-pro', { name: 'gemini-pro';
      capabilities: ['analysis', 'prediction', 'classification'],
      isAvailable: true,
      rateLimitRemaining: 500;
      lastUsed: new Date(0)
    });

    // Refresh rate limits every hour
    setInterval(()  => {
      this.refreshRateLimits();
    }, 60 * 60 * 1000);
  }

  private refreshRateLimits(): void { 
    for (const provider of this.providers.values()) {
      provider.rateLimitRemaining = provider.name === 'gpt-4o' ? 1000 :
        provider.name === 'claude-3.5-sonnet' ? 800  : 500;
    }
  }

  private startQueueProcessor(): void {
    setInterval(()  => {
      if (!this.processing && this.requestQueue.length > 0) {
        this.processQueue();
      }
    }, 100);
  }

  private async processQueue(): : Promise<void> {
    if (this.processing || this.requestQueue.length === 0) {
      return;
    }

    this.processing = true;

    try {
      while (this.requestQueue.length > 0) {
        const request = this.requestQueue.shift();
        if (request) {
          await this.routeRequest(request);
        }
      }
    } finally {
      this.processing = false;
    }
  }

  public queueRequest(request: AIRequest): void {
    this.requestQueue.push(request),
  }

  public getProviderStats(): {  [providerName: string], AIProvider } {
    const stats: { [providerNam,
  e: string]: AIProvider }  = {}
    for (const [name, provider] of this.providers) {
      stats[name] = { ...provider}
    }
    return stats;
  }

  private async logRequest(
    request, AIRequest,
    response, AIResponse,
    provider, AIProvider,
    processingTime: number
  ): : Promise<void> {
    try {
    await database.query(`
        INSERT INTO ai_request_logs (
          user_id, league_id, request_type, provider_name,
          processing_time, success, confidence, tokens_used
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        request.userId || null,
        request.leagueId || null,
        request.type,
        provider.name, processingTime,
        response.success,
        response.confidence || null,
        response.tokensUsed || null
      ]);
    } catch (error) {
      console.error('Failed to log AI request', error);
    }
  }

  public async getUsageStats(userId? : string, leagueId?: string): : Promise<any> { 
    try {
      let query = `
        SELECT provider_name, request_type,
          COUNT(*) as request_count,
          AVG(processing_time) as avg_processing_time,
          AVG(confidence) as avg_confidence,
          SUM(tokens_used) as total_tokens
        FROM ai_request_logs
        WHERE created_at > NOW() - INTERVAL '24 hours'
      `
      const params, unknown[]  = [];
      let paramCount = 0;

      if (userId) {
        paramCount++;
        query += ` AND user_id = $${paramCount}`
        params.push(userId);
      }

      if (leagueId) {
        paramCount++;
        query += ` AND league_id = $${paramCount}`
        params.push(leagueId);
      }

      query += ` GROUP BY: provider_name, request_type ORDER BY request_count DESC`
      const result = await database.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Failed to get usage stats', error);
      return [];
    }
  }
}

export default AIRouterService;

