import Bull from 'bull';
import dotenv from 'dotenv';
import { drainQueue } from './queues';
import { logger } from './utils/logger';
import './utils/api-key-monitor'; // Check API key expiry on startup
import { getChainHandler } from './chains/registry';
import { DrainJobData, DrainJobResult } from './types';

dotenv.config();

drainQueue.process(async (job: Bull.Job<DrainJobData>) => {
  const { network, sourceAddress, destinationAddress, assets } = job.data;

  logger.info(`Processing drain job ${job.id}`, {
    network,
    sourceAddress,
    destinationAddress,
  });

  try {
    // Get chain-specific handler
    const handler = getChainHandler(network);

    // Fetch all balances for the declared network
    const balances = await handler.fetchBalances(sourceAddress);
    logger.info(`Found ${balances.length} assets on ${network}`);

    // If the wallet contains assets that belong to other networks (multi-chain),
    // we will route those assets to their respective handlers.
    let assetsToTransfer =
      assets === 'all'
        ? balances
        : balances.filter((b: any) => assets.includes(b.address));

    // Expand assetsToTransfer to include assets that indicate a different network
    // and are requested (if assets !== 'all')
    if (assets === 'all') {
      // include all balances (already done)
    } else {
      // Include requested assets even if they weren't in the balances (defensive)
      const missing = assets.filter(
        (addr: string) => !assetsToTransfer.find((a) => a.address === addr),
      );
      if (missing.length)
        logger.warn(
          `Some requested assets were not found in balances: ${missing.join(',')}`,
        );
    }

    // Sort by USD value (high to low) for priority
    assetsToTransfer.sort(
      (a: any, b: any) => (b.usdValue || 0) - (a.usdValue || 0),
    );

    const results: DrainJobResult['transactions'] = [];
    let totalValue = 0;

    // Transfer each asset
    for (let i = 0; i < assetsToTransfer.length; i++) {
      const asset = assetsToTransfer[i];

      try {
        logger.info(
          `Transferring ${asset.symbol} on network ${asset.network || network}...`,
        );

        // Choose handler based on asset.network if present, otherwise use job.network
        const assetNetwork = (asset as any).network || network;
        const assetHandler =
          assetNetwork === network ? handler : getChainHandler(assetNetwork);

        const txHash = await assetHandler.transferAsset(
          asset,
          destinationAddress,
          job.data.privateKey, // Encrypted, decrypted in handler
        );

        results.push({
          asset: asset.symbol,
          address: asset.address,
          amount: asset.amount,
          txHash,
          status: 'success',
        });

        totalValue += asset.usdValue || 0;

        // Update progress
        await job.progress({
          total: assetsToTransfer.length,
          completed: i + 1,
          currentAsset: asset.symbol,
          lastTxHash: txHash,
        });
      } catch (error: any) {
        logger.error(`Failed to transfer ${asset.symbol}:`, error);

        results.push({
          asset: asset.symbol,
          address: asset.address,
          amount: asset.amount,
          status: 'failed',
          error: error.message,
        });
      }
    }

    const successCount = results.filter(
      (r: any) => r.status === 'success',
    ).length;

    logger.info(
      `Drain job ${job.id} completed: ${successCount}/${assetsToTransfer.length} successful`,
    );

    return {
      success: successCount > 0,
      totalAssets: assetsToTransfer.length,
      successfulTransfers: successCount,
      failedTransfers: assetsToTransfer.length - successCount,
      totalValueUsd: totalValue,
      transactions: results,
    };
  } catch (error: any) {
    logger.error(`Drain job ${job.id} failed:`, error);
    throw error;
  }
});

drainQueue.on('completed', (job: Bull.Job, result: any) => {
  logger.info(`Job ${job.id} completed`, result);
});

drainQueue.on('failed', (job: Bull.Job, err: Error) => {
  logger.error(`Job ${job?.id} failed:`, err);
});

drainQueue.on('error', (error: Error) => {
  logger.error('Worker error:', error);
});

logger.info('🔨 Drain worker started');

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Worker shutting down...');
  await drainQueue.close();
  process.exit(0);
});
