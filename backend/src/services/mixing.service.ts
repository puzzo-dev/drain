import { prisma } from '../db/prisma';
import { walletService } from './wallet.service';
import { getChainHandler } from '../chains/registry';
import { logger } from '../utils/logger';

interface MixingConfig {
  minHops: number;
  maxHops: number;
  minDelaySeconds: number;
  maxDelaySeconds: number;
}

const DEFAULT_MIXING_CONFIG: MixingConfig = {
  minHops: 10,
  maxHops: 15,
  minDelaySeconds: 30,
  maxDelaySeconds: 300 // 5 minutes
};

export class MixingService {
  /**
   * Create a withdrawal request with multi-hop mixing
   */
  async createWithdrawalRequest(
    userId: string,
    network: string,
    assetAddress: string,
    symbol: string,
    amount: string,
    destinationAddress: string,
    config: Partial<MixingConfig> = {}
  ): Promise<string> {
    const mixingConfig = { ...DEFAULT_MIXING_CONFIG, ...config };
    
    // Random number of hops within range
    const totalHops = this.randomBetween(mixingConfig.minHops, mixingConfig.maxHops);
    
    logger.info(`Creating withdrawal request with ${totalHops} hops for user ${userId}`);
    
    // Create withdrawal request
    const request = await prisma.withdrawalRequest.create({
      data: {
        userId,
        network,
        assetAddress,
        symbol,
        amount,
        destinationAddress,
        status: 'pending',
        totalHops
      }
    });
    
    // Generate ephemeral wallets for each hop
    const ephemeralWallets: string[] = [];
    
    for (let i = 1; i < totalHops; i++) {
      const wallet = await walletService.generateEphemeralWallet(network);
      
      const ephemeral = await prisma.ephemeralWallet.create({
        data: {
          network,
          address: wallet.address,
          encryptedPrivateKey: wallet.encryptedPrivateKey
        }
      });
      
      ephemeralWallets.push(ephemeral.address);
    }
    
    // Create mixing hops
    const custodyWallet = await prisma.custodialWallet.findUnique({
      where: { userId_network: { userId, network } }
    });
    
    if (!custodyWallet) {
      throw new Error(`No custodial wallet found for user ${userId} on ${network}`);
    }
    
    // Build hop chain: custody → ephemeral1 → ephemeral2 → ... → destination
    const addresses = [custodyWallet.address, ...ephemeralWallets, destinationAddress];
    
    for (let i = 0; i < totalHops; i++) {
      const delaySeconds = this.randomBetween(
        mixingConfig.minDelaySeconds,
        mixingConfig.maxDelaySeconds
      );
      
      await prisma.mixingHop.create({
        data: {
          withdrawalRequestId: request.id,
          hopNumber: i + 1,
          fromAddress: addresses[i],
          toAddress: addresses[i + 1],
          amount,
          delaySeconds,
          status: 'pending'
        }
      });
    }
    
    logger.info(`Created ${totalHops} mixing hops for withdrawal request ${request.id}`);
    
    return request.id;
  }
  
  /**
   * Execute a single mixing hop
   */
  async executeHop(hopId: string): Promise<void> {
    const hop = await prisma.mixingHop.findUnique({
      where: { id: hopId },
      include: {
        withdrawalRequest: true
      }
    });
    
    if (!hop) {
      throw new Error(`Mixing hop ${hopId} not found`);
    }
    
    if (hop.status !== 'pending') {
      logger.warn(`Hop ${hopId} already processed (status: ${hop.status})`);
      return;
    }
    
    // Wait for delay
    logger.info(`Waiting ${hop.delaySeconds}s before executing hop ${hop.hopNumber}...`);
    await this.sleep(hop.delaySeconds * 1000);
    
    try {
      // Mark as processing
      await prisma.mixingHop.update({
        where: { id: hopId },
        data: {
          status: 'processing',
          executedAt: new Date()
        }
      });
      
      // Get wallet for source address
      const sourceWallet = await this.getWalletForAddress(
        hop.fromAddress,
        hop.withdrawalRequest.network
      );
      
      if (!sourceWallet) {
        throw new Error(`No wallet found for address ${hop.fromAddress}`);
      }
      
      // Get chain handler
      const handler = getChainHandler(hop.withdrawalRequest.network);
      
      // Execute transfer
      const asset = {
        address: hop.withdrawalRequest.assetAddress,
        symbol: hop.withdrawalRequest.symbol,
        amount: hop.amount,
        decimals: 18, // TODO: Get from asset
        type: 'erc20' as const
      };
      
      const txHash = await handler.transferAsset(
        asset,
        hop.toAddress,
        sourceWallet.encryptedPrivateKey
      );
      
      // Update hop with tx info
      await prisma.mixingHop.update({
        where: { id: hopId },
        data: {
          status: 'completed',
          txHash
        }
      });
      
      // Update withdrawal request progress
      await prisma.withdrawalRequest.update({
        where: { id: hop.withdrawalRequestId },
        data: {
          hopsCompleted: { increment: 1 }
        }
      });
      
      logger.info(`Hop ${hop.hopNumber} completed: ${txHash}`);
      
      // Check if this was the last hop
      const request = await prisma.withdrawalRequest.findUnique({
        where: { id: hop.withdrawalRequestId }
      });
      
      if (request && request.hopsCompleted === request.totalHops) {
        await prisma.withdrawalRequest.update({
          where: { id: request.id },
          data: {
            status: 'completed',
            completedAt: new Date()
          }
        });
        
        logger.info(`Withdrawal request ${request.id} fully completed!`);
      }
      
    } catch (error: any) {
      logger.error(`Failed to execute hop ${hop.hopNumber}:`, error);
      
      await prisma.mixingHop.update({
        where: { id: hopId },
        data: {
          status: 'failed',
          error: error.message
        }
      });
      
      await prisma.withdrawalRequest.update({
        where: { id: hop.withdrawalRequestId },
        data: {
          status: 'failed',
          error: error.message
        }
      });
      
      throw error;
    }
  }
  
  /**
   * Get wallet (custodial or ephemeral) for an address
   */
  private async getWalletForAddress(address: string, network: string) {
    // Try custodial wallet first
    const custodial = await prisma.custodialWallet.findFirst({
      where: { address, network }
    });
    
    if (custodial) return custodial;
    
    // Try ephemeral wallet
    const ephemeral = await prisma.ephemeralWallet.findFirst({
      where: { address, network, burned: false }
    });
    
    return ephemeral;
  }
  
  private randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const mixingService = new MixingService();
