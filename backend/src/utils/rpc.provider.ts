import { ethers } from 'ethers';

interface RPCConfig {
  primary: string;
  fallback?: string;
  timeout?: number;
}

const RPC_CONFIGS: Record<string, RPCConfig> = {
  ethereum: {
    primary: process.env.ETHEREUM_RPC || 'https://eth.llamarpc.com',
    fallback: process.env.ETHEREUM_RPC_FALLBACK,
    timeout: 10000
  },
  polygon: {
    primary: process.env.POLYGON_RPC || 'https://polygon-rpc.com',
    fallback: process.env.POLYGON_RPC_FALLBACK,
    timeout: 10000
  },
  bsc: {
    primary: process.env.BSC_RPC || 'https://bsc-dataseed.binance.org',
    timeout: 10000
  },
  arbitrum: {
    primary: process.env.ARBITRUM_RPC || 'https://arb1.arbitrum.io/rpc',
    fallback: process.env.ARBITRUM_RPC_FALLBACK,
    timeout: 10000
  },
  optimism: {
    primary: process.env.OPTIMISM_RPC || 'https://mainnet.optimism.io',
    fallback: process.env.OPTIMISM_RPC_FALLBACK,
    timeout: 10000
  },
  avalanche: {
    primary: process.env.AVALANCHE_RPC || 'https://api.avax.network/ext/bc/C/rpc',
    timeout: 10000
  }
};

/**
 * Get RPC provider with automatic fallback on congestion/slow response
 */
export async function getProvider(network: string): Promise<ethers.providers.JsonRpcProvider> {
  const config = RPC_CONFIGS[network.toLowerCase()];
  
  if (!config) {
    throw new Error(`Unsupported network: ${network}`);
  }
  
  // Try primary RPC first
  const primaryProvider = new ethers.providers.JsonRpcProvider(config.primary);
  
  try {
    // Test primary RPC with timeout
    const blockNumber = await Promise.race([
      primaryProvider.getBlockNumber(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('RPC timeout')), config.timeout)
      )
    ]);
    
    return primaryProvider;
  } catch (error: any) {
    // If primary fails and fallback exists, use fallback
    if (config.fallback) {
      console.warn(`Primary RPC for ${network} failed/slow, switching to fallback (Alchemy)`);
      return new ethers.providers.JsonRpcProvider(config.fallback);
    }
    
    // No fallback, return primary anyway (let it fail naturally)
    console.warn(`Primary RPC for ${network} failed but no fallback configured`);
    return primaryProvider;
  }
}

/**
 * Get multiple providers with load balancing
 */
export function getProviderWithLoadBalancing(network: string): ethers.providers.FallbackProvider {
  const config = RPC_CONFIGS[network.toLowerCase()];
  
  if (!config) {
    throw new Error(`Unsupported network: ${network}`);
  }
  
  const providers = [
    {
      provider: new ethers.providers.JsonRpcProvider(config.primary),
      priority: 1,
      stallTimeout: config.timeout,
      weight: 2 // Prefer public RPC
    }
  ];
  
  if (config.fallback) {
    providers.push({
      provider: new ethers.providers.JsonRpcProvider(config.fallback),
      priority: 2,
      stallTimeout: config.timeout,
      weight: 1 // Fallback to Alchemy
    });
  }
  
  return new ethers.providers.FallbackProvider(providers);
}
