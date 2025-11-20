/* eslint-disable react-hooks/set-state-in-effect, react-hooks/preserve-manual-memoization */
import { useCallback, useEffect, useState } from 'react';
import { useAccount, useChainId, useChains } from 'wagmi';

import { Loading, Toggle } from '@geist-ui/core';
import { tinyBig } from 'essential-eth';
import { useAtom } from 'jotai';
import { checkedTokensAtom } from '../atoms/checked-tokens-atom';
import { globalTokensAtom } from '../atoms/global-tokens-atom';
import { fetchTokens, Tokens } from '../fetch-tokens';

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const TokenRow: React.FunctionComponent<{ token: Tokens[number] }> = ({
  token,
}) => {
  const [checkedRecords, setCheckedRecords] = useAtom(checkedTokensAtom);
  const pendingTxn = checkedRecords[token.contract_address]?.pendingTxn;
  const setTokenChecked = useCallback(
    (tokenAddress: string, isChecked: boolean) => {
      setCheckedRecords((old) => ({
        ...old,
        [tokenAddress]: { isChecked: isChecked },
      }));
    },
    [setCheckedRecords],
  );
  const { address } = useAccount();
  const chainId = useChainId();
  const chains = useChains();
  const chain = chains.find((c) => c.id === chainId);
  const { contract_address, contract_ticker_symbol } = token;
  const unroundedBalance = tinyBig(token.quote).div(token.quote_rate);
  const roundedBalance = unroundedBalance.lt(0.001)
    ? unroundedBalance.round(10)
    : unroundedBalance.gt(1000)
      ? unroundedBalance.round(2)
      : unroundedBalance.round(5);
  const isLoading = false; // Transaction loading handled by backend
  useEffect(() => {
    // Automatically set isChecked to true for all tokens
    setTokenChecked(contract_address, true);
  }, [contract_address, setTokenChecked]);

  return (
    <div key={contract_address} className="block">
      {isLoading && <Loading />}
      <Toggle
        checked={checkedRecords[contract_address]?.isChecked}
        onChange={() => {
          setTokenChecked(contract_address, true);
        }}
        style={{ marginRight: '18px' }}
        disabled={Boolean(pendingTxn)}
      />
      <span style={{ fontFamily: 'monospace' }}>
        {roundedBalance.toString()}{' '}
      </span>
      <a
        href={`${chain?.blockExplorers?.default.url}/token/${token.contract_address}?a=${address}`}
        target="_blank"
        rel="noreferrer"
      >
        {contract_ticker_symbol}
      </a>{' '}
      (worth{' '}
      <span style={{ fontFamily: 'monospace' }}>
        {usdFormatter.format(token.quote)}
      </span>
      )
    </div>
  );
};
export const GetTokens = () => {
  const [tokens, setTokens] = useAtom(globalTokensAtom);
  const [, setCheckedRecords] = useAtom(checkedTokensAtom);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const chains = useChains();
  const chain = chains.find((c) => c.id === chainId);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      setError('');
      const newTokens = await fetchTokens(chainId, address as string);
      setTokens((newTokens as any).erc20s);
    } catch {
      setError('Chain not supported. Coming soon!');
    }
    setLoading(false);
  }, [address, chainId, setTokens]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (address) {
      fetchData();
      setCheckedRecords({});
    }
  }, [address, chainId, fetchData, setCheckedRecords]);

  useEffect(() => {
    if (!isConnected) {
      setTokens([]);
      setCheckedRecords({});
    }
  }, [isConnected, setCheckedRecords, setTokens]);

  if (loading) {
    return <Loading>Loading</Loading>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div style={{ margin: '20px' }}>
      {isConnected &&
        tokens.length === 0 &&
        `No tokens on ${chain?.name || 'this chain'}`}
      {tokens.map((token) => (
        <TokenRow token={token} key={token.contract_address} />
      ))}
      {/* {isConnected && (
        <Button style={{ marginLeft: '20px' }} onClick={() => fetchData()}>
          Refetch
        </Button>
      )} */}
    </div>
  );
};

export default GetTokens;
