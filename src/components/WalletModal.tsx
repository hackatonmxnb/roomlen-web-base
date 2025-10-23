"use client";

import React from 'react';
import Image from 'next/image';

// Define supported wallet types
export type WalletType = 'metamask' | 'coinbase';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (wallet: WalletType) => void;
}

// Logos as SVG components to avoid dependency on external files
const MetaMaskLogo = () => (
  <svg width="48" height="48" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
    <path fill="#F6851B" d="M128 0l64 48v64l-64 48-64-48V48z"/>
    <path fill="#E2761B" d="M128 0l64 48v64l-64 48z"/>
    <path fill="#D96B1A" d="M128 160l64-48v-64L128 0z"/>
    <path fill="#C04327" d="M64 48l64 48-32 24-64-48z"/>
    <path fill="#E2761B" d="M128 96l32 24-32 24-64-48z"/>
  </svg>
);


export const WalletModal = ({ isOpen, onClose, onConnect }: WalletModalProps) => {
  if (!isOpen) {
    return null;
  }

  const handleConnect = (wallet: WalletType) => {
    onConnect(wallet);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md p-8 bg-white rounded-3xl shadow-2xl"
        onClick={(e) => e.stopPropagation()} // Prevents closing modal when clicking inside
      >
        <h2 className="text-2xl font-bold text-center text-slate-900">Connect Wallet</h2>
        <p className="mt-2 text-center text-slate-600">Choose your preferred wallet provider.</p>
        
        <div className="mt-6 space-y-4">
          <button
            onClick={() => handleConnect('metamask')}
            className="w-full flex items-center gap-4 p-4 rounded-xl text-lg font-semibold ring-1 ring-slate-200 hover:bg-slate-50 transition-all"
          >
            <MetaMaskLogo />
            MetaMask
          </button>
          <button
            onClick={() => handleConnect('coinbase')}
            className="w-full flex items-center gap-4 p-4 rounded-xl text-lg font-semibold ring-1 ring-slate-200 hover:bg-slate-50 transition-all"
          >
            <Image src="/base_square.png" alt="Base Wallet" width={48} height={48} />
            Base Wallet
          </button>
        </div>

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};
