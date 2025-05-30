import { config as dotenvConfig } from 'dotenv';
import type { DiscordConfig, RedisConfig, AppConfig } from '../types/events';

// Load environment variables
dotenvConfig();

/**
 * Validates and returns Discord configuration
 */
export function getDiscordConfig(): DiscordConfig {
  const token = process.env.DISCORD_BOT_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;
  const guildId = process.env.DISCORD_GUILD_ID;
  
  if (!token) {
    throw new Error('DISCORD_BOT_TOKEN environment variable is required');
  }
  
  if (!clientId) {
    throw new Error('DISCORD_CLIENT_ID environment variable is required');
  }

  const config: DiscordConfig = {
    token,
    clientId,
  };

  // Only add guildId if it's defined
  if (guildId) {
    config.guildId = guildId;
  }

  return config;
}

/**
 * Validates and returns Redis configuration
 */
export function getRedisConfig(): RedisConfig {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  
  return {
    url,
    retryDelay: 1000,
    maxRetries: 3,
  };
}

/**
 * Returns application configuration
 */
export function getAppConfig(): AppConfig {
  return {
    logLevel: process.env.LOG_LEVEL || 'info',
    nodeEnv: process.env.NODE_ENV || 'development',
    userRateLimit: parseInt(process.env.USER_RATE_LIMIT_PER_MINUTE || '10', 10),
    responseTimeout: parseInt(process.env.RESPONSE_TIMEOUT_MS || '30000', 10),
  };
}

/**
 * Validates all required environment variables
 */
export function validateEnvironment(): void {
  try {
    getDiscordConfig();
    getRedisConfig();
    getAppConfig();
    
    console.log('✅ Environment configuration validated');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Environment validation failed:', errorMessage);
    process.exit(1);
  }
}

/**
 * Development helper to show configuration (without secrets)
 */
export function logConfigSummary(): void {
  const discordConfig = getDiscordConfig();
  const redisConfig = getRedisConfig();
  const appConfig = getAppConfig();

  console.log('📋 Configuration Summary:');
  console.log(`  Discord Client ID: ${discordConfig.clientId}`);
  console.log(`  Discord Guild ID: ${discordConfig.guildId || 'Not set (global bot)'}`);
  console.log(`  Redis URL: ${redisConfig.url}`);
  console.log(`  Environment: ${appConfig.nodeEnv}`);
  console.log(`  Log Level: ${appConfig.logLevel}`);
  console.log(`  Rate Limit: ${appConfig.userRateLimit} requests/minute`);
} 