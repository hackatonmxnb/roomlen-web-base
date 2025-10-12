"use client";

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/lib/WalletProvider';
import { wmxnbAddress } from '@/lib/contractAddresses';
import { ethers } from 'ethers';
import WMXNB_ABI from '@/lib/abi/WMXNB.json';

export function WMXNBFaucet() {
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
      const wmxnb = new ethers.Contract(wmxnbAddress, WMXNB_ABI, provider);
      const balanceWei = await wmxnb.balanceOf(account);
      const balanceFormatted = ethers.formatEther(balanceWei);
      setBalance(parseFloat(balanceFormatted).toFixed(2));
    } catch (error) {
      console.error('Error fetching wMXNB balance:', error);
      setBalance('0');
    }
  };

  const handleMint = async () => {
    if (!isConnected || !account) {
      alert('Please connect your wallet first');
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 Checking wallet connection...');
      console.log('Account:', account);
      console.log('wMXNB Contract Address:', wmxnbAddress);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      console.log('🔗 Creating contract instance...');
      const wmxnb = new ethers.Contract(wmxnbAddress, WMXNB_ABI, signer);

      // Verificar que el contrato existe
      const code = await provider.getCode(wmxnbAddress);
      console.log('Contract code length:', code.length);
      if (code === '0x') {
        throw new Error('❌ Contract not found at this address. The wMXNB contract may not be deployed on Paseo Testnet yet.');
      }

      // Intentar leer el nombre y símbolo del token para verificar que es correcto
      try {
        const name = await wmxnb.name();
        const symbol = await wmxnb.symbol();
        const decimals = await wmxnb.decimals();
        console.log('✅ Token found:', { name, symbol, decimals });
      } catch (e) {
        console.warn('⚠️ Could not read token info, might not be an ERC20 token:', e);
      }

      // Mintear 10,000 wMXNB (cantidad generosa para testnet)
      const mintAmount = ethers.parseEther('10000');
      console.log('💰 Attempting to mint 10,000 wMXNB to:', account);
      console.log('Mint amount (wei):', mintAmount.toString());

      // Intentar diferentes nombres de función de minteo
      let tx;
      try {
        console.log('Trying mint(address, uint256)...');
        tx = await wmxnb.mint(account, mintAmount);
      } catch (mintError: any) {
        console.error('mint() failed:', mintError.message);

        // Intentar función alternativa: faucet()
        console.log('Trying alternative: calling contract without specific function...');
        throw new Error('The mint() function does not exist or is not accessible. The contract may need to be redeployed with a public mint/faucet function.');
      }
      console.log('📤 Transaction sent:', tx.hash);
      console.log('⏳ Waiting for confirmation...');

      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed in block:', receipt.blockNumber);

      // Esperar un poco para que el balance se actualice en la blockchain
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Actualizar balance
      await fetchBalance();

      console.log('✅ wMXNB minted successfully!');
      alert('🎉 Success! You received 10,000 wMXNB\n\nYour balance will update automatically.');

      // Disparar evento personalizado para que otros componentes actualicen
      window.dispatchEvent(new CustomEvent('wmxnb-balance-changed'));
    } catch (error: any) {
      console.error('❌ Error minting wMXNB:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        reason: error.reason,
        data: error.data,
        transaction: error.transaction,
        stack: error.stack
      });

      let errorMessage = 'Unknown error';
      if (error.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction rejected by user';
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient gas (PAS) to mint. Get testnet PAS first.';
      } else if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        errorMessage = error.message;
      } else {
        errorMessage = JSON.stringify(error);
      }

      alert('❌ Minting failed:\n\n' + errorMessage + '\n\nCheck console for details (F12)');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToMetaMask = async () => {
    try {
      const wasAdded = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: wmxnbAddress,
            symbol: 'wMXNB',
            decimals: 18,
            image: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png', // Placeholder
          },
        },
      });

      if (wasAdded) {
        console.log('✅ wMXNB added to MetaMask');
        alert('✅ wMXNB token added to MetaMask!');
      }
    } catch (error) {
      console.error('Error adding token to MetaMask:', error);
    }
  };

  if (!isConnected) {
    return null; // No mostrar si no está conectado
  }

  return (
    <div className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 p-4 border border-green-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💵</span>
          <div>
            <h4 className="font-bold text-slate-900">wMXNB Balance</h4>
            <p className="text-xs text-slate-600">Testnet Token Faucet</p>
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
            <strong>Why wMXNB?</strong> RoomLen uses wMXNB (Wrapped MXNB) as its native token.
            It's a stablecoin pegged to Mexican Peso, making transactions simpler and more predictable.
            This is testnet money - mint as much as you need!
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-slate-600">Your Balance</p>
          <p className="text-2xl font-bold text-slate-900">{balance} wMXNB</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAddToMetaMask}
            className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition"
            title="Add wMXNB to MetaMask"
          >
            🦊 Add to MetaMask
          </button>
          <button
            onClick={handleMint}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Minting...' : '💰 Mint 10k'}
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-500 text-center">
        Get free testnet tokens to try investing on RoomLen. Add to MetaMask to track your balance.
      </p>
    </div>
  );
}
