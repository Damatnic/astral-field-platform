import OpenAI from 'openai'
import { Anthropic } from '@anthropic-ai/sdk'

export interface AIProvider {
  name: string
  costPerToken: number
  requestCostBase: number
  maxTokens: number
  strength: AICapability[]
  rateLimit: {
    requestsPerMinute: number
    tokensPerMinute: number
  }
  latency: number // ms average
  reliability: number // 0-1 scale
}

export type AICapability = 
  | 'general_chat'
  | 'fantasy_analysis'
  | 'complex_reasoning'
  | 'creative_writing'
  | 'code_generation'
  | 'data_analysis'
  | 'mathematical'
  | 'fast_response'

export type QueryComplexity = 'simple' | 'moderate' | 'complex' | 'expert'
export type QueryPriority = 'low' | 'medium' | 'high' | 'critical'

export interface AIRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  maxTokens?: number
  temperature?: number
  capabilities: AICapability[]
  complexity: QueryComplexity
  priority: QueryPriority
  costBudget?: number // max cost in cents
  timeoutMs?: number
  userId?: string
  context?: string
}

export interface AIResponse {
  content: string
  provider: string
  tokensUsed: number
  actualCost: number
  latency: number
  cached: boolean
  confidence: number
  timestamp: string
}

class AIRouterService {
  private providers: Map<string, AIProvider> = new Map()
  private clients: Map<string, any> = new Map()
  private usageTracking: Map<string, any> = new Map()
  private failureTracking: Map<string, number> = new Map()

  constructor() {
    this.initializeProviders()
    this.initializeClients()
  }

  private initializeProviders() {
    // DeepSeek - Ultra cost-effective for simple tasks
    this.providers.set('deepseek', {
      name: 'DeepSeek',
      costPerToken: 0.000001, // $0.001 per 1K tokens
      requestCostBase: 0.01,
      maxTokens: 4096,
      strength: ['general_chat', 'fantasy_analysis', 'fast_response'],
      rateLimit: {
        requestsPerMinute: 100,
        tokensPerMinute: 100000
      },
      latency: 800,
      reliability: 0.92
    })

    // OpenAI GPT-4o-mini - Balanced cost/performance
    this.providers.set('openai-mini', {
      name: 'OpenAI GPT-4o-mini',
      costPerToken: 0.00015, // $0.15 per 1K tokens input, $0.6 per 1K output
      requestCostBase: 0.001,
      maxTokens: 16384,
      strength: ['general_chat', 'fantasy_analysis', 'complex_reasoning', 'fast_response'],
      rateLimit: {
        requestsPerMinute: 3000,
        tokensPerMinute: 200000
      },
      latency: 1200,
      reliability: 0.98
    })

    // OpenAI GPT-4o - High performance
    this.providers.set('openai-4o', {
      name: 'OpenAI GPT-4o',
      costPerToken: 0.0025, // $2.5 per 1K tokens input, $10 per 1K output
      requestCostBase: 0.01,
      maxTokens: 128000,
      strength: ['complex_reasoning', 'fantasy_analysis', 'data_analysis', 'creative_writing'],
      rateLimit: {
        requestsPerMinute: 500,
        tokensPerMinute: 30000
      },
      latency: 2000,
      reliability: 0.99
    })

    // Claude Sonnet - Excellence in reasoning
    this.providers.set('claude-sonnet', {
      name: 'Claude Sonnet',
      costPerToken: 0.003, // $3 per 1K tokens input, $15 per 1K output
      requestCostBase: 0.01,
      maxTokens: 200000,
      strength: ['complex_reasoning', 'fantasy_analysis', 'data_analysis', 'creative_writing'],
      rateLimit: {
        requestsPerMinute: 50,
        tokensPerMinute: 40000
      },
      latency: 3000,
      reliability: 0.97
    })

    // Google Gemini - Competitive alternative
    this.providers.set('gemini-pro', {
      name: 'Google Gemini Pro',
      costPerToken: 0.000125, // $0.125 per 1K tokens input, $0.375 per 1K output
      requestCostBase: 0.001,
      maxTokens: 32768,
      strength: ['general_chat', 'fantasy_analysis', 'complex_reasoning', 'mathematical'],
      rateLimit: {
        requestsPerMinute: 60,
        tokensPerMinute: 32000
      },
      latency: 2500,
      reliability: 0.94
    })
  }

  private initializeClients() {
    // Initialize OpenAI clients
    if (process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        dangerouslyAllowBrowser: false
      })
      this.clients.set('openai-mini', openai)
      this.clients.set('openai-4o', openai)
    }

    // Initialize Claude client
    if (process.env.ANTHROPIC_API_KEY) {
      const claude = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      })
      this.clients.set('claude-sonnet', claude)
    }

    // DeepSeek uses OpenAI-compatible API
    if (process.env.DEEPSEEK_API_KEY) {
      const deepseek = new OpenAI({
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: 'https://api.deepseek.com'
      })
      this.clients.set('deepseek', deepseek)
    }

    // Gemini would need Google AI SDK
    // if (process.env.GEMINI_API_KEY) {
    //   // Initialize Gemini client
    // }
  }

  async query(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now()

    try {
      // Select optimal provider
      const selectedProvider = await this.selectProvider(request)
      
      if (!selectedProvider) {
        throw new Error('No suitable AI provider available')
      }

      // Execute request
      const response = await this.executeRequest(request, selectedProvider)
      
      // Track usage and performance
      await this.trackUsage(selectedProvider, response, request)
      
      return response

    } catch (error: any) {
      // Fallback logic
      return await this.handleFailure(request, error, startTime)
    }
  }

  private async selectProvider(request: AIRequest): Promise<string | null> {
    const suitableProviders = Array.from(this.providers.entries())
      .filter(([key, provider]) => {
        // Check if provider supports required capabilities
        const supportsCapabilities = request.capabilities.every(cap => 
          provider.strength.includes(cap)
        )
        
        // Check if client is available
        const clientAvailable = this.clients.has(key)
        
        // Check if provider is within budget
        const withinBudget = !request.costBudget || 
          this.estimateCost(provider, request) <= request.costBudget
        
        // Check reliability (not failed recently)
        const reliable = (this.failureTracking.get(key) || 0) < 3

        return supportsCapabilities && clientAvailable && withinBudget && reliable
      })
      .map(([key, provider]) => ({
        key,
        provider,
        score: this.calculateProviderScore(provider, request)
      }))
      .sort((a, b) => b.score - a.score)

    return suitableProviders.length > 0 ? suitableProviders[0].key : null
  }

  private calculateProviderScore(provider: AIProvider, request: AIRequest): number {
    let score = 0

    // Cost efficiency (higher score for lower cost)
    const estimatedCost = this.estimateCost(provider, request)
    score += (1 / Math.max(estimatedCost, 0.01)) * 10

    // Reliability
    score += provider.reliability * 50

    // Speed bonus for time-sensitive requests
    if (request.priority === 'critical' || request.timeoutMs) {
      score += (1 / Math.max(provider.latency, 100)) * 30
    }

    // Capability match bonus
    const capabilityMatch = request.capabilities.filter(cap => 
      provider.strength.includes(cap)
    ).length / request.capabilities.length
    score += capabilityMatch * 25

    // Complexity match
    const complexityScores = {
      simple: ['deepseek', 'openai-mini'],
      moderate: ['openai-mini', 'gemini-pro'],
      complex: ['openai-4o', 'claude-sonnet'],
      expert: ['claude-sonnet', 'openai-4o']
    }
    
    const idealForComplexity = complexityScores[request.complexity]
    if (idealForComplexity.some(ideal => provider.name.toLowerCase().includes(ideal))) {
      score += 20
    }

    // Rate limit consideration
    const currentUsage = this.usageTracking.get(provider.name) || { requests: 0, tokens: 0 }
    if (currentUsage.requests < provider.rateLimit.requestsPerMinute * 0.8) {
      score += 15
    }

    return score
  }

  private estimateCost(provider: AIProvider, request: AIRequest): number {
    const estimatedTokens = request.messages.reduce((total, msg) => 
      total + Math.ceil(msg.content.length / 4), 0
    ) + (request.maxTokens || 1000)
    
    return provider.requestCostBase + (estimatedTokens * provider.costPerToken)
  }

  private async executeRequest(request: AIRequest, providerKey: string): Promise<AIResponse> {
    const provider = this.providers.get(providerKey)!
    const client = this.clients.get(providerKey)!
    const startTime = Date.now()

    try {
      let content: string
      let tokensUsed = 0

      if (providerKey.startsWith('openai') || providerKey === 'deepseek') {
        const completion = await client.chat.completions.create({
          model: this.getModelName(providerKey),
          messages: request.messages,
          max_tokens: request.maxTokens || 1000,
          temperature: request.temperature || 0.7
        })

        content = completion.choices[0]?.message?.content || ''
        tokensUsed = completion.usage?.total_tokens || 0

      } else if (providerKey === 'claude-sonnet') {
        const message = await client.messages.create({
          model: 'claude-3-sonnet-20240229',
          max_tokens: request.maxTokens || 1000,
          messages: request.messages.filter(m => m.role !== 'system'),
          system: request.messages.find(m => m.role === 'system')?.content
        })

        content = message.content[0]?.text || ''
        tokensUsed = message.usage?.input_tokens + message.usage?.output_tokens || 0

      } else {
        throw new Error(`Provider ${providerKey} not implemented`)
      }

      const latency = Date.now() - startTime
      const actualCost = this.calculateActualCost(provider, tokensUsed)

      return {
        content,
        provider: provider.name,
        tokensUsed,
        actualCost,
        latency,
        cached: false,
        confidence: this.calculateConfidence(content, provider),
        timestamp: new Date().toISOString()
      }

    } catch (error: any) {
      // Track failure
      this.failureTracking.set(providerKey, (this.failureTracking.get(providerKey) || 0) + 1)
      throw error
    }
  }

  private getModelName(providerKey: string): string {
    const models = {
      'openai-mini': 'gpt-4o-mini',
      'openai-4o': 'gpt-4o',
      'deepseek': 'deepseek-chat'
    }
    return models[providerKey as keyof typeof models] || 'gpt-4o-mini'
  }

  private calculateActualCost(provider: AIProvider, tokensUsed: number): number {
    return provider.requestCostBase + (tokensUsed * provider.costPerToken)
  }

  private calculateConfidence(content: string, provider: AIProvider): number {
    // Basic confidence calculation based on content length and provider reliability
    const contentScore = Math.min(content.length / 100, 1) * 30
    const providerScore = provider.reliability * 70
    return Math.round(contentScore + providerScore)
  }

  private async handleFailure(request: AIRequest, error: any, startTime: number): Promise<AIResponse> {
    console.error('AI Router failure:', error.message)
    
    // Try fallback with simpler request
    const fallbackRequest = {
      ...request,
      complexity: 'simple' as QueryComplexity,
      capabilities: ['general_chat' as AICapability],
      maxTokens: 500
    }

    try {
      const fallbackProvider = await this.selectProvider(fallbackRequest)
      if (fallbackProvider) {
        return await this.executeRequest(fallbackRequest, fallbackProvider)
      }
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError)
    }

    // Return error response
    return {
      content: "I apologize, but I'm currently experiencing technical difficulties. Please try again in a moment.",
      provider: 'fallback',
      tokensUsed: 0,
      actualCost: 0,
      latency: Date.now() - startTime,
      cached: false,
      confidence: 0,
      timestamp: new Date().toISOString()
    }
  }

  private async trackUsage(providerKey: string, response: AIResponse, request: AIRequest) {
    const provider = this.providers.get(providerKey)!
    const usage = this.usageTracking.get(provider.name) || {
      requests: 0,
      tokens: 0,
      totalCost: 0,
      avgLatency: 0,
      successRate: 1
    }

    usage.requests += 1
    usage.tokens += response.tokensUsed
    usage.totalCost += response.actualCost
    usage.avgLatency = (usage.avgLatency + response.latency) / 2

    this.usageTracking.set(provider.name, usage)

    // Reset failure tracking on success
    this.failureTracking.delete(providerKey)
  }

  // Convenience methods for specific use cases
  async getFantasyAdvice(question: string, context?: any, priority: QueryPriority = 'medium'): Promise<AIResponse> {
    const systemMessage = `You are an expert fantasy football advisor with deep knowledge of NFL players, statistics, matchups, and strategy. Provide actionable, data-driven advice to help users make better fantasy football decisions. Be specific, explain your reasoning, and focus on practical advice.`

    const contextInfo = context ? `Context: ${JSON.stringify(context)}\n\n` : ''

    return await this.query({
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: `${contextInfo}Question: ${question}` }
      ],
      capabilities: ['fantasy_analysis', 'data_analysis'],
      complexity: 'moderate',
      priority,
      maxTokens: 1000
    })
  }

  async analyzeTradeProposal(tradedAway: any[], tradedFor: any[], context?: any): Promise<AIResponse> {
    const systemMessage = `You are a fantasy football trade analyst. Analyze trade proposals considering player value, positional needs, season outlook, and playoff implications. Provide a clear recommendation with reasoning.`

    const tradeInfo = `
    Trading Away: ${tradedAway.map(p => `${p.name} (${p.position})`).join(', ')}
    Trading For: ${tradedFor.map(p => `${p.name} (${p.position})`).join(', ')}
    Context: ${JSON.stringify(context || {})}
    `

    return await this.query({
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: `Analyze this trade proposal:\n${tradeInfo}` }
      ],
      capabilities: ['fantasy_analysis', 'complex_reasoning'],
      complexity: 'complex',
      priority: 'medium',
      maxTokens: 1500
    })
  }

  async optimizeLineup(roster: any[], week: number, constraints?: any): Promise<AIResponse> {
    const systemMessage = `You are a fantasy football lineup optimizer. Consider matchups, projections, injury status, weather, and game scripts to recommend the optimal starting lineup.`

    const rosterInfo = roster.map(p => 
      `${p.name} (${p.position}) - ${p.team} - Projected: ${p.projectedPoints || 'N/A'} - Status: ${p.injuryStatus || 'Healthy'}`
    ).join('\n')

    return await this.query({
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: `Optimize my lineup for Week ${week}:\n\n${rosterInfo}\n\nConstraints: ${JSON.stringify(constraints || {})}` }
      ],
      capabilities: ['fantasy_analysis', 'data_analysis'],
      complexity: 'moderate',
      priority: 'high',
      maxTokens: 1200
    })
  }

  // Cost and usage analytics
  getUsageAnalytics(): any {
    const analytics = Array.from(this.usageTracking.entries()).map(([provider, usage]) => ({
      provider,
      ...usage,
      costEfficiency: usage.totalCost > 0 ? usage.requests / usage.totalCost : 0
    }))

    return {
      providers: analytics,
      totalRequests: analytics.reduce((sum, p) => sum + p.requests, 0),
      totalCost: analytics.reduce((sum, p) => sum + p.totalCost, 0),
      avgLatency: analytics.reduce((sum, p) => sum + p.avgLatency, 0) / analytics.length
    }
  }

  resetUsageTracking() {
    this.usageTracking.clear()
    this.failureTracking.clear()
  }
}

const aiRouter = new AIRouterService()
export default aiRouter