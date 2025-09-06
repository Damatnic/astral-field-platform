import { AIProvider, AIRequest, AIResponse } from '../types';

export class GPT4oProvider implements AIProvider {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1';
  private model = 'gpt-4o';
  private maxRetries = 3;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured for GPT-4o');
    }
  }

  async makeRequest(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      const response = await this.callOpenAIAPI(request);
      const responseTime = Date.now() - startTime;
      
      return {
        content: response.choices[0].message.content || '',
        provider: 'gpt-4o',
        model: this.model,
        responseTime,
        tokenUsage: {
          prompt: response.usage?.prompt_tokens || 0,
          completion: response.usage?.completion_tokens || 0,
          total: response.usage?.total_tokens || 0
        },
        cost: this.calculateCost(response.usage?.total_tokens || 0),
        confidence: this.extractConfidence(response.choices[0].message.content || ''),
        metadata: {
          finishReason: response.choices[0].finish_reason,
          systemFingerprint: response.system_fingerprint
        }
      };
    } catch (error) {
      throw new Error(`GPT-4o request failed: ${error}`);
    }
  }

  private async callOpenAIAPI(request: AIRequest, retryCount = 0): Promise<any> {
    try {
      const messages = this.buildMessages(request);
      
      const requestBody = {
        model: this.model,
        messages,
        max_tokens: request.maxTokens || 4000,
        temperature: request.temperature || 0.7,
        top_p: request.topP || 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1,
        response_format: request.responseFormat === 'json' ? { type: 'json_object' } : undefined
      };

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2' // Enable latest features
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle rate limiting with exponential backoff
        if (response.status === 429 && retryCount < this.maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.callOpenAIAPI(request, retryCount + 1);
        }
        
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message}`);
      }

      return await response.json();
    } catch (error) {
      if (retryCount < this.maxRetries && this.isRetryableError(error)) {
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.callOpenAIAPI(request, retryCount + 1);
      }
      throw error;
    }
  }

  private buildMessages(request: AIRequest): Array<{ role: string; content: string }> {
    const messages = [];
    
    // Add system message with enhanced capabilities
    messages.push({
      role: 'system',
      content: this.buildSystemMessage(request.taskType)
    });

    // Add context if provided
    if (request.context?.length) {
      messages.push({
        role: 'user',
        content: `Context: ${request.context.join('\n')}`
      });
    }

    // Add main prompt
    messages.push({
      role: 'user',
      content: request.prompt
    });

    return messages;
  }

  private buildSystemMessage(taskType: string): string {
    const baseSystem = `You are an advanced AI assistant specializing in fantasy sports analysis with access to GPT-4o's enhanced reasoning capabilities. You provide accurate, data-driven insights with mathematical precision.

Key capabilities:
- Advanced reasoning and logical analysis
- Statistical modeling and projections
- Pattern recognition in complex datasets  
- Strategic optimization and game theory
- Multi-factor analysis and correlation detection
- Uncertainty quantification and confidence scoring

Always provide:
1. Clear, actionable recommendations
2. Confidence scores (0.0-1.0) for predictions
3. Reasoning behind your analysis
4. Risk assessment and alternative scenarios`;

    const taskSpecificGuidance = {
      'player_analysis': `
Focus on:
- Performance trends and projection accuracy
- Injury risk assessment and recovery timelines
- Matchup advantages and situational factors
- Usage pattern analysis and opportunity metrics`,

      'trade_analysis': `
Focus on:
- Multi-dimensional value assessment
- Playoff impact modeling and championship odds
- Risk-adjusted returns and downside protection
- Market timing and strategic considerations`,

      'lineup_optimization': `
Focus on:
- Correlation analysis and stack strategies
- Ownership projection and contrarian opportunities
- Game environment factors and script analysis
- Risk tolerance and tournament vs cash considerations`,

      'draft_strategy': `
Focus on:
- Value-based drafting and positional scarcity
- ADP deviation opportunities and market inefficiencies
- Team construction and roster balance optimization
- Late-round value identification and sleeper analysis`,

      'waiver_analysis': `
Focus on:
- Opportunity evaluation and target prioritization
- Snap count trends and usage trajectory analysis
- Injury replacement value and handcuff strategies
- FAAB budget allocation and bidding strategy`,

      'season_strategy': `
Focus on:
- Championship path optimization and playoff seeding
- Schedule strength analysis and timing considerations
- Portfolio management and risk diversification
- Trade deadline strategy and roster construction`
    };

    return baseSystem + (taskSpecificGuidance[taskType] || '');
  }

  private extractConfidence(content: string): number {
    // Look for confidence indicators in the response
    const confidencePatterns = [
      /confidence[:\s]*([0-9]*\.?[0-9]+)/i,
      /([0-9]*\.?[0-9]+)\s*confidence/i,
      /certainty[:\s]*([0-9]*\.?[0-9]+)/i,
      /probability[:\s]*([0-9]*\.?[0-9]+)/i
    ];

    for (const pattern of confidencePatterns) {
      const match = content.match(pattern);
      if (match) {
        const value = parseFloat(match[1]);
        return value > 1 ? value / 100 : value; // Convert percentage to decimal
      }
    }

    // Default confidence based on response characteristics
    if (content.includes('very confident') || content.includes('highly likely')) {
      return 0.9;
    } else if (content.includes('confident') || content.includes('likely')) {
      return 0.8;
    } else if (content.includes('moderate') || content.includes('possible')) {
      return 0.6;
    } else if (content.includes('uncertain') || content.includes('unclear')) {
      return 0.4;
    }

    return 0.7; // Default moderate confidence
  }

  private calculateCost(totalTokens: number): number {
    // GPT-4o pricing: $5.00 per 1M input tokens, $15.00 per 1M output tokens
    // Using average pricing for simplicity: $10.00 per 1M tokens
    return (totalTokens / 1000000) * 10.0;
  }

  private isRetryableError(error: any): boolean {
    if (error.message?.includes('rate limit')) return true;
    if (error.message?.includes('timeout')) return true;
    if (error.message?.includes('network')) return true;
    if (error.message?.includes('ECONNRESET')) return true;
    return false;
  }

  getCostEstimate(request: AIRequest): number {
    // Estimate tokens based on prompt length and expected response
    const promptTokens = Math.ceil(request.prompt.length / 4); // Rough token estimation
    const expectedResponseTokens = request.maxTokens || 2000;
    const totalTokens = promptTokens + expectedResponseTokens;
    
    return this.calculateCost(totalTokens);
  }

  getCapabilities(): string[] {
    return [
      'advanced_reasoning',
      'mathematical_analysis', 
      'strategic_optimization',
      'pattern_recognition',
      'multi_factor_analysis',
      'uncertainty_quantification',
      'game_theory',
      'statistical_modeling',
      'correlation_analysis',
      'risk_assessment'
    ];
  }

  getModelInfo(): { name: string; version: string; contextLength: number } {
    return {
      name: 'GPT-4o',
      version: '2024-08-06',
      contextLength: 128000
    };
  }

  async validateHealth(): Promise<boolean> {
    try {
      const testRequest: AIRequest = {
        prompt: 'Test connection',
        taskType: 'health_check',
        maxTokens: 10
      };
      
      const response = await this.makeRequest(testRequest);
      return response.content.length > 0;
    } catch (error) {
      console.error('GPT-4o health check failed:', error);
      return false;
    }
  }

  // Advanced GPT-4o specific methods

  async analyzeComplexScenario(scenario: {
    players: string[];
    constraints: string[];
    objectives: string[];
    context: string[];
  }): Promise<AIResponse> {
    const prompt = `
Analyze this complex fantasy football scenario using advanced reasoning:

Players involved: ${scenario.players.join(', ')}
Constraints: ${scenario.constraints.join(', ')}
Objectives: ${scenario.objectives.join(', ')}
Additional context: ${scenario.context.join(', ')}

Please provide:
1. Multi-factor analysis of the situation
2. Probabilistic outcomes with confidence intervals
3. Risk-adjusted recommendations
4. Alternative strategies with trade-offs
5. Sensitivity analysis for key variables

Format your response with clear sections and numerical confidence scores.`;

    return await this.makeRequest({
      prompt,
      taskType: 'complex_analysis',
      maxTokens: 4000,
      temperature: 0.3 // Lower temperature for analytical tasks
    });
  }

  async optimizePortfolio(portfolio: {
    currentPlayers: Array<{name: string; position: string; value: number}>;
    availablePlayers: Array<{name: string; position: string; cost: number}>;
    constraints: {budget: number; positions: Record<string, number>};
    objectives: string[];
  }): Promise<AIResponse> {
    const prompt = `
Optimize this fantasy football portfolio using mathematical modeling:

Current Portfolio:
${portfolio.currentPlayers.map(p => `- ${p.name} (${p.position}): $${p.value}`).join('\n')}

Available Players:
${portfolio.availablePlayers.map(p => `- ${p.name} (${p.position}): $${p.cost}`).join('\n')}

Constraints:
- Budget: $${portfolio.constraints.budget}
- Position requirements: ${JSON.stringify(portfolio.constraints.positions)}

Objectives: ${portfolio.objectives.join(', ')}

Provide:
1. Optimal portfolio allocation
2. Expected value calculations
3. Risk metrics and Sharpe ratio equivalent
4. Sensitivity analysis
5. Alternative allocations with different risk profiles`;

    return await this.makeRequest({
      prompt,
      taskType: 'portfolio_optimization',
      maxTokens: 3500,
      temperature: 0.2
    });
  }
}