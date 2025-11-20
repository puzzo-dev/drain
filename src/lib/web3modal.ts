// Small re-export to avoid importing the app entrypoint (which mounts the app)
// Components should import `useWeb3Modal` from here to avoid side-effects.
export { useWeb3Modal } from '@web3modal/wagmi/react';
