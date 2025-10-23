"use client";

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/lib/WalletProvider';
import { USDC_ADDRESS } from '@/lib/contractAddresses';
import { ethers } from 'ethers';

const USDC_ABI = [
  'function balanceOf(address account) external view returns (uint256)',
];

export function USDCBalance() {
  const { account, isConnected } = useWallet();
  const [balance, setBalance] = useState<string>('0');

  useEffect(() => {
    if (isConnected && account) {
      fetchBalance();

      // Auto-refresh balance every 5 seconds
      const interval = setInterval(fetchBalance, 5000);

      // Listen for custom balance update event
      const handleBalanceChange = () => {
        console.log('Balance change event received, refreshing...');
        fetchBalance();
      };
      window.addEventListener('usdc-balance-changed', handleBalanceChange);

      return () => {
        clearInterval(interval);
        window.removeEventListener('usdc-balance-changed', handleBalanceChange);
      };
    }
  }, [isConnected, account]);

  const fetchBalance = async () => {
    if (!account) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider);
      const balanceWei = await usdc.balanceOf(account);
      const balanceFormatted = ethers.formatUnits(balanceWei, 6);
      setBalance(parseFloat(balanceFormatted).toFixed(2));
    } catch (error) {
      console.error('Error fetching USDC balance:', error);
      setBalance('0');
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg ring-1 ring-green-200">
      <span className="text-lg">💵</span>
      <div className="text-right">
        <div className="text-xs text-slate-600">Balance</div>
        <div className="text-sm font-bold text-slate-900">{balance} USDC</div>
      </div>
    </div>
  );
}

// Keep backward compatibility
export const WMXNBBalance = USDCBalance;
