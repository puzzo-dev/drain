# 🔑 Required API Keys & Configuration

## Essential API Keys (Required for Draining)

### 1. **Alchemy** (EVM Chain RPC Access)
- **What**: RPC provider for Ethereum, Polygon, Arbitrum, Optimism
- **Why**: Access blockchain data, submit transactions
- **Get it**: https://www.alchemy.com/
- **Free Tier**: 300M compute units/month (enough for testing)
- **Setup**:
  1. Create account
  2. Create new app
  3. Copy API key
  4. Add to `.env`: `ALCHEMY_KEY=your_key_here`

**Usage in app**:
```
ETHEREUM_RPC=https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}
POLYGON_RPC=https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}
ARBITRUM_RPC=https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}
OPTIMISM_RPC=https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}
```

---

### 2. **Covalent API** (Token Balance Fetching)
- **What**: Fetch all token balances from any wallet
- **Why**: Detect what assets exist in target wallet
- **Get it**: https://www.covalenthq.com/platform/auth/register/
- **Free Tier**: 100,000 API credits/month
- **Setup**:
  1. Create account
  2. Go to API Keys section
  3. Copy API key
  4. Add to `.env`: `COVALENT_API_KEY=cqt_your_key`

**What it does**: 
- Scans wallet across all chains
- Returns all tokens (ERC-20, NFTs) with USD values
- Filters out dust/spam tokens

---

## Optional API Keys (Recommended)

### 3. **Helius** (Solana RPC - Optional)
- **What**: High-performance Solana RPC
- **Why**: Faster/more reliable than public Solana endpoints
- **Get it**: https://www.helius.dev/
- **Free Tier**: Yes
- **Setup**: Add to `.env`: `HELIUS_API_KEY=your_key`

**Alternative**: Use free public Solana RPC:
```
SOLANA_RPC=https://api.mainnet-beta.solana.com
```

---

### 4. **Moralis** (Alternative to Covalent)
- **What**: Another token balance API
- **Why**: Backup if Covalent rate limits
- **Get it**: https://moralis.io/
- **Free Tier**: Yes
- **Setup**: Add to `.env`: `MORALIS_API_KEY=your_key`

---

## Database (Required)

### 5. **PostgreSQL** (Already Configured)
- **What**: Database for custody, users, transactions
- **Why**: Store held assets, withdrawal history
- **Your Setup**: Already have Coolify Postgres
- **Connection**: Already in `.env.example`:
```
DATABASE_URL=postgres://postgres:Ge2DeeeajZORNVMn697zCkNe496uCDPpmkdAzLot5w7WydSaYXbNJ2MjfOznLck6@zkg0s88888c0c44gcckcs4gs:5432/postgres
```

---

## Security Keys (Required - Generate Yourself)

### 6. **ENCRYPTION_KEY** (Critical)
- **What**: Encrypts private keys in database
- **Why**: Protects custody wallet keys
- **Generate**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
- **Example Output**: `a3f5e8d9c2b1a6f4e7d3c8b5a9f6e4d2c1b8a7f5e3d9c6b4a8f7e5d3c2b1a9f6`
- **Add to .env**: `ENCRYPTION_KEY=<generated_key>`

### 7. **JWT_SECRET** (Critical)
- **What**: Signs authentication tokens
- **Why**: Secure user login sessions
- **Generate**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
- **Add to .env**: `JWT_SECRET=<generated_key>`

### 8. **MASTER_WALLET_SEED** (Critical - Store Securely!)
- **What**: Master seed for generating all custody wallets
- **Why**: Deterministic wallet generation per user
- **Generate**:
```bash
node -e "console.log(require('bip39').generateMnemonic())"
```
- **Example Output**: `abandon ability able about above absent absorb abstract absurd abuse access accident`
- **Add to .env**: `MASTER_WALLET_SEED=word1 word2 word3 ... word12`
- **⚠️ NEVER LOSE THIS!** All custody wallets are derived from it

---

## Public RPC Endpoints (Free - No API Key)

### BSC (Binance Smart Chain)
```
BSC_RPC=https://bsc-dataseed.binance.org
```

### Avalanche
```
AVALANCHE_RPC=https://api.avax.network/ext/bc/C/rpc
```

### Bitcoin (Blockstream)
```
BITCOIN_RPC=https://blockstream.info/api
```

---

## Complete .env Template

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

# RPC Endpoints - EVM (GET ALCHEMY KEY!)
ALCHEMY_KEY=<your_alchemy_api_key>
ETHEREUM_RPC=https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}
POLYGON_RPC=https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}
ARBITRUM_RPC=https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}
OPTIMISM_RPC=https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}

# Public RPCs (No API key needed)
BSC_RPC=https://bsc-dataseed.binance.org
AVALANCHE_RPC=https://api.avax.network/ext/bc/C/rpc

# RPC Endpoints - Other Chains
SOLANA_RPC=https://api.mainnet-beta.solana.com
HELIUS_API_KEY=<optional_helius_key>
BITCOIN_RPC=https://blockstream.info/api

# External APIs (GET COVALENT KEY!)
COVALENT_API_KEY=<your_covalent_api_key>
MORALIS_API_KEY=<optional_moralis_key>
```

---

## Setup Checklist

- [ ] **Sign up for Alchemy** → Get API key
- [ ] **Sign up for Covalent** → Get API key
- [ ] **Generate ENCRYPTION_KEY** → `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] **Generate JWT_SECRET** → `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] **Generate MASTER_WALLET_SEED** → `node -e "console.log(require('bip39').generateMnemonic())"`
- [ ] **Copy all to .env file**
- [ ] **BACKUP MASTER_WALLET_SEED** → Store in password manager!

---

## Cost Estimates (Free Tiers)

| Service | Free Tier | Cost After |
|---------|-----------|------------|
| Alchemy | 300M compute units/mo | $49/mo for 3B units |
| Covalent | 100k credits/mo | $200/mo for 1M credits |
| Helius (optional) | Yes | $99/mo for premium |
| Database (Coolify) | Your existing setup | - |
| Redis | Local (free) | - |

**For internal tool**: Free tiers are more than enough!

---

## Quick Setup Script

Run this after getting API keys:

```bash
# 1. Install dependencies
npm install

# 2. Generate security keys
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('MASTER_WALLET_SEED=' + require('bip39').generateMnemonic())"

# 3. Copy to .env
cp .env.example .env
# Edit .env and paste generated keys + API keys

# 4. Setup database
npm run prisma:generate
npm run prisma:migrate

# 5. Start app
npm run dev:all
```

---

## Testing Without Full Setup

You can test basic functionality with just:
- **Required**: ALCHEMY_KEY, COVALENT_API_KEY
- **Generated**: ENCRYPTION_KEY, JWT_SECRET, MASTER_WALLET_SEED
- **Database**: DATABASE_URL (already have)

All other keys are optional and can be added later!
