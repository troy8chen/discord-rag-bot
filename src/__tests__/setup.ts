// Jest setup file
global.console = {
  ...console,
  // Uncomment to ignore specific console outputs during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.DISCORD_BOT_TOKEN = 'test-token';
process.env.DISCORD_CLIENT_ID = 'test-client-id'; 