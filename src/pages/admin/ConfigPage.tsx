import React, { useState, useEffect, useCallback } from 'react';
import { Input, Button, useToasts, Loading, Tabs } from '@geist-ui/core';

interface ConfigItem {
  key: string;
  value: string;
  description?: string;
  category: string;
  isSecret: boolean;
}

export default function ConfigPage() {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const { setToast } = useToasts();

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/config/all');
      if (!response.ok) throw new Error('Failed to fetch config');
      const data = await response.json();
      setConfigs(data);
    } catch (error) {
      setToast({
        text: `Failed to load configuration: ${error}`,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [setToast]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleUpdate = async (key: string, newValue: string) => {
    setSaving(key);
    try {
      const response = await fetch(`/api/admin/config/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: newValue }),
      });

      if (!response.ok) throw new Error('Failed to update');

      setToast({
        text: `Configuration ${key} updated successfully`,
        type: 'success',
      });

      // Refresh configs
      await fetchConfig();
    } catch (error) {
      setToast({
        text: `Failed to update ${key}: ${error}`,
        type: 'error',
      });
    } finally {
      setSaving(null);
    }
  };

  const groupedConfigs = configs.reduce(
    (acc, config) => {
      if (!acc[config.category]) {
        acc[config.category] = [];
      }
      acc[config.category].push(config);
      return acc;
    },
    {} as Record<string, ConfigItem[]>,
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loading>Loading configuration...</Loading>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">App Configuration</h1>
          <Button onClick={fetchConfig}>🔄 Refresh</Button>
        </div>

        <Tabs initialValue="walletconnect">
          {Object.entries(groupedConfigs).map(([category, items]) => (
            <Tabs.Item
              key={category}
              label={category.charAt(0).toUpperCase() + category.slice(1)}
              value={category}
            >
              <div className="space-y-4 mt-6">
                {items.map((config) => (
                  <div
                    key={config.key}
                    className="bg-gray-800 p-6 rounded-lg border border-gray-700"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-white">
                            {config.key}
                          </h3>
                          {config.isSecret && (
                            <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded">
                              Secret
                            </span>
                          )}
                        </div>
                        {config.description && (
                          <p className="text-sm text-gray-400 mb-4">
                            {config.description}
                          </p>
                        )}
                        <Input
                          width="100%"
                          value={config.value}
                          onChange={(e) => {
                            const newConfigs = [...configs];
                            const index = newConfigs.findIndex(
                              (c) => c.key === config.key,
                            );
                            newConfigs[index].value = e.target.value;
                            setConfigs(newConfigs);
                          }}
                          htmlType={config.isSecret ? 'password' : 'text'}
                          placeholder={`Enter ${config.key}`}
                        />
                      </div>
                      <Button
                        loading={saving === config.key}
                        onClick={() => handleUpdate(config.key, config.value)}
                        disabled={saving !== null}
                      >
                        💾 Save
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Tabs.Item>
          ))}
        </Tabs>

        <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500 rounded-lg">
          <h3 className="text-yellow-400 font-semibold mb-2">
            ⚠️ Important Notes
          </h3>
          <ul className="text-yellow-300 text-sm space-y-1">
            <li>• Configuration changes take effect immediately</li>
            <li>• Frontend users may need to refresh to see changes</li>
            <li>
              • Secret values are masked but stored in plain text in the
              database
            </li>
            <li>• Changes are logged for audit purposes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
