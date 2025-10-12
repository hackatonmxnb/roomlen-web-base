"use client";

import React from "react";
import dynamic from 'next/dynamic';

// Dynamic import to avoid server-side rendering issues
const WalletConnect = dynamic(
  () => import('@/components/WalletConnect'),
  { ssr: false }
);

export function TopbarOwner() {
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
          <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-slate-200 bg-white ml-3">
            Owner
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-slate-200 bg-white">
            KYC ✓
          </span>
          <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-slate-200 bg-white">
            Payout: CLABE ****1234
          </span>
          <WalletConnect />
        </div>
      </div>
    </header>
  );
}
