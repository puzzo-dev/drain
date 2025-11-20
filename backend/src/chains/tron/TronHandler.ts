import axios from 'axios';
import { ChainHandler, Asset } from '../../types';
import { logger } from '../../utils/logger';

// Use a dynamic require to support different tronweb packaging (CJS/ESM)
let _TronWeb: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('tronweb');
  _TronWeb = mod && mod.default ? mod.default : mod;
} catch (err) {
  // leave _TronWeb as null; we handle this in the constructor
  logger.warn('`tronweb` package not found; TronHandler will be disabled', {
    err,
  });
}

export class TronHandler implements ChainHandler {
  public network = 'tron';
  private tron: any;
  private rpc: string;

  constructor() {
    this.rpc = process.env.TRON_RPC || 'https://api.trongrid.io';
    // TronWeb needs full node, solidity node, and event server — use the same for all
    if (_TronWeb) {
      try {
        this.tron = new _TronWeb({ fullHost: this.rpc });
      } catch (err) {
        // Some builds export an object that isn't constructable; try alternative shape
        try {
          this.tron = new (_TronWeb as any).TronWeb({ fullHost: this.rpc });
        } catch (err2) {
          logger.error('Failed to instantiate TronWeb; Tron support disabled', {
            err,
            err2,
          });
          this.tron = null;
        }
      }
    } else {
      this.tron = null;
    }
  }

  // Fetch TRX and TRC-20 token balances for an address
  async fetchBalances(address: string): Promise<Asset[]> {
    try {
      // Normalize address to hex
      const hex = this.tron.address.toHex(address);

      // Get TRX balance
      const account = await this.tron.trx.getAccount(address);
      const trxBalanceSun = account?.balance ?? 0;
      const trxBalance = (trxBalanceSun / 1e6).toString();

      const assets: Asset[] = [];

      if (Number(trxBalance) > 0) {
        assets.push({
          address: 'TRX',
          symbol: 'TRX',
          name: 'Tron',
          decimals: 6,
          amount: trxBalance,
          type: 'native',
          network: 'tron',
        } as Asset);
      }

      // For TRC20 tokens, Tron API does not expose a simple covalent equivalent here.
      // We'll attempt to query TronGrid /v1/accounts/:address/contracts for token balances
      try {
        const resp = await axios.get(
          `${this.rpc}/v1/accounts/${address}/tokens`,
        );
        const tokens = resp.data.data || [];

        for (const t of tokens) {
          const contractAddress = t.token_address || t.contract;
          const decimals = Number(t.decimals || 6);
          const balance = t.balance || t.tokenBalance || 0;
          const amount = (Number(balance) / Math.pow(10, decimals)).toString();

          assets.push({
            address: contractAddress,
            symbol: t.token_symbol || t.symbol || 'TRC20',
            name: t.token_name || t.name || 'TRC-20 Token',
            decimals,
            amount,
            type: 'erc20',
            network: 'tron',
          } as Asset);
        }
      } catch (err) {
        logger.warn(
          'Failed to fetch TRC20 token list from TronGrid, continuing with TRX only',
          err,
        );
      }

      logger.info(`Fetched ${assets.length} assets for ${address} on Tron`);
      return assets;
    } catch (error: any) {
      logger.error('Error fetching Tron balances:', error);
      throw error;
    }
  }

  async transferAsset(
    asset: Asset,
    to: string,
    privateKey: string,
  ): Promise<string> {
    try {
      // Setup signer
      const tronWithPrivate = this.tron; // TronWeb supports setting privateKey per transaction
      tronWithPrivate.setPrivateKey(privateKey);

      // Native TRX transfer
      if (asset.symbol === 'TRX' || asset.address === 'TRX') {
        const amountSun = Math.floor(Number(asset.amount) * 1e6);
        const tx = await tronWithPrivate.trx.sendTransaction(to, amountSun);
        if (tx.result === false) throw new Error('TRX transfer failed');
        logger.info(`TRX transfer txid: ${tx.txid || tx}`);
        return tx.txid || tx;
      }

      // TRC20 token transfer
      const contract = await tronWithPrivate.contract().at(asset.address);
      const decimals = asset.decimals || 6;
      const amount = BigInt(
        Math.floor(Number(asset.amount) * Math.pow(10, decimals)),
      ).toString();
      const result = await contract.methods
        .transfer(to, amount)
        .send({ feeLimit: 1_000_000 });
      // result may be txid
      logger.info(`TRC20 transfer result: ${JSON.stringify(result)}`);
      return result.txid || result;
    } catch (error: any) {
      logger.error(`Error transferring Tron asset ${asset.symbol}:`, error);
      throw error;
    }
  }
}
