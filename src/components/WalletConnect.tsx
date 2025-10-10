'use client';

import { useWallet } from "@/lib/WalletProvider";
import React from "react";

const WalletConnect = () => {
  const { account, isConnected, connectWallet, disconnectWallet, wMxnbBalance, isPaseoNetwork } = useWallet();

  if (isConnected && account) {
    return (
      <div className="flex items-center gap-2">
        {!isPaseoNetwork && (
            <div className="px-3 py-2 text-xs font-bold text-yellow-800 bg-yellow-100 rounded-xl">Red Incorrecta</div>
        )}
        {wMxnbBalance !== null && (
            <div className="px-3 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl">
                {wMxnbBalance} wMXNB
            </div>
        )}
        <div className="px-3 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl">
          {`${account.substring(0, 5)}...${account.substring(account.length - 4)}`}
        </div>
        <button 
          onClick={disconnectWallet} 
          title="Disconnect Wallet"
          className="px-3 py-2 font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={connectWallet} 
      className="inline-flex items-center justify-center rounded-xl px-4 py-2 font-semibold shadow-sm hover:shadow transition bg-blue-600 text-white"
    >
      Connect Wallet
    </button>
  );
};

export default WalletConnect;