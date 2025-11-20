# Migration Guide: Browser-Based → Backend Service Architecture

## Why Migrate?

### Current Limitations (Browser-Based)
- ❌ Sequential transactions = slow (30s-2min per token)
- ❌ Page refresh = lost progress
- ❌ No automatic retry on failure
- ❌ Only supports EVM chains
- ❌ User must stay on page entire time
- ❌ High gas costs (no batching optimization)
- ❌ Poor error recovery

### Benefits of Backend Architecture
- ✅ Parallel & batched transactions = 10x faster
- ✅ Persistent job state
- ✅ Automatic retry with exponential backoff
- ✅ Multi-chain support (BTC, Solana, etc.)
- ✅ User can close browser
- ✅ Gas optimization strategies
- ✅ Production-grade monitoring

## Migration Phases

### Phase 1: Backend Foundation (Week 1-2)
**Goal**: Create backend service with EVM support only

**Tasks**:
1. Set up Express/Fastify API server
2. Implement Redis + Bull queue
3. Port existing `fetch-tokens.ts` logic to backend
4. Port `SendTokens.tsx` transfer logic to worker
5. Add PostgreSQL for job history
6. Basic authentication with wallet signatures

**Deliverables**:
- API endpoint: `POST /api/drain/request`
- API endpoint: `GET /api/drain/:jobId/status`
- Worker processing Ethereum mainnet drains
- Docker Compose setup for local development

### Phase 2: Multi-Chain Support (Week 3-4)
**Goal**: Add Bitcoin and Solana support

**Tasks**:
1. Implement Bitcoin handler (UTXO consolidation)
2. Implement Solana handler (SPL tokens)
3. Create unified chain handler interface
4. Add chain registry configuration
5. Update frontend to support chain selection

**Deliverables**:
- Bitcoin drain support
- Solana drain support
- Multi-chain job processing

### Phase 3: Frontend Dashboard (Week 5-6)
**Goal**: Modern UI for monitoring and control

**Tasks**:
1. Create job submission interface
2. Add real-time progress monitoring (WebSocket)
3. Transaction history page
4. Cost estimation before execution
5. Mobile-responsive design

**Deliverables**:
- Dashboard at `/dashboard`
- Job monitoring at `/drain/[jobId]`
- Historical data at `/history`

### Phase 4: Production Hardening (Week 7-8)
**Goal**: Production-ready deployment

**Tasks**:
1. Add comprehensive error handling
2. Implement retry strategies
3. Set up monitoring (Prometheus/Grafana)
4. Add rate limiting
5. Security audit
6. Load testing
7. Documentation

**Deliverables**:
- Production deployment guide
- Monitoring dashboards
- API documentation
- Security best practices

## Quick Start: Minimal Viable Backend

### 1. Install Dependencies

```bash
# Backend
cd backend
npm init -y
npm install express bull redis ioredis ethers pg prisma
npm install -D typescript @types/node @types/express ts-node nodemon

# Frontend (keep existing)
# No changes needed initially
```

### 2. Create Basic Structure

```
backend/
├── src/
│   ├── index.ts              # API server entry
│   ├── worker.ts             # Job processor
│   ├── chains/
│   │   └── evm.handler.ts    # EVM chain logic
│   ├── routes/
│   │   └── drain.routes.ts   # API endpoints
│   └── config/
│       └── chains.config.ts  # Chain configurations
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

### 3. Minimal API Server (`src/index.ts`)

```typescript
import express from 'express';
import { Queue } from 'bull';
import { createDrainJob } from './routes/drain.routes';

const app = express();
app.use(express.json());

const drainQueue = new Queue('drain', process.env.REDIS_URL);

app.post('/api/drain/request', async (req, res) => {
  const { sourceAddress, destinationAddress, network, signature } = req.body;
  
  // Verify signature
  // ... signature verification logic
  
  const job = await drainQueue.add({
    sourceAddress,
    destinationAddress,
    network,
    timestamp: Date.now()
  });
  
  res.json({ jobId: job.id, status: 'queued' });
});

app.get('/api/drain/:jobId/status', async (req, res) => {
  const job = await drainQueue.getJob(req.params.jobId);
  const state = await job.getState();
  const progress = job.progress();
  
  res.json({ 
    jobId: job.id, 
    status: state, 
    progress,
    data: job.returnvalue 
  });
});

app.listen(3001, () => console.log('API server running on :3001'));
```

### 4. Minimal Worker (`src/worker.ts`)

```typescript
import { Queue, Worker } from 'bull';
import { ethers } from 'ethers';
import { fetchTokens } from './chains/evm.handler';

const drainQueue = new Queue('drain', process.env.REDIS_URL);

const worker = new Worker('drain', async (job) => {
  const { sourceAddress, destinationAddress, network } = job.data;
  
  // Fetch tokens (reuse existing logic)
  const tokens = await fetchTokens(network, sourceAddress);
  
  job.updateProgress({ total: tokens.length, completed: 0 });
  
  // Transfer each token
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    
    try {
      // Transfer logic (reuse from SendTokens.tsx)
      const txHash = await transferToken(token, destinationAddress);
      
      job.updateProgress({ 
        total: tokens.length, 
        completed: i + 1,
        lastTx: txHash 
      });
    } catch (error) {
      // Log error but continue
      console.error(`Failed to transfer ${token.symbol}:`, error);
    }
  }
  
  return { success: true, transferred: tokens.length };
}, {
  connection: { host: 'localhost', port: 6379 }
});
```

### 5. Docker Compose

```yaml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  
  api:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - REDIS_URL=redis://redis:6379
      - ALCHEMY_KEY=${ALCHEMY_KEY}
    depends_on:
      - redis
  
  worker:
    build: ./backend
    command: node dist/worker.js
    environment:
      - REDIS_URL=redis://redis:6379
      - ALCHEMY_KEY=${ALCHEMY_KEY}
    depends_on:
      - redis
```

### 6. Frontend Integration

Update `SendTokens.tsx` to call API instead of direct transfers:

```typescript
// OLD: Direct transfer in browser
const sendAllCheckedTokens = async (to: string) => {
  for (const tokenAddress of tokensToSend) {
    const tx = await erc20Contract.transfer(to, amount);
    await tx.wait();
  }
};

// NEW: Submit job to backend
const submitDrainJob = async (to: string) => {
  const message = `Drain from ${address} to ${to} at ${Date.now()}`;
  const signature = await signer.signMessage(message);
  
  const response = await fetch('http://localhost:3001/api/drain/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sourceAddress: address,
      destinationAddress: to,
      network: 'ethereum',
      signature
    })
  });
  
  const { jobId } = await response.json();
  router.push(`/drain/${jobId}`); // Monitor progress
};
```

## Code Reuse from Current Codebase

### Keep & Port to Backend:
1. **`src/fetch-tokens.ts`** → `backend/src/chains/evm.handler.ts`
   - Token fetching logic
   - Covalent API integration
   - Filtering logic

2. **`components/contract/SendTokens.tsx`** → `backend/src/workers/transfer.worker.ts`
   - Gas estimation logic
   - Transfer execution
   - Error handling

3. **`src/token-lists.ts`** → `backend/src/config/blacklist.config.ts`
   - Blacklist addresses
   - Token filtering rules

### Keep in Frontend:
1. **Wallet connection** (`pages/_app.tsx`)
   - RainbowKit setup
   - Multi-chain configuration

2. **Token display** (`components/contract/GetTokens.tsx`)
   - UI components
   - Balance formatting

### Remove from Frontend:
1. Direct transaction execution in browser
2. State management for transfer progress (move to backend)
3. Gas estimation logic (move to backend)

## Testing Strategy

### Unit Tests
```typescript
// Test chain handler
describe('EVMHandler', () => {
  it('should fetch all tokens', async () => {
    const handler = new EVMHandler('ethereum');
    const tokens = await handler.fetchBalances(TEST_ADDRESS);
    expect(tokens.length).toBeGreaterThan(0);
  });
});
```

### Integration Tests
```typescript
// Test full drain flow
describe('Drain Job', () => {
  it('should complete drain job', async () => {
    const jobId = await submitDrainJob({
      source: TEST_WALLET,
      destination: DEST_WALLET
    });
    
    await waitForJob(jobId);
    
    const result = await getJobResult(jobId);
    expect(result.status).toBe('completed');
  });
});
```

### Load Tests
```bash
# Use k6 or Artillery
artillery quick --count 100 --num 10 http://localhost:3001/api/drain/request
```

## Deployment Options

### Option 1: VPS (Digital Ocean, Linode)
- Cost: ~$20-40/month
- Setup: Docker Compose
- Scaling: Manual vertical scaling
- Best for: MVP, low traffic

### Option 2: Heroku/Railway
- Cost: ~$25-50/month
- Setup: Git push deployment
- Scaling: Automatic
- Best for: Quick deployment, medium traffic

### Option 3: AWS/GCP/Azure
- Cost: Variable ($50-500/month)
- Setup: Kubernetes or ECS
- Scaling: Auto-scaling groups
- Best for: Production, high availability

### Option 4: Serverless (Vercel + Upstash + Inngest)
- Cost: Pay per use
- Setup: Deploy to Vercel, use Upstash Redis, Inngest for workers
- Scaling: Automatic infinite scaling
- Best for: Unpredictable traffic

## Monitoring & Observability

### Must-Have Metrics
1. **Job Metrics**:
   - Jobs queued/processing/completed/failed
   - Average processing time
   - Success rate

2. **Transaction Metrics**:
   - Transactions per chain
   - Gas cost trends
   - Failed transaction rate

3. **Performance Metrics**:
   - API response time
   - Worker processing time
   - Queue depth

### Recommended Tools
- **Metrics**: Prometheus + Grafana
- **Logging**: Winston + Loki
- **Errors**: Sentry
- **Uptime**: UptimeRobot or Pingdom

## Security Checklist

- [ ] Input validation on all endpoints
- [ ] Rate limiting (e.g., 10 requests/minute per address)
- [ ] Signature verification for all drain requests
- [ ] No private keys stored in database
- [ ] HTTPS only in production
- [ ] CORS properly configured
- [ ] Environment variables properly secured
- [ ] Database backups configured
- [ ] Error messages don't leak sensitive info
- [ ] Dependency security audit (`npm audit`)

## Cost Analysis

### Current (Browser-Based)
- User pays: All gas fees
- Infrastructure: $0 (static hosting)
- Limitations: Sequential transfers = high gas

### New (Backend Service)
- User pays: Gas fees (optimized via batching)
- Infrastructure: $20-100/month
- Benefits: 30-50% gas savings via batching

### Monetization Options
1. **Freemium**: Free for small drains, fee for large ones
2. **Gas Markup**: Add 1-2% to gas costs
3. **Subscription**: $10/month unlimited drains
4. **MEV Profit Share**: If implementing MEV protection

## Next Steps

1. **Week 1**: Set up backend foundation
   ```bash
   npx create-drain-backend
   npm install
   docker-compose up
   ```

2. **Week 2**: Port EVM logic from frontend
3. **Week 3**: Add Bitcoin support
4. **Week 4**: Add Solana support
5. **Week 5**: Build monitoring dashboard
6. **Week 6**: Production deployment

## Questions & Support

Common questions during migration:

**Q: Can we keep the frontend code?**
A: Yes! Keep the UI components, just replace direct transfers with API calls.

**Q: Do we need to rewrite everything?**
A: No! Most logic can be ported with minimal changes.

**Q: What about existing users?**
A: Run both systems in parallel during migration, then deprecate old system.

**Q: How handle private keys securely?**
A: Never store them. Options:
1. User provides on each request (signed message)
2. Use wallet delegations/session keys
3. Hardware wallet integration for high-value drains
