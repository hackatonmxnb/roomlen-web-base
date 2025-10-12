'use client';

import { useWallet } from "@/lib/WalletProvider";
import React, { useState } from "react";
import { WalletGuide, WalletHelpButton } from "./ui/WalletGuide";
import { CHAIN_ID, RPC_URL, CHAIN_NAME } from '@/lib/contractAddresses';

const WalletConnect = () => {
  const { account, isConnected, connectWallet, disconnectWallet, wMxnbBalance, isPaseoNetwork } = useWallet();
  const [showGuide, setShowGuide] = useState(false);
  const [isAddingNetwork, setIsAddingNetwork] = useState(false);
  const buttonContainerRef = React.useRef<HTMLDivElement>(null);

  const handleAddPaseoNetwork = async () => {
    if (!window.ethereum) {
      setShowGuide(true);
      return;
    }

    setIsAddingNetwork(true);
    try {
      await (window.ethereum as any).request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${CHAIN_ID.toString(16)}`,
          chainName: CHAIN_NAME,
          nativeCurrency: {
            name: 'PAS',
            symbol: 'PAS',
            decimals: 18
          },
          rpcUrls: [RPC_URL],
          blockExplorerUrls: ['https://blockscout-passet-hub.parity-testnet.parity.io']
        }]
      });

      alert('Paseo Network added successfully! 🎉 Now connect your wallet.');
    } catch (error: any) {
      console.error('Error adding network:', error);
      if (error.code === 4902) {
        alert('Network added. Please select "Paseo Testnet" in your wallet.');
      } else {
        alert(`Could not add network: ${error.message}`);
      }
    } finally {
      setIsAddingNetwork(false);
    }
  };

  if (isConnected && account) {
    return (
      <div className="flex items-center gap-2">
        {!isPaseoNetwork && (
          <div className="flex items-center gap-2">
            <div className="px-3 py-2 text-xs font-bold text-yellow-800 bg-yellow-100 rounded-xl flex items-center gap-2">
              <span>⚠️</span>
              <span>Wrong Network</span>
            </div>
            <button
              onClick={handleAddPaseoNetwork}
              disabled={isAddingNetwork}
              className="px-3 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
            >
              {isAddingNetwork ? 'Adding...' : 'Switch to Paseo'}
            </button>
          </div>
        )}
        {wMxnbBalance !== null && (
          <div className="px-3 py-2 text-sm font-semibold text-green-700 bg-green-50 rounded-xl border border-green-200">
            💰 {parseFloat(wMxnbBalance).toFixed(2)} wMXNB
          </div>
        )}
        <div className="px-3 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl">
          {`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}
        </div>
        <button
          onClick={disconnectWallet}
          title="Disconnect Wallet"
          className="px-3 py-2 font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div ref={buttonContainerRef} className="flex flex-col items-end gap-2">
      <button
        onClick={connectWallet}
        className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 font-semibold shadow-sm hover:shadow-lg transition-all bg-gradient-to-r from-green-600 to-blue-600 text-white hover:scale-105"
      >
        <span className="mr-2"></span>
        Connect Wallet
      </button>
      <WalletHelpButton onClick={() => setShowGuide(true)} />

      {showGuide && <WalletGuide onClose={() => setShowGuide(false)} buttonRef={buttonContainerRef} />}
    </div>
  );
};

export default WalletConnect;