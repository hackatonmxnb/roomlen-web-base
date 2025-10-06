'use client';

import React from "react";
import dynamic from 'next/dynamic';

// Importación dinámica para evitar problemas de renderizado en el lado del servidor
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
    <header className="sticky top-0 z-40 backdrop-blur bg-white/75 ring-1 ring-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-3 hover:opacity-80 transition">
            <img 
              src="/roomlenlogo.png" 
              alt="RoomLen Logo" 
              className="h-14 w-auto"
            />
          </a>
          <span className="pill ml-3">Investor</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <button
            onClick={() => onTab("portfolio")}
            className={`hover:text-slate-900 ${
              tab === "portfolio" ? "text-slate-900" : "text-slate-600"
            }`}
          >
            Portfolio
          </button>
          <button
            onClick={() => onTab("market")}
            className={`hover:text-slate-900 ${
              tab === "market" ? "text-slate-900" : "text-slate-600"
            }`}
          >
            Marketplace
          </button>
          <span className="text-slate-400">Payments</span>
          <span className="text-slate-400">Settings</span>
        </nav>
        <WalletConnect />
      </div>
    </header>
  );
}
