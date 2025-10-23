"use client";

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/lib/WalletProvider';
import { USDC_ADDRESS } from '@/lib/contractAddresses';
import { ethers } from 'ethers';

const USDC_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)'
];

export function USDCFaucet() {
  const { account, isConnected } = useWallet();
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // Fetch balance on mount and after minting
  useEffect(() => {
    if (isConnected && account) {
      fetchBalance();
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

  const handleGetUSDC = () => {
    // Open Base Sepolia faucet or instructions
    window.open('https://www.coinbase.com/faucets/base-ethereum-goerli-faucet', '_blank');
    alert('Opening Base faucet! Get free ETH and USDC for testing.\n\nAfter getting ETH, you can swap for USDC on Uniswap Base Sepolia.');
  };

  const handleAddToMetaMask = async () => {
    try {
      const wasAdded = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: USDC_ADDRESS,
            symbol: 'USDC',
            decimals: 6,
            image: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
          },
        },
      });

      if (wasAdded) {
        console.log('✅ USDC added to MetaMask');
        alert('✅ USDC token added to MetaMask!');
      }
    } catch (error) {
      console.error('Error adding token to MetaMask:', error);
    }
  };

  if (!isConnected) {
    return null; // Don't show if not connected
  }

  return (
    <div className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 p-4 border border-green-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💵</span>
          <div>
            <h4 className="font-bold text-slate-900">USDC Balance</h4>
            <p className="text-xs text-slate-600">Base Sepolia Testnet</p>
          </div>
        </div>
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="text-slate-500 hover:text-slate-700 transition"
        >
          <span className="text-lg">ℹ️</span>
        </button>
      </div>

      {showExplanation && (
        <div className="mb-3 p-3 rounded-lg bg-white border border-green-200">
          <p className="text-xs text-slate-700 leading-relaxed">
            <strong>Why USDC?</strong> RoomLen uses USDC as its native token on Base.
            It's a stablecoin pegged to US Dollar, making transactions simpler and more predictable.
            Get free testnet USDC from the Base faucet!
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-slate-600">Your Balance</p>
          <p className="text-2xl font-bold text-slate-900">{balance} USDC</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAddToMetaMask}
            className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition"
            title="Add USDC to MetaMask"
          >
            🦊 Add to MetaMask
          </button>
          <button
            onClick={handleGetUSDC}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold hover:scale-105 transition"
          >
            💰 Get USDC
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-500 text-center">
        Get free testnet USDC from Base faucet to try investing on RoomLen.
      </p>
    </div>
  );
}
