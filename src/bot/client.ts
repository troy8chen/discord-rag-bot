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
      // Split long responses into chunks
      const chunks = this.splitMessage(response, 1900);
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        if (!chunk) continue; // Skip undefined chunks
        
        const embed = new EmbedBuilder()
          .setColor(0x5865F2) // Discord brand color
          .setDescription(chunk)
          .setTimestamp();

        // Add title to first chunk
        if (i === 0) {
          embed.setTitle('📚 Documentation Assistant');
        }

        // Add sources to last chunk
        if (i === chunks.length - 1 && sources.length > 0) {
          const sourceText = sources.slice(0, 3).map((source, idx) => `[${idx + 1}](${source})`).join(' • ');
          embed.addFields({ name: '🔗 Sources', value: sourceText, inline: false });
        }

        await message.reply({ embeds: [embed] });
      }
    } catch (error) {
      log.error('❌ Error sending RAG response', error);
      await this.sendErrorResponse(message, 'I found an answer but had trouble formatting it. Please try again.');
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
   * Split message into Discord-compatible chunks
   */
  private splitMessage(text: string, maxLength: number): string[] {
    if (text.length <= maxLength) {
      return [text];
    }

    const chunks: string[] = [];
    let currentChunk = '';

    const sentences = text.split(/(?<=[.!?])\s+/);
    
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length <= maxLength) {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        currentChunk = sentence;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
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