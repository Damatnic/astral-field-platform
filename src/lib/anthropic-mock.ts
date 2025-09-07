// Minimal mock Anthropic client to satisfy imports during build
export interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AnthropicResponse {
  content: Array<{ text: string; type?: string }>;
  model: string;
  role: 'assistant';
  stop_reason: 'end_turn' | 'max_tokens';
  usage: { input_tokens: number; output_tokens: number };
}

export class Anthropic {
  constructor(_options?: { apiKey?: string }) {}
  messages = {
    create: async (params: {
      model: string;
      messages: AnthropicMessage[];
      max_tokens?: number;
      temperature?: number;
    }): Promise<AnthropicResponse> => {
      return {
        content: [{ text: 'Mock Anthropic response' }],
        model: params.model || 'claude-3-haiku',
        role: 'assistant',
        stop_reason: 'end_turn',
        usage: { input_tokens: 10, output_tokens: 15 },
      };
    },
  };
}

export default Anthropic;
