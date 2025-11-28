/**
 * AI Client
 * Main client for interacting with Cloudflare Workers AI
 * Uses native Workers AI binding directly
 */

import { ChatMessage, ChatOptions, ChatResponse, EmbeddingResponse, SummarizeOptions, AI_MODELS } from './types';

export class AIClient {
  private ai: Ai;

  constructor(binding: Ai) {
    this.ai = binding;
  }

  /**
   * Chat with AI model
   */
  async chat(
    messages: ChatMessage[],
    options: ChatOptions = {}
  ): Promise<ChatResponse> {
    const model = options.model || AI_MODELS.chat.llama3_8b;

    const response = await this.ai.run(model as any, {
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 2048,
      stream: options.stream ?? false,
    } as any);

    return {
      response: (response as any).response || '',
      usage: (response as any).usage,
    };
  }

  /**
   * Generate embeddings for text
   */
  async embed(text: string | string[]): Promise<EmbeddingResponse> {
    const texts = Array.isArray(text) ? text : [text];

    const response = await this.ai.run(AI_MODELS.embedding.bge_base as any, {
      text: texts,
    } as any);

    return {
      data: (response as any).data,
      shape: (response as any).shape,
    };
  }

  /**
   * Summarize text
   */
  async summarize(text: string, options: SummarizeOptions = {}): Promise<string> {
    const response = await this.ai.run(AI_MODELS.summarization.bart as any, {
      input_text: text,
      max_length: options.max_length ?? 1024,
    } as any);

    return (response as any).summary || '';
  }

  /**
   * Extract structured data from text using chat
   */
  async extractData<T = any>(text: string, schema: string): Promise<T> {
    const response = await this.chat([
      {
        role: 'system',
        content: `Extract data from the following text according to this schema: ${schema}. Return ONLY valid JSON, no explanations.`,
      },
      {
        role: 'user',
        content: text,
      },
    ]);

    try {
      return JSON.parse(response.response);
    } catch (error) {
      throw new Error('Failed to parse AI response as JSON');
    }
  }

  /**
   * Classify text into categories
   */
  async classify(text: string, categories: string[]): Promise<{ category: string; confidence: number }> {
    const response = await this.chat([
      {
        role: 'system',
        content: `Classify the following text into one of these categories: ${categories.join(', ')}. Respond with JSON: {"category": "...", "confidence": 0.0-1.0}`,
      },
      {
        role: 'user',
        content: text,
      },
    ]);

    try {
      return JSON.parse(response.response);
    } catch (error) {
      throw new Error('Failed to parse classification response');
    }
  }

  /**
   * Generate text based on prompt
   */
  async generate(prompt: string, systemPrompt?: string): Promise<string> {
    const messages: ChatMessage[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content: prompt });

    const response = await this.chat(messages);
    return response.response;
  }
}
