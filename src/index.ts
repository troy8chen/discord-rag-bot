/**
 * Discord RAG Bot - Main Entry Point
 * 
 * This bot connects Discord users to an AI-powered RAG system via Redis messaging.
 * It publishes user queries to Redis and subscribes to AI responses to send back to Discord.
 */

import { DiscordBot } from '@/bot/client';
import { validateEnvironment, logConfigSummary } from '@/utils/config';

let discordBot: DiscordBot;

async function main(): Promise<void> {
  try {
    console.log('🚀 Starting Discord RAG Bot...');
    
    // Validate environment configuration
    validateEnvironment();
    
    // Log configuration summary (development)
    if (process.env.NODE_ENV === 'development') {
      logConfigSummary();
    }

    // Initialize Discord bot
    discordBot = new DiscordBot();
    await discordBot.initialize();
    
    console.log('✅ Discord RAG Bot is ready and connected!');
    console.log('💬 Users can now mention the bot or send DMs to ask questions');
    
  } catch (error) {
    console.error('❌ Failed to start Discord RAG Bot:', error);
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
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
      
      try {
        if (discordBot) {
          await discordBot.shutdown();
        }
        
        console.log('✅ Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
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
    console.error('❌ Unhandled Promise Rejection:', reason);
    console.error('At:', promise);
  });

  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
  });
}

// Initialize error handling and graceful shutdown
setupErrorHandling();
setupGracefulShutdown();

// Start the application
main().catch((error) => {
  console.error('❌ Application startup failed:', error);
  process.exit(1);
}); 