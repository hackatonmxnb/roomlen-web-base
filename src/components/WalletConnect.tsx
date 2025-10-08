'use client';

import { useState, useEffect } from 'react';
import { web3Enable, web3Accounts } from '@polkadot/extension-dapp';
import { ApiPromise, WsProvider } from '@polkadot/api';

import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';

type WalletAccount = InjectedAccountWithMeta;

export default function WalletConnect() {
  const [api, setApi] = useState<ApiPromise | null>(null);
  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inicializar la API de Polkadot
  useEffect(() => {
    const initApi = async () => {
      try {
        const wsProvider = new WsProvider('wss://rpc.polkadot.io');
        const apiInstance = await ApiPromise.create({ provider: wsProvider });
        setApi(apiInstance);
        
        return () => {
          apiInstance.disconnect();
        };
      } catch (err) {
        console.error('Error connecting to Polkadot:', err);
        setError('Failed to connect to Polkadot network');
      }
    };

    initApi();
  }, []);

  const connectWallet = async () => {
    if (!api) return;
    
    setIsConnecting(true);
    setError(null);
    
    try {
      // Verificar si la extensión está instalada
      const extensions = await web3Enable('RoomLen');
      
      if (extensions.length === 0) {
        throw new Error('No Polkadot extension found. Please install it first.');
      }
      
      // Obtener cuentas
      const allAccounts = await web3Accounts();
      
      if (allAccounts.length === 0) {
        throw new Error('No accounts found. Please create or import an account in your Polkadot extension.');
      }
      
      setAccounts(allAccounts);
      setSelectedAccount(allAccounts[0].address);
      console.log(allAccounts[0].address);
      
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}…${address.slice(-4)}`;
  };

  return (
    <div className="flex items-center gap-2">
      {error && (
        <div className="text-red-500 text-xs mr-2">
          {error}
        </div>
      )}
      
      {selectedAccount ? (
        <div className="flex items-center gap-2">
          <span className="pill">Wallet: {formatAddress(selectedAccount)}</span>
        </div>
      ) : (
        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className="px-4 py-2 text-white rounded-lg disabled:opacity-50 transition-colors"
          style={{ 
            backgroundColor: 'var(--rf-blueTeal)',
            '--hover-bg': 'color-mix(in srgb, var(--rf-blueTeal) 85%, black)'
          } as React.CSSProperties}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--rf-blueTeal)';
          }}
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      )}
    </div>
  );
}
