import { getDiscordConfig, getRedisConfig, getAppConfig } from '../utils/config';

describe('Configuration Tests', () => {
  beforeEach(() => {
    // Set up test environment variables
    process.env.DISCORD_BOT_TOKEN = 'test-token';
    process.env.DISCORD_CLIENT_ID = 'test-client-id';
    process.env.REDIS_URL = 'redis://localhost:6379';
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    // Clean up
    delete process.env.DISCORD_BOT_TOKEN;
    delete process.env.DISCORD_CLIENT_ID;
    delete process.env.REDIS_URL;
  });

  test('Discord config should return valid configuration', () => {
    const config = getDiscordConfig();
    
    expect(config.token).toBe('test-token');
    expect(config.clientId).toBe('test-client-id');
  });

  test('Redis config should return valid configuration', () => {
    const config = getRedisConfig();
    
    expect(config.url).toBe('redis://localhost:6379');
    expect(config.retryDelay).toBe(1000);
    expect(config.maxRetries).toBe(3);
  });

  test('App config should return default values', () => {
    const config = getAppConfig();
    
    expect(config.nodeEnv).toBe('test');
    expect(config.responseTimeout).toBe(30000);
    expect(config.userRateLimit).toBe(10);
  });

  test('Discord config should throw when token is missing', () => {
    delete process.env.DISCORD_BOT_TOKEN;
    
    expect(() => getDiscordConfig()).toThrow('DISCORD_BOT_TOKEN environment variable is required');
  });
}); 