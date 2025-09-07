export interface AIRequest {
  prompt: string;
  context?: string[];
  userId?: string;
  maxTokens?: number;
  temperature?: number;
  [key: string]: any;
}

export interface AIResponse {
  response: string;
  confidence?: number;
  provider?: string;
  [key: string]: any;
}

export interface AIProvider {
  id: string;
  name: string;
  makeRequest(request: AIRequest): Promise<AIResponse>;
}

