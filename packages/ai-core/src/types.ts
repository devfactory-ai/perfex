/**
 * AI Core Types
 * Type definitions for AI functionality
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatResponse {
  response: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface EmbeddingResponse {
  data: number[][];
  shape: number[];
}

export interface SummarizeOptions {
  max_length?: number;
  min_length?: number;
}

export interface AIModels {
  chat: {
    llama3_8b: '@cf/meta/llama-3.1-8b-instruct';
    llama3_70b: '@cf/meta/llama-3.1-70b-instruct';
    mistral_7b: '@cf/mistral/mistral-7b-instruct-v0.1';
  };
  embedding: {
    bge_base: '@cf/baai/bge-base-en-v1.5';
    bge_large: '@cf/baai/bge-large-en-v1.5';
  };
  summarization: {
    bart: '@cf/facebook/bart-large-cnn';
  };
}

export const AI_MODELS: AIModels = {
  chat: {
    llama3_8b: '@cf/meta/llama-3.1-8b-instruct',
    llama3_70b: '@cf/meta/llama-3.1-70b-instruct',
    mistral_7b: '@cf/mistral/mistral-7b-instruct-v0.1',
  },
  embedding: {
    bge_base: '@cf/baai/bge-base-en-v1.5',
    bge_large: '@cf/baai/bge-large-en-v1.5',
  },
  summarization: {
    bart: '@cf/facebook/bart-large-cnn',
  },
};
