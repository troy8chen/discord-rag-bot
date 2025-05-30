# Discord RAG Bot

> Discord interface for the Inngest RAG ecosystem - connects Discord users to AI-powered documentation assistance.

## 🎯 Overview

This Discord bot provides a chat interface to query and interact with technical documentation using AI. It's part of a multi-service architecture that processes questions through vector search and large language models.

## 🏗️ Architecture

```
Discord User → Discord Bot → Redis → RAG Service → AI Response → Discord User
```

### Related Services
- **[RAG Service](https://github.com/yourusername/inngest-document-app)** - AI processing backend with Pinecone + OpenAI
- **Redis** - Message queue between services
- **This Bot** - Discord interface and user interaction

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Redis server running
- RAG service running (see related repo)
- Discord bot token

### Setup
```bash
# Clone and install
git clone https://github.com/yourusername/discord-rag-bot.git
cd discord-rag-bot
npm install

# Configure environment
cp .env.example .env
# Edit .env with your tokens

# Start development
npm run dev
```

### With Docker
```bash
# Start everything
docker-compose up -d

# View logs
docker-compose logs -f discord-bot
```

## 🔧 Configuration

### Discord Bot Setup
1. Create application at [Discord Developer Portal](https://discord.com/developers/applications)
2. Create bot and copy token to `.env`
3. Invite bot to server with permissions:
   - Send Messages
   - Read Message History
   - Use Slash Commands

### Redis Connection
- Must match Redis URL used by RAG service
- Default: `redis://localhost:6379`

## 📖 Usage

### Basic Commands
- **@bot [question]** - Ask AI about documentation
- **@bot help** - Show available commands
- **@bot status** - Check bot health

### Example
```
@InvestBot How do I handle batch operations in Inngest?
```

## 🏭 Production Deployment

### Environment Variables
See `.env.example` for required configuration.

### Docker Deployment
```bash
docker build -t discord-rag-bot .
docker run -d --env-file .env discord-rag-bot
```

### Health Checks
- `GET /health` - Service health status
- Redis connectivity test
- Discord API connection test

## 🔗 Integration

### Event Schema
The bot communicates with the RAG service via Redis using standardized events:

```typescript
interface RAGQueryEvent {
  id: string;           // UUID for tracking
  userId: string;       // Discord user ID
  channelId: string;    // Discord channel ID
  message: string;      // User question
  domain: string;       // RAG domain
  timestamp: number;    // Unix timestamp
}
```

See [docs/ECOSYSTEM.md](docs/ECOSYSTEM.md) for complete integration details.

## 🛠️ Development

### Scripts
```bash
npm run dev          # Development with hot reload
npm run build        # Production build
npm run test         # Run test suite
npm run lint         # Code linting
npm run type-check   # TypeScript validation
```

### Testing
```bash
npm test             # Unit tests
npm run test:integration  # Integration tests with Redis
npm run test:e2e     # End-to-end Discord tests
```

## 📋 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

See [DEVELOPMENT.md](docs/DEVELOPMENT.md) for detailed development setup.

## 📊 Monitoring

### Metrics
- Message processing time
- Redis connection health
- Discord API rate limits
- Error rates and types

### Logs
Structured JSON logging with correlation IDs for cross-service tracing.

## 🔒 Security

- Environment variables for all secrets
- Input validation and sanitization
- Rate limiting per user
- Discord permission validation

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/discord-rag-bot/issues)
- **Documentation**: [Ecosystem Docs](docs/ECOSYSTEM.md)
- **RAG Service**: [Related Repository](https://github.com/yourusername/inngest-document-app) 