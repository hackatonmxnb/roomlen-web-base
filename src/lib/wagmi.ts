'use client';

import { http, cookieStorage, createConfig, createStorage } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { coinbaseWallet, injected } from 'wagmi/connectors';

export const config = createConfig({
  chains: [baseSepolia],
  connectors: [
    injected({
      target: 'metaMask',
    }),
    coinbaseWallet({
      appName: 'RoomLen',
      appLogoUrl: '/base_square.png',
      preference: 'smartWalletOnly', // Use Smart Wallet (Base Account)
    }),
  ],
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  transports: {
    [baseSepolia.id]: http(),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
