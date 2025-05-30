#!/usr/bin/env node

/**
 * Redis Connection Test Script
 * Run this after setting up Redis Cloud to verify connectivity
 */

require('dotenv').config();
const { Redis } = require('ioredis');

async function testRedisConnection() {
  console.log('🔍 Testing Redis connection...\n');

  // Check environment variable
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.error('❌ ERROR: REDIS_URL environment variable not found');
    console.log('💡 Make sure you have REDIS_URL in your .env file');
    process.exit(1);
  }

  console.log(`📡 Connecting to: ${redisUrl.replace(/:[^@]*@/, ':***@')}`);

  try {
    // Create Redis connection
    const redis = new Redis(redisUrl);

    // Test basic connectivity
    console.log('⏳ Testing PING...');
    const pingResult = await redis.ping();
    console.log(`✅ PING response: ${pingResult}`);

    // Test pub/sub channels (used by Discord bot)
    console.log('⏳ Testing pub/sub channels...');
    await redis.publish('test:channel', JSON.stringify({ 
      test: true, 
      timestamp: Date.now() 
    }));
    console.log('✅ Published test message successfully');

    // Test Redis info
    console.log('⏳ Getting Redis info...');
    const info = await redis.info('server');
    const version = info.match(/redis_version:([^\r\n]+)/)?.[1];
    console.log(`✅ Redis version: ${version}`);

    // Test memory usage
    const memory = await redis.info('memory');
    const usedMemory = memory.match(/used_memory_human:([^\r\n]+)/)?.[1];
    console.log(`✅ Memory usage: ${usedMemory}`);

    // Cleanup
    await redis.disconnect();
    
    console.log('\n🎉 Redis connection test completed successfully!');
    console.log('💡 Your Redis Cloud database is ready for the Discord bot');
    
  } catch (error) {
    console.error('\n❌ Redis connection failed:');
    console.error(`   ${error.message}`);
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n🔧 Troubleshooting tips:');
      console.log('   • Check your REDIS_URL format');
      console.log('   • Verify the hostname is correct');
      console.log('   • Ensure your network can reach Redis Cloud');
    } else if (error.message.includes('NOAUTH')) {
      console.log('\n🔧 Troubleshooting tips:');
      console.log('   • Check your Redis password');
      console.log('   • Make sure username is "default"');
      console.log('   • Re-copy credentials from Redis Cloud console');
    }
    
    process.exit(1);
  }
}

// Run the test
testRedisConnection().catch(console.error); 