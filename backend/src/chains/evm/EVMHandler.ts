import { ethers } from 'ethers';
import axios from 'axios';
import { ChainHandler, Asset } from '../../types';
import { logger } from '../../utils/logger';

const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)'
];

export class EVMHandler implements ChainHandler {
  public network: string;
  private provider: ethers.providers.JsonRpcProvider;
  private chainId: number;
  
  private chainConfigs: Record<string, { rpc: string; chainId: number; covalentName: string }> = {
    ethereum: { 
      rpc: process.env.ETHEREUM_RPC || '', 
      chainId: 1,
      covalentName: 'eth-mainnet'
    },
    polygon: { 
      rpc: process.env.POLYGON_RPC || '', 
      chainId: 137,
      covalentName: 'matic-mainnet'
    },
    bsc: { 
      rpc: process.env.BSC_RPC || 'https://bsc-dataseed.binance.org', 
      chainId: 56,
      covalentName: 'bsc-mainnet'
    },
    arbitrum: { 
      rpc: process.env.ARBITRUM_RPC || 'https://arb1.arbitrum.io/rpc', 
      chainId: 42161,
      covalentName: 'arbitrum-mainnet'
    },
    optimism: { 
      rpc: process.env.OPTIMISM_RPC || 'https://mainnet.optimism.io', 
      chainId: 10,
      covalentName: 'optimism-mainnet'
    },
    avalanche: { 
      rpc: process.env.AVALANCHE_RPC || 'https://api.avax.network/ext/bc/C/rpc', 
      chainId: 43114,
      covalentName: 'avalanche-mainnet'
    }
  };
  
  constructor(network: string) {
    this.network = network;
    const config = this.chainConfigs[network];
    
    if (!config) {
      throw new Error(`Unsupported EVM network: ${network}`);
    }
    
    this.provider = new ethers.providers.JsonRpcProvider(config.rpc);
    this.chainId = config.chainId;
  }
  
  async fetchBalances(address: string): Promise<Asset[]> {
    try {
      const config = this.chainConfigs[this.network];
      const covalentKey = process.env.COVALENT_API_KEY;
      
      if (!covalentKey) {
        throw new Error('COVALENT_API_KEY not configured');
      }
      
      // Use Covalent API (same as frontend)
      const response = await axios.get(
        `https://api.covalenthq.com/v1/${config.covalentName}/address/${address}/balances_v2/`,
        {
          params: { key: covalentKey }
        }
      );
      
      const items = response.data.data.items || [];
      
      // Filter and map tokens
      const assets: Asset[] = items
        .filter((item: any) => {
          return (
            item.type !== 'dust' &&
            (item.type === 'cryptocurrency' || item.type === 'stablecoin') &&
            item.quote !== null &&
            item.quote > 1 // Min $1 USD
          );
        })
        .map((item: any) => ({
          address: item.contract_address,
          symbol: item.contract_ticker_symbol,
          name: item.contract_name,
          decimals: item.contract_decimals,
          amount: ethers.utils.formatUnits(item.balance, item.contract_decimals),
          usdValue: item.quote,
          type: 'erc20' as const
        }));
      
      // Add native balance
      const nativeBalance = await this.provider.getBalance(address);
      if (nativeBalance.gt(0)) {
        const nativeSymbol = this.getNativeSymbol();
        assets.push({
          address: ethers.constants.AddressZero,
          symbol: nativeSymbol,
          name: nativeSymbol,
          decimals: 18,
          amount: ethers.utils.formatEther(nativeBalance),
          type: 'native' as const
        });
      }
      
      logger.info(`Fetched ${assets.length} assets for ${address} on ${this.network}`);
      return assets;
      
    } catch (error: any) {
      logger.error(`Error fetching balances for ${this.network}:`, error);
      throw error;
    }
  }
  
  async transferAsset(asset: Asset, to: string, privateKey: string): Promise<string> {
    try {
      const wallet = new ethers.Wallet(privateKey, this.provider);
      
      // Native token transfer
      if (asset.address === ethers.constants.AddressZero) {
        const amount = ethers.utils.parseEther(asset.amount);
        const tx = await wallet.sendTransaction({
          to,
          value: amount
        });
        
        await tx.wait();
        logger.info(`Native transfer complete: ${tx.hash}`);
        return tx.hash;
      }
      
      // ERC-20 token transfer
      const contract = new ethers.Contract(asset.address, ERC20_ABI, wallet);
      const amount = ethers.utils.parseUnits(asset.amount, asset.decimals);
      
      // Estimate gas with 2x buffer
      const gasLimit = await contract.estimateGas.transfer(to, amount);
      
      const tx = await contract.transfer(to, amount, {
        gasLimit: gasLimit.mul(2)
      });
      
      await tx.wait();
      logger.info(`ERC-20 transfer complete: ${tx.hash}`);
      return tx.hash;
      
    } catch (error: any) {
      logger.error(`Error transferring ${asset.symbol}:`, error);
      throw error;
    }
  }
  
  private getNativeSymbol(): string {
    const symbols: Record<string, string> = {
      ethereum: 'ETH',
      polygon: 'MATIC',
      bsc: 'BNB',
      arbitrum: 'ETH',
      optimism: 'ETH',
      avalanche: 'AVAX'
    };
    return symbols[this.network] || 'ETH';
  }
}
