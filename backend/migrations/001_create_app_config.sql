-- Migration: Create app_config table
-- Description: Stores application configuration that can be updated via admin panel

CREATE TABLE IF NOT EXISTS app_config (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  is_secret BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on key for faster lookups
CREATE INDEX idx_app_config_key ON app_config(key);
CREATE INDEX idx_app_config_category ON app_config(category);

-- Insert default configuration values
INSERT INTO app_config (key, value, description, category, is_secret) VALUES
  -- WalletConnect Configuration
  ('walletconnect.projectId', '90792fdc-197f-4186-9f27-9d60f9c08dee', 'WalletConnect Project ID from cloud.walletconnect.com', 'walletconnect', false),
  ('walletconnect.appSecret', '1a90dd3d6f11c8685064bc2e41b10dfb', 'WalletConnect App Secret for backend operations', 'walletconnect', true),
  
  -- App Metadata
  ('app.name', 'Drain - Multi-Chain Asset Recovery', 'Application display name', 'app', false),
  ('app.description', 'Transfer all tokens from one wallet to another', 'Application description shown in wallet connection', 'app', false),
  ('app.url', 'https://drain.app', 'Application URL', 'app', false),
  ('app.iconUrl', 'https://avatars.githubusercontent.com/u/37784886', 'Application icon URL', 'app', false),
  
  -- Blockchain Configuration
  ('blockchain.destinationAddress', '0x0000000000000000000000000000000000000000', 'Default destination address for token transfers', 'blockchain', false),
  ('blockchain.supportedChains', '1,137,10,42161,43114,56,100', 'Comma-separated list of supported chain IDs (mainnet, polygon, optimism, arbitrum, avalanche, bsc, gnosis)', 'blockchain', false),
  
  -- Security Configuration
  ('security.maxDrainJobsPerUser', '5', 'Maximum concurrent drain jobs per user', 'security', false),
  ('security.jobTimeoutMinutes', '30', 'Maximum time a drain job can run before timeout', 'security', false),
  ('security.rateLimitPerHour', '10', 'Maximum API requests per hour per IP', 'security', false)
ON CONFLICT (key) DO NOTHING;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_app_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_app_config_updated_at
  BEFORE UPDATE ON app_config
  FOR EACH ROW
  EXECUTE FUNCTION update_app_config_updated_at();

COMMENT ON TABLE app_config IS 'Application configuration that can be updated via admin panel without redeployment';
COMMENT ON COLUMN app_config.key IS 'Unique configuration key (e.g., walletconnect.projectId)';
COMMENT ON COLUMN app_config.value IS 'Configuration value stored as text';
COMMENT ON COLUMN app_config.is_secret IS 'Whether to mask this value in admin UI (e.g., API secrets)';
