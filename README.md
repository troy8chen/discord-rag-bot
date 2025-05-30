# Discord RAG Bot 🤖

> **🎯 LIVE & READY! Try the bot now:** **[Discord Test Channel](https://discord.com/channels/1378047991264579745/1378047991910236214)**  
> **Bot:** `DocsAI#6774` | **Status:** ✅ Deployed on Render | **Uptime:** 24/7

> **AI-Powered Discord Bot with Expert Knowledge Base**  
> Production-ready Discord bot that connects to a RAG (Retrieval-Augmented Generation) service for intelligent document assistance. Powered by Redis event-driven architecture for scalable, real-time AI responses.

[![CI/CD Pipeline](https://github.com/troy8chen/discord-rag-bot/actions/workflows/ci.yml/badge.svg)](https://github.com/troy8chen/discord-rag-bot/actions)
[![Deployed on Render](https://img.shields.io/badge/Render-Deployed-success)](https://discord-rag-bot.onrender.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Redis Cloud](https://img.shields.io/badge/Redis-Cloud-red)](https://redis.io/)

## 🚀 Current Deployment Status

**✅ LIVE PRODUCTION SYSTEM:**
- **Discord Bot**: Deployed on Render - `https://discord-rag-bot.onrender.com`
- **Redis**: Redis Cloud (managed service)
- **RAG Worker**: Ready to deploy (see deployment section)
- **Status**: Bot is online and responding to queries

**Quick Test**: Join the Discord channel above and try:
```
@DocsAI How do I implement error handling in Next.js?
```

## 🏗️ Architecture Overview

This Discord bot works with a **separate RAG service** to provide expert-level assistance:

```mermaid
graph TB
    A[Discord User] --> B[Discord Bot<br/>Render Deployment]
    B --> C[Redis Cloud<br/>Managed Service]
    C --> D[RAG Worker<br/>Local/Deploy Ready]
    D --> E[AI Knowledge Base<br/>Pinecone + OpenAI]
    E --> D
    D --> C
    C --> B
    B --> A
    
    style A fill:#7289DA
    style B fill:#00D924
    style C fill:#DC382D
    style D fill:#FFD93D
    style E fill:#FF6B6B
```

### 🔄 Event-Driven Flow
1. **User sends message** → Discord bot receives interaction
2. **Bot publishes query** → Redis `rag:query` channel
3. **RAG worker processes** → AI generates expert response
4. **Worker publishes response** → Redis `rag:response` channel  
5. **Bot receives response** → Formatted Discord message sent

## 🚀 Quick Start

### Option 1: Test with Live Bot (Easiest)
**The bot is already deployed and ready to use!**

**🔗 [Test Channel](https://discord.com/channels/1378047991264579745/1378047991910236214)**

- Bot: `DocsAI#6774` (Online 24/7)
- Use mentions: `@DocsAI your question here`
- No setup required - just join and test!
- Need access? Contact **troy.dev** on Discord or [@troy8chen](https://github.com/troy8chen) on GitHub

### Option 2: Deploy Your Own Instance

#### 📋 Prerequisites
- Node.js 18+ 
- Redis Cloud account (free tier available)
- Discord Developer Application
- OpenAI API Key (for RAG worker)
- Pinecone Account (for RAG worker)

## 🚀 Deployment Guide

### Current Production Setup

**✅ What's Already Deployed:**
- **Discord Bot**: Running on Render (free tier)
- **Redis**: Redis Cloud managed service
- **CI/CD**: GitHub Actions pipeline working

**📋 What You Need to Deploy:**
- **RAG Worker**: Deploy from [tech-docs repo](https://github.com/troy8chen/tech-docs)

### Deploy RAG Worker (Required for AI Responses)

**Option 1: Render (Recommended - Free)**
```bash
# 1. Clone RAG service
git clone https://github.com/troy8chen/tech-docs.git
cd tech-docs

# 2. Create Render account and connect repo
# 3. Set environment variables in Render:
OPENAI_API_KEY=sk-your-key
PINECONE_API_KEY=your-pinecone-key
PINECONE_INDEX_NAME=tech-docs
REDIS_URL=your-redis-cloud-url

# 4. Deploy command: npm run rag-worker
```

**Option 2: Railway ($5/month)**
```bash
cd tech-docs
railway login
railway init
railway up
```

### Deploy Your Own Discord Bot (Optional)

If you want your own bot instead of using the live one:

#### 🤖 Discord Bot Setup

1. **Create Discord Application**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Click "New Application" → Name your bot
   - Navigate to "Bot" section → Reset Token (save as `DISCORD_BOT_TOKEN`)
   - Copy Application ID (save as `DISCORD_CLIENT_ID`)

2. **Deploy on Render**
   - Fork this repository
   - Connect to Render
   - Set environment variables:
     ```env
     DISCORD_BOT_TOKEN=your_bot_token
     DISCORD_CLIENT_ID=your_client_id
     REDIS_URL=your_redis_cloud_url
     ```

3. **Invite Bot to Server**
   ```
   https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=277025573888&scope=bot%20applications.commands
   ```

## 📚 Usage

### Example Interactions

```
User: @DocsAI How do I implement error handling in my functions?

DocsAI: 🤖 **Expert Answer:**

Based on the documentation, here are the best practices for error handling:

1. **Use try-catch blocks** for synchronous errors
2. **Implement retry logic** with exponential backoff  
3. **Use step functions** to isolate error-prone operations
4. **Configure failure handling** in your function configuration

📚 **Sources:**
- [Error Handling Guide](https://example.com/docs/errors)
- [Retry Patterns](https://example.com/docs/retry)

*Response time: 1.2s*
```

## 🛠️ Configuration

### Environment Variables

#### Discord Bot
```env
# Discord Configuration
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here

# Redis Configuration (Redis Cloud)
REDIS_URL=redis://username:password@host:port

# Optional Settings
LOG_LEVEL=info
NODE_ENV=production
```

#### RAG Service (tech-docs)
```env
# AI Configuration
OPENAI_API_KEY=sk-your_openai_key_here
PINECONE_API_KEY=your_pinecone_key_here  
PINECONE_INDEX_NAME=tech-docs

# Redis Configuration (same as Discord bot)
REDIS_URL=redis://username:password@host:port
```

## 🔧 Development

### Local Development Setup

```bash
# 1. Clone repositories
git clone https://github.com/troy8chen/discord-rag-bot.git
git clone https://github.com/troy8chen/tech-docs.git

# 2. Setup Redis Cloud (recommended) or local Redis
# Redis Cloud: https://redis.com/try-free
# Local: docker run -d --name redis -p 6379:6379 redis:7-alpine

# 3. Setup environment variables (see Configuration section)

# 4. Start RAG worker (Terminal 1)
cd tech-docs
npm install
npm run rag-worker

# 5. Start Discord bot (Terminal 2)
cd discord-rag-bot  
npm install
npm run dev
```

### Available Scripts

```bash
# Discord Bot Development
npm run dev          # Start with hot reload
npm run build        # Production build
npm run start        # Start production build
npm run test         # Run test suite
npm run test:redis   # Test Redis connection
npm run lint         # ESLint checking
```

## 📊 Production Monitoring

### Health Endpoints

The deployed bot includes health monitoring:

```bash
# Production health check
curl https://discord-rag-bot.onrender.com/health

# Local development health
curl http://localhost:3000/health
```

### Logging

Production logs are available in Render dashboard:
- User query processing times
- Redis connection status
- Discord API interactions
- Error tracking and debugging

## 🔍 Troubleshooting

### Common Issues

#### Bot not responding in Discord
- **Check**: Bot is online in Discord member list
- **Verify**: Render deployment logs show successful startup
- **Test**: Health endpoint returns 200 OK

#### RAG responses are generic/unhelpful
- **Check**: RAG worker is deployed and running
- **Verify**: Redis Cloud connection from both services
- **Test**: Redis pub/sub communication working

#### Performance issues
- **Render Free Tier**: Bot sleeps after 15 minutes of inactivity (50+ second wake time)
- **Solution**: Upgrade to Render paid tier ($7/month) for always-on
- **Alternative**: Use Railway or other platforms

## 🤝 Contributing

1. **Fork this repository**
   - [discord-rag-bot](https://github.com/troy8chen/discord-rag-bot)

2. **Create feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Test changes**
   ```bash
   npm test
   npm run lint
   ```

4. **Submit Pull Request**
   - Test with the live bot in Discord
   - Include screenshots/examples
   - Update documentation if needed

## 📈 Current Production Stats

### Performance Metrics (Live System)
- **Response Time**: 1-3 seconds for AI queries
- **Uptime**: 99%+ (Render free tier with sleep)
- **Redis Latency**: <50ms (Redis Cloud)
- **Deployment**: Automated via GitHub Actions

### Infrastructure Costs (Current)
- **Discord Bot**: Free (Render free tier)
- **Redis**: Free (Redis Cloud 30MB tier)
- **RAG Worker**: Deploy needed (~$0-7/month)
- **Total Current Cost**: $0/month

### Scaling Options
- **Render Starter**: $7/month (always-on bot)
- **Railway**: $5-10/month (bot + RAG worker)
- **Redis Cloud Paid**: $5+/month (larger datasets)

## 🎯 Use Cases

### Discord Communities
- **24/7 Expert Support**: Always-available AI assistance
- **Knowledge Base Access**: Instant access to documentation
- **Developer Onboarding**: Interactive learning assistant

### Integration Ready
- **Multi-Platform**: Easy to port to Slack, Teams, etc.
- **API Service**: RESTful endpoints available
- **Custom Knowledge**: Swap RAG data sources easily

## 🔮 Current Roadmap

### ✅ Completed
- Production Discord bot deployment
- Redis Cloud integration
- CI/CD pipeline with GitHub Actions
- Health monitoring and logging
- Event-driven architecture

### 🚧 In Progress
- RAG worker deployment automation
- Enhanced conversation context
- Performance optimization

### 📋 Next Steps
- Advanced analytics dashboard
- Multi-server support
- User preference learning
- Conversation history persistence

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **[tech-docs RAG System](https://github.com/troy8chen/tech-docs)** - Powerful AI knowledge base
- **Discord.js** - Excellent Discord API library
- **Redis Cloud** - Reliable managed Redis service
- **Render** - Simple deployment platform
- **OpenAI** - GPT-4 and embedding models
- **Pinecone** - Vector database for knowledge retrieval

---

**💬 Questions? Join our [Discord Test Channel](https://discord.com/channels/1378047991264579745/1378047991910236214)**

**🐛 Issues? Open a [GitHub Issue](https://github.com/troy8chen/discord-rag-bot/issues)**

**🚀 Built with ❤️ for AI-powered Discord communities** 