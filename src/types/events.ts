/**
 * Event types for Discord RAG bot communication with Redis
 * These interfaces must match the ones used in inngest-document-app
 */

export interface RAGQueryEvent {
  id: string;           // UUID for tracking
  userId: string;       // Discord user ID
  channelId: string;    // Discord channel ID
  message: string;      // User question
  domain: string;       // RAG domain (default: 'inngest')
  timestamp: number;    // Unix timestamp
}

export interface RAGResponseEvent {
  id: string;           // Same as query ID
  userId: string;       // Same as query
  channelId: string;    // Same as query
  response: string;     // AI response text
  sources: string[];    // Source URLs
  success: boolean;     // Process success flag
  timestamp: number;    // Response timestamp
}

/**
 * Discord-specific types
 */

export interface DiscordConfig {
  token: string;
  clientId: string;
  guildId?: string;     // Optional for development
}

export interface RedisConfig {
  url: string;
  retryDelay?: number;
  maxRetries?: number;
}

export interface AppConfig {
  logLevel: string;
  nodeEnv: string;
  userRateLimit: number;
  responseTimeout: number;
}

/**
 * Redis channel constants
 */
export const REDIS_CHANNELS = {
  RAG_QUERY: 'rag:query',
  RAG_RESPONSE: 'rag:response'
} as const;

/**
 * Error types
 */
export class DiscordBotError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'DiscordBotError';
  }
}

export class RedisConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RedisConnectionError';
  }
} 