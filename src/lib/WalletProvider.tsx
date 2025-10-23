'use client';

import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useAccount, useDisconnect, useConnect, useConnectors, useWalletClient, useChainId, useSwitchChain } from 'wagmi';
import { ethers } from 'ethers';
import { WalletModal, WalletType } from '@/components/WalletModal';

// --- Contract and Network Information ---
const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const USDC_ABI = ['function balanceOf(address) view returns (uint256)'];
const BASE_SEPOLIA_NETWORK_ID = '84532';
const BASE_SEPOLIA_CHAIN_ID = 84532;

// --- Context State Definition ---
interface WalletState {
  account: string | null;
  signer: ethers.Signer | null;
  provider: ethers.BrowserProvider | null;
  isConnected: boolean;
  connectWallet: () => void;
  disconnectWallet: () => void;
  switchToBaseSepolia: () => Promise<void>;
  isBaseSepoliaNetwork: boolean;
  usdcBalance: string | null;
}

const WalletContext = createContext<WalletState | undefined>(undefined);

// --- Provider Component ---
export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const { address, isConnected: wagmiConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { connect } = useConnect();
  const { switchChain } = useSwitchChain();
  const connectors = useConnectors();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();

  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const isBaseSepoliaNetwork = chainId?.toString() === BASE_SEPOLIA_NETWORK_ID;

  // --- Balance Logic ---
  const updateBalance = async (accountAddress: string, prov: ethers.BrowserProvider) => {
    try {
      const tokenContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, prov);
      const balance = await tokenContract.balanceOf(accountAddress);
      const formattedBalance = parseFloat(ethers.formatUnits(balance, 6)).toFixed(2);
      setUsdcBalance(formattedBalance);
    } catch (e) {
      console.error("Failed to fetch USDC balance:", e);
      setUsdcBalance(null);
    }
  };

  // Setup provider and signer when wallet is connected
  useEffect(() => {
    const setupProviderAndSigner = async () => {
      if (wagmiConnected && walletClient && address) {
        try {
          // Create provider from wallet client
          const browserProvider = new ethers.BrowserProvider(walletClient as any);
          const ethersSigner = await browserProvider.getSigner(address);

          setProvider(browserProvider);
          setSigner(ethersSigner);

          // Update USDC balance
          await updateBalance(address, browserProvider);
        } catch (error) {
          console.error('Error setting up provider:', error);
        }
      } else {
        setProvider(null);
        setSigner(null);
        setUsdcBalance(null);
      }
    };

    setupProviderAndSigner();
  }, [wagmiConnected, walletClient, address]);

  const connectWallet = () => setIsModalOpen(true);

  const disconnectWallet = () => {
    disconnect();
    setProvider(null);
    setSigner(null);
    setUsdcBalance(null);
  };

  const switchToBaseSepolia = async () => {
    try {
      if (switchChain) {
        await switchChain({ chainId: BASE_SEPOLIA_CHAIN_ID });
      } else if (typeof window !== 'undefined' && (window as any).ethereum) {
        // Fallback for older wallets
        await (window as any).ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x14a34' }], // 84532 in hex
        });
      }
    } catch (error: any) {
      // If network doesn't exist, add it
      if (error.code === 4902 || error.code === -32603) {
        try {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x14a34',
              chainName: 'Base Sepolia',
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18
              },
              rpcUrls: ['https://sepolia.base.org'],
              blockExplorerUrls: ['https://sepolia.basescan.org']
            }]
          });
        } catch (addError) {
          console.error('Error adding Base Sepolia network:', addError);
          throw addError;
        }
      } else {
        throw error;
      }
    }
  };

  const initiateConnection = async (walletType: WalletType) => {
    try {
      let connector;

      if (walletType === 'metamask') {
        // Try to find MetaMask connector (injected)
        connector = connectors.find((c) => c.id === 'injected' || c.name === 'MetaMask');

        if (!connector && typeof window !== 'undefined' && (window as any).ethereum) {
          // If connector not found but MetaMask is available, use the first injected connector
          connector = connectors.find((c) => c.id === 'injected');
        }
      } else if (walletType === 'coinbase') {
        connector = connectors.find((c) => c.id === 'coinbaseWalletSDK');
      }

      if (!connector) {
        if (walletType === 'metamask') {
          alert('MetaMask not detected. Please install MetaMask extension.');
          window.open('https://metamask.io/download/', '_blank');
        } else {
          alert('Connector not found. Please refresh the page.');
        }
        return;
      }

      await connect({ connector });

      // After connection, switch to Base Sepolia if needed
      setTimeout(async () => {
        const currentChainId = await (window as any).ethereum?.request({ method: 'eth_chainId' });
        if (currentChainId !== '0x14a34') {
          await switchToBaseSepolia();
        }
      }, 500);

      setIsModalOpen(false);
    } catch (error) {
      console.error(`Error connecting to ${walletType}:`, error);
      alert(`Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const value: WalletState = {
    account: address || null,
    signer,
    provider,
    isConnected: wagmiConnected,
    connectWallet,
    disconnectWallet,
    switchToBaseSepolia,
    isBaseSepoliaNetwork,
    usdcBalance,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
      <WalletModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConnect={initiateConnection} />
    </WalletContext.Provider>
  );
};

// --- Hook ---
export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) throw new Error('useWallet must be used within a WalletProvider');
  return context;
};
