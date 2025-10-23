"use client";

import React, { useState } from 'react';

interface HelpTooltipProps {
  term: string;
  explanation: string;
  example?: string;
  blockchainIntegration?: string;
}

export function HelpTooltip({ term, explanation, example, blockchainIntegration }: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<'top' | 'bottom'>('top');
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <span className="relative inline-flex items-center group">
      <button
        type="button"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleToggle}
        className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-[#16A957] to-[#1297C8] text-white hover:scale-110 transition-transform text-xs font-bold shadow-md z-30"
        aria-label={`Help about ${term}`}
      >
        ?
      </button>

      {isOpen && (
        <>
          {/* Backdrop - with lower z-index to not interfere with panels */}
          <div
            className="fixed inset-0 z-[35]"
            onClick={() => setIsOpen(false)}
          />

          {/* Tooltip Card */}
          <div
            ref={tooltipRef}
            className="absolute z-[60] w-80 bg-white rounded-xl shadow-2xl border-2 border-[#16A957] p-4 bottom-full left-1/2 -translate-x-1/2 mb-2 animate-fade-in pointer-events-auto"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-8 border-transparent border-t-[#16A957]"></div>

            {/* Header */}
            <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#16A957] to-[#1297C8] flex items-center justify-center text-white font-bold">
                ?
              </div>
              <div className="font-bold text-slate-900">{term}</div>
            </div>

            {/* Explanation */}
            <div className="text-sm text-slate-700 leading-relaxed mb-3">
              {explanation}
            </div>

            {/* Example */}
            {example && (
              <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-xs font-semibold text-blue-900 mb-1">💡 Example:</div>
                <div className="text-xs text-blue-800">{example}</div>
              </div>
            )}

            {/* Blockchain Integration */}
            {blockchainIntegration && (
              <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <img
                    src="/Base_basemark_blue.png"
                    alt="Base"
                    className="h-4 w-auto"
                  />
                  <div className="text-xs font-semibold text-blue-900">On Base:</div>
                </div>
                <div className="text-xs text-blue-800 leading-relaxed">{blockchainIntegration}</div>
              </div>
            )}
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </span>
  );
}

// Specific terms for Owner Dashboard
export const OWNER_TERMS = {
  tokenize: {
    term: "Tokenize",
    explanation: "Converting your rental contract into a digital asset (NFT) that lives on the blockchain. This makes it verifiable, tradeable, and usable as collateral.",
    example: "Your rental contract becomes NFT #1234, which you can use to request advances or sell on a marketplace.",
    blockchainIntegration: "We create an ERC-721 NFT on Base's Base Sepolia that stores your rental agreement details (rent amount, term, tenant score) permanently on-chain."
  },
  advance: {
    term: "Advance",
    explanation: "Immediate cash you receive today in exchange for your future rent payments. Instead of waiting months for rent, get 80-90% upfront.",
    example: "If your tenant pays $10,000/month for 12 months, you can receive ~$92,000 today instead of waiting 12 months.",
    blockchainIntegration: "When an investor funds your request, a smart contract on Base transfers wMXNB tokens to your wallet instantly and automatically."
  },
  riskTier: {
    term: "Risk Tier",
    explanation: "A grade (A, B, or C) that determines your advance terms based on tenant quality, payment history, and property factors. Better tier = more money, lower rates.",
    example: "Tier A (excellent): Get 90% advance at 15% APR. Tier C (fair): Get 78% advance at 28% APR.",
    blockchainIntegration: "The smart contract reads your tenant score from the NFT and automatically calculates your tier using on-chain risk parameters stored in the LendingProtocol contract."
  },
  haircut: {
    term: "Haircut",
    explanation: "A safety buffer (discount) applied to protect investors from risk. The percentage deducted from your total rent value before calculating the advance.",
    example: "With a 10% haircut on $120,000 total rent: $120,000 - 10% = $108,000 is used for your advance calculation.",
    blockchainIntegration: "Haircut percentage is stored in the risk tier parameters on Base and automatically applied by the smart contract when calculating loan amounts."
  },
  oc: {
    term: "Over-Collateral (OC)",
    explanation: "Extra collateral required to secure the advance. Your property must be worth more than the advance amount to protect investors.",
    example: "10% OC means if you want $90,000, your rental contract must be worth at least $99,000.",
    blockchainIntegration: "The smart contract verifies your NFT's rental value meets the OC requirement before allowing loan requests. This is enforced on-chain."
  },
  marketplace: {
    term: "Marketplace",
    explanation: "Where investors browse and fund advance requests. Once you publish, investors can see your property details and choose to fund you.",
    example: "Your tokenized property appears in the marketplace with details: $92,000 advance, 15% APR, Tier A, 12-month term.",
    blockchainIntegration: "Publishing creates a loan request transaction on Base that emits a LoanRequested event. Investors monitor these events to find opportunities."
  },
  nft: {
    term: "NFT (Digital Certificate)",
    explanation: "A unique digital token that proves you own the rental agreement. It's like a digital deed that can't be copied or faked.",
    example: "Your NFT #5678 contains: Property address, $10k/month rent, 12-month term, tenant score 85.",
    blockchainIntegration: "Your NFT is minted on Base using the ERC-721 standard. View it on BaseScan explorer and trade it on OpenSea NFT marketplace."
  },
  baseSepolia: {
    term: "Base Sepolia",
    explanation: "A test version of Base blockchain where we safely demonstrate RoomLen without using real money. Perfect for this hackathon!",
    example: "ETH tokens are free test tokens with no real value, allowing you to try everything risk-free.",
    blockchainIntegration: "All RoomLen contracts are deployed on Base Sepolia (Chain ID: 84532). Transactions are instant, free, and fully transparent on BaseScan explorer."
  },
  explorer: {
    term: "Block Explorer",
    explanation: "A website where you can see all blockchain transactions in real-time. It's like a public ledger anyone can verify.",
    example: "Click 'View on Explorer' to see your tokenization transaction, who created it, when, and all the details.",
    blockchainIntegration: "We use BaseScan for Base Sepolia. Every tokenization, loan request, and payment is permanently recorded and verifiable."
  }
};
