import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { drainApi, assetsApi, withdrawApi } from '../../lib/api-client';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [queueStatus, setQueueStatus] = useState<any>(null);
  const [heldAssets, setHeldAssets] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 5000); // Refresh every 5s
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboardData = async () => {
    try {
      const [queue, assets, withdrawalList] = await Promise.all([
        drainApi.getQueueStatus(),
        assetsApi.getHeldAssets(),
        withdrawApi.listWithdrawals(),
      ]);
      setQueueStatus(queue);
      setHeldAssets(assets.assets || []);
      setWithdrawals(withdrawalList.withdrawals || []);
    } catch (err: any) {
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          <div className="space-x-4">
            <a
              href="/admin/users"
              className="text-blue-400 hover:text-blue-300"
            >
              Users
            </a>
            <a
              href="/admin/custody"
              className="text-blue-400 hover:text-blue-300"
            >
              Custody
            </a>
            <a href="/docs" className="text-blue-400 hover:text-blue-300">
              API Docs
            </a>
            <button
              onClick={() => {
                localStorage.removeItem('auth_token');
                navigate('/login');
              }}
              className="text-red-400 hover:text-red-300"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Queue Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-400 mb-2">
              Drain Queue
            </h3>
            <p className="text-3xl font-bold text-blue-400">
              {queueStatus?.drainQueue?.waiting || 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Active: {queueStatus?.drainQueue?.active || 0}
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-400 mb-2">
              Withdrawal Queue
            </h3>
            <p className="text-3xl font-bold text-purple-400">
              {queueStatus?.withdrawalQueue?.waiting || 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Active: {queueStatus?.withdrawalQueue?.active || 0}
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-400 mb-2">
              Total Held Assets
            </h3>
            <p className="text-3xl font-bold text-green-400">
              $
              {heldAssets
                .reduce((sum, a) => sum + (parseFloat(a.usdValue) || 0), 0)
                .toFixed(2)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {heldAssets.length} assets
            </p>
          </div>
        </div>

        {/* Recent Withdrawals */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-xl mb-8">
          <h2 className="text-2xl font-bold mb-4">Recent Withdrawals</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4">ID</th>
                  <th className="text-left py-3 px-4">Asset</th>
                  <th className="text-left py-3 px-4">Amount</th>
                  <th className="text-left py-3 px-4">Hops</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Progress</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.slice(0, 10).map((w: any) => (
                  <tr
                    key={w.id}
                    className="border-b border-gray-700/50 hover:bg-gray-700/30"
                  >
                    <td className="py-3 px-4 font-mono text-sm">
                      {w.id.slice(0, 8)}
                    </td>
                    <td className="py-3 px-4">{w.symbol}</td>
                    <td className="py-3 px-4">{w.amount}</td>
                    <td className="py-3 px-4">{w.totalHops}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          w.status === 'completed'
                            ? 'bg-green-500/20 text-green-400'
                            : w.status === 'processing'
                              ? 'bg-blue-500/20 text-blue-400'
                              : w.status === 'failed'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {w.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {w.hopsCompleted}/{w.totalHops}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Held Assets Summary */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
          <h2 className="text-2xl font-bold mb-4">Custody Assets by Network</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              'ethereum',
              'polygon',
              'bsc',
              'arbitrum',
              'optimism',
              'avalanche',
              'solana',
            ].map((network) => {
              const networkAssets = heldAssets.filter(
                (a) => a.network === network,
              );
              const totalValue = networkAssets.reduce(
                (sum, a) => sum + (parseFloat(a.usdValue) || 0),
                0,
              );

              return (
                <div key={network} className="bg-gray-700/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold capitalize mb-2">
                    {network}
                  </h3>
                  <p className="text-2xl font-bold text-blue-400">
                    ${totalValue.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {networkAssets.length} assets
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
