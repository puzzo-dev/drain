import { ethers } from 'ethers';
import * as bip39 from 'bip39';
import HDKey from 'hdkey';
import { Keypair } from '@solana/web3.js';
import { encrypt, decrypt } from './encryption.service';
import { logger } from '../utils/logger';

const MASTER_SEED = process.env.MASTER_WALLET_SEED || '';

if (!MASTER_SEED) {
  logger.warn('MASTER_WALLET_SEED not set! Generating temporary seed...');
  // For development only - in production, this should be set in .env
}

// Coin type constants for BIP44
const COIN_TYPES: Record<string, number> = {
  ethereum: 60,
  bsc: 60,
  polygon: 60,
  arbitrum: 60,
  optimism: 60,
  avalanche: 60,
  solana: 501,
  bitcoin: 0
};

export class WalletService {
  private masterSeed: Buffer;
  
  constructor() {
    if (MASTER_SEED) {
      this.masterSeed = bip39.mnemonicToSeedSync(MASTER_SEED);
    } else {
      // Development only
      const mnemonic = bip39.generateMnemonic();
      logger.info(`Generated temporary mnemonic: ${mnemonic}`);
      this.masterSeed = bip39.mnemonicToSeedSync(mnemonic);
    }
  }
  
  /**
   * Generate a custodial wallet for a user on a specific network
   */
  async generateCustodialWallet(userId: string, network: string): Promise<{
    address: string;
    encryptedPrivateKey: string;
    derivationPath: string;
  }> {
    const coinType = COIN_TYPES[network] || 60;
    
    // BIP44 path: m/44'/coin_type'/account'/change/address_index
    // We use userId hash as account number for deterministic generation
    const accountIndex = this.hashUserIdToNumber(userId);
    const path = `m/44'/${coinType}'/${accountIndex}'/0/0`;
    
    if (network === 'solana') {
      return this.generateSolanaWallet(userId, path);
    } else {
      // EVM-compatible chains
      return this.generateEVMWallet(userId, path);
    }
  }
  
  /**
   * Generate ephemeral wallet (one-time use for mixing)
   */
  async generateEphemeralWallet(network: string): Promise<{
    address: string;
    encryptedPrivateKey: string;
  }> {
    if (network === 'solana') {
      const keypair = Keypair.generate();
      return {
        address: keypair.publicKey.toBase58(),
        encryptedPrivateKey: encrypt(Buffer.from(keypair.secretKey).toString('hex'))
      };
    } else {
      // EVM
      const wallet = ethers.Wallet.createRandom();
      return {
        address: wallet.address,
        encryptedPrivateKey: encrypt(wallet.privateKey)
      };
    }
  }
  
  /**
   * Decrypt and return wallet instance
   */
  async getWalletInstance(encryptedPrivateKey: string, network: string, provider?: any): Promise<any> {
    const privateKey = decrypt(encryptedPrivateKey);
    
    if (network === 'solana') {
      const secretKey = Buffer.from(privateKey, 'hex');
      return Keypair.fromSecretKey(secretKey);
    } else {
      // EVM
      return new ethers.Wallet(privateKey, provider);
    }
  }
  
  private generateEVMWallet(userId: string, path: string): {
    address: string;
    encryptedPrivateKey: string;
    derivationPath: string;
  } {
    const root = HDKey.fromMasterSeed(this.masterSeed);
    const child = root.derive(path);
    
    const wallet = new ethers.Wallet(child.privateKey);
    
    return {
      address: wallet.address,
      encryptedPrivateKey: encrypt(wallet.privateKey, userId),
      derivationPath: path
    };
  }
  
  private generateSolanaWallet(userId: string, path: string): {
    address: string;
    encryptedPrivateKey: string;
    derivationPath: string;
  } {
    const root = HDKey.fromMasterSeed(this.masterSeed);
    const child = root.derive(path);
    
    const keypair = Keypair.fromSeed(child.privateKey.slice(0, 32));
    
    return {
      address: keypair.publicKey.toBase58(),
      encryptedPrivateKey: encrypt(Buffer.from(keypair.secretKey).toString('hex'), userId),
      derivationPath: path
    };
  }
  
  private hashUserIdToNumber(userId: string): number {
    // Create a deterministic number from userId for BIP44 account index
    const hash = userId.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    
    // Return positive number in safe range (0 to 2^31 - 1)
    return Math.abs(hash) % 2147483648;
  }
}

export const walletService = new WalletService();
