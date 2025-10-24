'use client';

import { http, cookieStorage, createConfig, createStorage } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors';

export const config = createConfig({
  chains: [baseSepolia],
  connectors: [
    injected({
      target: 'metaMask',
    }),
    coinbaseWallet({
      appName: 'RoomLen - Rent-Backed Lending',
      appLogoUrl: 'https://roomlenbase.netlify.app/roomlenlogo.png',
      preference: 'all', // Support both EOA and Smart Wallet
      version: '4',
      headlessMode: false,
    }),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'roomlen_base_batches',
      metadata: {
        name: 'RoomLen',
        description: 'Turn rental agreements into instant liquidity on Base',
        url: 'https://roomlenbase.netlify.app',
        icons: ['https://roomlenbase.netlify.app/roomlenlogo.png']
      },
      showQrModal: true,
    }),
  ],
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  transports: {
    [baseSepolia.id]: http('https://sepolia.base.org', {
      batch: true,
      retryCount: 3,
      timeout: 30_000,
    }),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
