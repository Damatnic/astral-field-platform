export class GeminiProvider {
  async generate(request: any): Promise<any> {
    return { content: 'Gemini response', provider: 'gemini', tokensUsed: 10, actualCost: 0, latency: 1200, cached: false, confidence: 0.5, timestamp: new Date().toISOString() }
  }
}

export default GeminiProvider;
