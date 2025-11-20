# Backend Quick Start

## Prerequisites

- Node.js 20+
- Redis installed (will auto-start)

## Setup (2 minutes)

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and add your API keys:
# - ALCHEMY_KEY
# - COVALENT_API_KEY
```

### 3. Start Everything (API + Worker)

```bash
npm run dev:all
```

Or run separately:

```bash
# Terminal 1: API server (auto-starts Redis)
npm run dev

# Terminal 2: Worker
npm run dev:worker
```

### 6. Test API
```bash
# Health check
curl http://localhost:3001/health

# Queue status
curl http://localhost:3001/api/status/queue

# Create drain job (replace with actual values)
curl -X POST http://localhost:3001/api/drain/request \
  -H "Content-Type: application/json" \
  -d '{
    "network": "polygon",
    "sourceAddress": "0x...",
    "destinationAddress": "0x...",
    "privateKey": "0x...",
    "assets": "all"
  }'
```

## Development Workflow

```bash
# Run everything in one command
npm run dev:all

# Or separately:
npm run dev        # API server (Redis auto-starts)
npm run dev:worker # Worker
```

## Architecture Overview

```
Client → API Server → Redis Queue → Worker → Blockchain
         ↓
      WebSocket updates
```

## Next Steps

1. **Frontend Integration**: Update frontend to call backend API instead of direct transfers
2. **Add Bitcoin Handler**: Implement `src/chains/btc/BTCHandler.ts`
3. **Add Solana Handler**: Implement `src/chains/solana/SolanaHandler.ts`
4. **Add Authentication**: Implement signature verification middleware

## API Endpoints

- `POST /api/drain/request` - Create drain job
- `GET /api/drain/:jobId` - Get job status
- `GET /api/status/queue` - Queue statistics
- `GET /health` - Health check

## Troubleshooting

**Redis connection failed**:
```bash
# Make sure Redis is running
redis-cli ping
# Should return: PONG
```

**Port 3001 already in use**:
Change `PORT` in `.env` file

**Worker not processing**:
Check Redis is running and worker logs

For full documentation, see `../MIGRATION.md`
