#!/bin/bash

# 🚀 TechDocs RAG Ecosystem - Developer Setup Script
# Run this script to set up your development environment

set -e

echo "🎉 Setting up TechDocs RAG Ecosystem development environment..."

# Check prerequisites
echo "📋 Checking prerequisites..."
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required. Install from https://nodejs.org/"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required. Comes with Node.js"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required. Install from https://docker.com/"; exit 1; }

echo "✅ Prerequisites check passed"

# Start Redis if not running
echo "🐳 Starting Redis container..."
if ! docker ps | grep -q redis; then
    docker run -d -p 6379:6379 --name redis redis:7-alpine
    echo "✅ Redis started on port 6379"
else
    echo "✅ Redis already running"
fi

# Install dependencies
echo "📦 Installing dependencies for Discord bot..."
npm install

echo "📦 Installing dependencies for RAG service..."
if [ -d "../inngest-document-app" ]; then
    cd ../inngest-document-app && npm install && cd ../discord-rag-bot
else
    echo "⚠️  Please clone inngest-document-app repository first:"
    echo "   git clone https://github.com/troy8chen/inngest-document-app"
fi

# Check environment files
echo "🔧 Checking environment configuration..."
if [ ! -f ".env" ]; then
    echo "⚠️  Copy .env.example to .env and add your API keys:"
    echo "   cp .env.example .env"
    echo "   # Then edit .env with your Discord Bot Token, etc."
fi

if [ -d "../inngest-document-app" ] && [ ! -f "../inngest-document-app/.env.local" ]; then
    echo "⚠️  Set up environment for RAG service too:"
    echo "   cd ../inngest-document-app"
    echo "   cp .env.example .env.local"
    echo "   # Add your OpenAI and Pinecone API keys"
fi

echo ""
echo "🎯 Setup complete! Next steps:"
echo "1. Add API keys to .env files"
echo "2. Terminal 1: cd ../inngest-document-app && npm run rag-worker"  
echo "3. Terminal 2: npm run dev"
echo "4. Test the bot in Discord!"
echo ""
echo "📚 Documentation: https://github.com/users/troy8chen/projects/4"
echo "🤝 Need help? Create an issue in the appropriate repository" 