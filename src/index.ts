/**
 * Discord RAG Bot - Main Entry Point
 * 
 * This bot connects Discord users to an AI-powered RAG system via Redis messaging.
 * It publishes user queries to Redis and subscribes to AI responses to send back to Discord.
 */

import { DiscordBot } from './bot/client';
import { HealthServer } from './health';
import { validateEnvironment, logConfigSummary } from './utils/config';
import { log } from './utils/logger';

let discordBot: DiscordBot;
let healthServer: HealthServer;

async function main(): Promise<void> {
  try {
    log.info('🚀 Starting Discord RAG Bot...');
    
    // Validate environment configuration
    validateEnvironment();
    
    // Log configuration summary (development)
    if (process.env.NODE_ENV === 'development') {
      logConfigSummary();
    }

    // Initialize Discord bot
    discordBot = new DiscordBot();
    await discordBot.initialize();
    
    // Start health monitoring server
    healthServer = new HealthServer(discordBot);
    const port = parseInt(process.env.PORT || '3000');
    await healthServer.start(port);
    
    log.info('✅ Discord RAG Bot is ready and connected!');
    log.info('💬 Users can now mention the bot or send DMs to ask questions');
    log.info(`🩺 Health monitoring available at http://localhost:${port}/health`);
    
  } catch (error) {
    log.error('❌ Failed to start Discord RAG Bot', error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown handling
 */
function setupGracefulShutdown(): void {
  const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'] as const;
  
  signals.forEach(signal => {
    process.on(signal, async () => {
      log.info(`\n🛑 Received ${signal}, shutting down gracefully...`);
      
      try {
        if (healthServer) {
          await healthServer.stop();
        }
        
        if (discordBot) {
          await discordBot.shutdown();
        }
        
        log.info('✅ Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        log.error('❌ Error during shutdown', error);
        process.exit(1);
      }
    });
  });
}

/**
 * Unhandled error handling
 */
function setupErrorHandling(): void {
  process.on('unhandledRejection', (reason, promise) => {
    log.error('❌ Unhandled Promise Rejection', reason);
    log.error('At Promise:', promise);
  });

  process.on('uncaughtException', (error) => {
    log.error('❌ Uncaught Exception', error);
    process.exit(1);
  });
}

// Initialize error handling and graceful shutdown
setupErrorHandling();
setupGracefulShutdown();

// Start the application
main().catch((error) => {
  log.error('❌ Application startup failed', error);
  process.exit(1);
}); 