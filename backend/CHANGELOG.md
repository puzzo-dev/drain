# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Versioning Strategy

- **MAJOR** (x.0.0): Multiple functionalities, breaking changes, architecture updates
- **MINOR** (0.x.0): Single functionality, new features, bug fixes, improvements
- **PATCH** (0.0.x): Simple fixes, styling changes, documentation updates

## [1.0.0] - 2025-11-20

### 🚀 MAJOR Release - Initial Implementation

**Features**:

- Multi-chain custody drain system (EVM, Solana, Bitcoin support)
- User registration and JWT authentication
- Custodial wallet generation (BIP44 HD derivation)
- 10-15 hop mixing service with ephemeral wallets
- Bull queue system with Redis for reliable job processing
- RPC failover strategy (public RPCs primary, Alchemy fallback)
- API key expiration monitoring (Covalent)
- Complete REST API (15+ endpoints)
- PostgreSQL + Prisma ORM database layer
- WebSocket support for real-time updates

**Architecture**:

- Express API server
- Bull workers (drain + withdrawal)
- Chain handler abstraction
- AES-256-GCM encryption for private keys
- Comprehensive logging with Winston

**Networks Supported**:

- Ethereum
- Polygon
- BSC (Binance Smart Chain)
- Arbitrum
- Optimism
- Avalanche
- Solana

---
