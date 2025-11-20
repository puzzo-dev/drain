import { useWeb3Modal } from '../lib/web3modal';
import { useAccount } from 'wagmi';
import { GetTokens } from '../components/GetTokens';
import { SendTokens } from '../components/SendTokens';

export default function HomePage() {
  const { open } = useWeb3Modal();
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="p-4 border-b border-gray-800">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Drain</h1>
          <button
            onClick={() => open()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            {isConnected ? 'Connected' : 'Connect Wallet'}
          </button>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <GetTokens />
          <SendTokens />
        </div>
      </main>
    </div>
  );
}
