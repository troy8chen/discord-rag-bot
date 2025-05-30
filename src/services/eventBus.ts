import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import type { RAGQueryEvent, RAGResponseEvent } from '@/types/events';
import { REDIS_CHANNELS, RedisConnectionError } from '@/types/events';
import { getRedisConfig, getAppConfig } from '@/utils/config';

/**
 * Redis Event Bus for Discord RAG Bot
 * Handles communication with the RAG worker service
 */
export class EventBus {
  private publisher: Redis;
  private subscriber: Redis;
  private responseHandlers = new Map<string, (response: RAGResponseEvent) => void>();
  private isConnected = false;

  constructor() {
    const config = getRedisConfig();
    
    // Create separate Redis connections for pub/sub
    this.publisher = new Redis(config.url);
    this.subscriber = new Redis(config.url);
  }

  /**
   * Initialize the event bus and start listening for responses
   */
  async initialize(): Promise<void> {
    try {
      console.log('📨 Connecting to Redis...');
      
      // Setup error handlers
      this.publisher.on('error', (error) => {
        console.error('❌ Redis Publisher Error:', error);
      });

      this.subscriber.on('error', (error) => {
        console.error('❌ Redis Subscriber Error:', error);
      });

      // Subscribe to RAG responses
      await this.subscriber.subscribe(REDIS_CHANNELS.RAG_RESPONSE);
      
      // Handle incoming responses
      this.subscriber.on('message', (channel, message) => {
        if (channel === REDIS_CHANNELS.RAG_RESPONSE) {
          this.handleRAGResponse(message);
        }
      });

      this.isConnected = true;
      console.log('✅ Redis EventBus connected and listening for responses');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new RedisConnectionError(`Failed to initialize Redis: ${errorMessage}`);
    }
  }

  /**
   * Publish a query to the RAG service
   */
  async publishQuery(userId: string, channelId: string, message: string): Promise<string> {
    if (!this.isConnected) {
      throw new RedisConnectionError('EventBus not initialized');
    }

    const queryId = uuidv4();
    const query: RAGQueryEvent = {
      id: queryId,
      userId,
      channelId,
      message,
      domain: 'inngest', // Default domain
      timestamp: Date.now()
    };

    try {
      await this.publisher.publish(REDIS_CHANNELS.RAG_QUERY, JSON.stringify(query));
      console.log(`📤 Published query ${queryId} for user ${userId}`);
      return queryId;
    } catch (error) {
      console.error('❌ Failed to publish query:', error);
      throw error;
    }
  }

  /**
   * Register a handler for a specific query response
   */
  waitForResponse(queryId: string, timeoutMs: number = 30000): Promise<RAGResponseEvent> {
    return new Promise((resolve, reject) => {
      // Set timeout
      const timeout = setTimeout(() => {
        this.responseHandlers.delete(queryId);
        reject(new Error(`Query ${queryId} timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      // Register response handler
      this.responseHandlers.set(queryId, (response: RAGResponseEvent) => {
        clearTimeout(timeout);
        this.responseHandlers.delete(queryId);
        resolve(response);
      });
    });
  }

  /**
   * Handle incoming RAG responses
   */
  private handleRAGResponse(message: string): void {
    try {
      const response: RAGResponseEvent = JSON.parse(message);
      console.log(`📥 Received response ${response.id} for user ${response.userId}`);

      // Find and call the response handler
      const handler = this.responseHandlers.get(response.id);
      if (handler) {
        handler(response);
      } else {
        console.warn(`⚠️ No handler found for response ${response.id}`);
      }
    } catch (error) {
      console.error('❌ Failed to handle RAG response:', error);
    }
  }

  /**
   * Close Redis connections
   */
  async close(): Promise<void> {
    console.log('🛑 Closing Redis connections...');
    
    if (this.subscriber) {
      await this.subscriber.unsubscribe();
      this.subscriber.disconnect();
    }
    
    if (this.publisher) {
      this.publisher.disconnect();
    }
    
    this.isConnected = false;
    console.log('✅ Redis connections closed');
  }

  /**
   * Health check
   */
  async ping(): Promise<boolean> {
    try {
      const result = await this.publisher.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }
} 