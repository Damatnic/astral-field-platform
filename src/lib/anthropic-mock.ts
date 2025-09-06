// Mock Anthropic SDK for build compatibility
// This is a placeholder implementation to prevent build errors

export interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AnthropicResponse {
  content: Array<{
    text: string;
    type: 'text';
  }>;
  model: string;
  role: 'assistant';
  stop_reason: 'end_turn' | 'max_tokens';
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class Anthropic {
  constructor(options?: { apiKey?: string }) {
    // Mock constructor
  }

  messages = {
    create: async (params: {
      model: string;
      messages: AnthropicMessage[];
      max_tokens?: number;
      temperature?: number;
    }): Promise<AnthropicResponse> => {
      // Mock response
      return {
        content: [{
          text: 'Mock Anthropic response for build compatibility',
          type: 'text'
        }],
        model: params.model || 'claude-3-haiku',
        role: 'assistant',
        stop_reason: 'end_turn',
        usage: {
          input_tokens: 10,
          output_tokens: 15
        }
      };
    }
  };
}

export default Anthropic;