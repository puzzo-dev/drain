import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  avalanche,
  bsc,
  gnosis,
} from 'wagmi/chains';
import { CssBaseline, GeistProvider, Loading } from '@geist-ui/core';
import App from './App';
import './index.css';
import { getConfig } from './lib/config';

const chains = [
  mainnet,
  polygon,
  optimism,
  arbitrum,
  avalanche,
  bsc,
  gnosis,
] as const;
const queryClient = new QueryClient();

let web3ModalInitialized = false;

// Root component with config loading
const Root = () => {
  const [wagmiConfig, setWagmiConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getConfig()
      .then((config) => {
        // Create wagmi config with project ID from database
        const projectId = config.walletconnect.projectId;

        const metadata = {
          name: config.app.name,
          description: config.app.description,
          url: config.app.url,
          icons: [config.app.iconUrl],
        };

        const wConfig = defaultWagmiConfig({
          chains,
          projectId,
          metadata,
        });

        setWagmiConfig(wConfig);

        // Create Web3Modal only once with correct project ID
        if (!web3ModalInitialized) {
          createWeb3Modal({
            wagmiConfig: wConfig,
            projectId,
          });
          web3ModalInitialized = true;
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load config:', err);
        setLoading(false);
      });
  }, []);

  if (loading || !wagmiConfig) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: '#000',
        }}
      >
        <Loading>Loading configuration...</Loading>
      </div>
    );
  }

  return (
    <React.StrictMode>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <GeistProvider>
              <CssBaseline />
              <App />
            </GeistProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </WagmiProvider>
    </React.StrictMode>
  );
};

export default Root;

// `useWeb3Modal` is re-exported from `src/lib/web3modal` to avoid importing
// this file (which mounts the app) from other modules and causing side-effects.

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />);
