import express from 'express';
import { DiscordBot } from './bot/client';
import { EventBus } from './services/eventBus';
import { log } from './utils/logger';

/**
 * Health Check Server
 * Provides HTTP endpoints for monitoring bot status
 */
export class HealthServer {
  private app: express.Application;
  private server: any;
  private bot: DiscordBot;
  private eventBus: EventBus;

  constructor(bot: DiscordBot) {
    this.app = express();
    this.bot = bot;
    this.eventBus = new EventBus();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Basic health check
    this.app.get('/', (req, res) => {
      res.json({ 
        status: 'healthy', 
        service: 'discord-rag-bot',
        timestamp: new Date().toISOString()
      });
    });

    // Detailed health check
    this.app.get('/health', async (req, res) => {
      try {
        const botStatus = this.bot.getHealthStatus();
        const redisStatus = await this.checkRedisHealth();
        
        const overallStatus = botStatus.status === 'healthy' && redisStatus.status === 'healthy' 
          ? 'healthy' : 'unhealthy';

        const health = {
          status: overallStatus,
          timestamp: new Date().toISOString(),
          services: {
            discord: botStatus,
            redis: redisStatus
          },
          environment: {
            nodeEnv: process.env.NODE_ENV,
            nodeVersion: process.version,
            uptime: process.uptime(),
            memory: process.memoryUsage()
          }
        };

        res.status(overallStatus === 'healthy' ? 200 : 503).json(health);
      } catch (error) {
        log.error('Health check failed', error);
        res.status(503).json({
          status: 'unhealthy',
          error: 'Health check failed',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Metrics endpoint
    this.app.get('/metrics', (req, res) => {
      res.json({
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        version: process.version
      });
    });
  }

  private async checkRedisHealth(): Promise<{ status: 'healthy' | 'unhealthy', details?: any }> {
    try {
      await this.eventBus.ping();
      return { status: 'healthy' };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  async start(port: number = 3000): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.app.listen(port, () => {
        log.info(`🩺 Health server started on port ${port}`);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    if (this.server) {
      this.server.close();
      log.info('🩺 Health server stopped');
    }
  }
} 