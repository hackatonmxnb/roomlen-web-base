'use client';

import React from "react";
import dynamic from 'next/dynamic';

// Dynamic import to avoid server-side rendering issues
const WalletConnect = dynamic(
  () => import('@/components/WalletConnect'),
  { ssr: false }
);

interface TopbarProps {
  tab: "portfolio" | "market";
  onTab: (tab: "portfolio" | "market") => void;
}

export function Topbar({ tab, onTab }: TopbarProps) {
  return (
    <header className="bg-gradient-to-r from-white to-slate-50 ring-1 ring-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-3 hover:opacity-80 transition">
            <img
              src="/roomlenlogo.png"
              alt="RoomLen Logo"
              className="h-14 w-auto"
            />
          </a>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
          <button
            onClick={() => onTab("portfolio")}
            className={`px-3 py-2 rounded-lg transition-all ${
              tab === "portfolio"
                ? "text-white bg-gradient-to-r from-[#16A957] to-[#1297C8]"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            📊 Portfolio
          </button>
          <button
            onClick={() => onTab("market")}
            className={`px-3 py-2 rounded-lg transition-all ${
              tab === "market"
                ? "text-white bg-gradient-to-r from-[#16A957] to-[#1297C8]"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            🏪 Marketplace
          </button>
        </nav>

        <div className="flex items-center gap-4">
          {/* Polkadot Badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg ring-1 ring-slate-200">
            <img src="/polkadot_logo.png" alt="Polkadot" className="h-5 w-auto" />
            <span className="text-xs font-semibold text-slate-700">Paseo Testnet</span>
          </div>

          <div className="text-right hidden sm:block">
            <div className="font-bold text-slate-800 flex items-center gap-2">
              Investor Dashboard
              <span className="text-blue-600 text-xl">💼</span>
            </div>
            <div className="text-xs text-slate-500">Earn. Stream. Grow.</div>
          </div>

          <WalletConnect />
        </div>
      </div>
    </header>
  );
}
