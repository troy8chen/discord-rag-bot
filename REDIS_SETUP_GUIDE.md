# 🚀 Redis Cloud Setup Guide
## Complete Step-by-Step Instructions for Discord RAG Bot

### **🎯 Why Redis Cloud? (Quick Recap)**
- ✅ **Free 30MB database** (perfect for testing)
- ✅ **Managed service** (no maintenance needed)
- ✅ **Shared between projects** (discord-bot + tech-docs)
- ✅ **Global availability** (AWS, GCP, Azure regions)
- ✅ **Built-in monitoring** and automatic backups

---

## **Step 1: Create Redis Cloud Account** (2 minutes)

### 1.1 Go to Redis Cloud
🔗 **URL**: [redis.com/try-free](https://redis.com/try-free)

### 1.2 Sign Up Options
Choose one of:
- **Email + Password** (fill the form, click "Get Started")
- **Sign up with Google** 
- **Sign up with GitHub**

### 1.3 Email Verification
- Check your email for activation link
- Click "**Activate account**" 
- This takes you to "Create your database" page

---

## **Step 2: Create Free Database** (3 minutes)

### 2.1 Choose Plan Type
On the "Create your database" page:
- Select **"Essentials"** (NOT Pro)
- This gives you the free 30MB option

### 2.2 Configure Database
```
Database name: [Auto-generated] (you can change this)
Cloud Provider: Choose closest to you (AWS/GCP/Azure)
Region: Choose closest region to your deployment
Type: Redis Stack (keep default)
```

### 2.3 Durability Settings
**Recommended for Development:**
```
High availability: None (single instance - fine for testing)
Data persistence: Append-Only File (recommended)
```

**For Production:**
```
High availability: Multi-Zone (better reliability)
Data persistence: Append-Only File + Snapshot
```

### 2.4 Memory Limit
- **Select "30 MB"** for **FREE** database
- ⚠️ You can only have ONE free database at a time

### 2.5 Create Database
- Click **"Create database"**
- Wait for status to change from "pending" (🟠) to "active" (🟢)
- Usually takes 1-2 minutes

---

## **Step 3: Get Connection Details** (1 minute)

### 3.1 Navigate to Security Section
- Once database is active, you'll see the "Configuration" tab
- Scroll down to **"Security"** section

### 3.2 Get Credentials
```
Username: default (always this)
Password: [masked] - click the 👁️ eye icon to reveal
```

### 3.3 Get Connection URL
Click **"Connect"** button → This opens the connection wizard

**Example Connection URL Format:**
```
redis://default:your_password_here@redis-12345.c1.us-east-1-1.ec2.cloud.redislabs.com:12345
```

---

## **Step 4: Test Connection** (1 minute)

### 4.1 Using Redis Insight (Web-based GUI)
- In the connection wizard, click **"Launch Redis Insight web"**
- This opens a web-based Redis GUI
- Click **"Load sample data"** to test
- You should see sample keys and values

### 4.2 Using Command Line (Optional)
If you have redis-cli installed:
```bash
redis-cli -u redis://default:your_password@your_host:port
> PING
PONG
```

---

## **Step 5: Configure Your Projects** (2 minutes)

### 5.1 Update Discord Bot (.env)
```bash
# In discord-rag-bot/.env
DISCORD_BOT_TOKEN=your_discord_token
DISCORD_CLIENT_ID=your_discord_client_id
REDIS_URL=redis://default:your_password@your_host:port
```

### 5.2 Update RAG Service (.env.local)
```bash
# In tech-docs/.env.local
OPENAI_API_KEY=your_openai_key
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX_NAME=your_index_name
REDIS_URL=redis://default:your_password@your_host:port
```

**⚠️ Important**: Both projects MUST use the **exact same REDIS_URL**

---

## **Step 6: Verify Everything Works** (2 minutes)

### 6.1 Test Redis Connection Locally
```bash
# In discord-rag-bot directory
node -e "
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);
redis.ping().then(result => {
  console.log('✅ Redis connection:', result);
  redis.disconnect();
}).catch(err => {
  console.error('❌ Redis error:', err.message);
});
"
```

Expected output: `✅ Redis connection: PONG`

### 6.2 Test Full System
```bash
# Terminal 1: Start RAG worker (tech-docs)
cd tech-docs
npm run discord-worker

# Terminal 2: Start Discord bot
cd discord-rag-bot  
npm run dev

# Terminal 3: Test in Discord
# Type: @YourBot what is Inngest?
```

---

## **🛡️ Security & Production Settings**

### Production Recommendations:
1. **High Availability**: Enable Multi-Zone
2. **Backups**: Enable both Append-Only File + Snapshots  
3. **Monitoring**: Use Redis Insight for performance monitoring
4. **Scaling**: Upgrade from 30MB free → paid plans when needed

### Cost Estimates:
```
Free Tier: 30MB, 30 connections (perfect for testing)
Paid Essentials: $5-15/month (250MB-12GB)
Pro Plans: $45+/month (unlimited scale)
```

---

## **🔧 Troubleshooting**

### ❌ "Connection refused" 
```bash
# Check your REDIS_URL format
echo $REDIS_URL
# Should be: redis://default:password@host:port
```

### ❌ "Auth failed"
```bash
# Verify password in Redis Cloud console
# Re-copy the password (click eye icon)
```

### ❌ "Network timeout"
```bash
# Check firewall settings
# Ensure your deployment can reach Redis Cloud IPs
```

### ❌ "Database not active"
```bash
# Wait for database status to show green checkmark
# Can take 1-5 minutes after creation
```

---

## **📊 Monitoring Your Redis**

### Redis Cloud Console:
- **Metrics**: Memory usage, operations/sec, connections
- **Logs**: Error tracking and debugging
- **Alerts**: Set up email notifications

### Redis Insight:
- **Data Browser**: View keys and values
- **Performance**: Real-time metrics
- **CLI**: Built-in command line interface

---

## **🚀 Next Steps After Setup**

1. **Deploy Discord Bot**: Use Railway/Docker with your Redis URL
2. **Deploy RAG Service**: Use your existing tech-docs deployment  
3. **Test End-to-End**: Verify Discord → Redis → RAG → Response flow
4. **Monitor Usage**: Watch Redis metrics in the console
5. **Scale When Needed**: Upgrade to larger Redis plans as usage grows

---

## **💡 Pro Tips**

### Development:
- Use Redis Insight web UI to debug message flow
- Monitor `rag:query` and `rag:response` channels
- Test with small messages first

### Production:
- Set up Redis alerts for high memory usage
- Use connection pooling in your applications
- Consider Redis clustering for very high scale

### Cost Optimization:
- Start with 30MB free tier
- Monitor actual usage before upgrading
- Use append-only persistence vs. snapshots for cost savings

---

**🎉 That's it! Your Redis Cloud database is now ready to power your Discord RAG bot with professional-grade infrastructure.** 