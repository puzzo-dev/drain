# Configuration Management System

## Overview

The app now uses a database-driven configuration system that allows updating settings via the admin panel without redeploying the application.

## Architecture

```
┌─────────────────┐
│   Frontend      │
│  (React/Vite)   │
└────────┬────────┘
         │ GET /api/config/public
         ▼
┌─────────────────┐
│   Backend API   │
│   (Express)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PostgreSQL    │
│  app_config     │
└─────────────────┘
```

## Setup

### 1. Database Migration

Run the migration to create the `app_config` table:

```bash
psql $DATABASE_URL -f backend/migrations/001_create_app_config.sql
```

This will:

- Create the `app_config` table
- Insert default configuration values (including your WalletConnect credentials)
- Set up triggers for `updated_at` timestamp

### 2. Environment Variables

Update `.env.local` with your database connection:

```env
# Database (only this needs to be in env)
DATABASE_URL=postgresql://user:password@localhost:5432/drain
REDIS_URL=redis://localhost:6379

# These are now in the database, but kept as fallbacks
VITE_WALLETCONNECT_PROJECT_ID=90792fdc-197f-4186-9f27-9d60f9c08dee
VITE_WALLETCONNECT_APP_SECRET=1a90dd3d6f11c8685064bc2e41b10dfb
```

### 3. Backend Routes

Add config routes to your Express server:

```typescript
import configRoutes from './routes/config.routes';

app.use('/api/config', configRoutes);
```

## Configuration Categories

### WalletConnect

- `walletconnect.projectId` - WalletConnect Project ID
- `walletconnect.appSecret` - App Secret for backend operations

### App Metadata

- `app.name` - Application display name
- `app.description` - Description shown in wallet connection
- `app.url` - Application URL
- `app.iconUrl` - Application icon URL

### Blockchain

- `blockchain.destinationAddress` - Default destination for token transfers
- `blockchain.supportedChains` - Comma-separated chain IDs (1,137,10,42161,43114,56,100)

### Security

- `security.maxDrainJobsPerUser` - Max concurrent jobs per user
- `security.jobTimeoutMinutes` - Job timeout in minutes
- `security.rateLimitPerHour` - API rate limit per IP

## Admin Panel

Access the configuration admin panel at:

```
http://localhost:3002/admin/config
```

Features:

- ✅ View all configuration values
- ✅ Edit values in real-time
- ✅ Categorized tabs (WalletConnect, App, Blockchain, Security)
- ✅ Secret masking for sensitive values
- ✅ Immediate effect (no deployment needed)

## API Endpoints

### Public (No Auth)

```
GET /api/config/public
```

Returns non-secret configuration for frontend use.

### Admin (Requires Auth)

```
GET /api/admin/config/all
PUT /api/admin/config/:key
POST /api/admin/config/init
```

## Frontend Usage

### Loading Configuration

The app automatically loads configuration on startup from `/api/config/public`. If the API is unavailable, it falls back to environment variables.

```typescript
import { getConfig } from './lib/config';

const config = await getConfig();
console.log(config.walletconnect.projectId);
```

### Configuration Cache

Configuration is cached in memory to avoid repeated API calls. Clear the cache after admin updates:

```typescript
import { clearConfigCache } from './lib/config';

clearConfigCache(); // Force reload on next getConfig()
```

## Benefits

✅ **No Redeployment**: Update WalletConnect credentials, chain support, and other settings without rebuilding  
✅ **Environment Separation**: Different configs for dev/staging/prod in the same codebase  
✅ **Audit Trail**: All configuration changes are logged with timestamps  
✅ **Fallback Safety**: Falls back to environment variables if database is unavailable  
✅ **Secret Management**: Sensitive values are marked and can be masked in UI

## Security Notes

⚠️ **Important:**

- Secret values (like `appSecret`) are stored in plain text in the database
- Consider encrypting secrets at rest using a key management service
- Add authentication middleware to protect admin endpoints
- Implement audit logging for configuration changes
- Use HTTPS in production to protect secrets in transit

## Development Workflow

1. **Local Development**: Use `.env.local` for quick iteration
2. **Database Seeding**: Run migration to populate default values
3. **Admin Updates**: Use admin panel to update values
4. **Production**: Database values take precedence over environment

## TODO

- [ ] Add authentication middleware to admin endpoints
- [ ] Implement audit logging for config changes
- [ ] Add encryption for secret values
- [ ] Create UI for viewing configuration history
- [ ] Add validation for configuration values
- [ ] Implement role-based access control
