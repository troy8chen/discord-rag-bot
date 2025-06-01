import { Client, GatewayIntentBits, Events, Message, EmbedBuilder, ChannelType } from 'discord.js';
import { EventBus } from '../services/eventBus';
import { getDiscordConfig, getAppConfig } from '../utils/config';
import { log } from '../utils/logger';
import { DiscordBotError } from '../types/events';

/**
 * Discord Bot Client
 * Handles Discord API interactions and integrates with RAG service
 */
export class DiscordBot {
  private client: Client;
  private eventBus: EventBus;
  private config = getDiscordConfig();
  private appConfig = getAppConfig();
  private userRateLimits = new Map<string, number>();

  constructor() {
    // Initialize Discord client with required intents
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
      ]
    });

    this.eventBus = new EventBus();
    this.setupEventHandlers();
  }

  /**
   * Initialize the Discord bot
   */
  async initialize(): Promise<void> {
    try {
      log.info('🤖 Initializing Discord client...');
      
      // Initialize Redis event bus first
      await this.eventBus.initialize();
      
      // Login to Discord
      await this.client.login(this.config.token);
      
      log.info('✅ Discord bot initialized successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.error('Failed to initialize Discord bot', error);
      throw new DiscordBotError(`Failed to initialize Discord bot: ${errorMessage}`);
    }
  }

  /**
   * Setup Discord event handlers
   */
  private setupEventHandlers(): void {
    // Bot ready event
    this.client.once(Events.ClientReady, (readyClient) => {
      log.info(`🎉 Discord bot is ready! Logged in as ${readyClient.user.tag}`);
      log.systemHealth('discord-client', 'healthy', { 
        username: readyClient.user.tag,
        guildCount: readyClient.guilds.cache.size 
      });
    });

    // Message events
    this.client.on(Events.MessageCreate, this.handleMessage.bind(this));

    // Error handling
    this.client.on(Events.Error, (error) => {
      log.error('❌ Discord client error', error);
      log.systemHealth('discord-client', 'unhealthy', { error: error.message });
    });

    this.client.on(Events.Warn, (warning) => {
      log.warn('⚠️ Discord client warning', { warning });
    });
  }

  /**
   * Handle incoming Discord messages
   */
  private async handleMessage(message: Message): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Ignore bot messages
      if (message.author.bot) return;

      // Check if message mentions the bot or is a DM
      const isMentioned = message.mentions.has(this.client.user!);
      const isDM = message.channel.type === ChannelType.DM;
      
      if (!isMentioned && !isDM) return;

      // Rate limiting
      if (this.isRateLimited(message.author.id)) {
        await message.reply('⏳ You\'re sending messages too quickly. Please wait a moment and try again.');
        return;
      }

      // Extract message content (remove bot mention if present)
      let content = message.content;
      if (isMentioned) {
        content = content.replace(/<@!?\d+>/g, '').trim();
      }

      if (!content) {
        await message.reply('👋 Hi! Ask me anything about the documentation and I\'ll help you find answers!');
        return;
      }

      // Show typing indicator (check if channel supports it)
      if ('sendTyping' in message.channel) {
        await message.channel.sendTyping();
      }

      // Send query to RAG service
      log.userQuery(message.author.id, content, '');
      
      const queryId = await this.eventBus.publishQuery(
        message.author.id,
        message.channel.id,
        content
      );

      // Wait for response
      const response = await this.eventBus.waitForResponse(queryId, this.appConfig.responseTimeout);
      const responseTime = Date.now() - startTime;

      if (response.success) {
        await this.sendRAGResponse(message, response.response, response.sources);
        log.botResponse(message.author.id, queryId, true, responseTime);
      } else {
        await this.sendErrorResponse(message, 'I encountered an error while processing your question. Please try again.');
        log.botResponse(message.author.id, queryId, false, responseTime);
      }

    } catch (error) {
      const responseTime = Date.now() - startTime;
      log.error('❌ Error handling message', error);
      log.botResponse(message.author.id, 'unknown', false, responseTime);
      await this.sendErrorResponse(message, 'Something went wrong while processing your request. Please try again later.');
    }
  }

  /**
   * Send formatted RAG response to Discord
   */
  private async sendRAGResponse(message: Message, response: string, sources: string[]): Promise<void> {
    try {
      // Brief initial delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Split response into progressive chunks (sentences/paragraphs)
      const progressiveChunks = this.splitIntoProgressiveChunks(response);
      let accumulatedText = '';
      
      for (let i = 0; i < progressiveChunks.length; i++) {
        const chunk = progressiveChunks[i];
        accumulatedText += (accumulatedText ? ' ' : '') + chunk;
        
        // Small delay between progressive chunks
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 400));
        }
        
        const embed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setDescription(accumulatedText)
          .setTimestamp();

        // Add title to first chunk
        if (i === 0) {
          embed.setTitle('📚 Documentation Assistant');
        }

        // Add sources to final chunk
        if (i === progressiveChunks.length - 1 && sources.length > 0) {
          const sourceText = sources.slice(0, 3).map((source) => {
            const title = this.extractSourceTitle(source);
            return `[${title}](${source})`;
          }).join('\n');
          embed.addFields({ name: '🔗 Sources', value: sourceText, inline: false });
        }

        // Edit the previous message instead of sending new ones
        if (i === 0) {
          const reply = await message.reply({ embeds: [embed] });
          // Store reference for editing
          for (let j = 1; j < progressiveChunks.length; j++) {
            const nextChunk = progressiveChunks[j];
            accumulatedText += ' ' + nextChunk;
            
            await new Promise(resolve => setTimeout(resolve, 400));
            
            const updatedEmbed = new EmbedBuilder()
              .setColor(0x5865F2)
              .setTitle('📚 Documentation Assistant')
              .setDescription(accumulatedText)
              .setTimestamp();

            // Add sources to final update
            if (j === progressiveChunks.length - 1 && sources.length > 0) {
              const sourceText = sources.slice(0, 3).map((source) => {
                const title = this.extractSourceTitle(source);
                return `[${title}](${source})`;
              }).join('\n');
              updatedEmbed.addFields({ name: '🔗 Sources', value: sourceText, inline: false });
            }

            await reply.edit({ embeds: [updatedEmbed] });
          }
          break;
        }
      }
    } catch (error) {
      log.error('❌ Error sending RAG response', error);
      await this.sendErrorResponse(message, 'I found an answer but had trouble formatting it. Please try again.');
    }
  }

  /**
   * Split response into progressive chunks for typing effect
   */
  private splitIntoProgressiveChunks(text: string): string[] {
    // Split by sentences, but keep reasonable chunk sizes
    const sentences = text.split(/(?<=[.!?])\s+/);
    const chunks: string[] = [];
    let currentChunk = '';
    
    for (const sentence of sentences) {
      // If adding this sentence would make chunk too long, start new chunk
      if (currentChunk && (currentChunk + ' ' + sentence).length > 200) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks.filter(chunk => chunk.length > 0);
  }

  /**
   * Extract meaningful title from URL for source display
   */
  private extractSourceTitle(url: string): string {
    try {
      // Remove protocol and query parameters
      const cleanUrl = url.replace(/^https?:\/\//, '').split('?')[0];
      
      // Extract path segments, skip common prefixes
      const pathSegments = cleanUrl.split('/').filter(segment => 
        segment && segment !== 'docs' && segment !== 'www.inngest.com'
      );
      
      if (pathSegments.length === 0) return 'Documentation';
      
      // Take the last meaningful segment and format it
      const lastSegment = pathSegments[pathSegments.length - 1];
      
      // Handle common patterns like "error-handling" -> "Error Handling"
      if (lastSegment.includes('-')) {
        return lastSegment
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
      
      // Capitalize first letter
      return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
      
    } catch (error) {
      return 'Documentation';
    }
  }

  /**
   * Send error response to Discord
   */
  private async sendErrorResponse(message: Message, errorText: string): Promise<void> {
    try {
      const embed = new EmbedBuilder()
        .setColor(0xED4245) // Discord error color
        .setTitle('❌ Error')
        .setDescription(errorText)
        .setTimestamp();

      await message.reply({ embeds: [embed] });
    } catch (error) {
      log.error('❌ Error sending error response', error);
      // Fallback to plain text
      await message.reply(`❌ ${errorText}`);
    }
  }

  /**
   * Check if user is rate limited
   */
  private isRateLimited(userId: string): boolean {
    const now = Date.now();
    const userLastRequest = this.userRateLimits.get(userId) || 0;
    const timeSinceLastRequest = now - userLastRequest;
    const rateLimitWindow = 60000 / this.appConfig.userRateLimit; // Convert per-minute to milliseconds

    if (timeSinceLastRequest < rateLimitWindow) {
      return true;
    }

    this.userRateLimits.set(userId, now);
    return false;
  }

  /**
   * Shutdown the bot gracefully
   */
  async shutdown(): Promise<void> {
    log.info('🛑 Shutting down Discord bot...');
    
    if (this.eventBus) {
      await this.eventBus.close();
    }
    
    if (this.client) {
      this.client.destroy();
    }
    
    log.info('✅ Discord bot shutdown complete');
  }

  /**
   * Get bot status
   */
  isReady(): boolean {
    return this.client.isReady();
  }

  /**
   * Health check endpoint
   */
  getHealthStatus() {
    return {
      status: this.isReady() ? 'healthy' : 'unhealthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      discord: {
        ready: this.isReady(),
        guilds: this.client.guilds?.cache.size || 0,
        ping: this.client.ws.ping
      }
    };
  }
} 