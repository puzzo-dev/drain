const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const defaultConfigs = [
  // WalletConnect Configuration
  {
    key: 'walletconnect.projectId',
    value:
      process.env.VITE_WALLETCONNECT_PROJECT_ID ||
      '90792fdc-197f-4186-9f27-9d60f9c08dee',
    description: 'WalletConnect Project ID from cloud.walletconnect.com',
    category: 'walletconnect',
    isSecret: false,
  },
  {
    key: 'walletconnect.appSecret',
    value:
      process.env.VITE_WALLETCONNECT_APP_SECRET ||
      '1a90dd3d6f11c8685064bc2e41b10dfb',
    description: 'WalletConnect App Secret for backend operations',
    category: 'walletconnect',
    isSecret: true,
  },

  // App Metadata
  {
    key: 'app.name',
    value: 'Drain - Multi-Chain Asset Recovery',
    description: 'Application display name',
    category: 'app',
    isSecret: false,
  },
  {
    key: 'app.description',
    value: 'Transfer all tokens from one wallet to another',
    description: 'Application description shown in wallet connection',
    category: 'app',
    isSecret: false,
  },
  {
    key: 'app.url',
    value: process.env.VITE_APP_URL || 'https://drain.app',
    description: 'Application URL',
    category: 'app',
    isSecret: false,
  },
  {
    key: 'app.iconUrl',
    value: 'https://avatars.githubusercontent.com/u/37784886',
    description: 'Application icon URL',
    category: 'app',
    isSecret: false,
  },

  // Blockchain Configuration
  {
    key: 'blockchain.destinationAddress',
    value:
      process.env.VITE_DESTINATION_ADDRESS ||
      '0x0000000000000000000000000000000000000000',
    description: 'Default destination address for token transfers',
    category: 'blockchain',
    isSecret: false,
  },
  {
    key: 'blockchain.supportedChains',
    value: '1,137,10,42161,43114,56,100',
    description:
      'Comma-separated list of supported chain IDs (mainnet, polygon, optimism, arbitrum, avalanche, bsc, gnosis)',
    category: 'blockchain',
    isSecret: false,
  },

  // Security Configuration
  {
    key: 'security.maxDrainJobsPerUser',
    value: '5',
    description: 'Maximum concurrent drain jobs per user',
    category: 'security',
    isSecret: false,
  },
  {
    key: 'security.jobTimeoutMinutes',
    value: '30',
    description: 'Maximum time a drain job can run before timeout',
    category: 'security',
    isSecret: false,
  },
  {
    key: 'security.rateLimitPerHour',
    value: '10',
    description: 'Maximum API requests per hour per IP',
    category: 'security',
    isSecret: false,
  },
];

async function main() {
  console.log('🌱 Seeding app configuration...');

  for (const config of defaultConfigs) {
    await prisma.appConfig.upsert({
      where: { key: config.key },
      update: {
        // Only update description and category, preserve existing values
        description: config.description,
        category: config.category,
        isSecret: config.isSecret,
      },
      create: config,
    });
    console.log(`✓ ${config.key}`);
  }

  console.log('✅ Seed completed successfully');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
