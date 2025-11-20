export interface Asset {
  id: string; // token id/address
  symbol: string;
  name?: string;
  decimals: number;
  amount: string; // as string to avoid precision
  chain: string; // e.g. 'ethereum', 'tron', 'solana'
  raw?: any; // provider-specific data
}

export interface FeeEstimate {
  feeNative: string;
  feeUsd?: number;
}

export interface ChainHandler {
  network: string; // short id
  fetchBalances(address: string): Promise<Asset[]>;
  estimateFees?(asset: Asset): Promise<FeeEstimate>;
  transferAsset(
    asset: Asset,
    destination: string,
    privateKey: string,
  ): Promise<string>; // returns tx hash
}
