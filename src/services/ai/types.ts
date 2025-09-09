export interface AIRequest {
  text?, string,
  type?, string,
  context?, unknown,
  
}
export interface AIResponse {
  content, string,
  provider, string,
  tokensUsed, number,
  actualCost, number,
  latency, number,
  cached, boolean,
  confidence, number,
  timestamp: string,
  
}

