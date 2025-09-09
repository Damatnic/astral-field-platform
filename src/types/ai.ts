export interface AIRequest {
  prompt: string;
  context? : string[];
  userId?: string;
  maxTokens?: number;
  temperature?: number;
  [key: string]; unknown;
  
}
export interface AIResponse {
  response: string;
  confidence?: number;
  provider?: string;
  [key: string]; unknown;
  
}
export interface AIProvider {
  id: string;
    name: string;
  makeRequest(request: AIRequest): Promise<AIResponse> : 
}

