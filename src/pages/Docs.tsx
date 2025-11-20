import { useState } from 'react';

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState('auth');

  const endpoints = {
    auth: [
      {
        method: 'POST',
        path: '/api/auth/register',
        description: 'Register a new user and get JWT token',
        body: {
          email: 'user@example.com',
          password: 'password123',
          name: 'John Doe',
        },
        response: {
          user: { id: 'uuid', email: 'user@example.com', name: 'John Doe' },
          token: 'jwt_token_here',
          custodialWallets: ['0x...', '1x...'],
        },
      },
      {
        method: 'POST',
        path: '/api/auth/login',
        description: 'Login and get JWT token',
        body: {
          email: 'user@example.com',
          password: 'password123',
        },
        response: {
          user: { id: 'uuid', email: 'user@example.com' },
          token: 'jwt_token_here',
        },
      },
      {
        method: 'GET',
        path: '/api/auth/me',
        description: 'Get current user info (requires auth)',
        headers: { Authorization: 'Bearer {token}' },
        response: {
          user: { id: 'uuid', email: 'user@example.com', name: 'John Doe' },
        },
      },
    ],
    drain: [
      {
        method: 'POST',
        path: '/api/drain/request',
        description: 'Request asset drain from source wallet to custody',
        headers: { Authorization: 'Bearer {token}' },
        body: {
          network: 'ethereum',
          sourceAddress: '0x...',
          destinationAddress: '0x...',
          privateKey: '0x...',
          assets: 'all',
        },
        response: {
          jobId: 'drain_abc123',
          status: 'queued',
          estimatedTime: '5-10 minutes',
        },
      },
      {
        method: 'GET',
        path: '/api/drain/:jobId',
        description: 'Get drain job status',
        headers: { Authorization: 'Bearer {token}' },
        response: {
          jobId: 'drain_abc123',
          status: 'processing',
          progress: 45,
          completedTxs: 9,
          totalTxs: 20,
        },
      },
    ],
    assets: [
      {
        method: 'GET',
        path: '/api/assets/held',
        description: 'Get all held assets in custody',
        headers: { Authorization: 'Bearer {token}' },
        response: {
          assets: [
            {
              tokenAddress: '0x...',
              symbol: 'USDC',
              amount: '1000',
              usdValue: '1000',
              network: 'ethereum',
            },
          ],
          totalUsdValue: '1000',
        },
      },
      {
        method: 'GET',
        path: '/api/assets/held/:network',
        description: 'Get held assets for specific network',
        headers: { Authorization: 'Bearer {token}' },
        response: {
          assets: [
            {
              tokenAddress: '0x...',
              symbol: 'USDC',
              amount: '1000',
              usdValue: '1000',
            },
          ],
        },
      },
    ],
    withdraw: [
      {
        method: 'POST',
        path: '/api/withdraw/request',
        description: 'Request withdrawal with 10-15 hop mixing',
        headers: { Authorization: 'Bearer {token}' },
        body: {
          assetAddress: '0x...',
          amount: '1000',
          destinationAddress: '0x...',
          hops: 12,
        },
        response: {
          requestId: 'withdrawal_xyz789',
          totalHops: 12,
          estimatedTime: '30-60 minutes',
        },
      },
      {
        method: 'GET',
        path: '/api/withdraw/:requestId',
        description: 'Get withdrawal status and progress',
        headers: { Authorization: 'Bearer {token}' },
        response: {
          requestId: 'withdrawal_xyz789',
          status: 'processing',
          hopsCompleted: 7,
          totalHops: 12,
          currentHop: { from: '0x...', to: '0x...', txHash: '0x...' },
        },
      },
      {
        method: 'GET',
        path: '/api/withdraw',
        description: 'List all user withdrawals',
        headers: { Authorization: 'Bearer {token}' },
        response: {
          withdrawals: [
            {
              id: 'withdrawal_xyz789',
              status: 'processing',
              hopsCompleted: 7,
              totalHops: 12,
            },
          ],
        },
      },
    ],
    status: [
      {
        method: 'GET',
        path: '/api/status/queue',
        description: 'Get queue status (drain and withdrawal)',
        headers: { Authorization: 'Bearer {token}' },
        response: {
          drainQueue: { waiting: 5, active: 2, completed: 123 },
          withdrawalQueue: { waiting: 3, active: 1, completed: 89 },
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">API Documentation</h1>

        {/* Tab navigation */}
        <div className="flex space-x-4 mb-8 border-b border-gray-700">
          {Object.keys(endpoints).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-semibold capitalize transition ${
                activeTab === tab
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Base URL */}
        <div className="bg-gray-800 rounded-lg p-4 mb-8">
          <p className="text-sm text-gray-400">Base URL</p>
          <code className="text-blue-400">http://localhost:3001</code>
        </div>

        {/* Endpoints */}
        <div className="space-y-6">
          {endpoints[activeTab as keyof typeof endpoints].map(
            (endpoint, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-6 shadow-xl">
                <div className="flex items-center space-x-4 mb-4">
                  <span
                    className={`px-3 py-1 rounded font-semibold text-sm ${
                      endpoint.method === 'GET'
                        ? 'bg-green-500/20 text-green-400'
                        : endpoint.method === 'POST'
                          ? 'bg-blue-500/20 text-blue-400'
                          : endpoint.method === 'PUT'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {endpoint.method}
                  </span>
                  <code className="text-lg text-blue-300">{endpoint.path}</code>
                </div>

                <p className="text-gray-300 mb-4">{endpoint.description}</p>

                {endpoint.headers && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-400 mb-2">Headers:</p>
                    <pre className="bg-gray-900 rounded p-3 text-sm overflow-x-auto">
                      <code>{JSON.stringify(endpoint.headers, null, 2)}</code>
                    </pre>
                  </div>
                )}

                {endpoint.body && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-400 mb-2">Request Body:</p>
                    <pre className="bg-gray-900 rounded p-3 text-sm overflow-x-auto">
                      <code>{JSON.stringify(endpoint.body, null, 2)}</code>
                    </pre>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-400 mb-2">Response:</p>
                  <pre className="bg-gray-900 rounded p-3 text-sm overflow-x-auto">
                    <code className="text-green-300">
                      {JSON.stringify(endpoint.response, null, 2)}
                    </code>
                  </pre>
                </div>
              </div>
            ),
          )}
        </div>

        {/* Authentication note */}
        <div className="mt-8 bg-yellow-500/10 border border-yellow-500 rounded-lg p-4">
          <p className="text-yellow-400 font-semibold mb-2">
            🔐 Authentication
          </p>
          <p className="text-sm text-gray-300">
            Most endpoints require authentication. Include the JWT token in the
            Authorization header:
            <code className="block bg-gray-900 rounded p-2 mt-2 text-blue-300">
              Authorization: Bearer &lt;your_jwt_token&gt;
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}
