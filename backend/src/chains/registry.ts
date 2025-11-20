import { ChainHandler, Asset } from '../types';
import { EVMHandler } from './evm/EVMHandler';
import { TronHandler } from './tron/TronHandler';
import { logger } from '../utils/logger';

const handlers: Record<string, ChainHandler> = {};

// Register EVM chains
const evmChains = [
  'ethereum',
  'polygon',
  'bsc',
  'arbitrum',
  'optimism',
  'avalanche',
];

evmChains.forEach((chain) => {
  handlers[chain] = new EVMHandler(chain);
});

// Register Tron handler
handlers['tron'] = new TronHandler();

// TODO: Add Bitcoin, Solana, etc.
// handlers['bitcoin'] = new BTCHandler();
// handlers['solana'] = new SolanaHandler();

export function getChainHandler(network: string): ChainHandler {
  const handler = handlers[network.toLowerCase()];

  if (!handler) {
    logger.error(`No handler found for network: ${network}`);
    throw new Error(`Unsupported network: ${network}`);
  }

  return handler;
}

export function getSupportedNetworks(): string[] {
  return Object.keys(handlers);
}
