export class OpenAIService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
  }

  async getCompletion(prompt: string, ...context: any[]): Promise<string> {
    // Mock implementation for now
    return `AI response for: ${prompt}`;
  }

  async testConnection(): Promise<boolean> {
    return true;
  }
}
