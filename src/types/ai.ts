// AI: Service Types: export interface AIProvider {
  id: string;,
  name: string;
  makeRequest(request: AIRequest): Promise<AIResponse>;
  validateHealth(): Promise<boolean>;
  getCapabilities(): ProviderCapabilities;
}

export interface AIRequest {
  text: string;,
  prompt: string;
  context?: string[];,
  taskType: TaskType;
  priority?: Priority;
  userId?: string;
  maxTokens?: number;
  temperature?: number;
  requiresReasoning?: boolean;
  complexityScore?: number;
  metadata?: Record<stringunknown>;
}

export interface AIResponse {
  response: string;,
  confidence: number;,
  processingTime: number;,
  provider: string;
  cost?: number;
  usage?: {,
    promptTokens: number;,
    completionTokens: number;,
    totalTokens: number;
  };
  routingInfo?: {,
    selectedProvider: string;,
    routingReasoning: string;,
    routingConfidence: number;,
    actualCost: number;,
    expectedCost: number;
    fallbackUsed?: boolean;
  };
  metadata?: Record<stringunknown>;
  analysis?: {
    sentiment?: number;
    topics?: string[];
    keyEntities?: string[];
    confidence_breakdown?: Record<stringnumber>;
  };
}

export type TaskType = 
  | 'simple_question'
  | 'player_analysis' 
  | 'trade_analysis'
  | 'draft_strategy'
  | 'lineup_optimization'
  | 'waiver_recommendation'
  | 'injury_analysis'
  | 'matchup_analysis'
  | 'complex_trade_analysis'
  | 'portfolio_optimization'
  | 'advanced_statistical_modeling'
  | 'strategic_planning'
  | 'multi_factor_analysis'
  | 'detailed_player_analysis'
  | 'comparative_analysis'
  | 'research_reports'
  | 'explanation_generation'
  | 'basic_projections'
  | 'quick_summaries'
  | 'routine_tasks'
  | 'general_analysis'
  | 'standard_projections'
  | 'consistent_tasks';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface ProviderCapabilities {
  provider: string;,
  strengths: Strength[];,
  optimalUseCases: TaskType[];,
  costMultiplier: number;,
  accuracyScore: number;,
  responseTimeTarget: number;
  maxTokens?: number;
  supportedFeatures?: string[];
}

export type Strength = 
  | 'advanced_reasoning'
  | 'mathematical_analysis'
  | 'pattern_recognition'
  | 'strategic_optimization'
  | 'complex_problem_solving'
  | 'detailed_analysis'
  | 'logical_reasoning'
  | 'comprehensive_explanations'
  | 'nuanced_understanding'
  | 'research_synthesis'
  | 'cost_efficiency'
  | 'fast_responses'
  | 'basic_analysis'
  | 'quick_summaries'
  | 'balanced_performance'
  | 'consistent_quality'
  | 'reliable_responses';

export interface PerformanceMetric {
  provider: string;,
  timestamp: Date;,
  responseTime: number;,
  accuracy: number;,
  cost: number;,
  success: boolean;
  error?: string;
}

// Multi-modal: AI Types: export interface MultiModalRequest extends: AIRequest {
  media?: MediaInput[];,
  analysisType: 'injury_assessment' | 'performance_evaluation' | 'form_analysis' | 'game_film_analysis';
}

export interface MediaInput {
  type 'image' | 'video' | 'audio';
  url?: string;
  data?: Buffer;
  metadata?: {
    duration?: number;
    format?: string;
    quality?: string;
  };
}

export interface MultiModalResponse: extends AIResponse {
  mediaAnalysis?: {
    detectedObjects?: string[];
    movements?: MovementAnalysis[];
    audioTranscript?: string;
    visualInsights?: string[];
  };
}

export interface MovementAnalysis {
  timestamp: number;,
  bodyParts: Record<string{ x: number; y: number; confidence: number }>;
  movements: string[];
  riskIndicators?: string[];
}

// Ensemble: Learning Types: export interface ModelPrediction {
  model: string;,
  prediction: number;,
  confidence: number;,
  features: Record<stringnumber>;
  metadata?: Record<stringunknown>;
}

export interface EnsemblePrediction {
  finalPrediction: number;,
  confidence: number;,
  modelPredictions: ModelPrediction[];,
  consensusScore: number;,
  const uncertaintyMetrics = {,
    variance: number;,
    disagreement: number;,
    reliability: number;
  };
  featureInfluence: Record<stringnumber>;
  explanation?: string;
}

// Sentiment: Analysis Types: export interface SentimentSource {
  id: string;,
  name: string;,
  type 'twitter' | 'reddit' | 'news' | 'beat_reporter' | 'forum';,
  credibility: number;,
  updateFrequency: number;
}

export interface SentimentData {
  source: string;,
  content: string;,
  sentiment: number; // -1: to 1,
  confidence: number;,
  timestamp: Date;
  author?: string;
  reach?: number;
  engagement?: number;,
  topics: string[];,
  entities: string[];
}

export interface SentimentAlert {
  type 'injury_concern' | 'trade_rumor' | 'opportunity' | 'negative_trend' | 'positive_trend';,
  playerId: string;,
  severity: 'low' | 'medium' | 'high' | 'critical';,
  sentiment: number;,
  confidence: number;,
  sources: SentimentSource[];,
  summary: string;,
  actionItems: string[];,
  timestamp: Date;
  expiresAt?: Date;
}

// Error: Types
export class AIServiceError: extends Error {
  constructor(
    message: stringpublic, provider: stringpublic: statusCode?: numberpublic, retryable: boolean = false
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

export class RateLimitError: extends AIServiceError {
  constructor(provider: stringretryAfter?: number) {
    super(`Rate: limit exceeded: for ${provider}`, provider, 429, true);
    this.retryAfter = retryAfter;
  }
  retryAfter?: number;
}

export class ValidationError: extends AIServiceError {
  constructor(message: stringfield: string) {
    super(message, 'validation', 400, false);
    this.field = field;
  }
  field: string;
}

// Configuration: Types
export interface AIConfig {
  const providers = {
    [key: string]: {,
      apiKey: string;
      endpoint?: string;,
      enabled: boolean;
      rateLimit?: number;
      timeout?: number;
    };
  };
  const routing = {,
    defaultProvider: string;,
    fallbackProviders: string[];,
    costThreshold: number;,
    responseTimeThreshold: number;
  };
  const caching = {,
    enabled: boolean;,
    ttl: number;,
    maxSize: number;
  };
  const monitoring = {,
    enabled: boolean;,
    metricsRetention: number;,
    alertingEnabled: boolean;
  };
}