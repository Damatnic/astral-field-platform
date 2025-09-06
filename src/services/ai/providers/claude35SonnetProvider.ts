import { AIProvider, AIRequest, AIResponse } from '../types';

export class Claude35SonnetProvider implements AIProvider {
  private apiKey: string;
  private baseUrl = 'https://api.anthropic.com/v1';
  private model = 'claude-3-5-sonnet-20241022';
  private maxRetries = 3;

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('Anthropic API key not configured for Claude-3.5 Sonnet');
    }
  }

  async makeRequest(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      const response = await this.callAnthropicAPI(request);
      const responseTime = Date.now() - startTime;
      
      return {
        content: response.content[0].text || '',
        provider: 'claude-3.5-sonnet',
        model: this.model,
        responseTime,
        tokenUsage: {
          prompt: response.usage?.input_tokens || 0,
          completion: response.usage?.output_tokens || 0,
          total: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0)
        },
        cost: this.calculateCost(response.usage?.input_tokens || 0, response.usage?.output_tokens || 0),
        confidence: this.extractConfidence(response.content[0].text || ''),
        metadata: {
          stopReason: response.stop_reason,
          stopSequence: response.stop_sequence
        }
      };
    } catch (error) {
      throw new Error(`Claude-3.5 Sonnet request failed: ${error}`);
    }
  }

  private async callAnthropicAPI(request: AIRequest, retryCount = 0): Promise<any> {
    try {
      const requestBody = {
        model: this.model,
        max_tokens: request.maxTokens || 4000,
        temperature: request.temperature || 0.7,
        top_p: request.topP || 0.9,
        system: this.buildSystemMessage(request.taskType),
        messages: this.buildMessages(request),
        stream: false,
        metadata: {
          user_id: request.userId || 'anonymous'
        }
      };

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'max-tokens-3-5-sonnet-2024-07-15' // Enable increased token limit
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle rate limiting with exponential backoff
        if (response.status === 429 && retryCount < this.maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.callAnthropicAPI(request, retryCount + 1);
        }
        
        throw new Error(`Anthropic API error: ${response.status} - ${errorData.error?.message}`);
      }

      return await response.json();
    } catch (error) {
      if (retryCount < this.maxRetries && this.isRetryableError(error)) {
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.callAnthropicAPI(request, retryCount + 1);
      }
      throw error;
    }
  }

  private buildSystemMessage(taskType: string): string {
    const baseSystem = `You are Claude 3.5 Sonnet, an advanced AI assistant with exceptional reasoning capabilities specializing in fantasy sports analysis. You excel at:

- Deep analytical thinking and logical reasoning
- Complex problem-solving with multiple variables
- Statistical analysis and mathematical modeling
- Strategic thinking and game theory applications
- Detailed explanations with step-by-step reasoning
- Nuanced understanding of context and implications

Your responses should be:
- Thorough and well-reasoned with clear logic
- Quantitative when possible with statistical backing
- Honest about uncertainty and limitations
- Structured with clear sections and bullet points
- Include confidence assessments for predictions

Always consider multiple perspectives and provide alternative scenarios.`;

    const taskSpecificGuidance = {
      'strategic_analysis': `
Excel at:
- Multi-layered strategic thinking
- Long-term vs short-term trade-offs
- Competitive dynamics and opponent modeling
- Scenario planning and contingency strategies
- Risk/reward optimization with mathematical backing`,

      'detailed_explanation': `
Provide:
- Step-by-step logical reasoning
- Comprehensive factor analysis
- Historical context and precedent examples  
- Detailed methodology explanations
- Clear connection between evidence and conclusions`,

      'complex_modeling': `
Focus on:
- Multi-variable statistical modeling
- Correlation and causation analysis
- Uncertainty quantification and sensitivity analysis
- Monte Carlo simulations and probabilistic outcomes
- Model validation and assumption testing`,

      'comparative_analysis': `
Analyze:
- Systematic comparison frameworks
- Weighted scoring models with rationale
- Trade-off analysis between alternatives
- Ranking methodologies with clear criteria
- Sensitivity to different weighting schemes`,

      'research_synthesis': `
Synthesize:
- Multiple data sources and viewpoints
- Conflicting information with resolution strategies
- Literature review and expert consensus
- Meta-analysis approaches when applicable
- Evidence quality assessment and reliability scoring`
    };

    return baseSystem + (taskSpecificGuidance[taskType] || '');
  }

  private buildMessages(request: AIRequest): Array<{ role: string; content: string }> {
    const messages = [];

    // Add context if provided
    if (request.context?.length) {
      messages.push({
        role: 'user',
        content: `Background context for analysis:\n${request.context.join('\n\n')}`
      });
    }

    // Add main prompt with enhanced structure for Claude
    const enhancedPrompt = this.enhancePromptForClaude(request.prompt, request.taskType);
    messages.push({
      role: 'user',
      content: enhancedPrompt
    });

    return messages;
  }

  private enhancePromptForClaude(prompt: string, taskType: string): string {
    // Claude responds well to structured prompts with clear expectations
    const structuredPrompt = `
${prompt}

Please structure your response as follows:
1. **Executive Summary**: Key findings and recommendations (2-3 sentences)
2. **Detailed Analysis**: Comprehensive breakdown with supporting data
3. **Risk Assessment**: Potential downsides and mitigation strategies
4. **Confidence Score**: Your confidence level (0.0-1.0) with reasoning
5. **Alternative Scenarios**: Other possible outcomes and their implications
6. **Action Items**: Specific, actionable next steps

Ensure your analysis is thorough, well-reasoned, and backed by quantitative evidence where available.`;

    return structuredPrompt;
  }

  private extractConfidence(content: string): number {
    // Claude often provides explicit confidence scores
    const confidencePatterns = [
      /confidence[:\s]*([0-9]*\.?[0-9]+)/i,
      /([0-9]*\.?[0-9]+)\s*confidence/i,
      /certainty[:\s]*([0-9]*\.?[0-9]+)/i,
      /probability[:\s]*([0-9]*\.?[0-9]+)/i,
      /confidence score[:\s]*([0-9]*\.?[0-9]+)/i
    ];

    for (const pattern of confidencePatterns) {
      const match = content.match(pattern);
      if (match) {
        const value = parseFloat(match[1]);
        return value > 1 ? value / 100 : value;
      }
    }

    // Claude-specific confidence indicators
    if (content.includes('highly confident') || content.includes('very certain')) {
      return 0.95;
    } else if (content.includes('confident') || content.includes('strong evidence')) {
      return 0.85;
    } else if (content.includes('moderately confident') || content.includes('reasonable certainty')) {
      return 0.75;
    } else if (content.includes('some uncertainty') || content.includes('limited data')) {
      return 0.6;
    } else if (content.includes('significant uncertainty') || content.includes('speculative')) {
      return 0.4;
    }

    return 0.8; // Claude typically provides well-reasoned responses
  }

  private calculateCost(inputTokens: number, outputTokens: number): number {
    // Claude-3.5 Sonnet pricing: $3.00 per 1M input tokens, $15.00 per 1M output tokens
    const inputCost = (inputTokens / 1000000) * 3.0;
    const outputCost = (outputTokens / 1000000) * 15.0;
    return inputCost + outputCost;
  }

  private isRetryableError(error: any): boolean {
    if (error.message?.includes('rate_limit')) return true;
    if (error.message?.includes('timeout')) return true;
    if (error.message?.includes('network')) return true;
    if (error.message?.includes('ECONNRESET')) return true;
    if (error.message?.includes('overloaded')) return true;
    return false;
  }

  getCostEstimate(request: AIRequest): number {
    const promptTokens = Math.ceil(request.prompt.length / 4);
    const expectedResponseTokens = request.maxTokens || 3000;
    
    return this.calculateCost(promptTokens, expectedResponseTokens);
  }

  getCapabilities(): string[] {
    return [
      'advanced_reasoning',
      'detailed_analysis',
      'strategic_thinking',
      'complex_modeling',
      'comparative_analysis',
      'research_synthesis',
      'logical_reasoning',
      'nuanced_understanding',
      'step_by_step_explanation',
      'uncertainty_quantification',
      'multi_perspective_analysis',
      'evidence_evaluation'
    ];
  }

  getModelInfo(): { name: string; version: string; contextLength: number } {
    return {
      name: 'Claude-3.5 Sonnet',
      version: '20241022',
      contextLength: 200000
    };
  }

  async validateHealth(): Promise<boolean> {
    try {
      const testRequest: AIRequest = {
        prompt: 'Please respond with "OK" to confirm connectivity.',
        taskType: 'health_check',
        maxTokens: 10
      };
      
      const response = await this.makeRequest(testRequest);
      return response.content.toLowerCase().includes('ok');
    } catch (error) {
      console.error('Claude-3.5 Sonnet health check failed:', error);
      return false;
    }
  }

  // Claude-specific advanced methods

  async performDetailedAnalysis(analysis: {
    subject: string;
    data: Array<{ metric: string; value: number; context: string }>;
    questions: string[];
    constraints: string[];
  }): Promise<AIResponse> {
    const prompt = `
Please perform a comprehensive analysis of: ${analysis.subject}

Available Data:
${analysis.data.map(d => `- ${d.metric}: ${d.value} (${d.context})`).join('\n')}

Key Questions to Address:
${analysis.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Constraints and Limitations:
${analysis.constraints.join('\n')}

Please provide a thorough analysis with:
1. Data quality assessment and reliability scoring
2. Statistical significance testing where applicable  
3. Multiple analytical frameworks and their conclusions
4. Potential biases and how they affect interpretation
5. Actionable insights with implementation roadmap
6. Sensitivity analysis for key assumptions

Structure your response with clear reasoning chains and quantitative backing for all claims.`;

    return await this.makeRequest({
      prompt,
      taskType: 'detailed_explanation',
      maxTokens: 8000,
      temperature: 0.3
    });
  }

  async developStrategicPlan(plan: {
    objectives: string[];
    resources: Array<{ type: string; amount: number; constraints: string[] }>;
    timeline: string;
    competitors: Array<{ name: string; strengths: string[]; weaknesses: string[] }>;
    environment: { opportunities: string[]; threats: string[] };
  }): Promise<AIResponse> {
    const prompt = `
Develop a comprehensive strategic plan with the following parameters:

Strategic Objectives:
${plan.objectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

Available Resources:
${plan.resources.map(r => `- ${r.type}: ${r.amount} (Constraints: ${r.constraints.join(', ')})`).join('\n')}

Timeline: ${plan.timeline}

Competitive Landscape:
${plan.competitors.map(c => `
- ${c.name}
  Strengths: ${c.strengths.join(', ')}
  Weaknesses: ${c.weaknesses.join(', ')}`).join('\n')}

External Environment:
- Opportunities: ${plan.environment.opportunities.join(', ')}
- Threats: ${plan.environment.threats.join(', ')}

Please develop a strategic plan including:
1. Situation analysis with SWOT integration
2. Strategic options evaluation with decision matrix
3. Recommended strategy with detailed rationale
4. Implementation roadmap with milestones
5. Risk mitigation strategies
6. Success metrics and monitoring framework
7. Contingency plans for different scenarios

Ensure all recommendations are backed by logical reasoning and consider both quantitative and qualitative factors.`;

    return await this.makeRequest({
      prompt,
      taskType: 'strategic_analysis',
      maxTokens: 8000,
      temperature: 0.4
    });
  }

  async synthesizeResearch(research: {
    topic: string;
    sources: Array<{ title: string; findings: string[]; reliability: number }>;
    conflictingViewpoints: Array<{ viewpoint: string; evidence: string[]; supporters: string[] }>;
    gaps: string[];
  }): Promise<AIResponse> {
    const prompt = `
Synthesize research findings on: ${research.topic}

Source Material:
${research.sources.map((s, i) => `
${i + 1}. ${s.title} (Reliability: ${s.reliability}/10)
   Key Findings: ${s.findings.join('; ')}`).join('\n')}

Conflicting Viewpoints:
${research.conflictingViewpoints.map((v, i) => `
${i + 1}. ${v.viewpoint}
   Evidence: ${v.evidence.join('; ')}
   Supported by: ${v.supporters.join(', ')}`).join('\n')}

Research Gaps: ${research.gaps.join(', ')}

Please provide:
1. Comprehensive synthesis with evidence hierarchy
2. Resolution of conflicting findings with methodology
3. Meta-analysis approach where applicable
4. Confidence assessment for different conclusions
5. Research quality evaluation and bias assessment
6. Practical implications and actionable insights
7. Future research priorities and methodological recommendations

Weight sources by reliability and provide transparent reasoning for all synthesis decisions.`;

    return await this.makeRequest({
      prompt,
      taskType: 'research_synthesis',
      maxTokens: 8000,
      temperature: 0.3
    });
  }
}