import winston from 'winston';
import { getAppConfig } from './config';

const config = getAppConfig();

// Create Winston logger
const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'discord-rag-bot' },
  transports: [
    // Write all logs to console in development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ],
});

// Add file logging in production
if (config.nodeEnv === 'production') {
  logger.add(new winston.transports.File({ 
    filename: 'logs/error.log', 
    level: 'error' 
  }));
  logger.add(new winston.transports.File({ 
    filename: 'logs/combined.log' 
  }));
}

// Custom methods for common operations
export const log = {
  info: (message: string, meta?: any) => logger.info(message, meta),
  warn: (message: string, meta?: any) => logger.warn(message, meta),
  error: (message: string, error?: Error | any) => {
    if (error instanceof Error) {
      logger.error(message, { error: error.message, stack: error.stack });
    } else {
      logger.error(message, { error });
    }
  },
  debug: (message: string, meta?: any) => logger.debug(message, meta),
  
  // Discord-specific logging
  userQuery: (userId: string, query: string, queryId: string) => {
    logger.info('User query received', { userId, query, queryId, type: 'user_query' });
  },
  
  botResponse: (userId: string, queryId: string, success: boolean, responseTime: number) => {
    logger.info('Bot response sent', { 
      userId, 
      queryId, 
      success, 
      responseTime, 
      type: 'bot_response' 
    });
  },
  
  systemHealth: (component: string, status: 'healthy' | 'unhealthy', details?: any) => {
    logger.info('System health check', { 
      component, 
      status, 
      details, 
      type: 'health_check' 
    });
  }
};

export default logger; 