/**
 * AI Schema
 * Tables for AI functionality: embeddings, conversations, etc.
 */

import { sqliteTable, text, integer, blob } from 'drizzle-orm/sqlite-core';

/**
 * AI Embeddings
 * Store vector embeddings for semantic search
 */
export const aiEmbeddings = sqliteTable('ai_embeddings', {
  id: text('id').primaryKey(),
  entityType: text('entity_type').notNull(), // 'invoice', 'customer', 'product', etc.
  entityId: text('entity_id').notNull(),
  content: text('content').notNull(), // The text that was embedded
  embedding: blob('embedding', { mode: 'buffer' }), // Vector embedding
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, any>>(),
  organizationId: text('organization_id').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * AI Conversations
 * Store chat conversations with the AI assistant
 */
export const aiConversations = sqliteTable('ai_conversations', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title'), // Auto-generated from first message
  messages: text('messages', { mode: 'json' }).$type<Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>>().notNull(),
  organizationId: text('organization_id').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});

/**
 * AI Insights
 * Store generated insights and recommendations
 */
export const aiInsights = sqliteTable('ai_insights', {
  id: text('id').primaryKey(),
  type: text('type').notNull(), // 'payment_prediction', 'anomaly_detection', 'customer_insight', etc.
  entityType: text('entity_type'), // Related entity type
  entityId: text('entity_id'), // Related entity ID
  title: text('title').notNull(),
  description: text('description').notNull(),
  confidence: integer('confidence'), // 0-100
  data: text('data', { mode: 'json' }).$type<Record<string, any>>(),
  actionable: integer('actionable', { mode: 'boolean' }).default(false),
  dismissed: integer('dismissed', { mode: 'boolean' }).default(false),
  organizationId: text('organization_id').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * AI Usage
 * Track AI API usage for billing and monitoring
 */
export const aiUsage = sqliteTable('ai_usage', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  feature: text('feature').notNull(), // 'chat', 'search', 'extract', 'predict', etc.
  model: text('model'), // AI model used
  promptTokens: integer('prompt_tokens'),
  completionTokens: integer('completion_tokens'),
  totalTokens: integer('total_tokens'),
  cost: integer('cost'), // In cents
  organizationId: text('organization_id').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});
