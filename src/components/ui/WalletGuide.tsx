"use client";

import React, { useState, useEffect, useRef } from 'react';
import { CHAIN_ID, RPC_URL, CHAIN_NAME } from '@/lib/contractAddresses';

interface WalletGuideProps {
  onClose: () => void;
  buttonRef?: React.RefObject<HTMLDivElement>;
}

export function WalletGuide({ onClose, buttonRef }: WalletGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlightPosition, setSpotlightPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });

  useEffect(() => {
    if (currentStep === 0 && buttonRef?.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setSpotlightPosition({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      });
    }
  }, [currentStep, buttonRef]);

  const steps = [
    {
      title: "Welcome to RoomLen!",
      description: "We'll guide you step by step to connect your digital wallet. It's super easy, just follow the instructions!",
      icon: "👋",
      iconType: "emoji",
      action: null,
      spotlight: true
    },
    {
      title: "Install MetaMask",
      description: "MetaMask is the most popular and secure wallet. It's a free browser extension.",
      icon: "/metammask_logo.png",
      iconType: "image",
      action: (
        <a
          href="https://metamask.io/download/"
          target="_blank"
          rel="noopener noreferrer"
          className="btn bg-orange-500 hover:bg-orange-600 text-white w-full flex items-center justify-center gap-2"
        >
          <img src="/metammask_logo.png" alt="MetaMask" className="h-5 w-auto" />
          Download MetaMask →
        </a>
      )
    },
    {
      title: "Add Base Sepolia Network",
      description: "RoomLen runs on Base Sepolia network. It's free and secure. Click the button to add the network automatically.",
      icon: "🌐",
      iconType: "emoji",
      action: (
        <button
          onClick={async () => {
            try {
              if (!window.ethereum) {
                alert('Please install MetaMask first');
                return;
              }

              await (window.ethereum as any).request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: `0x${CHAIN_ID.toString(16)}`,
                  chainName: CHAIN_NAME,
                  nativeCurrency: {
                    name: 'ETH',
                    symbol: 'ETH',
                    decimals: 18
                  },
                  rpcUrls: [RPC_URL],
                  blockExplorerUrls: ['https://sepolia.basescan.org']
                }]
              });

              alert('Network added successfully! 🎉');
              setCurrentStep(currentStep + 1);
            } catch (error: any) {
              console.error('Error adding network:', error);
              alert(`Error: ${error.message || 'Could not add the network'}`);
            }
          }}
          className="btn bg-blue-600 hover:bg-blue-700 text-white w-full"
        >
          ✨ Add Base Sepolia Network (1 click)
        </button>
      )
    },
    {
      title: "Get Free ETH Tokens",
      description: "You need ETH tokens to pay for transactions. They're FREE and only for testing on Base Sepolia. They have no real value.",
      icon: "💰",
      iconType: "emoji",
      action: (
        <div className="space-y-3">
          <a
            href="https://www.coinbase.com/faucets/base-ethereum-goerli-faucet"
            target="_blank"
            rel="noopener noreferrer"
            className="btn bg-purple-600 hover:bg-purple-700 text-white w-full"
          >
            Get Free ETH →
          </a>
          <p className="text-xs text-slate-500 text-center">
            1. Copy your wallet address<br />
            2. Paste it in the Base faucet<br />
            3. Wait 30 seconds ⏱️
          </p>
        </div>
      )
    },
    {
      title: "All Set!",
      description: "You're all configured. Now you can connect your wallet and use RoomLen without any issues.",
      icon: "🎉",
      iconType: "emoji",
      action: (
        <button
          onClick={onClose}
          className="btn bg-green-600 hover:bg-green-700 text-white w-full"
        >
          Start Using RoomLen →
        </button>
      )
    }
  ];

  const step = steps[currentStep];

  const getCardPosition = () => {
    if (currentStep === 0 && buttonRef?.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      return {
        top: `${rect.bottom + 20}px`,
        left: `${Math.min(rect.left, window.innerWidth - 450)}px`,
        maxWidth: '420px'
      };
    }
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      maxWidth: '520px'
    };
  };

  return (
    <>
      {/* Dark overlay with spotlight */}
      <div className="fixed inset-0 z-[60]" style={{ pointerEvents: 'none' }}>
        <svg className="w-full h-full">
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              {step.spotlight && spotlightPosition.width > 0 && (
                <rect
                  x={spotlightPosition.left - 8}
                  y={spotlightPosition.top - 8}
                  width={spotlightPosition.width + 16}
                  height={spotlightPosition.height + 16}
                  rx="16"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.75)"
            mask="url(#spotlight-mask)"
            className="transition-all duration-500"
          />
        </svg>
      </div>

      {/* Animated border around the spotlight */}
      {step.spotlight && spotlightPosition.width > 0 && (
        <div
          className="fixed z-[61] pointer-events-none"
          style={{
            top: spotlightPosition.top - 8,
            left: spotlightPosition.left - 8,
            width: spotlightPosition.width + 16,
            height: spotlightPosition.height + 16,
          }}
        >
          <div className="w-full h-full rounded-2xl border-4 border-blue-500 animate-pulse shadow-lg shadow-blue-500/50"></div>
        </div>
      )}

      {/* Guide card */}
      <div
        className="fixed z-[62] animate-fade-in"
        style={getCardPosition()}
      >
        <div className="bg-white rounded-2xl shadow-2xl border-2 border-blue-500 p-6 w-full">
          {/* Arrow pointing to button (only in step 1) */}
          {currentStep === 0 && (
            <div className="absolute -top-3 left-8 w-6 h-6 bg-blue-500 transform rotate-45 border-t-2 border-l-2 border-blue-500"></div>
          )}

          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 text-2xl font-bold w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-full transition"
          >
            ×
          </button>

          <div className="text-center mb-5">
            <div className="mb-3 flex items-center justify-center">
              {step.iconType === 'emoji' ? (
                <div className="text-5xl animate-bounce">{step.icon}</div>
              ) : (
                <img src={step.icon} alt={step.title} className="h-20 w-auto animate-bounce" />
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h2>
            <p className="text-slate-600 text-sm leading-relaxed">{step.description}</p>
          </div>

          <div className="mb-5">
            {step.action}
          </div>

          {/* Progress indicators */}
          <div className="flex gap-2 justify-center mb-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentStep ? 'bg-blue-600 w-8' :
                  index < currentStep ? 'bg-green-500 w-2' :
                  'bg-slate-300 w-2'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                const newStep = Math.max(0, currentStep - 1);
                setCurrentStep(newStep);
              }}
              disabled={currentStep === 0}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              ← Previous
            </button>

            <div className="text-xs font-semibold text-slate-500">
              Step {currentStep + 1} of {steps.length}
            </div>

            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => {
                  const newStep = currentStep + 1;
                  setCurrentStep(newStep);
                }}
                className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Done! ✨
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Click on overlay to close */}
      <div
        className="fixed inset-0 z-[59]"
        onClick={onClose}
      />
    </>
  );
}

// Component to show on the wallet button when not connected
export function WalletHelpButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-sm text-blue-600 hover:text-blue-700 underline"
    >
      First time? View guide →
    </button>
  );
}
