'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { WalletModal, WalletType } from '@/components/WalletModal';

// --- Contract and Network Information ---
const WMXNB_ADDRESS = '0xf8bB2Ce2643f89e6B80fDaC94483cDA91110d95a';
const WMXNB_ABI = ['function balanceOf(address) view returns (uint256)'];
const PASEO_NETWORK_ID = '420420422';

// --- Context State Definition ---
interface WalletState {
  account: string | null;
  signer: ethers.Signer | null;
  provider: ethers.BrowserProvider | null;
  isConnected: boolean;
  connectWallet: () => void;
  disconnectWallet: () => void;
  isPaseoNetwork: boolean;
  wMxnbBalance: string | null;
}

const WalletContext = createContext<WalletState | undefined>(undefined);

// --- Provider Component ---
export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [isPaseoNetwork, setIsPaseoNetwork] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [wMxnbBalance, setWMxnbBalance] = useState<string | null>(null);

  // --- Balance Logic ---
  const updateBalance = async (accountAddress: string, prov: ethers.BrowserProvider) => {
    try {
      const tokenContract = new ethers.Contract(WMXNB_ADDRESS, WMXNB_ABI, prov);
      const balance = await tokenContract.balanceOf(accountAddress);
      const formattedBalance = parseFloat(ethers.formatUnits(balance, 18)).toFixed(2);
      setWMxnbBalance(formattedBalance);
    } catch (e) {
      console.error("Failed to fetch wMXNB balance:", e);
      setWMxnbBalance(null);
    }
  };

  // --- Connection Logic ---
  const resetState = () => {
    setAccount(null);
    setSigner(null);
    setProvider(null);
    setIsPaseoNetwork(false);
    setWMxnbBalance(null);
  };

  const connectWallet = () => setIsModalOpen(true);

  const disconnectWallet = () => {
    resetState();
    localStorage.removeItem('walletType');
  };

  const initiateConnection = async (walletType: WalletType) => {
    let walletProvider: any;
    if (walletType === 'metamask') walletProvider = window.ethereum;
    else if (walletType === 'subwallet') walletProvider = window.SubWallet;

    if (!walletProvider) {
      alert(`Could not find ${walletType}. Please make sure it's installed.`);
      return;
    }

    try {
      const browserProvider = new ethers.BrowserProvider(walletProvider);
      const accounts = await browserProvider.send('eth_requestAccounts', []);
      const currentSigner = await browserProvider.getSigner();
      const network = await browserProvider.getNetwork();
      const currentAccount = accounts[0];

      setProvider(browserProvider);
      setSigner(currentSigner);
      setAccount(currentAccount);
      setIsPaseoNetwork(network.chainId.toString() === PASEO_NETWORK_ID);
      
      await updateBalance(currentAccount, browserProvider);
      
      localStorage.setItem('walletType', walletType);
    } catch (error) {
      console.error(`Error connecting to ${walletType}:`, error);
      resetState();
    }
  };

  // --- Wallet Event Handling ---
  useEffect(() => {
    const provider = window.ethereum || window.SubWallet;
    if (!provider) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== account) {
        const lastUsedWallet = localStorage.getItem('walletType') as WalletType;
        if (lastUsedWallet) initiateConnection(lastUsedWallet);
      }
    };
    const handleChainChanged = () => window.location.reload();

    provider.on('accountsChanged', handleAccountsChanged);
    provider.on('chainChanged', handleChainChanged);

    return () => {
      provider.removeListener('accountsChanged', handleAccountsChanged);
      provider.removeListener('chainChanged', handleChainChanged);
    };
  }, [account]);

  const value = { account, signer, provider, isConnected: !!account, connectWallet, disconnectWallet, isPaseoNetwork, wMxnbBalance };

  return (
    <WalletContext.Provider value={value}>
      {children}
      <WalletModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConnect={initiateConnection} />
    </WalletContext.Provider>
  );
};

// --- Hook and Global Types ---
export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) throw new Error('useWallet must be used within a WalletProvider');
  return context;
};

declare global {
  interface Window {
    ethereum?: any;
    SubWallet?: any;
  }
}
