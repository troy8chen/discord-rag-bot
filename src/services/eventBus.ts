import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { RAGQueryEvent, RAGResponseEvent } from '../types/events';
import { getRedisConfig, getAppConfig } from '../utils/config';

/**
 * Event Bus for Redis pub/sub messaging
 * Handles communication between Discord bot and RAG service
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
   * Initialize Redis connections and set up subscriptions
   */
  async initialize(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      // Subscribe to response channel
      await this.subscriber.subscribe('rag:response');
      
      // Handle incoming responses
      this.subscriber.on('message', (channel: string, message: string) => {
        if (channel === 'rag:response') {
          this.handleRAGResponse(message);
        }
      });

      this.isConnected = true;
      console.log('✅ Redis event bus initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Redis event bus:', error);
      throw error;
    }
  }

  /**
   * Publish RAG query to processing service
   */
  async publishQuery(userId: string, channelId: string, message: string): Promise<string> {
    const queryId = uuidv4();
    
    const queryEvent: RAGQueryEvent = {
      id: queryId,
      userId,
      channelId,
      message,
      domain: 'inngest',
      timestamp: Date.now()
    };

    await this.publisher.publish('rag:query', JSON.stringify(queryEvent));
    console.log(`📤 Published query ${queryId} to RAG service`);
    
    return queryId;
  }

  /**
   * Wait for RAG response with timeout
   */
  async waitForResponse(queryId: string, timeoutMs: number): Promise<RAGResponseEvent> {
    const appConfig = getAppConfig();
    const timeout = timeoutMs || appConfig.responseTimeout;

    return new Promise((resolve, reject) => {
      // Set up timeout
      const timer = setTimeout(() => {
        this.responseHandlers.delete(queryId);
        reject(new Error(`Response timeout for query ${queryId}`));
      }, timeout);

      // Set up response handler
      this.responseHandlers.set(queryId, (response) => {
        clearTimeout(timer);
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
      const handler = this.responseHandlers.get(response.id);
      
      if (handler) {
        console.log(`📥 Received response for query ${response.id}`);
        handler(response);
      }
    } catch (error) {
      console.error('❌ Error handling RAG response:', error);
    }
  }

  /**
   * Health check - ping Redis
   */
  async ping(): Promise<void> {
    await this.publisher.ping();
  }

  /**
   * Clean shutdown
   */
  async close(): Promise<void> {
    if (this.publisher) {
      await this.publisher.quit();
    }
    if (this.subscriber) {
      await this.subscriber.quit();
    }
    this.isConnected = false;
    console.log('✅ Redis event bus closed');
  }
} 