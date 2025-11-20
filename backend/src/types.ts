export interface Asset {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  amount: string;
  usdValue?: number;
  type: 'native' | 'erc20' | 'spl' | 'utxo';
}

export interface DrainJobData {
  network: string;
  sourceAddress: string;
  destinationAddress: string;
  assets: 'all' | string[];
  privateKey: string; // Encrypted
  options?: {
    maxGasPrice?: string;
    batchSize?: number;
    prioritize?: string[];
  };
}

export interface DrainJobResult {
  success: boolean;
  totalAssets: number;
  successfulTransfers: number;
  failedTransfers: number;
  totalValueUsd: number;
  transactions: Array<{
    asset: string;
    address: string;
    amount: string;
    txHash?: string;
    status: 'success' | 'failed';
    error?: string;
  }>;
}

export interface ChainHandler {
  network: string;
  fetchBalances(address: string): Promise<Asset[]>;
  transferAsset(asset: Asset, to: string, privateKey: string): Promise<string>;
  estimateFees?(asset: Asset): Promise<{ gasFee: string; usdValue: number }>;
}
