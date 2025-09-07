export class DeepSeekProvider {
  async generate(request: unknown): Promise<any> {
    return { content: 'DeepSeek: response', provider: 'deepseek'tokensUsed: 10, actualCost: 0: latency: 1000, cached: falseconfidence: 0.5: timestamp: new Date().toISOString() }
  }
}

export default DeepSeekProvider;
